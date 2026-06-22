# Postman Testing Steps for ATLAS Authentication API

## Prerequisites
1. Ensure the PostgreSQL database is running and the database URL is set in the .env file.
2. Run the SQL scripts to insert default roles and create test users:
   - `backend/sql/insert_roles.sql`
   - `backend/sql/create_test_users.sql`
3. Start the FastAPI server: `uvicorn app:app --reload`

## Test Users
The following test users are available (password: `password123` for all):
- SYSTEM_ADMIN: admin@atlas.com
- HR_ADMIN: hr.admin@atlas.com
- RECEPTIONIST: reception@atlas.com

## 1. Login Endpoint
**URL:** `POST http://localhost:8000/api/auth/login`

**Request Body (JSON):**
```json
{
  "email": "admin@atlas.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "role": "SYSTEM_ADMIN",
  "message": "Welcome System Admin"
}
```

Save the token for use in subsequent requests (set as an environment variable in Postman, e.g., `access_token`).

## 2. Access Protected Endpoint
**URL:** `GET http://localhost:8000/api/protected`

**Headers:**
- Authorization: `Bearer {{access_token}}`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Hello System, you have accessed a protected endpoint!",
  "user_id": "user_uuid_here",
  "email": "admin@atlas.com"
}
```

## 3. Access Admin Endpoint (SYSTEM_ADMIN only)
**URL:** `GET http://localhost:8000/api/admin`

**Headers:**
- Authorization: `Bearer {{access_token}}` (token from SYSTEM_ADMIN login)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome System Admin System!",
  "user_id": "user_uuid_here",
  "email": "admin@atlas.com",
  "role": "SYSTEM_ADMIN"
}
```

**Note:** If you try to access this endpoint with a non-SYSTEM_ADMIN token (e.g., HR_ADMIN), you will get a 403 Forbidden response.

## 4. Get Current User Info
**URL:** `GET http://localhost:8000/api/auth/me`

**Headers:**
- Authorization: `Bearer {{access_token}}`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": "user_uuid_here",
    "email": "admin@atlas.com",
    "first_name": "System",
    "last_name": "Admin",
    "role": "SYSTEM_ADMIN",
    "is_active": true
  }
}
```

## 5. Test Invalid Login
**URL:** `POST http://localhost:8000/api/auth/login`

**Request Body (JSON):**
```json
{
  "email": "admin@atlas.com",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## 6. Test Inactive User (if applicable)
You can set a user's `is_active` to false in the database and then try to login to see the appropriate error.

## Environment Variables
Ensure the following are set in your .env file:
- DATABASE_URL
- SECRET_KEY
- ALGORITHM
- ACCESS_TOKEN_EXPIRE_MINUTES

Example .env file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/atlas
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```