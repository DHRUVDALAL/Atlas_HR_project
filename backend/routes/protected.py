from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from middleware.role_auth import (
    require_system_admin,
    require_hr_admin,
    require_tech_head,
    require_receptionist,
)
from models.user import User

router = APIRouter(
    prefix="/api",
    tags=["protected"]
)


@router.get("/protected")
def protected_endpoint(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Hello {current_user.first_name}, you have accessed a protected endpoint!",
        "user_id": str(current_user.user_id),
        "email": current_user.email
    }


@router.get("/protected/me")
def protected_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "user_id": str(current_user.user_id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role.role_name,
            "is_active": current_user.is_active
        }
    }


@router.get("/admin/dashboard", dependencies=[require_system_admin])
def admin_dashboard(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Welcome to Admin Dashboard, {current_user.first_name}!",
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "role": current_user.role.role_name,
        "dashboard": "admin"
    }


@router.get("/hr/dashboard", dependencies=[require_hr_admin])
def hr_dashboard(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Welcome to HR Dashboard, {current_user.first_name}!",
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "role": current_user.role.role_name,
        "dashboard": "hr"
    }


@router.get("/tech/dashboard", dependencies=[require_tech_head])
def tech_dashboard(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Welcome to Tech Dashboard, {current_user.first_name}!",
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "role": current_user.role.role_name,
        "dashboard": "tech"
    }


@router.get("/reception/dashboard", dependencies=[require_receptionist])
def reception_dashboard(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Welcome to Reception Dashboard, {current_user.first_name}!",
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "role": current_user.role.role_name,
        "dashboard": "reception"
    }