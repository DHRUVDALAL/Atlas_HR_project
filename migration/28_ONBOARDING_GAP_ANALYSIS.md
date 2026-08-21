# Phase 8: Employee Onboarding — GAP Analysis

**Date:** 2026-07-13  
**Status:** COMPLETE

---

## 1. Executive Summary

The backend has **NO onboarding module whatsoever**. The system is purely an Interview Management System (ATS) that ends at the hiring decision (`SELECTED` status). There are no onboarding models, routes, schemas, services, permissions, or any post-hire functionality. The old frontend also has NO onboarding pages or components.

---

## 2. Backend Analysis

### 2.1 What EXISTS in the Backend

| Feature | Location | Onboarding Relevance |
|---|---|---|
| `FinalDecision` table | `models/applicant.py:548-566` | Contains `joining_date`, `offered_ctc`, `approved_by`, `final_status` — starting point for onboarding |
| `candidates` table | `models/applicant.py:37-159` | Full candidate data (personal, professional, education, employment) — source for employee profile |
| `candidate_documents` table | `models/applicant.py:429-457` | Document upload endpoint exists (`POST /api/candidate/{id}/documents`) |
| `users` table | `models/user.py:12-45` | Internal staff table with `employee_code` — could be target for employee creation |
| `candidate_activity_logs` | `models/applicant.py:517-527` | Audit trail pattern reusable for onboarding tracking |
| `POST /api/workflow/final-decision/{id}` | `routes/workflow.py` | Sets `joining_date`, `offered_ctc`, `approved_by` on FinalDecision |
| `GET /api/workflow/final-discussion/{id}` | `routes/workflow.py` | Returns candidate + technical/CEO scores |
| `GET /api/candidate/{id}` | `routes/applicant.py` | Full candidate detail |
| `GET /api/applicants?limit=500` | `routes/applicant.py` | All applicants with status |
| Document upload/download | `routes/applicant.py` | `POST /api/candidate/{id}/documents`, `GET /api/candidate/{id}/documents/{doc_id}/download` |

### 2.2 What DOES NOT EXIST in the Backend

| Category | Status | Details |
|---|---|---|
| Onboarding module | ❌ Does not exist | No `onboarding/` directory, no models/routes/services |
| Onboarding status | ❌ Does not exist | No statuses like `ONBOARDING`, `DOCUMENTS_PENDING`, `BG_VERIFICATION_PENDING` |
| Document verification | ❌ Does not exist | No `document_verification` table, no verification workflow |
| Background verification (BGV) | ❌ Does not exist | No `background_verification` table or service |
| Asset allocation | ❌ Does not exist | No `asset_allocation` or `employee_assets` table |
| Induction | ❌ Does not exist | Zero matches for "induction" in entire codebase |
| Onboarding checklist | ❌ Does not exist | Zero matches for "checklist" in backend |
| Employee master | ❌ Does not exist | No employee profile beyond basic User model |
| Offer letter / acceptance | ❌ Does not exist | No offer acceptance workflow or status tracking |
| Payroll integration | ❌ Does not exist | No payroll table or service |
| Post-hire pipeline | ❌ Does not exist | Pipeline ends at SELECTED — no transition to onboarding |
| Candidate-to-employee migration | ❌ Does not exist | No code to create User from selected Candidate |
| Onboarding permissions | ❌ Does not exist | Zero `onboarding.*`, `document_verification.*`, `asset.*` permissions |
| Onboarding roles | ❌ Does not exist | No ONBOARDING_ADMIN, FACILITIES_TEAM, IT_TEAM roles |

---

## 3. Old Frontend Analysis

The old frontend has **NO onboarding functionality**. All 25 "joining" references are in the offer/negotiation phase (pre-hire). The "checklist" is a form-validation progress indicator, not an onboarding checklist. Zero matches for: onboarding, verification, induction, payroll, asset allocation.

---

## 4. What We CAN Build (Frontend-Only)

Since the backend provides SELECTED candidates with `joining_date` and `offered_ctc`, we can build:

1. **Onboarding Dashboard** — filter SELECTED candidates, show KPIs, quick actions
2. **Employee Queue** — list selected candidates with joining dates, search/filter
3. **Employee Profile** — read-only view using `GET /api/candidate/{id}` data
4. **Document Verification** — client-side verification status tracking (localStorage)
5. **Background Verification** — client-side BGV status tracking (localStorage)
6. **IT Asset Allocation** — client-side asset assignment tracking (localStorage)
7. **HR Checklist** — visual checklist with status tracking (localStorage)
8. **Employee Timeline** — visual onboarding progression timeline
9. **Notifications** — toast-only (no backend notification system)

---

## 5. Data Sources

| Data | Source | Notes |
|---|---|---|
| Candidate personal info | `GET /api/candidate/{id}` | Full profile |
| Candidate professional info | `GET /api/candidate/{id}` | `professional_details` |
| Candidate education | `GET /api/candidate/{id}` | `education[]` |
| Candidate employment history | `GET /api/candidate/{id}` | `employment_history[]` |
| Candidate documents | `GET /api/candidate/{id}/documents` | Signature PDF only |
| Document download | `GET /api/candidate/{id}/documents/{doc_id}/download` | Actual file |
| Offer details | `GET /api/workflow/final-discussion/{id}` | `candidate` object |
| Joining date | `FinalDecision.joining_date` | From final-discussion endpoint |
| Offered CTC | `FinalDecision.offered_ctc` | From final-discussion endpoint |
| Interview scores | `GET /api/workflow/final-discussion/{id}` | `technical_scores`, `ceo_scores` |
| Onboarding state | localStorage (`atlas.onboarding`) | Client-side only |

---

## 6. Key Constraints

1. No backend onboarding endpoints — all onboarding state is client-side (localStorage)
2. No document verification backend — verification is visual/tracking only
3. No background verification backend — BGV is visual/tracking only
4. No IT asset backend — asset allocation is visual/tracking only
5. No employee creation backend — no candidate-to-employee conversion
6. No onboarding notifications — toast-only feedback
7. No onboarding permissions — reuse existing `decision.final` permission

---

## 7. Recommendation

Build a **frontend-only onboarding module** that:
- Uses existing API data (applicants + FinalDecision + candidate detail)
- Tracks onboarding state in localStorage
- Provides visual dashboards, checklists, and timelines
- Documents all missing backend capabilities for future development
- Reuses existing UI patterns (cards, badges, tabs, timelines, skeletons)
