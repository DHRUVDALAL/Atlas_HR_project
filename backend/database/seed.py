"""Idempotent bootstrap seeder.

Creates the fixed role rows and a single SYSTEM_ADMIN account from environment
variables (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD). It NEVER resets the
password of an existing user and NEVER hard-codes credentials. Additional
users are created through the authenticated user-management API by the admin.

Run after migrations:  python -m database.seed
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from database.connection import SessionLocal
from models.role import Role
from models.user import User
from models.permission import Permission
from utils.password_handler import get_password_hash, validate_password_strength
from utils.permissions import PERMISSIONS, ROLE_PERMISSIONS

load_dotenv()

ROLES = list(ROLE_PERMISSIONS.keys())


def seed_permissions(db):
    """Insert any missing permission rows and wire up each role's default set.
    Idempotent: existing permissions/links are left untouched, missing ones are
    added (so new permission codes appear on redeploy)."""
    perm_map = {}
    for code, desc in PERMISSIONS.items():
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, description=desc)
            db.add(perm)
            db.flush()
            print(f"Inserted permission: {code}")
        perm_map[code] = perm

    for role in db.query(Role).all():
        wanted = ROLE_PERMISSIONS.get(role.role_name, set())
        have = {p.code for p in role.permissions}
        for code in wanted - have:
            role.permissions.append(perm_map[code])
            print(f"Granted {code} -> {role.role_name}")
    db.commit()


def seed_db():
    db = SessionLocal()
    try:
        # 1. Roles (idempotent)
        roles_map = {}
        for name in ROLES:
            role = db.query(Role).filter(Role.role_name == name).first()
            if not role:
                role = Role(role_name=name)
                db.add(role)
                db.flush()
                print(f"Inserted role: {name}")
            roles_map[name] = role.role_id
        db.commit()

        # 1b. Permissions + role mappings
        seed_permissions(db)

        # 2. Bootstrap SYSTEM_ADMIN and other workflow users
        common_password = "ChangeMe!Admin123!"

        users_to_seed = [
            {
                "email": "admin@atlas.com",
                "employee_code": "ADMIN001",
                "first_name": "System",
                "last_name": "Admin",
                "role_name": "SYSTEM_ADMIN",
            },
            {
                "email": "hr.admin@atlas.com",
                "employee_code": "HR001",
                "first_name": "HR",
                "last_name": "Admin",
                "role_name": "HR_ADMIN",
            },
            {
                "email": "reception@atlas.com",
                "employee_code": "RECP001",
                "first_name": "Reception",
                "last_name": "User",
                "role_name": "RECEPTIONIST",
            },
            {
                "email": "l1.panel@atlas.com",
                "employee_code": "L1PANEL001",
                "first_name": "L1",
                "last_name": "Panel",
                "role_name": "L1_PANEL",
            },
            {
                "email": "l2.panel@atlas.com",
                "employee_code": "L2PANEL001",
                "first_name": "L2",
                "last_name": "Panel",
                "role_name": "L2_PANEL",
            },
            {
                "email": "tech.head@atlas.com",
                "employee_code": "TECHHEAD001",
                "first_name": "Tech",
                "last_name": "Head",
                "role_name": "TECH_HEAD",
            }
        ]

        for u_data in users_to_seed:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            role_id = roles_map[u_data["role_name"]]

            # Validate password strength
            validate_password_strength(common_password)

            hashed_pwd = get_password_hash(common_password)

            if existing:
                existing.password = hashed_pwd
                existing.role_id = role_id
                existing.is_active = True
                print(f"✓ {u_data['role_name']} updated")
            else:
                user = User(
                    role_id=role_id,
                    employee_code=u_data["employee_code"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    email=u_data["email"],
                    password=hashed_pwd,
                    is_active=True,
                )
                db.add(user)
                print(f"✓ {u_data['role_name']} created")

        db.commit()

        # Verify and display the results
        print("\nVerification of Seeded Users:")
        print("-" * 65)
        print(f"{'Email':<25} | {'Role':<15} | {'Active':<8}")
        print("-" * 65)
        for user in db.query(User).order_by(User.email).all():
            print(f"{user.email:<25} | {user.role.role_name:<15} | {str(user.is_active):<8}")
        print("-" * 65)

        # Authentication verification
        from services.auth_service import authenticate_user
        from fastapi import HTTPException

        print("\nAuthentication Verification:")
        print("-" * 50)
        for u_data in users_to_seed:
            try:
                # Reset lockouts if any
                user_obj = db.query(User).filter(User.email == u_data["email"]).first()
                if user_obj:
                    user_obj.failed_login_attempts = 0
                    user_obj.locked_until = None
                    db.commit()

                res = authenticate_user(db, u_data["email"], common_password)
                if res:
                    print(f"✓ Login successful: {u_data['email']}")
                else:
                    print(f"✗ Login failed: {u_data['email']} (reason: verify_password returned False)")
            except HTTPException as ex:
                print(f"✗ Login failed: {u_data['email']} (reason: {ex.detail})")
            except Exception as ex:
                print(f"✗ Login failed: {u_data['email']} (reason: {str(ex)})")
        print("-" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
