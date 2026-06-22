from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    success: bool
    token: str
    role: str
    message: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }