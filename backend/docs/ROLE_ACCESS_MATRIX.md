# ATLAS Role Access Matrix

> **Version:** 1.0.0  
> **Last Updated:** 2026-06-21  
> **System:** ATLAS Interview Management System

---

## 1. Defined Roles

| # | Role Name | Description | Scope |
|---|-----------|-------------|-------|
| 1 | `SYSTEM_ADMIN` | System Administrator — full access superuser | All endpoints |
| 2 | `HR_ADMIN` | Human Resources Administrator | HR operations |
| 3 | `TECH_HEAD` | Technical Department Head | Tech operations |
| 4 | `RECEPTIONIST` | Reception / Front Desk | Reception operations |
| 5 | `HR_PANEL` | HR Interview Panel Member | Interview participation |
| 6 | `L1_PANEL` | Level 1 Interview Panel Member | Interview participation |
| 7 | `L2_PANEL` | Level 2 Interview Panel Member | Interview participation |

---

## 2. Complete Access Matrix

### Legend

| Symbol | Meaning |
|:------:|---------|
| ✅ | Access Granted (200 OK) |
| ❌ | Access Denied (403 Forbidden) |
| 🔓 | Public — No authentication required |
| 🔐 | Requires authentication (any role) |

---

### Endpoint × Role Matrix

| Endpoint | Auth | SYSTEM_ADMIN | HR_ADMIN | TECH_HEAD | RECEPTIONIST | HR_PANEL | L1_PANEL | L2_PANEL |
|----------|:----:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /` | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| `POST /api/auth/login` | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| `GET /api/auth/me` | 🔐 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/protected` | 🔐 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/protected/me` | 🔐 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/admin/dashboard` | 🔐+Role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/hr/dashboard` | 🔐+Role | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/tech/dashboard` | 🔐+Role | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/reception/dashboard` | 🔐+Role | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /api/admin` | 🔐+Role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Role-Specific Access Lists

### SYSTEM_ADMIN

> **Superuser** — has access to all endpoints

| Status | Endpoint |
|:------:|----------|
| ✅ | `GET /` |
| ✅ | `POST /api/auth/login` |
| ✅ | `GET /api/auth/me` |
| ✅ | `GET /api/protected` |
| ✅ | `GET /api/protected/me` |
| ✅ | `GET /api/admin/dashboard` |
| ✅ | `GET /api/hr/dashboard` |
| ✅ | `GET /api/tech/dashboard` |
| ✅ | `GET /api/reception/dashboard` |
| ✅ | `GET /api/admin` |

---

### HR_ADMIN

| Status | Endpoint | Reason |
|:------:|----------|--------|
| ✅ | `GET /` | Public |
| ✅ | `POST /api/auth/login` | Public |
| ✅ | `GET /api/auth/me` | Any authenticated |
| ✅ | `GET /api/protected` | Any authenticated |
| ✅ | `GET /api/protected/me` | Any authenticated |
| ❌ | `GET /api/admin/dashboard` | SYSTEM_ADMIN only |
| ✅ | `GET /api/hr/dashboard` | HR_ADMIN allowed |
| ❌ | `GET /api/tech/dashboard` | TECH_HEAD only |
| ❌ | `GET /api/reception/dashboard` | RECEPTIONIST only |
| ❌ | `GET /api/admin` | SYSTEM_ADMIN only |

---

### TECH_HEAD

| Status | Endpoint | Reason |
|:------:|----------|--------|
| ✅ | `GET /` | Public |
| ✅ | `POST /api/auth/login` | Public |
| ✅ | `GET /api/auth/me` | Any authenticated |
| ✅ | `GET /api/protected` | Any authenticated |
| ✅ | `GET /api/protected/me` | Any authenticated |
| ❌ | `GET /api/admin/dashboard` | SYSTEM_ADMIN only |
| ❌ | `GET /api/hr/dashboard` | HR_ADMIN only |
| ✅ | `GET /api/tech/dashboard` | TECH_HEAD allowed |
| ❌ | `GET /api/reception/dashboard` | RECEPTIONIST only |
| ❌ | `GET /api/admin` | SYSTEM_ADMIN only |

---

### RECEPTIONIST

| Status | Endpoint | Reason |
|:------:|----------|--------|
| ✅ | `GET /` | Public |
| ✅ | `POST /api/auth/login` | Public |
| ✅ | `GET /api/auth/me` | Any authenticated |
| ✅ | `GET /api/protected` | Any authenticated |
| ✅ | `GET /api/protected/me` | Any authenticated |
| ❌ | `GET /api/admin/dashboard` | SYSTEM_ADMIN only |
| ❌ | `GET /api/hr/dashboard` | HR_ADMIN only |
| ❌ | `GET /api/tech/dashboard` | TECH_HEAD only |
| ✅ | `GET /api/reception/dashboard` | RECEPTIONIST allowed |
| ❌ | `GET /api/admin` | SYSTEM_ADMIN only |

---

### HR_PANEL / L1_PANEL / L2_PANEL

> These roles currently have **no dedicated dashboard endpoints**. They can only access public and general authenticated endpoints.

| Status | Endpoint | Reason |
|:------:|----------|--------|
| ✅ | `GET /` | Public |
| ✅ | `POST /api/auth/login` | Public |
| ✅ | `GET /api/auth/me` | Any authenticated |
| ✅ | `GET /api/protected` | Any authenticated |
| ✅ | `GET /api/protected/me` | Any authenticated |
| ❌ | `GET /api/admin/dashboard` | SYSTEM_ADMIN only |
| ❌ | `GET /api/hr/dashboard` | HR_ADMIN only |
| ❌ | `GET /api/tech/dashboard` | TECH_HEAD only |
| ❌ | `GET /api/reception/dashboard` | RECEPTIONIST only |
| ❌ | `GET /api/admin` | SYSTEM_ADMIN only |

---

## 4. Expected Error Responses

### No Authentication (No Bearer Token)

| Endpoint | Status | Response |
|----------|:------:|----------|
| Any protected endpoint | 401 | `{"detail": "Not authenticated"}` |

### Valid Token, Wrong Role

| Endpoint | Status | Response |
|----------|:------:|----------|
| Any role-restricted endpoint | 403 | `{"detail": "Operation not permitted"}` |

### Invalid/Expired Token

| Endpoint | Status | Response |
|----------|:------:|----------|
| Any protected endpoint | 401 | `{"detail": "Could not validate credentials"}` |

---

## 5. RBAC Implementation Details

### Role Check Configuration (Source: `middleware/role_auth.py`)

```python
# Pre-defined role checkers
require_system_admin = require_role(["SYSTEM_ADMIN"])
require_hr_admin     = require_role(["HR_ADMIN", "SYSTEM_ADMIN"])
require_tech_head    = require_role(["TECH_HEAD", "SYSTEM_ADMIN"])
require_receptionist = require_role(["RECEPTIONIST", "SYSTEM_ADMIN"])
```

### Route → Role Checker Mapping

| Route File | Endpoint | Role Checker | Applied As |
|------------|----------|-------------|------------|
| `routes/protected.py` | `/api/admin/dashboard` | `require_system_admin` | `dependencies=` |
| `routes/protected.py` | `/api/hr/dashboard` | `require_hr_admin` | `dependencies=` |
| `routes/protected.py` | `/api/tech/dashboard` | `require_tech_head` | `dependencies=` |
| `routes/protected.py` | `/api/reception/dashboard` | `require_receptionist` | `dependencies=` |
| `routes/admin.py` | `/api/admin` | `require_role(["SYSTEM_ADMIN"])` | `dependencies=` |

---

## 6. Database Role Records

### Roles Table (from `sql/insert_roles.sql`)

```sql
INSERT INTO roles (role_id, role_name) VALUES
(uuid_generate_v4(), 'SYSTEM_ADMIN'),
(uuid_generate_v4(), 'HR_ADMIN'),
(uuid_generate_v4(), 'RECEPTIONIST'),
(uuid_generate_v4(), 'HR_PANEL'),
(uuid_generate_v4(), 'L1_PANEL'),
(uuid_generate_v4(), 'L2_PANEL'),
(uuid_generate_v4(), 'TECH_HEAD')
ON CONFLICT (role_name) DO NOTHING;
```

### Test Users (from `sql/create_test_users.sql`)

| Role | Email | Employee Code | Notes |
|------|-------|---------------|-------|
| SYSTEM_ADMIN | admin@atlas.com | ADMIN001 | ✅ Working |
| HR_ADMIN | hr.admin@atlas.com | HR001 | ⚠️ Dummy password hash |
| RECEPTIONIST | reception@atlas.com | RECP001 | ✅ Working |
| TECH_HEAD | — | — | ❌ No test user created |

---

*This matrix was generated from source code analysis of the ATLAS backend on 2026-06-21.*
