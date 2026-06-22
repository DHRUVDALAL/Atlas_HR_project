from fastapi import APIRouter, Depends
from middleware.role_auth import require_role
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api",
    tags=["admin"]
)

@router.get("/admin", dependencies=[require_role(["SYSTEM_ADMIN"])])
def admin_endpoint(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": f"Welcome System Admin {current_user.first_name}!",
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "role": current_user.role.role_name
    }