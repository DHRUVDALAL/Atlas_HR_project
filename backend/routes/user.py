from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database.connection import get_db
from models.user import User
from models.role import Role
from schemas.user import UserCreate, UserResponse, UserUpdate, RoleResponse
from middleware.role_auth import require_permission
from middleware.auth import get_current_user
from utils.password_handler import get_password_hash, validate_password_strength
import uuid
from typing import List, Optional

router = APIRouter(
    prefix="/api",
    tags=["users"]
)

# ---------------------------------------------------------------------------
# ROLE ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/roles", response_model=List[RoleResponse], dependencies=[require_permission("role.read")])
def list_roles(db: Session = Depends(get_db)):
    """List all available roles in the system."""
    return db.query(Role).all()


# ---------------------------------------------------------------------------
# USER ENDPOINTS
# ---------------------------------------------------------------------------

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[require_permission("user.manage")])
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user. Only SYSTEM_ADMIN role permitted."""
    # Validate password strength
    try:
        validate_password_strength(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    role = db.query(Role).filter(Role.role_id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        
    # Hash password
    hashed_pwd = get_password_hash(payload.password)
    
    new_user = User(
        user_id=uuid.uuid4(),
        role_id=payload.role_id,
        employee_code=payload.employee_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        mobile_no=payload.mobile_no,
        password=hashed_pwd,
        department=payload.department,
        is_active=payload.is_active
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User email, employee code, or department already exists")
        
    return new_user


@router.get("/users", response_model=List[UserResponse], dependencies=[require_permission("user.manage")])
def list_users(
    role_id: Optional[uuid.UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List users, with optional role filtering and pagination."""
    query = db.query(User)
    if role_id:
        query = query.filter(User.role_id == role_id)
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserResponse, dependencies=[require_permission("user.manage")])
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve details for a specific user."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserResponse, dependencies=[require_permission("user.manage")])
def update_user(user_id: uuid.UUID, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update user details. Only SYSTEM_ADMIN role permitted."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        user.email = payload.email
    if payload.mobile_no is not None:
        user.mobile_no = payload.mobile_no
    if payload.is_active is not None:
        user.is_active = payload.is_active
        
    if payload.role_id is not None:
        role = db.query(Role).filter(Role.role_id == payload.role_id).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        user.role_id = payload.role_id
        
    if payload.department is not None:
        user.department = payload.department
            
    if payload.password is not None:
        try:
            validate_password_strength(payload.password)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        user.password = get_password_hash(payload.password)
        
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email, employee code, or department already exists")
        
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[require_permission("user.manage")])
def delete_user(user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a user. SYSTEM_ADMIN only. Users cannot delete themselves."""
    if user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    db.delete(user)
    db.commit()
    return None
