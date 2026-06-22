# ATLAS HR Project — Applicant Form API Documentation

## Overview

The Applicant Form Intake Module provides REST APIs for managing employment applications. Applicants can create, update, and submit applications through 8 form sections. Section 9 (Interview Panel Assessment) is internal-only and not exposed via these APIs.

**Base URL:** `http://localhost:8000`

**Authentication:** These endpoints are currently public. Authentication will be integrated in a future phase.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/applicants` | Create a new draft application |
| `GET` | `/api/applicants` | List applicants (paginated) |
| `GET` | `/api/applicants/{id}` | Get applicant by ID |
| `PUT` | `/api/applicants/{id}` | Update a draft application |
| `POST` | `/api/applicants/{id}/submit` | Submit an application |
| `POST` | `/api/applicants/{id}/signature` | Upload signature PDF |

---

## 1. Create Draft Application

**`POST /api/applicants`**

Creates a new application with status `DRAFT`. Section 1 (Personal Details) is required. All other sections are optional and can be added later via the update endpoint.

### Request Body

```json
{
  "personal_details": {
    "first_name": "Rahul",
    "middle_name": "Kumar",
    "last_name": "Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "9876543210",
    "alternate_phone": "9123456780",
    "gender": "MALE",
    "date_of_birth": "1995-06-15",
    "current_address": "123 MG Road, Andheri West",
    "permanent_address": "456 Station Road, Pune",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400058"
  },
  "professional_details": {
    "current_company": "Infosys Ltd",
    "current_designation": "Senior Software Engineer",
    "total_experience": 5.5,
    "relevant_experience": 4.0,
    "current_ctc": 1200000,
    "expected_ctc": 1800000,
    "notice_period": "30 days",
    "joining_availability": "Immediate after notice",
    "preferred_location": "Mumbai",
    "employment_type": "FULL_TIME"
  },
  "employment_history": [
    {
      "company_name": "Wipro Technologies",
      "designation": "Software Developer",
      "start_date": "2019-07-01",
      "end_date": "2022-06-30",
      "responsibilities": "Full stack development",
      "reason_for_leaving": "Career advancement"
    }
  ],
  "education": [
    {
      "qualification": "B.Tech",
      "institution_name": "VJTI Mumbai",
      "university": "Mumbai University",
      "passing_year": 2017,
      "percentage": 85.5,
      "grade": "A",
      "specialization": "Computer Science"
    }
  ],
  "personality_assessment": [
    {"question_number": 1, "rating": 4},
    {"question_number": 2, "rating": 5}
  ],
  "situational_responses": [
    {"question_number": 1, "selected_option": "A"},
    {"question_number": 2, "selected_option": "C"}
  ],
  "written_responses": [
    {
      "question_number": 1,
      "answer_text": "I believe in continuous learning and adapting to new technologies..."
    }
  ],
  "declaration": {
    "declaration_accepted": true,
    "consent_accepted": true,
    "signed_date": "2026-06-22"
  }
}
```

### Response (201 Created)

```json
{
  "success": true,
  "message": "Application created successfully",
  "data": {
    "applicant_id": "uuid-string",
    "application_number": "ATLAS-APP-20260622-0001",
    "first_name": "Rahul",
    "status": "DRAFT",
    "created_at": "2026-06-22T10:00:00+05:30",
    "professional_details": { ... },
    "employment_history": [ ... ],
    "education": [ ... ],
    "personality_assessment": [ ... ],
    "situational_responses": [ ... ],
    "written_responses": [ ... ],
    "declaration": { ... },
    "documents": []
  }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| `400` | Duplicate email |
| `422` | Validation error (see Validation Rules section) |

---

## 2. List Applicants

**`GET /api/applicants`**

Returns a paginated list of applicants with optional status filter.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Number of records to skip |
| `limit` | int | 20 | Number of records to return (max 100) |
| `status` | string | null | Filter by status: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, `REJECTED`, `HIRED` |

### Response (200 OK)

```json
{
  "success": true,
  "total": 42,
  "skip": 0,
  "limit": 20,
  "applicants": [
    {
      "applicant_id": "uuid",
      "application_number": "ATLAS-APP-20260622-0001",
      "first_name": "Rahul",
      "last_name": "Sharma",
      "email": "rahul.sharma@example.com",
      "phone": "9876543210",
      "status": "DRAFT",
      "created_at": "2026-06-22T10:00:00+05:30",
      "updated_at": "2026-06-22T10:00:00+05:30"
    }
  ]
}
```

---

## 3. Get Applicant by ID

**`GET /api/applicants/{applicant_id}`**

Returns the full applicant record with all sections.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `applicant_id` | UUID string | The applicant's unique ID |

### Response (200 OK)

Returns the same structure as the create response `data` field.

### Error Responses

| Code | Condition |
|------|-----------|
| `400` | Invalid UUID format |
| `404` | Applicant not found |

---

## 4. Update Draft Application

**`PUT /api/applicants/{applicant_id}`**

Updates an existing DRAFT application. Only provided sections are updated — omitted sections remain unchanged.

**Restriction:** Only applications with status `DRAFT` can be updated.

### Request Body

Same structure as create, but all sections are optional:

```json
{
  "professional_details": {
    "current_company": "Updated Company",
    "current_designation": "Lead Engineer",
    "total_experience": 6.0,
    "relevant_experience": 5.0,
    "employment_type": "FULL_TIME"
  }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| `400` | Application is not in DRAFT status |
| `400` | Duplicate email |
| `404` | Applicant not found |
| `422` | Validation error |

---

## 5. Submit Application

**`POST /api/applicants/{applicant_id}/submit`**

Submits a DRAFT application for review. Changes status from `DRAFT` to `SUBMITTED`.

### Submission Requirements

The following must be satisfied:
- Application must be in `DRAFT` status
- **Section 2** (Professional Details) must be present
- **Section 8** (Declaration) must be present
- `declaration_accepted` must be `true`
- `consent_accepted` must be `true`

### Response (200 OK)

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicant_id": "uuid",
    "status": "SUBMITTED",
    ...
  }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| `400` | Application is not DRAFT / missing required sections / declaration not accepted |
| `404` | Applicant not found |

---

## 6. Upload Signature PDF

**`POST /api/applicants/{applicant_id}/signature`**

Uploads a digital signature as a PDF file.

### Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Accepted format:** PDF only (`application/pdf`)
- **Max file size:** 5 MB

### Response (200 OK)

```json
{
  "success": true,
  "message": "Signature uploaded successfully",
  "data": {
    "document_id": "uuid",
    "document_type": "SIGNATURE_PDF",
    "file_name": "signature.pdf",
    "file_path": "/path/to/uploads/signatures/uuid_timestamp.pdf",
    "uploaded_at": "2026-06-22T10:00:00+05:30"
  }
}
```

### Error Responses

| Code | Condition |
|------|-----------|
| `400` | File is not PDF |
| `404` | Applicant not found |
| `413` | File exceeds 5 MB |

---

## Validation Rules

| Field | Rule |
|-------|------|
| `email` | Must be valid email format |
| `phone` / `alternate_phone` | Must be exactly 10 digits |
| `date_of_birth` | Must not be a future date |
| `gender` | Must be `MALE`, `FEMALE`, or `OTHER` |
| `current_ctc` / `expected_ctc` | Must be ≥ 0 |
| `total_experience` / `relevant_experience` | Must be ≥ 0 |
| `employment_type` | Must be `FULL_TIME`, `PART_TIME`, `CONTRACT`, or `INTERN` |
| `start_date` / `end_date` | `end_date` must not be before `start_date` |
| `passing_year` | Must be between 1900 and current year |
| `percentage` | Must be between 0 and 100 |
| `rating` (Section 5) | Must be integer 1–5 |
| `selected_option` (Section 6) | Must be `A`, `B`, `C`, or `D` |
| `answer_text` (Section 7) | Minimum 20 characters, maximum 2000 characters |
| `declaration_accepted` / `consent_accepted` | Must both be `true` for submission |
| Signature file | Must be PDF, max 5 MB |

---

## Status Lifecycle

```
DRAFT → SUBMITTED → UNDER_REVIEW → SHORTLISTED → HIRED
                                   → REJECTED
```

- **DRAFT:** Initial state. Application can be updated.
- **SUBMITTED:** Application is locked for editing. Awaiting review.
- **UNDER_REVIEW:** (future) HR is reviewing the application.
- **SHORTLISTED:** (future) Application has passed initial screening.
- **REJECTED:** (future) Application was rejected.
- **HIRED:** (future) Applicant has been hired.

> **Note:** Only `DRAFT → SUBMITTED` transition is currently implemented via API. Other transitions will be added when the HR/Admin review module is built.
