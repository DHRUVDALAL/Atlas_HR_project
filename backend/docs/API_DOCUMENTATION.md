# ATLAS Interview Management System — API Documentation

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:8000`  
> **Generated:** 2026-06-21  
> **Framework:** FastAPI (Python)  
> **Database:** PostgreSQL  
> **Authentication:** JWT Bearer Token (HS256)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [JWT Token Flow](#3-jwt-token-flow)
4. [Authorization & RBAC Flow](#4-authorization--rbac-flow)
5. [Role Matrix](#5-role-matrix)
6. [API Endpoints](#6-api-endpoints)
   - [Root](#61-root)
   - [Authentication](#62-authentication)
   - [Protected Endpoints](#63-protected-endpoints)
   - [Role-Based Dashboards](#64-role-based-dashboards)
   - [Admin Endpoints](#65-admin-endpoints)
7. [Request & Response Models](#7-request--response-models)
8. [Error Codes](#8-error-codes)
9. [Security Notes](#9-security-notes)

---

## 1. Project Overview

**ATLAS** (Interview Management System) is a backend API for managing interview workflows within an organization. The system supports multi-role access control with JWT-based authentication.

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI ≥ 0.68.0 |
| Runtime | Python 3.11+ with Uvicorn |
| Database | PostgreSQL (via SQLAlchemy ORM) |
| Authentication | JWT (python-jose, HS256) |
| Password Hashing | bcrypt via passlib |
| Validation | Pydantic v2 |

### Database Models

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `users` | `user_id` (UUID) | User accounts with role assignments |
| `roles` | `role_id` (UUID) | Role definitions (SYSTEM_ADMIN, HR_ADMIN, etc.) |

---

## 2. Authentication Flow

```
┌─────────┐       POST /api/auth/login        ┌──────────┐
│  Client  │ ──────────────────────────────────▶│  Server  │
│          │   { email, password }              │          │
│          │                                    │          │
│          │       200 OK                       │          │
│          │◀──────────────────────────────────│          │
│          │   { token, role, message }         │          │
│          │                                    │          │
│          │   GET /api/protected               │          │
│          │   Authorization: Bearer <token>    │          │
│          │ ──────────────────────────────────▶│          │
│          │                                    │          │
│          │       200 OK / 401 / 403           │          │
│          │◀──────────────────────────────────│          │
└─────────┘                                    └──────────┘
```

### Steps:
1. Client sends `POST /api/auth/login` with `email` and `password`
2. Server validates credentials against PostgreSQL database
3. Password is verified using bcrypt hash comparison
4. On success, server generates a JWT token containing `user_id`, `email`, `role`, and `exp`
5. Token is returned to client with role name and welcome message
6. Client includes token in `Authorization: Bearer <token>` header for subsequent requests

---

## 3. JWT Token Flow

### Token Generation

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 |
| Expiry | 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`) |
| Secret Key | Configured via `SECRET_KEY` environment variable |

### Token Payload Structure

```json
{
  "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
  "email": "admin@atlas.com",
  "role": "SYSTEM_ADMIN",
  "exp": 1782055167
}
```

### Token Validation Pipeline

1. Extract token from `Authorization: Bearer <token>` header
2. Decode JWT using `SECRET_KEY` and `HS256` algorithm
3. Extract `user_id` from payload
4. Query database for user with matching `user_id`
5. Verify user exists and `is_active = true`
6. Return user object if all checks pass
7. Raise `401 Unauthorized` if any check fails

---

## 4. Authorization & RBAC Flow

### Role-Based Access Control

The system implements RBAC via FastAPI dependency injection:

- **`get_current_user`** — Validates JWT and returns the authenticated user
- **`require_role(allowed_roles)`** — Checks if user's role is in the allowed list
- **Pre-defined role checkers:**
  - `require_system_admin` → `["SYSTEM_ADMIN"]`
  - `require_hr_admin` → `["HR_ADMIN", "SYSTEM_ADMIN"]`
  - `require_tech_head` → `["TECH_HEAD", "SYSTEM_ADMIN"]`
  - `require_receptionist` → `["RECEPTIONIST", "SYSTEM_ADMIN"]`

> **Note:** `SYSTEM_ADMIN` has access to all role-restricted endpoints.

---

## 5. Role Matrix

### Defined Roles

| Role | Description |
|------|-------------|
| `SYSTEM_ADMIN` | Full system access — superuser |
| `HR_ADMIN` | HR department administration |
| `TECH_HEAD` | Technical department head |
| `RECEPTIONIST` | Front desk / reception operations |
| `HR_PANEL` | HR interview panel member |
| `L1_PANEL` | Level 1 interview panel member |
| `L2_PANEL` | Level 2 interview panel member |

### Endpoint Access Matrix

| Endpoint | SYSTEM_ADMIN | HR_ADMIN | TECH_HEAD | RECEPTIONIST | Others |
|----------|:---:|:---:|:---:|:---:|:---:|
| `POST /api/auth/login` | ✅ Public | ✅ Public | ✅ Public | ✅ Public | ✅ Public |
| `GET /api/auth/me` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/protected` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/protected/me` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/admin/dashboard` | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /api/hr/dashboard` | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| `GET /api/tech/dashboard` | ✅ | ❌ 403 | ✅ | ❌ 403 | ❌ 403 |
| `GET /api/reception/dashboard` | ✅ | ❌ 403 | ❌ 403 | ✅ | ❌ 403 |
| `GET /api/admin` | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |

---

## 6. API Endpoints

### 6.1 Root

#### `GET /`

Returns API welcome message and documentation links.

**Authentication:** None required

**Response (200 OK):**
```json
{
  "message": "Welcome to ATLAS Interview Management System API",
  "docs": "/docs",
  "redoc": "/redoc"
}
```

---

### 6.2 Authentication

#### `POST /api/auth/login`

Authenticate a user and obtain a JWT token.

**Authentication:** None required  
**Roles:** Public  
**Tags:** `auth`

**Request Body:**
```json
{
  "email": "admin@atlas.com",
  "password": "password123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `EmailStr` | ✅ | Must be valid email format |
| `password` | `string` | ✅ | Non-empty string |

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "SYSTEM_ADMIN",
  "message": "Welcome System Admin"
}
```

**Welcome Messages by Role:**

| Role | Message |
|------|---------|
| `SYSTEM_ADMIN` | "Welcome System Admin" |
| `HR_ADMIN` | "Welcome HR Admin" |
| `RECEPTIONIST` | "Welcome Receptionist" |
| `TECH_HEAD` | "Welcome Tech Head" |
| `L1_PANEL` | "Welcome L1 Panel" |
| `L2_PANEL` | "Welcome L2 Panel" |
| `HR_PANEL` | "Welcome HR Panel" |

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 401 | Invalid email or password | `{"detail": "Invalid email or password"}` |
| 422 | Missing/invalid fields | `{"detail": [{"type": "missing", "loc": ["body", "email"], "msg": "Field required"}]}` |

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Authentication:** Bearer Token required  
**Roles:** Any authenticated user  
**Tags:** `auth`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
    "email": "admin@atlas.com",
    "first_name": "System",
    "last_name": "Admin",
    "role": "SYSTEM_ADMIN",
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 401 | Missing/invalid/expired token | `{"detail": "Could not validate credentials"}` |
| 400 | Inactive user | `{"detail": "Inactive user"}` |

---

### 6.3 Protected Endpoints

#### `GET /api/protected`

Access a generic protected endpoint (requires authentication only, no role restriction).

**Authentication:** Bearer Token required  
**Roles:** Any authenticated user  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Hello System, you have accessed a protected endpoint!",
  "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
  "email": "admin@atlas.com"
}
```

---

#### `GET /api/protected/me`

Get detailed user profile via the protected route.

**Authentication:** Bearer Token required  
**Roles:** Any authenticated user  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
    "email": "admin@atlas.com",
    "first_name": "System",
    "last_name": "Admin",
    "role": "SYSTEM_ADMIN",
    "is_active": true
  }
}
```

---

### 6.4 Role-Based Dashboards

#### `GET /api/admin/dashboard`

Access the System Admin dashboard.

**Authentication:** Bearer Token required  
**Roles:** `SYSTEM_ADMIN` only  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to Admin Dashboard, System!",
  "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
  "email": "admin@atlas.com",
  "role": "SYSTEM_ADMIN",
  "dashboard": "admin"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | No/invalid token |
| 403 | Insufficient role permissions |

---

#### `GET /api/hr/dashboard`

Access the HR Admin dashboard.

**Authentication:** Bearer Token required  
**Roles:** `HR_ADMIN`, `SYSTEM_ADMIN`  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to HR Dashboard, HR!",
  "user_id": "uuid-here",
  "email": "hr.admin@atlas.com",
  "role": "HR_ADMIN",
  "dashboard": "hr"
}
```

---

#### `GET /api/tech/dashboard`

Access the Tech Head dashboard.

**Authentication:** Bearer Token required  
**Roles:** `TECH_HEAD`, `SYSTEM_ADMIN`  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to Tech Dashboard, Tech!",
  "user_id": "uuid-here",
  "email": "tech.head@atlas.com",
  "role": "TECH_HEAD",
  "dashboard": "tech"
}
```

---

#### `GET /api/reception/dashboard`

Access the Receptionist dashboard.

**Authentication:** Bearer Token required  
**Roles:** `RECEPTIONIST`, `SYSTEM_ADMIN`  
**Tags:** `protected`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to Reception Dashboard, Reception!",
  "user_id": "uuid-here",
  "email": "reception@atlas.com",
  "role": "RECEPTIONIST",
  "dashboard": "reception"
}
```

---

### 6.5 Admin Endpoints

#### `GET /api/admin`

Access the admin-only endpoint.

**Authentication:** Bearer Token required  
**Roles:** `SYSTEM_ADMIN` only  
**Tags:** `admin`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome System Admin System!",
  "user_id": "a477f9e7-36dc-48f5-94ad-f126d481c926",
  "email": "admin@atlas.com",
  "role": "SYSTEM_ADMIN"
}
```

---

## 7. Request & Response Models

### LoginRequest

```python
class LoginRequest(BaseModel):
    email: EmailStr      # Required, validated email format
    password: str        # Required, plain text password
```

### TokenResponse

```python
class TokenResponse(BaseModel):
    success: bool        # Always true on success
    token: str           # JWT access token
    role: str            # User's role name
    message: str         # Welcome message
```

### UserResponse (Auth)

```python
class UserResponse(BaseModel):
    user_id: str         # UUID as string
    email: str           # User's email
    first_name: str      # First name
    last_name: str       # Last name
    role: str            # Role name
    is_active: bool      # Account active status
```

### UserCreate

```python
class UserCreate(BaseModel):
    employee_code: str          # Required, unique
    first_name: str             # Required
    last_name: str              # Required
    email: EmailStr             # Required, unique
    mobile_no: Optional[str]    # Optional
    password: str               # Required, will be hashed
    department: Optional[str]   # Optional, UUID as string
    role_id: str                # Required, UUID as string
    is_active: bool = True      # Default: true
```

### HTTPValidationError

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "field_name"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

---

## 8. Error Codes

| HTTP Status | Error | Description | Example |
|:-----------:|-------|-------------|---------|
| 200 | — | Success | Valid request processed |
| 400 | Bad Request | Inactive user account | `{"detail": "Inactive user"}` |
| 401 | Unauthorized | Invalid credentials or token | `{"detail": "Invalid email or password"}` |
| 403 | Forbidden | Insufficient role permissions | `{"detail": "Operation not permitted"}` |
| 422 | Validation Error | Missing or invalid request fields | `{"detail": [...validation errors...]}` |

---

## 9. Security Notes

### Current Implementation

1. **Password Storage:** Passwords are hashed with bcrypt via `passlib` — industry standard
2. **JWT Signing:** Tokens signed with HS256 using a configurable secret key
3. **Token Expiry:** 30-minute expiry by default, configurable via environment variable
4. **RBAC Enforcement:** Role checks implemented as FastAPI dependency injection
5. **Input Validation:** Pydantic v2 with `EmailStr` validation for email fields
6. **Database ORM:** SQLAlchemy with parameterized queries (SQL injection protected)

### Observations & Recommendations

| Area | Observation | Severity |
|------|-------------|----------|
| Secret Key | Hardcoded in `.env` as `my_super_secret_key_123456` | ⚠️ HIGH |
| CORS | No CORS middleware configured | ⚠️ MEDIUM |
| Rate Limiting | No rate limiting on login endpoint | ⚠️ MEDIUM |
| Refresh Tokens | No refresh token mechanism | ℹ️ LOW |
| Account Lockout | No account lockout after failed attempts | ⚠️ MEDIUM |
| Password Policy | No minimum password length/complexity enforcement | ⚠️ MEDIUM |
| HTTPS | No HTTPS enforcement in application layer | ⚠️ HIGH |
| Test Users | HR_ADMIN and TECH_HEAD test users have invalid password hashes | ℹ️ INFO |

---

*This documentation was auto-generated from source code analysis and live API testing on 2026-06-21.*
