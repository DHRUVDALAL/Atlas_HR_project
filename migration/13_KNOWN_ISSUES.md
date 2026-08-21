# Migration Document 13: Known Issues

No outstanding functional issues or runtime ReferenceErrors were identified.

## Previously Resolved Issues
*   **Issue**: `[MISSING_EXPORT] "MOCK_ACCOUNTS" is not exported by "src/lib/auth.tsx"`.
    *   Cause: The target login page depended on MOCK_ACCOUNTS exports which were removed from auth context to prevent hardcoded credentials.
    *   Resolution: Refactored the login page to declare MOCK_ACCOUNTS locally mapping to real backend seed accounts and password inputs.
    *   Status: RESOLVED

*   **Issue**: Mismatched Candidate Registration API path.
    *   Cause: The placeholder frontend used `POST /api/applicants/register` which does not exist on the backend and sent flat details, whereas backend requires a single atomic `POST /api/applicant` multipart request containing `payload` (JSON string containing nested `personal_details`, `professional_details`, etc.) and `signature` (digital signature PDF file).
    *   Resolution: Reconstructed payload formatting, connected signature PDF file uploading, and aligned fetch requests to `/api/applicant`.
    *   Status: RESOLVED
