import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    mobile_no: Optional[str] = None
    password: str
    department: Optional[str] = None
    role_id: uuid.UUID
    secondary_role_id: Optional[uuid.UUID] = None
    secondary_role_id: Optional[uuid.UUID] = None
    is_active: bool = True

class RoleResponse(BaseModel):
    role_id: uuid.UUID
    secondary_role_id: Optional[uuid.UUID] = None
    secondary_role_id: Optional[uuid.UUID] = None
    role_name: str

    model_config = {"from_attributes": True}

class UserResponse(BaseModel):
    user_id: uuid.UUID
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    mobile_no: Optional[str] = None
    department: Optional[str] = None
    role_id: uuid.UUID
    secondary_role_id: Optional[uuid.UUID] = None
    secondary_role_id: Optional[uuid.UUID] = None
    is_active: bool
    role: Optional[RoleResponse] = None

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_no: Optional[str] = None
    password: Optional[str] = None
    department: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    secondary_role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None