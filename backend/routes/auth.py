from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database.connection import get_db
from models.user import User
from services.auth_service import authenticate_user, update_last_login, create_access_token_for_user, create_refresh_token, rotate_refresh_token, revoke_refresh_token
from middleware.auth import get_current_user
from middleware.role_auth import get_user_permissions
from schemas.auth import LoginRequest, TokenResponse, UserResponse, RefreshRequest, RefreshResponse, ChangePasswordRequest
import os
from datetime import timedelta
from utils.limiter import limiter

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in environment")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, user_credentials: LoginRequest, db: Session = Depends(get_db)):
    email = user_credentials.email
    password = user_credentials.password
    
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    update_last_login(db, str(user.user_id))
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token_for_user(
        user, expires_delta=access_token_expires
    )
    
    # Determine welcome message based on role
    role_name = user.role.role_name
    welcome_messages = {
        "SYSTEM_ADMIN": "Welcome System Admin",
        "HR_ADMIN": "Welcome HR Admin",
        "RECEPTIONIST": "Welcome Receptionist",
        "TECH_HEAD": "Welcome Tech Head",
        "L1_PANEL": "Welcome L1 Panel",
        "L2_PANEL": "Welcome L2 Panel",
        "HR_PANEL": "Welcome HR Panel"
    }
    message = welcome_messages.get(role_name, f"Welcome {role_name}")
    
    # Create refresh token
    refresh_token = create_refresh_token(db, str(user.user_id))
    
    return TokenResponse(
        success=True,
        token=access_token,
        refresh_token=refresh_token,
        role=role_name,
        secondary_role=user.secondary_role.role_name if user.secondary_role else None,
        message=message
    )

@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("20/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    res = rotate_refresh_token(db, payload.refresh_token)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    new_access, new_refresh, user = res
    return RefreshResponse(
        success=True,
        token=new_access,
        refresh_token=new_refresh
    )

@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    # Idempotent: revoke the refresh token so it can't be rotated again.
    revoke_refresh_token(db, payload.refresh_token)
    return {"success": True, "message": "Logged out"}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from utils.password_handler import verify_password, get_password_hash, validate_password_strength
    
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    try:
        validate_password_strength(payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    current_user.password = get_password_hash(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


@router.get("/me", response_model=dict)
def read_current_user(current_user: User = Depends(get_current_user)):
    user_data = UserResponse(
        user_id=str(current_user.user_id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role.role_name,
        secondary_role=current_user.secondary_role.role_name if current_user.secondary_role else None,
        is_active=current_user.is_active
    )
    return {
        "success": True,
        "user": user_data.model_dump(),
        # The frontend gates one uniform layout on these permission codes.
        "permissions": sorted(get_user_permissions(current_user)),
    }