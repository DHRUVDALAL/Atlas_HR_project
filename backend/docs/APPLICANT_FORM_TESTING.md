# ATLAS HR Project — Applicant Form Testing Documentation

## Overview

This document describes the complete testing strategy for the Applicant Form Intake Module. The test suite covers API functionality, field-level validation, error handling, database integrity, and file upload mechanics.

---

## Test Environment Setup

### Prerequisites

- Python 3.11+
- PostgreSQL running locally
- All dependencies installed (`pip install -r requirements.txt`)
- pytest installed (`pip install pytest httpx`)

### Running Tests

```bash
cd /Users/dhruv/Desktop/SAP_Project/Atlas/backend

# Run all applicant tests
python3 -m pytest tests/test_applicant_api.py -v

# Run specific test class
python3 -m pytest tests/test_applicant_api.py::TestCreateApplicant -v

# Run with detailed output
python3 -m pytest tests/test_applicant_api.py -v --tb=long

# Run and stop on first failure
python3 -m pytest tests/test_applicant_api.py -v -x
```

---

## Test Categories

### 1. API Tests (CRUD Operations)

| # | Test | Method | Endpoint | Expected |
|---|------|--------|----------|----------|
| 1 | Create full application | POST | `/api/applicants` | 201 — all sections saved |
| 2 | Create minimal (Section 1 only) | POST | `/api/applicants` | 201 — optional sections null |
| 3 | Reject duplicate email | POST | `/api/applicants` | 400 |
| 4 | Get existing applicant | GET | `/api/applicants/{id}` | 200 — all sections returned |
| 5 | Get non-existent applicant | GET | `/api/applicants/{id}` | 404 |
| 6 | Get with invalid UUID | GET | `/api/applicants/{id}` | 400 |
| 7 | List applicants | GET | `/api/applicants` | 200 — paginated list |
| 8 | List with pagination | GET | `/api/applicants?skip=0&limit=5` | 200 — respects params |
| 9 | List with status filter | GET | `/api/applicants?status=DRAFT` | 200 — filtered results |
| 10 | Update personal details | PUT | `/api/applicants/{id}` | 200 — fields updated |
| 11 | Add sections via update | PUT | `/api/applicants/{id}` | 200 — new sections added |
| 12 | Update non-existent | PUT | `/api/applicants/{id}` | 404 |
| 13 | Submit complete application | POST | `/api/applicants/{id}/submit` | 200 — status=SUBMITTED |
| 14 | Submit incomplete application | POST | `/api/applicants/{id}/submit` | 400 |
| 15 | Submit already submitted | POST | `/api/applicants/{id}/submit` | 400 |
| 16 | Update submitted application | PUT | `/api/applicants/{id}` | 400 |

---

### 2. Validation Tests

| # | Test | Field | Invalid Value | Expected |
|---|------|-------|---------------|----------|
| 1 | Invalid email format | `email` | `"not-an-email"` | 422 |
| 2 | Phone not 10 digits | `phone` | `"12345"` | 422 |
| 3 | Future date of birth | `date_of_birth` | `"2030-01-01"` | 422 |
| 4 | Invalid gender | `gender` | `"INVALID"` | 422 |
| 5 | Negative CTC | `current_ctc` | `-50000` | 422 |
| 6 | Negative experience | `total_experience` | `-1` | 422 |
| 7 | Passing year < 1900 | `passing_year` | `1800` | 422 |
| 8 | Passing year in future | `passing_year` | `2030` | 422 |
| 9 | Rating below 1 | `rating` | `0` | 422 |
| 10 | Rating above 5 | `rating` | `6` | 422 |
| 11 | Invalid scenario option | `selected_option` | `"E"` | 422 |
| 12 | Answer too short | `answer_text` | `"Too short"` (< 20 chars) | 422 |
| 13 | Answer too long | `answer_text` | 2001 characters | 422 |
| 14 | Invalid employment type | `employment_type` | `"INVALID_TYPE"` | 422 |
| 15 | End date before start | `end_date` < `start_date` | — | 422 |
| 16 | Percentage above 100 | `percentage` | `105.0` | 422 |

---

### 3. Negative / Edge Case Tests

| # | Test | Scenario | Expected |
|---|------|----------|----------|
| 1 | Empty request body | `POST /api/applicants` with `{}` | 422 |
| 2 | Missing required fields | Only `first_name` provided | 422 |
| 3 | Submit without declaration | All sections except declaration | 400 |
| 4 | Submit with `declaration_accepted=false` | — | 400 |
| 5 | Submit with `consent_accepted=false` | — | 400 |

---

### 4. Database Tests

| # | Test | Verification |
|---|------|-------------|
| 1 | All sections created | Full payload → all child tables populated |
| 2 | Application number format | `ATLAS-APP-YYYYMMDD-XXXX` |
| 3 | Status transitions | `DRAFT` → `SUBMITTED` |
| 4 | Timestamps populated | `created_at` and `updated_at` not null |

---

### 5. File Upload Tests

| # | Test | Input | Expected |
|---|------|-------|----------|
| 1 | Valid PDF upload | PDF file, `application/pdf` | 200 — file saved to disk |
| 2 | Non-PDF rejected | TXT file, `text/plain` | 400 |
| 3 | Oversized file | 6 MB PDF | 413 |
| 4 | Non-existent applicant | Valid PDF, fake UUID | 404 |
| 5 | File stored on disk | — | File exists at returned `file_path` |
| 6 | Document metadata saved | — | `documents` array in GET response |
| 7 | Multiple uploads | 3 PDFs | All 3 recorded |

---

## Postman Testing

### Setup

1. Import `postman/Applicant_Form_API_Collection.json` into Postman
2. Import `postman/Applicant_Form_API_Environment.json` as environment
3. Select "ATLAS Applicant Form - Local" environment
4. Ensure server is running at `http://localhost:8000`

### Execution Order

Run requests in this order:

1. **Create Draft Application (Full)** — Creates a complete draft, auto-saves `applicant_id`
2. **Create Minimal Draft** — Tests minimal creation
3. **List All Applicants** — Verifies listing works
4. **List by Status (DRAFT)** — Tests status filter
5. **Get Applicant by ID** — Uses saved `applicant_id`
6. **Update Draft** — Updates professional details
7. **Upload Signature PDF** — Requires selecting a PDF file manually
8. **Submit Application** — Changes status to SUBMITTED
9. **[NEG] Get Non-existent** — Expects 404
10. **[NEG] Invalid Email** — Expects 422
11. **[NEG] Invalid Rating** — Expects 422
12. **[NEG] Submit Again** — Expects 400

### Collection Tests

Each request includes Postman test scripts that automatically:
- Verify status codes
- Validate response structure
- Save `applicant_id` for subsequent requests
- Check business rules

---

## Expected Test Results Summary

| Category | Total Tests | Expected Pass |
|----------|-------------|---------------|
| API Tests | 16 | 16 |
| Validation Tests | 16 | 16 |
| Negative Tests | 5 | 5 |
| Database Tests | 4 | 4 |
| File Upload Tests | 7 | 7 |
| **Total** | **48** | **48** |
