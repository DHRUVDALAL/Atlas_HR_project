# Migration Document 02: Backend Analysis

## 1. Backend Specifications
The backend is a FastAPI application configured to run on port `8000` by default. It utilizes SQLAlchemy v2.0 style syntax connected to a PostgreSQL database.

## 2. API Prefix and Structure
All endpoints are prefix-grouped under `/api`.
*   Authentication: `/api/auth`
*   Applicants: `/api/applicants`
*   Workflow Engine: `/api/workflow`
*   Admin Services: `/api/user`

## 3. Database Schema Overview
*   **candidates**: Tracks first_name, last_name, email, phone, and lifecycle statuses.
*   **interview_rounds**: Structured ratings and observations for HR review, L1/L2 Technical rounds, CEO evaluation, and Final Decision parameters.
*   **users**: Staff credentials (password hashing via passlib bcrypt).
