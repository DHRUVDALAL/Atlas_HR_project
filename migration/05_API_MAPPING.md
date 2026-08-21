# Migration Document 05: API Mapping

## 1. Authentication Endpoints
*   `POST /api/auth/login`: Sign-in user (maps to `login` in `auth.tsx`)
*   `GET /api/auth/me`: Resolve staff permissions (maps to `restoreSession` and post-login verification in `auth.tsx`)
*   `POST /api/auth/logout`: Revoke active refresh token (maps to `logout` in `auth.tsx`)
*   `POST /api/auth/refresh`: Rotate refresh token (maps to `refreshAccessToken` in `api.ts`)

## 2. Candidates & Workflow Endpoints
*   `POST /api/applicants/register`: Register applicant profile
*   `POST /api/applicants/{id}/upload-document`: Upload PDF resumes or signature forms
*   `POST /api/workflow/receptionist/forward/{id}`: Forward applicant from reception to HR review stage
*   `POST /api/workflow/hr/review/{id}`: HR review scorecard submit
*   `POST /api/workflow/interviewer/evaluate/{id}`: L1/L2 Technical round scorecard submit
*   `POST /api/workflow/ceo/evaluate/{id}`: CEO feedback submit
*   `POST /api/workflow/admin/final-decision/{id}`: Offer selection release
