# Migration Document 11: Migration Backlog

## Backlog Tasks

*   **Task-001: Auth Context Integration**
    *   Description: Connect login, logout, and restoreSession functions to backend API endpoints.
    *   Priority: Critical
    *   Files: `frontend-new/src/lib/auth.tsx`
    *   Status: DONE
    *   Estimated Complexity: Medium

*   **Task-002: Seed Credentials Login Mapping**
    *   Description: Map quick sign-in helper button clicks in the login page to use seeded backend credentials.
    *   Priority: High
    *   Files: `frontend-new/src/routes/login.tsx`
    *   Status: DONE
    *   Estimated Complexity: Low

*   **Task-003: Vite Compilation Verification**
    *   Description: Re-compile production assets to verify all packages load and bundle successfully.
    *   Priority: High
    *   Files: `frontend-new/package.json`
    *   Status: DONE
    *   Estimated Complexity: Low

*   **Task-004: Candidate Registration Module Migration**
    *   Description: Reconstruct the Candidate Registration Wizard wizard steps, validate payload structure mapping, resolve mismatching API paths, add digital signature file upload, and map to POST /api/applicant.
    *   Priority: Critical
    *   Files: `frontend-new/src/routes/register-candidate.tsx`
    *   Status: DONE
    *   Estimated Complexity: High
    *   Verification Checklist:
        *   ✅ Personal Details, Professional, Employment History, Education, Personality, Situational, Written, and Declaration stages present.
        *   ✅ Digital Signature file upload (PDF max 5MB) is verified.
        *   ✅ Input schema maps 100% to backend `ApplicantFullCreate` schema.
        *   ✅ Single atomic multipart form-data request to `POST /api/applicant` completes successfully.
        *   ✅ browser-persisted draft state works.
        *   ✅ edit-mode via search query works.
