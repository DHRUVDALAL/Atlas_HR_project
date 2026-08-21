# Migration Document 03: Old Frontend Analysis

## 1. Structure
The reference implementation in `/frontend` is a standard SPA utilizing:
*   `contexts/AuthContext.jsx`: Handles global login tokens state and calls `/auth/me` to retrieve permissions.
*   `api/axiosInstance.js`: Configures baseURL and incorporates response interceptors to automatically log out on expired credentials (401 response).
*   `components/dashboard/`: Contains dashboard widgets for Receptionist, HR Panel, L1/L2 panel interviewers, and CEO evaluations.

## 2. Key Deficiencies Identified & Remedied
*   **Imports Errors**: Several pages had missing MUI component imports (e.g. `Chip`, `Tabs`, `Dialog`) resulting in blank screens, which were audited and fully resolved.
