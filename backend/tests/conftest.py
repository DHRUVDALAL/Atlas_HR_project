import pytest
import os
import sys
import uuid
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point the application at the disposable test database BEFORE importing
# database.connection (which binds its engine at import time). This must also
# run before the test modules are collected so their module-level engines and
# the app's get_db all target the same PostgreSQL test DB.
_test_db_url = os.getenv("TEST_DATABASE_URL")
if _test_db_url:
    os.environ["DATABASE_URL"] = _test_db_url

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure they are registered with Base metadata
from database.connection import Base, get_db
from models.role import Role
from models.user import User
from models.applicant import *
from utils.password_handler import get_password_hash

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Tests run against PostgreSQL (the models use JSONB / native UUID).
    # Point DATABASE_URL at a disposable test database, e.g.
    #   postgresql+psycopg2://atlas:atlas@db:5432/atlas_test
    db_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError(
            "Set TEST_DATABASE_URL (or DATABASE_URL) to a PostgreSQL test DB."
        )
    os.environ["DATABASE_URL"] = db_url

    engine = create_engine(db_url)
    
    # Disable rate limiting for testing
    from app import app
    if hasattr(app.state, "limiter"):
        app.state.limiter.enabled = False
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Seed roles and users
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        # Predefined roles
        roles_to_seed = [
            "SYSTEM_ADMIN",
            "HR_ADMIN",
            "RECEPTIONIST",
            "HR_PANEL",
            "L1_PANEL",
            "L2_PANEL",
            "TECH_HEAD"
        ]
        
        role_map = {}
        for role_name in roles_to_seed:
            role = db.query(Role).filter(Role.role_name == role_name).first()
            if not role:
                role = Role(role_id=uuid.uuid4(), role_name=role_name)
                db.add(role)
                db.commit()
                db.refresh(role)
            role_map[role_name] = role

        # Predefined test users (password: password123)
        hashed_password = get_password_hash("password123")
        users_to_seed = [
            {
                "email": "admin@atlas.com",
                "employee_code": "ADMIN001",
                "first_name": "System",
                "last_name": "Admin",
                "role_name": "SYSTEM_ADMIN"
            },
            {
                "email": "hr.admin@atlas.com",
                "employee_code": "HR001",
                "first_name": "HR",
                "last_name": "Admin",
                "role_name": "HR_ADMIN"
            },
            {
                "email": "reception@atlas.com",
                "employee_code": "RECP001",
                "first_name": "Reception",
                "last_name": "User",
                "role_name": "RECEPTIONIST"
            },
            {
                "email": "hr.panel@atlas.com",
                "employee_code": "HRPANEL001",
                "first_name": "HR",
                "last_name": "Panel",
                "role_name": "HR_PANEL"
            },
            {
                "email": "l1.panel@atlas.com",
                "employee_code": "L1PANEL001",
                "first_name": "L1",
                "last_name": "Panel",
                "role_name": "L1_PANEL"
            },
            {
                "email": "l2.panel@atlas.com",
                "employee_code": "L2PANEL001",
                "first_name": "L2",
                "last_name": "Panel",
                "role_name": "L2_PANEL"
            },
            {
                "email": "tech.head@atlas.com",
                "employee_code": "TECHHEAD001",
                "first_name": "Tech",
                "last_name": "Head",
                "role_name": "TECH_HEAD"
            }
        ]

        for u_data in users_to_seed:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            role = role_map[u_data["role_name"]]
            if not user:
                user = User(
                    user_id=uuid.uuid4(),
                    role_id=role.role_id,
                    employee_code=u_data["employee_code"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    email=u_data["email"],
                    password=hashed_password,
                    is_active=True
                )
                db.add(user)
            else:
                user.password = hashed_password
                user.role_id = role.role_id
                user.is_active = True
                user.failed_login_attempts = 0
                user.locked_until = None
        db.commit()

        # Seed permissions + role->permission mappings so the permission-gated
        # endpoints work in tests exactly as in the running app.
        from database.seed import seed_permissions
        seed_permissions(db)
    finally:
        db.close()
