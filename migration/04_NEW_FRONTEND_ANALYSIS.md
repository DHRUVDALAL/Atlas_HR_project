# Migration Document 04: New Frontend Analysis

## 1. Directory Structure
The target implementation in `/frontend-new` is built on TanStack Start:
*   `src/routes/`: Contains file-based routing components (e.g. `_authenticated.dashboard.tsx`, `register-candidate.tsx`).
*   `src/lib/api.ts`: Native fetch-based wrapper encapsulating authorization headers injection, error formatting, and automatic access token rotations.
*   `src/lib/auth.tsx`: Auth Context containing session states and roles validation guards (`hasPermission`, `hasRole`).

## 2. Authentication Connection
*   Connected mock sign-in logic directly to backend API `/api/auth/login` and `/api/auth/me`.
*   Restored local sessions on page reload by resolving user profile and permissions list dynamically from the server.
