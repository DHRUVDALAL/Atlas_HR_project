# Phase 11.10 — Report Export

## Overview
CSV/Excel export for candidates, offers, onboarding, and dashboard summary.

## API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/reports/candidates/export` | `report.export` |
| GET | `/api/reports/offers/export` | `report.export` |
| GET | `/api/reports/onboarding/export` | `report.export` |
| GET | `/api/reports/dashboard/summary` | `dashboard.view` |

## Export Formats

### CSV Export
- Streaming response for large datasets
- UTF-8 encoding
- Automatic column headers
- Configurable filters

## Report Types

### Candidate Report
- Application Number
- First Name, Last Name
- Email, Phone
- Position, Status
- Experience
- Applied Date

### Offer Report
- Offer ID
- Candidate ID
- Position, CTC
- Status
- Offer Date
- Valid Until
- Joining Date

### Onboarding Report
- Onboarding ID
- Candidate ID
- Department, Designation
- Status
- Joining Date
- Created Date

### Dashboard Summary
- Total candidates
- Total offers
- Total onboarding
- Pending offers
- Active onboarding

## Query Parameters
- `format` - Export format (csv, excel)
- `status` - Filter by status
