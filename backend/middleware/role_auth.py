from fastapi import Depends, HTTPException, status

from middleware.auth import get_current_user
from models.user import User


def get_user_permissions(user: User) -> set:
    """Return the set of permission codes granted to a user via its roles."""
    perms = set()
    if user.role:
        perms.update(p.code for p in user.role.permissions)
    if user.secondary_role:
        perms.update(p.code for p in user.secondary_role.permissions)
    return perms


def require_permission(*codes: str):
    """Dependency: allow the request only if the user holds ALL given
    permission codes. Authorization is driven by permissions, never by role
    names — so adding a role or an Nth interview panel needs no code change."""
    def checker(current_user: User = Depends(get_current_user)):
        granted = get_user_permissions(current_user)
        if not set(codes).issubset(granted):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user
    return Depends(checker)


def require_any_permission(*codes: str):
    """Dependency: allow the request if the user holds ANY of the given codes."""
    def checker(current_user: User = Depends(get_current_user)):
        granted = get_user_permissions(current_user)
        if granted.isdisjoint(codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user
    return Depends(checker)
