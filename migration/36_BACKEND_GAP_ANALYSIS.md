# ATLAS Backend Gap Analysis — Phase 9

**Date:** July 13, 2026  
**Scope:** Backend API completeness analysis vs frontend requirements

---

## 1. Executive Summary

The backend provides **41 endpoints** across 5 routers covering authentication, applicant management, workflow operations, user management, and scorecard management. However, **2 major modules** (Offer Management, Employee Onboarding) have **zero backend support** and rely entirely on localStorage.

### Gap Summary
| Module | Backend Endpoints | Frontend Routes | Gap |
|--------|------------------|-----------------|-----|
| Authentication | 4 | 3 | ✅ Complete |
| Applicant Management | 16 | 4 | ✅ Complete |
| Workflow | 8 | 8 | ✅ Complete |
| User Management | 3 | 0 | ✅ Complete |
| Scorecard | 3 | 0 | ✅ Complete |
| **Offer Management** | **0** | **7** | ❌ **Critical Gap** |
| **Employee Onboarding** | **0** | **3** | ❌ **Critical Gap** |

---

## 2. Critical Gaps

### Gap 1: Offer Management (Frontend-Only)

**Frontend Routes:**
- `/offer/dashboard` — 6 KPI cards (total offers, pending, accepted, rejected, avg processing, this month)
- `/offer/queue` — Searchable/filterable offer list
- `/offer/builder/$candidateId` — Offer creation form
- `/offer/preview/$candidateId` — HTML offer letter preview (print-to-PDF)
- `/offer/status/$candidateId` — Offer timeline/history
- `/offer/$candidateId` — 5-tab offer detail view
- `/candidate-portal/$candidateId` — Public candidate portal

**Backend Support:** NONE

**Impact:**
- All offer data stored in `localStorage` under `atlas.offers`
- Data lost on browser clear
- No multi-device sync
- No audit trail
- No email notifications
- No PDF generation
- No approval workflows

**Recommended Backend Endpoints:**
```
POST   /api/offers                      — Create offer
GET    /api/offers                      — List offers (search/filter/paginate)
GET    /api/offers/:id                  — Get offer details
PUT    /api/offers/:id                  — Update offer
DELETE /api/offers/:id                  — Delete offer
POST   /api/offers/:id/send             — Send offer letter
POST   /api/offers/:id/accept           — Accept offer
POST   /api/offers/:id/reject           — Reject offer
GET    /api/offers/:id/history          — Get offer history
GET    /api/candidate/:id/offer         — Get candidate's offer
GET    /api/offers/stats                — Dashboard statistics
```

### Gap 2: Employee Onboarding (Frontend-Only)

**Frontend Routes:**
- `/onboarding/dashboard` — 8 KPI cards (total, in-progress, documents pending, etc.)
- `/onboarding/queue` — Searchable/filterable employee list
- `/onboarding/$candidateId` — 6-tab employee profile (Overview, Documents, BGV, Assets, Checklist, Timeline)

**Backend Support:** NONE

**Impact:**
- All onboarding data stored in `localStorage` under `atlas.onboarding`
- Data lost on browser clear
- No multi-device sync
- No audit trail
- No email notifications
- No document verification workflow
- No IT asset allocation
- No background verification integration

**Recommended Backend Endpoints:**
```
POST   /api/onboarding                      — Start onboarding
GET    /api/onboarding                      — List onboarding records (search/filter/paginate)
GET    /api/onboarding/:id                  — Get onboarding details
PUT    /api/onboarding/:id                  — Update onboarding
GET    /api/onboarding/:id/checklist        — Get checklist status
PUT    /api/onboarding/:id/checklist/:item  — Update checklist item
POST   /api/onboarding/:id/documents/:type/verify — Verify document
POST   /api/onboarding/:id/documents/:type/reject — Reject document
POST   /api/onboarding/:id/bgv/:category/clear    — Clear background check
POST   /api/onboarding/:id/bgv/:category/fail     — Fail background check
POST   /api/onboarding/:id/assets/:type/allocate  — Allocate IT asset
GET    /api/onboarding/:id/assets           — Get allocated assets
GET    /api/onboarding/stats                — Dashboard statistics
```

---

## 3. Minor Gaps

### Gap 3: No Email/Notification Service
- **Backend:** No email sending capability
- **Frontend:** Toast notifications only
- **Impact:** No email notifications for status changes, offers, onboarding tasks

### Gap 4: No PDF Generation
- **Backend:** No PDF generation service
- **Frontend:** HTML offer letters (print-to-PDF via browser)
- **Impact:** No branded PDF offer letters, no digital signatures

### Gap 5: No Document Storage
- **Backend:** Basic file upload for candidate documents
- **Frontend:** Document verification UI exists
- **Impact:** No secure document storage, no document versioning

### Gap 6: No Audit Trail
- **Backend:** `CandidateActivityLog` table exists but limited usage
- **Frontend:** Timeline component shows activity
- **Impact:** Incomplete audit trail for compliance

### Gap 7: No Assignment System
- **Backend:** `InterviewAssignment` model exists but limited API
- **Frontend:** Queue-based assignment (status only)
- **Impact:** No accountability tracking, no assignment history

---

## 4. Database Schema Gaps

### Missing Tables
| Table | Purpose | Priority |
|-------|---------|----------|
| `offers` | Offer management records | HIGH |
| `offer_history` | Offer status changes | HIGH |
| `onboarding` | Onboarding records | HIGH |
| `onboarding_checklist` | Checklist items | HIGH |
| `onboarding_documents` | Document verification | HIGH |
| `onboarding_bgv` | Background verification | MEDIUM |
| `onboarding_assets` | IT asset allocation | MEDIUM |
| `notifications` | Email/notification queue | LOW |

### Existing but Underused Tables
| Table | Current Usage | Potential |
|-------|--------------|-----------|
| `candidate_activity_logs` | Basic logging | Full audit trail |
| `interview_assignments` | Limited API | Full assignment system |

---

## 5. Recommendations

### Immediate (Phase 9 Completion)
1. Document localStorage-only limitations clearly
2. Add warning messages in Offer/Onboarding modules
3. Ensure data persistence across browser sessions

### Short-Term (Post-Phase 9)
4. Add Offer Management backend endpoints
5. Add Employee Onboarding backend endpoints
6. Add database tables for offers and onboarding
7. Migrate localStorage data to backend

### Medium-Term (Future Sprints)
8. Add email notification service
9. Add PDF generation service
10. Add document storage service
11. Add audit trail service
12. Add assignment system

### Long-Term (Production)
13. Add background verification integration
14. Add IT asset management integration
15. Add payroll integration
16. Add HRIS integration

---

## 6. Conclusion

**Backend Coverage: 73%** (30/41 frontend routes have backend support)

**Critical Gaps: 2** (Offer Management, Employee Onboarding)

**Recommended Action:** Prioritize adding backend endpoints for Offer Management and Employee Onboarding before production deployment. Current localStorage-only approach is acceptable for demo/development but NOT for production use.
