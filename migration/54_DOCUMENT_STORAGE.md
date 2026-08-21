# Phase 11.3 — Document Storage

## Overview
Production document storage with versioning, metadata, validation, and audit trail.

## Components

### Document Storage Model (`models/communications.py`)
- Version-controlled documents
- MIME type validation
- File size tracking
- SHA-256 checksums
- Candidate-based organization

### Document Storage Service (`services/document_storage_service.py`)
- Upload with validation
- Version management
- Download with FileResponse
- Storage statistics

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/documents/upload/{candidate_id}` | `document.upload` |
| GET | `/api/documents/candidate/{candidate_id}` | `document.view` |
| GET | `/api/documents/candidate/{candidate_id}/summary` | `document.view` |
| GET | `/api/documents/{id}` | `document.view` |
| GET | `/api/documents/{id}/download` | `document.download` |
| GET | `/api/documents/candidate/{id}/versions/{type}` | `document.view` |
| DELETE | `/api/documents/{id}` | `document.delete` |
| GET | `/api/documents/stats/storage` | `document.view` |

## Document Types

| Type | Allowed MIME Types |
|------|-------------------|
| resume | application/pdf, application/msword |
| photograph | image/jpeg, image/png |
| signature | application/pdf, image/jpeg, image/png |
| pan | application/pdf, image/jpeg, image/png |
| aadhar | application/pdf, image/jpeg, image/png |
| passport | application/pdf, image/jpeg, image/png |
| education | application/pdf, image/jpeg, image/png |
| experience | application/pdf, image/jpeg, image/png |
| offer | application/pdf |
| joining | application/pdf |
| verification | application/pdf, image/jpeg, image/png |
| medical | application/pdf, image/jpeg, image/png |
| other | all supported types |

## Storage Structure
```
uploads/
├── {document_type}/
│   ├── {YYYY}/
│   │   ├── {MM}/
│   │   │   ├── {candidate_id}/
│   │   │   │   ├── {uuid}.pdf
│   │   │   │   ├── {uuid}.jpg
```

## Versioning
- Each upload creates a new version
- Previous versions marked as `is_latest=false`
- Version number incremented automatically
- Full version history available per document type

## Validation
- File size limit (configurable, default 10MB)
- MIME type validation per document type
- SHA-256 checksum for integrity
