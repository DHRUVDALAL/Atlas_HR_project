# ATLAS Workflow Validation Report — Phase 9

**Date:** July 13, 2026  
**Scope:** Complete hiring pipeline validation — Registration → Onboarding

---

## 1. Workflow Status Map

### Backend Statuses (from models/applicant.py)
```
DRAFT → SUBMITTED → RECEPTION_FORWARDED → HR_REVIEW_COMPLETED → TECHNICAL_ROUND → CEO_ROUND → FINAL_DISCUSSION_PENDING → SELECTED/REJECTED/HOLD
```

### Frontend Status Mapping
| Backend Status | Frontend Display | Module |
|---------------|-----------------|--------|
| DRAFT | Draft | Registration |
| SUBMITTED | Submitted | Reception |
| RECEPTION_FORWARDED | Forwarded | Reception |
| HR_REVIEW_COMPLETED | HR Review Complete | HR |
| TECHNICAL_ROUND | Technical Round | Technical |
| CEO_ROUND | CEO Round | CEO |
| FINAL_DISCUSSION_PENDING | Final Discussion Pending | Final Discussion |
| SELECTED | Selected | Final Decision |
| REJECTED | Rejected | Final Decision |
| HOLD | Hold | Final Decision |

---

## 2. Pipeline Walkthrough

### Stage 1: Registration (POST /api/applicant)
- **Input:** Multipart: JSON payload + PDF signature
- **Output:** Candidate ID, auto-set status=DRAFT
- **Frontend:** `/register-candidate` (public route)
- **Validation:** ✅ Working

### Stage 2: Reception Forward (POST /api/workflow/reception-forward/{id})
- **Permission:** `workflow.reception_forward`
- **Input:** `{ remarks }`
- **Status Change:** DRAFT → SUBMITTED
- **Frontend:** Candidate detail page, forward button
- **Validation:** ✅ Working

### Stage 3: HR Review (POST /api/workflow/hr/review/{id})
- **Permission:** `workflow.hr_review`
- **Input:** `{ ratings, strengths, weaknesses, remarks, recommendation }`
- **Status Change:** SUBMITTED → HR_REVIEW_COMPLETED
- **Frontend:** `/hr/review/$id` form
- **Validation:** ✅ Working

### Stage 4: Technical Evaluation (POST /api/workflow/technical/evaluate/{id})
- **Permission:** `workflow.technical_evaluate`
- **Input:** `{ round_number, ratings, strengths, weaknesses, remarks, recommendation }`
- **Status Change:** HR_REVIEW_COMPLETED → TECHNICAL_ROUND
- **Frontend:** `/interviewer/evaluate/$id` form
- **Validation:** ✅ Working

### Stage 5: CEO Evaluation (POST /api/workflow/ceo/evaluate/{id})
- **Permission:** `workflow.ceo_evaluate`
- **Input:** `{ remarks (5-2000 chars, required), evaluation_data, save_draft }`
- **Status Change:** TECHNICAL_ROUND → CEO_ROUND
- **Frontend:** `/ceo/evaluate/$id` form
- **Validation:** ✅ Working

### Stage 6: Final Discussion (POST /api/workflow/final-discussion/{id})
- **Permission:** `final.discuss`
- **Input:** `{ discussion_notes, recommendations }`
- **Status Change:** CEO_ROUND → FINAL_DISCUSSION_PENDING
- **Frontend:** `/final-discussion/$id` page
- **Validation:** ✅ Working

### Stage 7: Final Decision (POST /api/workflow/final-decision/{id})
- **Permission:** `decision.final`
- **Input:** `{ final_status, offered_ctc, joining_date, approved_by, final_remarks, hr_discussion_notes, hr_discussion, ceo_discussion, save_draft }`
- **Status Change:** FINAL_DISCUSSION_PENDING → SELECTED/REJECTED/HOLD
- **Frontend:** `/final-decision/$id` page
- **Validation:** ✅ Working

---

## 3. Missing Workflow Steps

### Reception → HR Assignment
- **No API endpoint** to assign candidate to HR reviewer
- **Current:** Candidates appear in HR queue based on status only
- **Impact:** No accountability tracking

### HR → Technical Assignment
- **No API endpoint** to assign candidate to technical interviewer
- **Current:** Candidates appear in interview queue based on status only
- **Impact:** No accountability tracking

### Technical → CEO Assignment
- **No API endpoint** to assign candidate to CEO
- **Current:** CEO can see all TECHNICAL_ROUND candidates
- **Impact:** No accountability tracking

### Offer Management (Frontend-Only)
- **No backend endpoints** for offer CRUD
- **All data in localStorage**
- **Risk:** Data lost on browser clear

### Onboarding (Frontend-Only)
- **No backend endpoints** for onboarding CRUD
- **All data in localStorage**
- **Risk:** Data lost on browser clear

---

## 4. Status Transition Issues

### Issue 1: Status Not Updating After HR Review
- **Scenario:** HR submits review, status should update to HR_REVIEW_COMPLETED
- **Check:** Verify API updates status correctly
- **Status:** ⚠️ Needs testing

### Issue 2: CEO Evaluation Payload Format
- **Scenario:** CEO submits evaluation with save_draft=true
- **Check:** Verify API accepts draft saves without status change
- **Status:** ⚠️ Needs testing

### Issue 3: Final Decision Validation
- **Scenario:** Final decision with invalid status (e.g., "PENDING")
- **Check:** Verify API validates final_status enum
- **Status:** ⚠️ Needs testing

---

## 5. Recommendations

### Immediate
1. Add assignment endpoints for HR/Technical/CEO
2. Add backend endpoints for offer management
3. Add backend endpoints for onboarding management

### Short-Term
4. Add status transition validation
5. Add audit trail for all status changes
6. Add email notifications for status changes

### Medium-Term
7. Add workflow automation (e.g., auto-assign to next available reviewer)
8. Add SLA tracking for each stage
9. Add workflow analytics dashboard
