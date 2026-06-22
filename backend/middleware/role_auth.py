from fastapi import Depends, HTTPException, status
from middleware.auth import get_current_user
from models.user import User


def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user
    return Depends(role_checker)


require_system_admin = require_role(["SYSTEM_ADMIN"])
require_hr_admin = require_role(["HR_ADMIN", "SYSTEM_ADMIN"])
require_tech_head = require_role(["TECH_HEAD", "SYSTEM_ADMIN"])
require_receptionist = require_role(["RECEPTIONIST", "SYSTEM_ADMIN"])