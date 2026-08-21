# Migration Document 09: Authentication Flow

## 1. Authentication Handshake
```
[React Client]                           [FastAPI Backend]
      │                                         │
      ├─────── POST /api/auth/login ───────────>┤
      │        (email + password)               │
      │                                         │
      <──── Returns TokenResponse (200 OK) ─────┤
      │     (access & refresh token)            │
      │                                         │
      ├───────── GET /api/auth/me ─────────────>┤
      │        (Bearer Access Token)            │
      │                                         │
      <───── Returns UserResponse (200 OK) ─────┤
      │      (email, profile & permissions)     │
```

## 2. Token Lifecycle Management
*   **Access Token**: Stored in `localStorage` as `atlas.access_token`. Included in all dynamic requests under `Authorization: Bearer <token>` header. Expiry is 30 minutes.
*   **Refresh Token**: Stored in `localStorage` as `atlas.refresh_token`. Refreshed automatically via POST `/api/auth/refresh` on HTTP 401 response status, or cleared routing to `/login` if expired.
