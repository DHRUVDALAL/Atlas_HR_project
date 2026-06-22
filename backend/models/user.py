from sqlalchemy import Column, String, UUID as pgUUID, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base
import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(pgUUID(as_uuid=True), primary_key=True, index=True)
    role_id = Column(pgUUID(as_uuid=True), ForeignKey("roles.role_id"), nullable=False)
    employee_code = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(20), nullable=False)
    last_name = Column(String(20), nullable=False)
    email = Column(String(50), unique=True, index=True, nullable=False)
    mobile_no = Column(String(13))
    password = Column(String, nullable=False)  # hashed password
    department = Column(pgUUID(as_uuid=True))  # Assuming department is a UUID, but we don't have a department model
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    # Relationship
    role = relationship("Role")