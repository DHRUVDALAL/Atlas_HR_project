# ATLAS HR Project — Applicant Form Flow Documentation

## Overview

This document describes the complete application lifecycle, API call sequences, and status transition rules for the Applicant Form Intake Module.

---

## Application Lifecycle

```mermaid
flowchart TD
    A["Applicant visits form"] --> B["POST /api/applicants<br/>Create Draft"]
    B --> C{"Draft Created<br/>Status: DRAFT"}
    C --> D["PUT /api/applicants/{id}<br/>Update sections"]
    D --> C
    C --> E["POST /api/applicants/{id}/signature<br/>Upload PDF"]
    E --> C
    C --> F["POST /api/applicants/{id}/submit<br/>Submit Application"]
    F --> G{"Validation Check"}
    G -->|Pass| H["Status: SUBMITTED"]
    G -->|Fail| I["400 Error<br/>Missing sections or declaration"]
    I --> C
    H --> J["HR/Admin Review<br/>(Future Phase)"]
    J --> K["UNDER_REVIEW"]
    K --> L{"Decision"}
    L -->|Accept| M["SHORTLISTED"]
    L -->|Reject| N["REJECTED"]
    M --> O["HIRED"]

    style C fill:#ffd700,stroke:#333
    style H fill:#4caf50,stroke:#333,color:#fff
    style N fill:#f44336,stroke:#333,color:#fff
    style O fill:#2196f3,stroke:#333,color:#fff
```

---

## Status Transition Rules

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Application
    DRAFT --> DRAFT : Update / Upload Signature
    DRAFT --> SUBMITTED : Submit (with validation)
    SUBMITTED --> UNDER_REVIEW : HR begins review
    UNDER_REVIEW --> SHORTLISTED : Pass screening
    UNDER_REVIEW --> REJECTED : Fail screening
    SHORTLISTED --> HIRED : Final offer accepted
    SHORTLISTED --> REJECTED : Offer declined/withdrawn
```

| From | To | Trigger | Conditions |
|------|----|---------|------------|
| — | `DRAFT` | `POST /api/applicants` | Valid Section 1 data |
| `DRAFT` | `DRAFT` | `PUT /api/applicants/{id}` | Application exists, status is DRAFT |
| `DRAFT` | `SUBMITTED` | `POST /api/applicants/{id}/submit` | Professional details present, declaration accepted |
| `SUBMITTED` | `UNDER_REVIEW` | (future) Admin API | Admin/HR action |
| `UNDER_REVIEW` | `SHORTLISTED` | (future) Admin API | HR decision |
| `UNDER_REVIEW` | `REJECTED` | (future) Admin API | HR decision |
| `SHORTLISTED` | `HIRED` | (future) Admin API | Final hire decision |

> **Note:** Only `DRAFT → DRAFT` and `DRAFT → SUBMITTED` transitions are implemented in Phase 1. All other transitions will be added when the HR/Admin review module is built.

---

## API Call Sequence — Happy Path

```mermaid
sequenceDiagram
    participant A as Applicant
    participant API as ATLAS API
    participant DB as PostgreSQL
    participant FS as File System

    Note over A,FS: Phase 1 — Create Application
    A->>API: POST /api/applicants<br/>{personal_details, ...}
    API->>DB: Generate app number<br/>Insert applicant + sections
    DB-->>API: Applicant record
    API-->>A: 201 {applicant_id, status: DRAFT}

    Note over A,FS: Phase 2 — Update (optional, repeatable)
    A->>API: PUT /api/applicants/{id}<br/>{updated sections}
    API->>DB: Validate DRAFT status<br/>Replace child records
    DB-->>API: Updated record
    API-->>A: 200 {updated data}

    Note over A,FS: Phase 3 — Upload Signature
    A->>API: POST /api/applicants/{id}/signature<br/>file: signature.pdf
    API->>API: Validate PDF, check size
    API->>FS: Save to uploads/signatures/
    API->>DB: Insert document metadata
    DB-->>API: Document record
    API-->>A: 200 {document_id, file_path}

    Note over A,FS: Phase 4 — Submit
    A->>API: POST /api/applicants/{id}/submit
    API->>DB: Validate completeness
    API->>DB: Update status → SUBMITTED
    DB-->>API: Submitted record
    API-->>A: 200 {status: SUBMITTED}
```

---

## API Call Sequence — Error Scenarios

```mermaid
sequenceDiagram
    participant A as Applicant
    participant API as ATLAS API

    Note over A,API: Duplicate Email
    A->>API: POST /api/applicants<br/>{email: existing@email.com}
    API-->>A: 400 "Email already exists"

    Note over A,API: Invalid Data
    A->>API: POST /api/applicants<br/>{phone: "123"}
    API-->>A: 422 Validation Error

    Note over A,API: Update Submitted App
    A->>API: PUT /api/applicants/{id}<br/>(status: SUBMITTED)
    API-->>A: 400 "Only DRAFT can be updated"

    Note over A,API: Submit Incomplete
    A->>API: POST /api/applicants/{id}/submit<br/>(missing declaration)
    API-->>A: 400 "Missing required sections"

    Note over A,API: Upload Non-PDF
    A->>API: POST /api/applicants/{id}/signature<br/>file: image.png
    API-->>A: 400 "Only PDF files accepted"

    Note over A,API: Upload Oversized
    A->>API: POST /api/applicants/{id}/signature<br/>file: large.pdf (6MB)
    API-->>A: 413 "File exceeds 5MB limit"
```

---

## Submission Validation Checklist

When `POST /api/applicants/{id}/submit` is called, the system validates:

```mermaid
flowchart TD
    A["Submit Request"] --> B{"Status == DRAFT?"}
    B -->|No| X1["❌ 400: Already submitted"]
    B -->|Yes| C{"Professional Details<br/>present?"}
    C -->|No| X2["❌ 400: Section 2 required"]
    C -->|Yes| D{"Declaration<br/>present?"}
    D -->|No| X3["❌ 400: Section 8 required"]
    D -->|Yes| E{"declaration_accepted<br/>== true?"}
    E -->|No| X4["❌ 400: Declaration must be accepted"]
    E -->|Yes| F{"consent_accepted<br/>== true?"}
    F -->|No| X5["❌ 400: Consent must be accepted"]
    F -->|Yes| G["✅ Status → SUBMITTED"]

    style G fill:#4caf50,stroke:#333,color:#fff
    style X1 fill:#f44336,stroke:#333,color:#fff
    style X2 fill:#f44336,stroke:#333,color:#fff
    style X3 fill:#f44336,stroke:#333,color:#fff
    style X4 fill:#f44336,stroke:#333,color:#fff
    style X5 fill:#f44336,stroke:#333,color:#fff
```

---

## File Upload Flow

```mermaid
flowchart LR
    A["Upload Request"] --> B{"File is PDF?"}
    B -->|No| X1["❌ 400"]
    B -->|Yes| C{"Size ≤ 5MB?"}
    C -->|No| X2["❌ 413"]
    C -->|Yes| D["Save to<br/>uploads/signatures/<br/>{uuid}_{timestamp}.pdf"]
    D --> E["Insert metadata<br/>in applicant_documents"]
    E --> F["✅ 200"]
```

---

## Data Flow Summary

| Section | Table | Relationship | API Input Key |
|---------|-------|-------------|---------------|
| 1. Personal Details | `applicants` | — | `personal_details` |
| 2. Professional Details | `applicant_professional_details` | One-to-one | `professional_details` |
| 3. Employment History | `applicant_employment_history` | One-to-many | `employment_history` |
| 4. Education | `applicant_education` | One-to-many | `education` |
| 5. Your Perspective | `applicant_personality_assessment` | One-to-many | `personality_assessment` |
| 6. Workplace Scenarios | `applicant_situational_responses` | One-to-many | `situational_responses` |
| 7. Descriptive Questions | `applicant_written_responses` | One-to-many | `written_responses` |
| 8. Declaration | `applicant_declaration` | One-to-one | `declaration` |
| Signature | `applicant_documents` | One-to-many | File upload |
| 9. Interview Panel | `interview_panel_assessment` | One-to-many | NOT EXPOSED |
