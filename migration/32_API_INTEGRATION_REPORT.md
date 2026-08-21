# ATLAS API Integration Report — Phase 9

**Date:** July 13, 2026  
**Scope:** Frontend ↔ Backend API integration audit

---

## 1. API Client Architecture

### Current Implementation (`frontend-new/src/lib/api.ts`)
```typescript
// Generic API function
api<T>(path: string, options?: RequestInit): Promise<T>

// Auth API
authApi.login(email, password): Promise<LoginResponse>
authApi.refresh(refreshToken): Promise<RefreshResponse>
authApi.logout(refreshToken): Promise<void>
authApi.me(): Promise<User>
```

### Token Management
- **Storage:** `atlas.access_token` and `atlas.refresh_token` in localStorage
- **Refresh:** Automatic on 401 response
- **Retry:** Single retry after token refresh
- **Logout:** Clear localStorage, redirect to login

---

## 2. Frontend → API Endpoint Mapping

### Authentication
| Frontend Call | API Endpoint | Status |
|--------------|-------------|--------|
| `authApi.login()` | `POST /api/auth/login` | ✅ Working |
| `authApi.refresh()` | `POST /api/auth/refresh` | ✅ Working |
| `authApi.logout()` | `POST /api/auth/logout` | ✅ Working |
| `authApi.me()` | `GET /api/auth/me` | ✅ Working |

### Candidate Management
| Frontend Call | API Endpoint | Status |
|--------------|-------------|--------|
| `api('/api/applicants')` | `GET /api/applicants` | ✅ Working |
| `api('/api/candidate/{id}')` | `GET /api/candidate/{id}` | ✅ Working |
| `api('/api/candidate/{id}', {method:'PUT'})` | `PUT /api/candidate/{id}` | ✅ Working |
| `api('/api/candidate/{id}', {method:'DELETE'})` | `DELETE /api/candidate/{id}` | ✅ Working |
| `api('/api/candidate/{id}/submit')` | `POST /api/candidate/{id}/submit` | ✅ Working |
| `api('/api/candidate/{id}/documents')` | `GET /api/candidate/{id}/documents` | ✅ Working |
| `api('/api/candidate/{id}/activity')` | `GET /api/candidate/{id}/activity` | ✅ Working |
| `api('/api/candidate/{id}/timeline')` | `GET /api/candidate/{id}/timeline` | ✅ Working |

### Workflow
| Frontend Call | API Endpoint | Status |
|--------------|-------------|--------|
| `api('/api/workflow/hr/review/{id}')` | `POST /api/workflow/hr/review/{id}` | ✅ Working |
| `api('/api/workflow/technical/evaluate/{id}')` | `POST /api/workflow/technical/evaluate/{id}` | ✅ Working |
| `api('/api/workflow/my-assignments')` | `GET /api/workflow/my-assignments` | ✅ Working |
| `api('/api/workflow/ceo/evaluate/{id}')` | `POST /api/workflow/ceo/evaluate/{id}` | ✅ Working |
| `api('/api/workflow/final-discussion/{id}')` | `POST /api/workflow/final-discussion/{id}` | ✅ Working |
| `api('/api/workflow/final-decision/{id}')` | `POST /api/workflow/final-decision/{id}` | ✅ Working |
| `api('/api/workflow/dashboard/stats')` | `GET /api/workflow/dashboard/stats` | ✅ Working |
| `api('/api/workflow/ceo/candidates')` | `GET /api/workflow/ceo/candidates` | ✅ Working |

### Scorecard
| Frontend Call | API Endpoint | Status |
|--------------|-------------|--------|
| `api('/api/scorecard/domains')` | `GET /api/scorecard/domains` | ✅ Working |
| `api('/api/scorecard/topics')` | `GET /api/scorecard/topics` | ✅ Working |
| `api('/api/scorecard/topics', {method:'POST'})` | `POST /api/scorecard/topics` | ✅ Working |

### Users
| Frontend Call | API Endpoint | Status |
|--------------|-------------|--------|
| `api('/api/users')` | `GET /api/users` | ✅ Working |
| `api('/api/users', {method:'POST'})` | `POST /api/users` | ✅ Working |

---

## 3. localStorage Usage Audit

| Key | Used By | Purpose | Status |
|-----|---------|---------|--------|
| `atlas.access_token` | `api.ts`, `auth.tsx` | JWT access token | ✅ Active |
| `atlas.refresh_token` | `api.ts`, `auth.tsx` | JWT refresh token | ✅ Active |
| `atlas.user` | `auth.tsx` | Cached user object | ✅ Active |
| `atlas.offers` | `offer.*` routes | Offer records (localStorage-only) | ✅ Active |
| `atlas.onboarding` | `onboarding.*` routes | Onboarding records (localStorage-only) | ✅ Active |
| `atlas.onboarding_doc` | **NONE** | Unused | ❌ Remove |

---

## 4. Missing API Integrations

### Offer Management (Frontend-Only)
- **No backend endpoints** for offer CRUD
- All offer data stored in localStorage
- **Risk:** Data lost on browser clear, no multi-device sync

### Onboarding (Frontend-Only)
- **No backend endpoints** for onboarding CRUD
- All onboarding data stored in localStorage
- **Risk:** Same as offer management

### Public Registration
- **POST /api/applicant** — multipart: JSON payload + PDF signature
- **No frontend integration** — registration form exists but submission not implemented

---

## 5. Error Handling Audit

### Current Pattern
```typescript
try {
  const data = await api('/api/some/endpoint');
  setData(data);
} catch (error) {
  console.error('Error:', error);
  toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
}
```

### Issues Found
1. **No global error handler** — each component handles errors independently
2. **No retry logic** — transient failures not handled
3. **No abort controllers** — race conditions possible
4. **Inconsistent error messages** — some use `error.message`, some hardcode strings

---

## 6. Recommendations

### Immediate
1. Remove `atlas.onboarding_doc` from localStorage
2. Add AbortController to all API calls
3. Add global TanStack Query error handler

### Short-Term
4. Add retry with exponential backoff
5. Add request deduplication window
6. Implement public registration form submission

### Medium-Term
7. Add backend endpoints for offer management
8. Add backend endpoints for onboarding management
9. Add API response caching strategy
