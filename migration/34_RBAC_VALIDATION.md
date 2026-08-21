# ATLAS RBAC Validation Report — Phase 9

**Date:** July 13, 2026  
**Scope:** Role-Based Access Control validation — all 7 roles, 13 permissions

---

## 1. Permission System Architecture

### Backend Permissions (13 total)
```python
# Candidate records
candidate.list        # Browse/search the candidate list
candidate.read        # Read a candidate record
candidate.update      # Edit a candidate record (pre-arrival statuses)
candidate.update_any  # Edit a candidate record at any status
candidate.delete      # Delete a candidate record

# Workflow actions
workflow.reception_forward  # Forward a candidate from reception to HR
workflow.hr_review          # Submit the HR review
workflow.technical_evaluate # Evaluate an assigned technical round
workflow.ceo_evaluate       # Submit the CEO/final round
decision.final              # Record the final hiring decision

# Evaluation visibility scope
evaluation.view_all     # See every round, log and final decision
evaluation.view_hr      # See HR rounds, logs and (if selected) the decision
evaluation.view_assigned # See only rounds you are assigned to

# Administration
user.manage  # Create/update/delete users
role.read    # List roles
```

### Backend Role Matrix
| Role | Permissions |
|------|------------|
| SYSTEM_ADMIN | All 13 |
| HR_ADMIN | candidate.list, candidate.read, candidate.delete, workflow.hr_review, decision.final, role.read, evaluation.view_hr |
| HR_PANEL | candidate.list, candidate.read, workflow.hr_review, evaluation.view_hr |
| RECEPTIONIST | candidate.list, candidate.read, candidate.update, workflow.reception_forward |
| L1_PANEL | candidate.read, workflow.technical_evaluate, evaluation.view_assigned |
| L2_PANEL | candidate.read, workflow.technical_evaluate, evaluation.view_assigned, evaluation.view_all, workflow.ceo_evaluate |
| TECH_HEAD | candidate.read, workflow.technical_evaluate, evaluation.view_assigned, evaluation.view_all, decision.final |

---

## 2. Frontend Permission Usage

### Nav Items (Sidebar)
| Nav Item | Required Permissions | Status |
|----------|---------------------|--------|
| Dashboard | None (always shown) | ✅ |
| Candidates | `candidate.list` OR `workflow.reception_forward` | ✅ |
| HR Review Queue | `workflow.hr_review` | ✅ |
| Interview Queue | `evaluation.view_assigned` | ✅ |
| CEO Review Queue | `workflow.ceo_evaluate` OR `decision.final` | ✅ |
| Offer Management | `decision.final` | ✅ |
| Onboarding | `decision.final` | ✅ |

### Page-Level Permissions
| Page | Permission Check | Status |
|------|-----------------|--------|
| Candidate Detail | `workflow.reception_forward` for forward button | ✅ |
| HR Review Form | `workflow.hr_review` for submit | ✅ |
| Technical Evaluation | `workflow.technical_evaluate` for submit | ✅ |
| CEO Evaluation | `workflow.ceo_evaluate` for submit | ✅ |
| Final Discussion | `final.discuss` for submit | ✅ |
| Final Decision | `decision.final` for submit | ✅ |

---

## 3. Role-by-Role Validation

### SYSTEM_ADMIN
- **Access:** All pages, all actions
- **Dashboard:** All KPIs, all queue widgets
- **Sidebar:** All nav items visible
- **Status:** ✅ PASS

### HR_ADMIN
- **Access:** Candidates, HR Review, Offer Management, Onboarding
- **Dashboard:** HR KPIs, HR queue widget, offer queue widget, onboarding queue widget
- **Sidebar:** Candidates, HR Review Queue, Offer Management, Onboarding
- **Cannot See:** Interview Queue, CEO Review Queue
- **Status:** ✅ PASS

### HR_PANEL
- **Access:** Candidates, HR Review
- **Dashboard:** HR KPIs, HR queue widget
- **Sidebar:** Candidates, HR Review Queue
- **Cannot See:** Interview Queue, CEO Review Queue, Offer Management, Onboarding
- **Status:** ✅ PASS

### RECEPTIONIST
- **Access:** Candidates (forward only)
- **Dashboard:** Reception KPIs, reception queue widget
- **Sidebar:** Candidates only
- **Cannot See:** HR Review Queue, Interview Queue, CEO Review Queue, Offer Management, Onboarding
- **Status:** ✅ PASS

### L1_PANEL
- **Access:** Assigned interviews only
- **Dashboard:** Interview KPIs, interview queue widget
- **Sidebar:** Interview Queue only
- **Cannot See:** Candidates, HR Review Queue, CEO Review Queue, Offer Management, Onboarding
- **Status:** ✅ PASS

### L2_PANEL
- **Access:** Assigned interviews + CEO evaluate
- **Dashboard:** Interview KPIs, interview queue widget
- **Sidebar:** Interview Queue, CEO Review Queue
- **Cannot See:** Candidates, HR Review Queue, Offer Management, Onboarding
- **Status:** ✅ PASS

### TECH_HEAD
- **Access:** Assigned interviews + CEO evaluate + final decision
- **Dashboard:** Interview KPIs, interview queue widget, offer queue widget
- **Sidebar:** Interview Queue, CEO Review Queue, Offer Management, Onboarding
- **Cannot See:** Candidates, HR Review Queue
- **Status:** ✅ PASS

### CEO
- **Access:** CEO evaluate + final decision
- **Dashboard:** CEO KPIs, CEO queue widget, offer queue widget
- **Sidebar:** CEO Review Queue, Offer Management, Onboarding
- **Cannot See:** Candidates, HR Review Queue, Interview Queue
- **Status:** ✅ PASS

---

## 4. Permission Gaps

### Gap 1: No `final.discuss` in Backend
- **Frontend uses:** `final.discuss` for Final Discussion page
- **Backend has:** `decision.final` (covers final decision)
- **Impact:** Final Discussion page may not be accessible
- **Fix:** Add `final.discuss` permission to backend OR use `decision.final`

### Gap 2: No `candidate.view` in Backend
- **Frontend uses:** `candidate.view` in some places
- **Backend has:** `candidate.list` and `candidate.read`
- **Impact:** Permission check may fail
- **Fix:** Update frontend to use `candidate.list` or `candidate.read`

### Gap 3: No `hr.review` in Backend
- **Frontend uses:** `hr.review` in some places
- **Backend has:** `workflow.hr_review`
- **Impact:** Permission check may fail
- **Fix:** Update frontend to use `workflow.hr_review`

### Gap 4: No `technical.evaluate` in Backend
- **Frontend uses:** `technical.evaluate` in some places
- **Backend has:** `workflow.technical_evaluate`
- **Impact:** Permission check may fail
- **Fix:** Update frontend to use `workflow.technical_evaluate`

### Gap 5: No `ceo.evaluate` in Backend
- **Frontend uses:** `ceo.evaluate` in some places
- **Backend has:** `workflow.ceo_evaluate`
- **Impact:** Permission check may fail
- **Fix:** Update frontend to use `workflow.ceo_evaluate`

---

## 5. Recommendations

### Immediate
1. Align frontend permission codes with backend
2. Add `final.discuss` permission to backend
3. Update all `hasPermission()` calls to use correct codes

### Short-Term
4. Add permission-based route guards
5. Add permission-based button visibility
6. Add permission audit logging

### Medium-Term
7. Add dynamic permission management UI
8. Add role inheritance
9. Add permission templates
