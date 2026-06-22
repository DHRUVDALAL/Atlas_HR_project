from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    mobile_no: Optional[str] = None
    password: str
    department: Optional[str] = None  # UUID as string
    role_id: str  # UUID as string
    is_active: bool = True

class UserResponse(BaseModel):
    user_id: str
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    mobile_no: Optional[str] = None
    department: Optional[str] = None
    role_id: str
    is_active: bool

    model_config = {"from_attributes": True}