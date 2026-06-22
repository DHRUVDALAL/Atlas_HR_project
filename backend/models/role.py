from sqlalchemy import Column, String, UUID as pgUUID
from database.connection import Base

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(pgUUID(as_uuid=True), primary_key=True, index=True)
    role_name = Column(String(50), unique=True, index=True, nullable=False)