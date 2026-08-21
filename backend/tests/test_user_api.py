import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.connection import get_db
from models.user import User
from models.role import Role

client = TestClient(app)

def get_token_for_user(email: str) -> str:
    """Helper to authenticate and get JWT token."""
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"}
    )
    assert response.status_code == 200
    return response.json()["token"]

def test_unauthorized_user_endpoints():
    """Unauthenticated requests must be rejected."""
    # List
    assert client.get("/api/users").status_code == 401
    # Create
    assert client.post("/api/users", json={}).status_code == 401
    # Get
    assert client.get(f"/api/users/{uuid.uuid4()}").status_code == 401
    # Update
    assert client.put(f"/api/users/{uuid.uuid4()}", json={}).status_code == 401
    # Delete
    assert client.delete(f"/api/users/{uuid.uuid4()}").status_code == 401
    # Roles
    assert client.get("/api/roles").status_code == 401

def test_forbidden_role_endpoints():
    """Non-admin or non-hr-admin roles must be restricted."""
    reception_token = get_token_for_user("reception@atlas.com")
    headers = {"Authorization": f"Bearer {reception_token}"}
    
    # Receptionist cannot create, update, delete users, or list users/roles
    assert client.post("/api/users", json={}, headers=headers).status_code == 403
    assert client.put(f"/api/users/{uuid.uuid4()}", json={}, headers=headers).status_code == 403
    assert client.delete(f"/api/users/{uuid.uuid4()}", headers=headers).status_code == 403
    assert client.get("/api/users", headers=headers).status_code == 403
    assert client.get("/api/roles", headers=headers).status_code == 403

def test_list_roles():
    """SYSTEM_ADMIN or HR_ADMIN should be able to list roles."""
    admin_token = get_token_for_user("admin@atlas.com")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.get("/api/roles", headers=headers)
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 7
    role_names = [r["role_name"] for r in roles]
    assert "SYSTEM_ADMIN" in role_names
    assert "HR_ADMIN" in role_names
    assert "RECEPTIONIST" in role_names
    assert "L1_PANEL" in role_names

def test_user_crud_flow():
    """Complete CRUD flow for user management."""
    admin_token = get_token_for_user("admin@atlas.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get a role UUID for RECEPTIONIST
    roles_resp = client.get("/api/roles", headers=admin_headers)
    receptionist_role = next(r for r in roles_resp.json() if r["role_name"] == "RECEPTIONIST")
    role_id = receptionist_role["role_id"]
    
    # 1. Negative Test: Insecure Password (too short)
    payload_bad_pwd = {
        "employee_code": "TESTUSER101",
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser101@atlas.com",
        "mobile_no": "1112223334",
        "password": "short",
        "role_id": role_id
    }
    resp = client.post("/api/users", json=payload_bad_pwd, headers=admin_headers)
    assert resp.status_code == 400
    assert "at least 12 characters" in resp.json()["detail"]
    
    # 2. Negative Test: Insecure Password (missing special char)
    payload_bad_pwd["password"] = "SecurePassword123"
    resp = client.post("/api/users", json=payload_bad_pwd, headers=admin_headers)
    assert resp.status_code == 400
    assert "special character" in resp.json()["detail"]

    # 3. Create User with Valid Secure Password
    valid_payload = {
        "employee_code": "TESTUSER102",
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser102@atlas.com",
        "mobile_no": "1112223334",
        "password": "SecurePass123!",
        "role_id": role_id
    }
    create_resp = client.post("/api/users", json=valid_payload, headers=admin_headers)
    assert create_resp.status_code == 201
    user_data = create_resp.json()
    assert user_data["email"] == "testuser102@atlas.com"
    user_id = user_data["user_id"]
    
    # 4. List Users & verify it is there
    list_resp = client.get("/api/users", headers=admin_headers)
    assert list_resp.status_code == 200
    user_emails = [u["email"] for u in list_resp.json()]
    assert "testuser102@atlas.com" in user_emails
    
    # 5. Retrieve Specific User
    get_resp = client.get(f"/api/users/{user_id}", headers=admin_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["first_name"] == "Test"
    
    # 6. Update User (first name, and is_active)
    update_payload = {
        "first_name": "UpdatedTestName",
        "is_active": False
    }
    update_resp = client.put(f"/api/users/{user_id}", json=update_payload, headers=admin_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["first_name"] == "UpdatedTestName"
    assert update_resp.json()["is_active"] is False

    # 7. Negative Test: Cannot delete self
    # We must first fetch current admin's user_id from /api/auth/me
    me_resp = client.get("/api/auth/me", headers=admin_headers)
    admin_user_id = me_resp.json()["user"]["user_id"]
    del_self_resp = client.delete(f"/api/users/{admin_user_id}", headers=admin_headers)
    assert del_self_resp.status_code == 400
    assert "Cannot delete your own account" in del_self_resp.json()["detail"]
    
    # 8. Delete Created User
    delete_resp = client.delete(f"/api/users/{user_id}", headers=admin_headers)
    assert delete_resp.status_code == 204
    
    # 9. Verify Deleted User is gone
    get_gone_resp = client.get(f"/api/users/{user_id}", headers=admin_headers)
    assert get_gone_resp.status_code == 404

def test_account_lockout():
    """Verify that an account is locked after 5 failed login attempts."""
    # Use a dedicated seeded account that no other test logs in as, so locking
    # it cannot cascade 403s into unrelated tests (MAX_FAILED_ATTEMPTS = 5).
    email = "tech.head@atlas.com"

    # Attempts 1-4: wrong password -> 401 (not yet locked)
    for _ in range(4):
        resp = client.post(
            "/api/auth/login",
            json={"email": email, "password": "wrongpassword"}
        )
        assert resp.status_code == 401

    # Attempt 5: the counter reaches the threshold and the account is locked.
    # authenticate_user still returns False for the bad password, so this
    # attempt is reported as 401.
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": "wrongpassword"}
    )
    assert resp.status_code == 401

    # Now locked: even the correct password is rejected with 403.
    lock_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"}
    )
    assert lock_resp.status_code == 403
    assert "temporarily locked" in lock_resp.json()["detail"]

    # Reset this account's lockout state so re-runs against a shared DB stay clean.
    from database.connection import SessionLocal
    db = SessionLocal()
    try:
        locked_user = db.query(User).filter(User.email == email).first()
        if locked_user:
            locked_user.failed_login_attempts = 0
            locked_user.locked_until = None
            db.commit()
    finally:
        db.close()
