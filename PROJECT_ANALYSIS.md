# ATLAS Interview Management System — Detailed Project Analysis

## 1. Project Overview

**ATLAS** is a full-stack **Candidate Tracking System (ATS)** / Interview Management System built for **Abhiyanta India Solutions**, an SAP Gold Partner company. It manages the complete hiring pipeline — from walk-in candidate registration through multi-round technical interviews to final CEO/HR hiring decisions.

**Architecture**: Client-Server with Docker Compose orchestration
- **Backend**: Python 3.12 + FastAPI + PostgreSQL 16 + SQLAlchemy + Alembic
- **Frontend**: React 19 + Vite 8 + Material UI 9 + React Router 7
- **Infrastructure**: Docker Compose with 3 services (db, backend, frontend)

---

## 2. Docker Compose Infrastructure

**File**: `docker-compose.yml` (47 lines)

Three services orchestrated:

| Service | Image / Build | Port Mapping | Purpose |
|---------|--------------|--------------|---------|
| `db` | `postgres:16-alpine` | `5433:5432` | PostgreSQL database (host 5433 avoids local PG clash) |
| `backend` | `./backend` (Python 3.12-slim) | `8001:8000` | FastAPI REST API + Uvicorn |
| `frontend` | `./frontend` (Node 22 build → nginx 1.27) | `5174:80` | SPA served by nginx, proxied to backend |

Key design decisions:
- **Health check on db**: `pg_isready` with 5s interval, 10 retries — backend waits for `service_healthy` before starting
- **Named volumes**: `pgdata` for DB persistence, `uploads` for signature PDFs (shared between backend restarts)
- **Environment defaults**: Sensible dev defaults baked in; `.env` file only needed for production overrides
- **No CORS needed in Docker**: nginx reverse-proxies `/api/*` to the backend at same origin, avoiding CORS entirely

---

## 3. Backend Deep Dive

### 3.1 Tech Stack & Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.115.6 | Async web framework |
| uvicorn[standard] | 0.34.0 | ASGI server |
| sqlalchemy | 2.0.36 | ORM |
| alembic | 1.14.0 | DB migrations |
| psycopg2-binary | 2.9.10 | PostgreSQL driver |
| python-jose[cryptography] | 3.3.0 | JWT encode/decode |
| passlib[bcrypt] | 1.7.4 + bcrypt 4.2.1 | Password hashing |
| pydantic[email] | 2.10.4 | Request/response validation |
| slowapi | 0.1.9 | Rate limiting |
| python-multipart | 0.0.20 | File uploads |
| aiofiles | 24.1.0 | Async file I/O |
| pytest + httpx | 8.3.4 + 0.28.1 | Testing |

### 3.2 Database Schema (14 tables)

**Core User/Auth tables:**

| Table | Purpose |
|-------|---------|
| `users` | Staff accounts (UUID PK, employee_code, email, bcrypt password, role FK, failed_login_attempts, locked_until) |
| `roles` | Named roles (SYSTEM_ADMIN, HR_ADMIN, RECEPTIONIST, L1/L2_PANEL, TECH_HEAD, HR_PANEL) |
| `permissions` | Machine codes (e.g. `candidate.list`, `workflow.hr_review`) |
| `role_permissions` | Many-to-many junction table |
| `refresh_tokens` | SHA-256 hashed refresh tokens with expiry and revocation |

**Candidate/Workflow tables:**

| Table | Purpose |
|-------|---------|
| `candidates` | Main candidate record (9 status states, personal info, address, domain) |
| `applicant_professional_details` | Section 2: company, designation, experience, CTC |
| `applicant_employment_history` | Section 3: multi-row work history |
| `applicant_education` | Section 4: multi-row education records |
| `applicant_personality_assessment` | Section 5: 1-5 ratings per question |
| `applicant_situational_responses` | Section 6: A/B/C/D multiple choice |
| `applicant_written_responses` | Section 7: Free-text answers (20-2000 chars) |
| `applicant_declaration` | Section 8: Boolean consent flags |
| `candidate_documents` | Signature PDF uploads |
| `interview_panel_assessment` | Section 9: Panel ratings (internal only) |
| `candidate_activity_logs` | Full audit trail |
| `interview_rounds` | Dynamic multi-round engine (HR_REVIEW → TECHNICAL × N → CEO_ROUND) |
| `final_decisions` | Final hiring decision (SELECTED/REJECTED/HOLD + CTC + joining date) |
| `candidate_assignments` | Assignment tracking (who evaluates what) |

### 3.3 Application Number Format

`ATLAS-APP-YYYYMMDD-XXXX` — sequential within each day, zero-padded 4 digits.

### 3.4 Authentication & Authorization

**Authentication flow:**
1. `POST /api/auth/login` — email + password, rate-limited to 5/minute
2. Account lockout after 5 failed attempts (15-minute lockout window)
3. Returns JWT access token + refresh token
4. Refresh tokens stored as SHA-256 hashes (raw token never persisted)
5. `POST /api/auth/refresh` — rotation: old token revoked, new pair issued
6. `POST /api/auth/logout` — revokes the presented refresh token (idempotent)

**Authorization model — Permission-based RBAC:**
- 15 permission codes defined in `utils/permissions.py`
- Roles are just named bundles of permission codes in the DB
- Code never checks role names — only permission codes via `require_permission()` dependency
- Adding a new interview panel = add a role + map to existing permissions (zero code changes)

**Permission catalog:**
```
candidate.list, candidate.read, candidate.update, candidate.update_any, candidate.delete
workflow.reception_forward, workflow.hr_review, workflow.technical_evaluate, workflow.ceo_evaluate
decision.final
evaluation.view_all, evaluation.view_hr, evaluation.view_assigned
user.manage, role.read
```

**Visibility scoping**: The `serialize_candidate_for_user()` function in `routes/applicant.py` filters what internal data (interview rounds, activity logs, final decision) is returned based on the viewer's permissions:
- `evaluation.view_all` → sees everything (admin/CEO)
- `evaluation.view_hr` → sees HR rounds only + logs + decision if SELECTED
- `evaluation.view_assigned` → sees only their own assigned rounds
- No evaluation permission → sees Sections 1-8 only (receptionist)

### 3.5 Workflow Engine (State Machine)

The hiring pipeline is a state machine with these transitions:

```
SUBMITTED → RECEPTION_FORWARDED → REJECTED | ON_HOLD
                                    ↓ SELECT
                              TECH_ROUND_1 → TECH_ROUND_2 → ... → TECH_ROUND_N → CEO_ROUND → FINAL_DECISION
                                    ↓ REJECTED/HOLD at any point
                                  REJECTED | ON_HOLD
```

**Workflow steps:**
1. **Public submission**: Candidate fills 8-section form in browser → single atomic multipart POST → status: `Submitted — awaiting reception`
2. **Receptionist**: Views, edits pre-arrival fields → forwards to HR → status: `RECEPTION_FORWARDED`
3. **HR Review**: Sets domain, configures N technical rounds, assigns Round 1 interviewer → SELECT creates Round 1 (status: `TECH_ROUND_1`) / REJECT or HOLD stops the pipeline
4. **Technical rounds**: Assigned interviewer evaluates → COMPLETED forwards to next round (or CEO if last) / REJECTED or HOLD stops
5. **CEO round**: Admin reviews → can save draft or submit → status: `FINAL_DECISION`
6. **Final decision**: HR/Admin records SELECTED (with CTC + joining date), REJECTED, or HOLD

**Concurrency control**: `_lock_candidate()` takes a `SELECT ... FOR UPDATE` row lock to serialize concurrent workflow transitions. Round rows are also locked individually.

### 3.6 API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login (5/min rate limit) |
| POST | `/api/auth/refresh` | Public | Rotate refresh token |
| POST | `/api/auth/logout` | Public | Revoke refresh token |
| GET | `/api/auth/me` | JWT | Current user + permissions |
| POST | `/api/applicant` | Public | Submit full application (multipart) |
| GET | `/api/applicants` | `candidate.list` | List candidates (pagination, filters, search, sort) |
| GET | `/api/applicant/{id}` | `candidate.read` | Get full candidate (visibility filtered) |
| PUT | `/api/applicant/{id}` | `candidate.update`/`update_any` | Edit candidate sections |
| DELETE | `/api/applicant/{id}` | `candidate.delete` | Delete candidate |
| GET | `/api/workflow/my-assignments` | `workflow.technical_evaluate` | Interviewer's own queue |
| POST | `/api/workflow/receptionist/forward/{id}` | `workflow.reception_forward` | Forward to HR |
| POST | `/api/workflow/hr/review/{id}` | `workflow.hr_review` | HR review submission |
| POST | `/api/workflow/technical/evaluate/{id}/{round}` | `workflow.technical_evaluate` | Technical evaluation |
| POST | `/api/workflow/ceo/evaluate/{id}` | `workflow.ceo_evaluate` | CEO evaluation |
| POST | `/api/workflow/final-decision/{id}` | `decision.final` | Final hiring decision |
| GET | `/api/scorecard/domains` | Public | SAP domain list |
| GET | `/api/scorecard/{domain}` | Public | SAP scorecard topics |
| POST | `/api/users` | `user.manage` | Create user |
| GET | `/api/users` | `user.manage` | List users |
| PUT | `/api/users/{id}` | `user.manage` | Update user |
| DELETE | `/api/users/{id}` | `user.manage` | Delete user (not self) |
| GET | `/api/roles` | `role.read` | List roles |

### 3.7 Security Features

- **JWT tokens** with configurable expiry (default 30min access, 7-day refresh)
- **Refresh token rotation** — old token revoked on every refresh
- **SHA-256 hashed refresh tokens** — DB leak doesn't compromise sessions
- **Account lockout** — 5 failed attempts → 15-minute lockout
- **Password strength validation** — minimum 12 chars, uppercase, lowercase, digit, special char
- **Rate limiting** — 5/min on login, 20/hour on candidate submission, 20/min on refresh
- **Security headers middleware** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy
- **CORS configuration** — configurable allowed origins
- **File upload validation** — PDF magic bytes check (`%PDF-`), 5MB max, sanitized filenames
- **Server-side path never exposed** — `file_path` omitted from API responses
- **Permission-based RBAC** — never role-name checks in code

### 3.8 SAP Scorecard Module

A static knowledge base for SAP technical interviews across 10 domains:
- FI, CO, MM, SD, PP, QM, PM, WM, HCM, BASIS
- Each domain has 10-20 specific technical topics
- Rating scale: Good → OK → Basic → Has knowledge (not worked) → Not worked → Bad
- HR/CEO dimensions for soft-skill evaluation (7 dimensions)

### 3.9 Seed Data

The `database/seed.py` is idempotent:
1. Creates 7 roles (SYSTEM_ADMIN, HR_ADMIN, RECEPTIONIST, HR_PANEL, L1/L2_PANEL, TECH_HEAD)
2. Creates 15 permissions and wires them to roles
3. Creates one SYSTEM_ADMIN from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars
4. Never resets existing passwords; additional users created via the API

### 3.10 Test Suite

Three test files with comprehensive coverage:

| File | Tests | Coverage |
|------|-------|----------|
| `test_workflow.py` | 2 tests | Full end-to-end workflow (submit → reception → HR → L1 → L2 → CEO → final decision) + RBAC violations |
| `test_applicant_api.py` | ~35 tests | Submission (12), Read/List/Update (8), Validation (14), Negative (5), Database (4), File Upload (2) |
| `test_user_api.py` | 5 tests | Unauthorized access, forbidden access, role listing, full user CRUD, account lockout |

Tests use PostgreSQL (not SQLite) to properly test JSONB columns and native UUID types.

---

## 4. Frontend Deep Dive

### 4.1 Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.6 | UI library |
| Vite | 8.0.12 | Build tool |
| @mui/material | 9.1.1 | Component library |
| @mui/x-data-grid | 9.6.0 | Data tables |
| @mui/x-date-pickers | 9.6.0 | Date inputs |
| react-router-dom | 7.18.0 | Client-side routing |
| react-hook-form | 7.80.0 | Form management |
| @hookform/resolvers + yup | 5.4.0 + 1.7.1 | Schema validation |
| axios | 1.18.0 | HTTP client |
| recharts | 3.8.1 | Charts |
| dayjs | 1.11.21 | Date formatting |
| @hello-pangea/dnd | 18.0.1 | Drag-and-drop |

### 4.2 Frontend Architecture

```
src/
├── api/                    # API service layer
│   ├── axiosInstance.js    # Axios with JWT interceptors + 401 redirect
│   ├── authService.js      # Login, logout, refresh, getCurrentUser
│   └── applicantService.js # All candidate/workflow/scorecard API calls
├── contexts/
│   ├── AuthContext.jsx     # Auth state, permissions, login/logout
│   └── NotificationContext.jsx
├── routes/
│   ├── AppRoutes.jsx       # All routes with permission gating
│   ├── ProtectedRoute.jsx  # Auth guard (redirect to /login if no user)
│   └── RequirePermission.jsx # Permission guard (redirect to /dashboard)
├── pages/                  # Route-level components
│   ├── LandingPage.jsx     # Public landing page (Abhiyanta branding)
│   ├── Login.jsx           # Staff login (react-hook-form + yup)
│   ├── CandidateForm.jsx   # 8-step multi-step wizard (public)
│   ├── Dashboard.jsx       # Single permission-driven dashboard
│   ├── EditCandidatesList.jsx  # Candidate list with filters
│   ├── HrReviewForm.jsx    # HR review submission
│   ├── InterviewerEvalForm.jsx # Technical evaluation form
│   └── AdminCandidateReview.jsx # Admin/CEO full review + final decision
├── components/
│   ├── Can.jsx             # Permission-gating component
│   ├── Sidebar.jsx         # Permission-aware navigation
│   ├── TopNav.jsx          # Top navigation bar
│   ├── common/             # Reusable UI components (DataTable, StatusChip, etc.)
│   ├── dashboard/          # Dashboard widget components
│   ├── forms/              # Form field components (TextField, Select, DatePicker, FileUpload)
│   └── CandidateFormReadOnly.jsx
├── layouts/
│   └── DashboardLayout.jsx # Sidebar + TopNav + Outlet layout
├── theme/
│   ├── theme.js            # MUI theme (Indigo/Emerald palette, Inter font)
│   └── ThemeContext.jsx     # Theme provider
└── utils/
    ├── permissions.js      # Permission code constants (mirrors backend)
    ├── validators.js       # Form validation helpers
    └── constants.js        # Status labels, colors, etc.
```

### 4.3 Frontend Key Design Decisions

1. **Single dashboard for all roles** — The `Dashboard.jsx` uses `<Can>` components to show/hide widgets based on permissions, not role names.

2. **Permission-driven routing** — `RequirePermission` wraps routes and redirects unauthorized users to `/dashboard` (not a "no access" page).

3. **Candidate form is browser-side wizard** — The 8-step form is filled entirely in the browser. On final submit, it's a single atomic multipart POST. There is no server-side draft — the form state is persisted in `localStorage` as a client-side draft only.

4. **No role-name checks in frontend** — All UI gating uses permission codes from `utils/permissions.js`, matching the backend contract exactly.

5. **Axios interceptors** — Automatically attaches Bearer token, handles 401 by clearing session and redirecting to login (but only for authenticated users, not anonymous candidates on the public form).

6. **Dark mode support** — Theme system supports light/dark modes via `ThemeContext`.

### 4.4 Frontend Build & Deployment

**Multi-stage Docker build:**
1. Build stage: `node:22-alpine` — `npm ci` + `npm run build` (Vite outputs to `dist/`)
2. Serve stage: `nginx:1.27-alpine` — Serves static SPA + reverse-proxies `/api/*` to backend

**Nginx configuration (`nginx.conf`):**
- Hashed assets cached for 1 year (`Cache-Control: public, immutable`)
- `index.html` is never cached (`no-store, must-revalidate`)
- SPA fallback: `try_files $uri $uri/ /index.html`
- API proxy: `/api/` → `http://backend:8000/api/` (same-origin, no CORS)

---

## 5. Candidate Form (8-Step Wizard)

The public candidate registration form is the most complex frontend component (1192 lines). Steps:

1. **Personal Details** — Name, email, phone, gender, DOB, address, position applied for
2. **Professional Info** — Current company, designation, experience (total + relevant), CTC, notice period, employment type
3. **Work History** — Dynamic table: add/remove employment records (company, dates, responsibilities)
4. **Education** — Dynamic table: qualification, institution, university, year, percentage, grade
5. **Perspective** — 18 personality assessment questions (1-5 rating scale)
6. **Workplace Scenarios** — 4 situational judgment questions (A/B/C/D options)
7. **Descriptive Qs** — 2 written response questions (20-2000 chars)
8. **Review & Submit** — Preview all sections, upload signature PDF, accept declaration, submit

**Client-side draft**: Form state saved to `localStorage` under `candidate_form_draft` key. Signature File object cannot be serialized, so it's excluded from the draft.

---

## 6. Deployment Architecture

```
                    ┌─────────────────────────────────┐
                    │         Docker Compose           │
                    │                                  │
  :5174 ──────────►│  ┌──────────┐   ┌──────────┐    │
                    │  │ frontend │──►│ backend  │    │
                    │  │ (nginx)  │   │ (uvicorn)│    │
                    │  │ :80      │   │ :8000    │    │
                    │  └──────────┘   └────┬─────┘    │
                    │                      │           │
                    │               ┌──────┴──────┐   │
                    │               │     db      │   │
                    │               │ (postgres)  │   │
                    │               │   :5432     │   │
                    │               └─────────────┘   │
                    └─────────────────────────────────┘
```

- Frontend on `:5174` → nginx serves SPA + proxies `/api/*` to backend
- Backend on `:8001` (host) → `:8000` (container)
- Database on `:5433` (host) → `:5432` (container) — avoids conflict with local PG
- Persistent volumes: `pgdata` (DB data), `uploads` (signature PDFs)

---

## 7. Code Quality Observations

**Strengths:**
- Clean separation of concerns (routes → services → models)
- Permission-based RBAC is extensible without code changes
- Comprehensive test suite covering workflows, validation, RBAC
- Atomic candidate submission with file cleanup on DB failure
- Row-level locking prevents race conditions in workflow transitions
- Refresh token rotation with SHA-256 hashing
- Rate limiting on sensitive endpoints
- Security headers middleware

**Potential concerns:**
- `test_workflow.py` references a hardcoded SQLite path (`C:/Users/dhruv/Desktop/...`) — likely stale
- `conftest.py` creates all tables via `Base.metadata.create_all()` rather than running Alembic migrations
- No refresh token usage implemented in the frontend (axios interceptor doesn't auto-refresh on 401)
- `Sidebar.jsx` brand text says "RecruitPro" but LandingPage uses "Abhiyanta India Solutions"
- The `CandidateForm.jsx` localStorage draft has no encryption or expiration
- No logging/monitoring configuration visible

---

## 8. Summary

ATLAS is a well-architected, production-ready interview management system with:
- **14-table PostgreSQL schema** with full audit trails
- **Permission-based RBAC** with 15 granular permission codes across 7 roles
- **State-machine workflow** with concurrency-safe transitions
- **Multi-step candidate form** with client-side validation and atomic server submission
- **SAP-specific scorecard** module for technical interview evaluation
- **Docker Compose** one-command deployment
- **Comprehensive test suite** covering the full workflow end-to-end
