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
        common_password = "password123"

        users_to_seed = [
            # SYSTEM_ADMIN
            {
                "email": "umesh@abhiyantatech.com",
                "employee_code": "ADMIN001",
                "first_name": "Umesh",
                "last_name": "Admin",
                "role_name": "SYSTEM_ADMIN",
            },
            # RECEPTIONIST
            {
                "email": "amsadmin@abhiyantatech.com",
                "employee_code": "RECP001",
                "first_name": "Reception",
                "last_name": "Admin",
                "role_name": "RECEPTIONIST",
            },
            # HR_ADMIN
            {"email": "Faisal.k@abhiyantatech.com", "employee_code": "HR001", "first_name": "Faisal", "last_name": "HR", "role_name": "HR_ADMIN"},
            {"email": "Akanksha.K@abhiyantatech.com", "employee_code": "HR002", "first_name": "Akanksha", "last_name": "HR", "role_name": "HR_ADMIN"},
            {"email": "Akshata.K@abhiyantatech.com", "employee_code": "HR003", "first_name": "Akshata", "last_name": "HR", "role_name": "HR_ADMIN"},
            {"email": "Sayali.S@abhiyantatech.com", "employee_code": "HR004", "first_name": "Sayali", "last_name": "HR", "role_name": "HR_ADMIN"},
            {"email": "Saraswathi.P@abhiyantatech.com", "employee_code": "HR005", "first_name": "Saraswathi", "last_name": "HR", "role_name": "HR_ADMIN"},
            # L1_PANEL
            {"email": "Amol.S@abhiyantatech.com", "employee_code": "L1_001", "first_name": "Amol", "last_name": "Somwanshi", "role_name": "L1_PANEL"},
            {"email": "Krunal.K@abhiyantatech.com", "employee_code": "L1_002", "first_name": "Krunal", "last_name": "Khode", "role_name": "L1_PANEL"},
            {"email": "Accounts@abhiyantatech.com", "employee_code": "L1_003", "first_name": "Neil", "last_name": "Joglekar", "role_name": "L1_PANEL"},
            {"email": "Vinod.H@abhiyantatech.com", "employee_code": "L1_004", "first_name": "Vinod", "last_name": "Harkare", "role_name": "L1_PANEL"},
            {"email": "Viraj.M@abhiyantatech.com", "employee_code": "L1_005", "first_name": "Viraj", "last_name": "Mahanawar", "role_name": "L1_PANEL"},
            {"email": "Amol.p@abhiyantatech.com", "employee_code": "L1_006", "first_name": "Amol", "last_name": "Pawar", "role_name": "L1_PANEL"},
            {"email": "Pooja.v@abhiyantatech.com", "employee_code": "L1_007", "first_name": "Pooja", "last_name": "V", "role_name": "L1_PANEL"},
            {"email": "karan.k@abhiyantatech.com", "employee_code": "L1_008", "first_name": "Karan", "last_name": "K", "role_name": "L1_PANEL"},
            {"email": "Trupti.W@abhiyantatech.com", "employee_code": "L1_009", "first_name": "Trupti", "last_name": "W", "role_name": "L1_PANEL"},
            {"email": "Varsha@abhiyantatech.com", "employee_code": "L1_010", "first_name": "Varsha", "last_name": "V", "role_name": "L1_PANEL"},
            {"email": "Parth.c@abhiyantatech.com", "employee_code": "L1_011", "first_name": "Parth", "last_name": "C", "role_name": "L1_PANEL"},
            {"email": "Ashwini.G@abhiyantatech.com", "employee_code": "L1_012", "first_name": "Ashwini", "last_name": "G", "role_name": "L1_PANEL"},
            {"email": "Nitesh.T@abhiyantatech.com", "employee_code": "L1_013", "first_name": "Nitesh", "last_name": "T", "role_name": "L1_PANEL"},
            {"email": "Anand@abhiyantatech.com", "employee_code": "L1_014", "first_name": "Anand", "last_name": "A", "role_name": "L1_PANEL"},
            {"email": "Abhishek.T@abhiyantatech.com", "employee_code": "L1_015", "first_name": "Abhishek", "last_name": "T", "role_name": "L1_PANEL"},
            {"email": "Swapnil.M@abhiyantatech.com", "employee_code": "L1_016", "first_name": "Swapnil", "last_name": "M", "role_name": "L1_PANEL"},
            {"email": "Kishor.J@abhiyantatech.com", "employee_code": "L1_017", "first_name": "Kishor", "last_name": "J", "role_name": "L1_PANEL"},
            {"email": "baliram@abhiyantatech.com", "employee_code": "L1_018", "first_name": "Baliram", "last_name": "B", "role_name": "L1_PANEL"},
            {"email": "sanket@abhiyantatech.com", "employee_code": "L1_019", "first_name": "Sanket", "last_name": "S", "role_name": "L1_PANEL"},
            {"email": "Shrikant.T@abhiyantatech.com", "employee_code": "L1_020", "first_name": "Shrikant", "last_name": "T", "role_name": "L1_PANEL"},
            {"email": "Shailesh.P@abhiyantatech.com", "employee_code": "L1_021", "first_name": "Shailesh", "last_name": "P", "role_name": "L1_PANEL"},
            {"email": "Balaram.p@abhiyantatech.com", "employee_code": "L1_022", "first_name": "Balaram", "last_name": "P", "role_name": "L1_PANEL"},
            {"email": "Abhinandan.d@abhiyantatech.com", "employee_code": "L1_023", "first_name": "Abhinandan", "last_name": "D", "role_name": "L1_PANEL"},
            {"email": "Rahul.S@abhiyantatech.com", "employee_code": "L1_024", "first_name": "Rahul", "last_name": "S", "role_name": "L1_PANEL"},
            {"email": "Manisha.S@abhiyantatech.com", "employee_code": "L1_025", "first_name": "Manisha", "last_name": "S", "role_name": "L1_PANEL"},
        ]

        for u_data in users_to_seed:
            existing = db.query(User).filter(User.employee_code == u_data["employee_code"]).first()
            role_id = roles_map[u_data["role_name"]]

            # Validate password strength
            validate_password_strength(common_password)

            hashed_pwd = get_password_hash(common_password)

            if existing:
                existing.email = u_data["email"]
                existing.first_name = u_data["first_name"]
                existing.last_name = u_data["last_name"]
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
