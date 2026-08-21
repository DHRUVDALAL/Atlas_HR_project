# Technical Interview Module Migration Plan

## Phase 5 — Interviewer Dashboard, Queue, Evaluation, Candidate Review, Workflow, Timeline, Documents, Search & Responsive

**Date:** 2026-07-13  
**Status:** IN PROGRESS  
**Backend:** Production-ready — DO NOT modify

---

## 1. Module Inventory

| Module | Description | Routes / Files | Status |
|--------|-------------|---------------|--------|
| **Module 1** | Interviewer Dashboard KPIs & Quick Actions | `_authenticated.dashboard.tsx` | Pending |
| **Module 2** | Interview Queue Page | `_authenticated.interviewer.queue.tsx` | NEW |
| **Module 3** | Interview Detail / Candidate Review | `_authenticated.interviewer.review.$id.tsx` | NEW |
| **Module 4** | Technical Evaluation Form | `_authenticated.interviewer.evaluate.$id.tsx` | Enhance |
| **Module 5** | Workflow (Pass/Fail/Hold) | Backend API + Module 4 | Integrate |
| **Module 6** | Timeline | Reuse + enhance timeline component | Integrate |
| **Module 7** | Documents / Resume | Reuse + enhance documents viewer | Integrate |
| **Module 8** | Search, Pagination, Responsive | Across Modules 2-4 | Integrate |
| **Module 9** | Build, Lint, Documentation | All files | Final |

---

## 2. Role Inventory

| Role | Permissions | Access |
|------|-------------|--------|
| L1_PANEL | `candidate.read`, `workflow.technical_evaluate`, `evaluation.view_assigned` | Queue, Evaluate, Read-Only Profile |
| L2_PANEL | `candidate.read`, `workflow.technical_evaluate`, `evaluation.view_assigned`, `evaluation.view_all`, `workflow.ceo_evaluate` | Queue, Evaluate, Read-Only Profile, CEO Evaluate |
| TECH_HEAD | `candidate.read`, `workflow.technical_evaluate`, `evaluation.view_assigned`, `evaluation.view_all`, `decision.final` | Queue, Evaluate, Read-Only Profile, Final Decision |

---

## 3. API Inventory

| Endpoint | Method | Auth | Module |
|----------|--------|------|--------|
| `/api/workflow/my-assignments?only_pending={bool}` | GET | `evaluation.view_assigned` | Module 1, 2 |
| `/api/scorecard/{domain}` | GET | `candidate.read` | Module 4 |
| `/api/scorecard/domains` | GET | `candidate.read` | Module 4 |
| `/api/workflow/technical/evaluate/{candidate_id}/{round_number}` | POST | `workflow.technical_evaluate` | Module 4, 5 |
| `/api/workflow/final-decision/{candidate_id}` | POST | `decision.final` | Module 5 (TECH_HEAD) |
| `/api/workflow/candidate/{candidate_id}` | GET | `candidate.read` | Module 3 |
| `/api/workflow/candidate/{candidate_id}/timeline` | GET | `candidate.read` | Module 6 |
| `/api/candidate/{candidate_id}/documents` | GET | `candidate.read` | Module 7 |
| `/api/workflow/status` | GET | `candidate.read` | Module 1 (KPIs) |
| `/api/candidates` | GET | `candidate.list` | Module 2 (search) |

---

## 4. Backend Workflow Transitions

```
DRAFT → SUBMITTED
SUBMITTED → RECEPTION_FORWARDED
RECEPTION_FORWARDED → HR_REVIEW_COMPLETED
HR_REVIEW_COMPLETED → TECHNICAL_ROUND
TECHNICAL_ROUND → CEO_ROUND (L2/L3 panel)
TECHNICAL_ROUND → FINAL_DISCUSSION_PENDING (TECH_HEAD with CEO bypass)
TECHNICAL_ROUND → REJECTED (panel)
TECHNICAL_ROUND → HOLD (panel)
CEO_ROUND → FINAL_DISCUSSION_PENDING (CEO)
CEO_ROUND → REJECTED (CEO)
FINAL_DISCUSSION_PENDING → SELECTED (TECH_HEAD + CEO)
FINAL_DISCUSSION_PENDING → REJECTED (TECH_HEAD + CEO)
```

---

## 5. Backend Evaluation Schema

### TechnicalEvaluationRequest
```json
{
  "status_selection": "COMPLETED | REJECTED | HOLD",
  "remarks": "string (optional)",
  "evaluation_data": {
    "overall_assessment": {
      "communication_skills": 1-5,
      "cultural_fit": 1-5,
      "growth_potential": 1-5,
      "grooming_score": 1-5,
      "attitude_score": 1-5,
      "relocation_confirmed": 1-5,
      "overall_rating": 1-5
    },
    "topic_ratings": [
      { "topic_id": "string", "rating": 1-5, "comments": "string" }
    ]
  },
  "next_interviewer_email": "string (optional, for routing)"
}
```

### FinalDecisionRequest
```json
{
  "decision": "SELECTED | REJECTED | HOLD",
  "reason": "string (optional)"
}
```

---

## 6. Module 1 — Interviewer Dashboard Enhancement

### Requirements
- KPI cards: Total Assigned, Pending Today, Completed Today, In Progress
- Assignment list (pending interviews) with candidate name, role, domain, status
- Quick actions: Evaluate, View Profile
- Loading skeletons
- Role-gated: Only visible to L1/L2/TECH_HEAD

### Changes
- `_authenticated.dashboard.tsx`: Add `InterviewerDashboardSection` component
- API: `GET /api/workflow/my-assignments?only_pending=true`

---

## 7. Module 2 — Interview Queue Page

### Requirements
- Full-page queue of all assigned interviews
- Server-side search by candidate name
- Status filter (PENDING, IN_PROGRESS, COMPLETED, EVALUATED)
- Sort by urgency (oldest first)
- Pagination
- Candidate cards with name, role, domain, status badge
- Click → navigate to review page
- Loading skeletons

### Route
- `_authenticated.interviewer.queue.tsx`

---

## 8. Module 3 — Interview Detail / Candidate Review

### Requirements
- Read-only candidate profile for interviewers
- Tabs: Professional, Experience, Education, Skills, Documents, Timeline
- Resume PDF viewer (inline iframe)
- Activity timeline (backend data)
- Quick action: Start Evaluation

### Route
- `_authenticated.interviewer.review.$id.tsx`

---

## 9. Module 4 — Technical Evaluation Form Enhancement

### Requirements
- Dynamic topic-based scoring fetched from `/api/scorecard/{domain}`
- Topic-rating table with star rating + comments per topic
- 7 overall assessment fields (communication, cultural fit, growth, grooming, attitude, relocation, overall)
- Status selection (COMPLETED/REJECTED/HOLD)
- Next interviewer email (optional routing)
- Draft auto-save (localStorage)
- Loading skeleton
- Candidate summary card

### Route
- `_authenticated.interviewer.evaluate.$id.tsx`

---

## 10. Implementation Order

1. **Module 1**: Dashboard Enhancement — KPI cards, assignment list, quick actions
2. **Module 2**: Interview Queue Page — full page with search, filter, sort
3. **Module 3**: Interview Detail — read-only candidate review
4. **Module 4**: Evaluation Form — dynamic topics, overall assessment, status routing
5. **Module 5**: Workflow Actions — pass/fail/hold, final decision
6. **Module 6**: Timeline — activity timeline integration
7. **Module 7**: Documents — resume viewer, document list
8. **Module 8**: Search, Pagination, Responsive — across all modules
9. **Module 9**: Build, Lint, Documentation — final verification
