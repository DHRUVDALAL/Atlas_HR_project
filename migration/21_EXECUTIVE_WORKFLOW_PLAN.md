# Executive Workflow Migration Plan

## Phase 6 — CEO Evaluation, Final Discussion & Final Decision

**Date:** 2026-07-13  
**Status:** IN PROGRESS  
**Backend:** Production-ready — DO NOT modify

---

## 1. GAP Analysis Summary

### Critical API Mismatches (Must Fix)

| File | Current Payload | Backend Expects | Fix Required |
|------|----------------|-----------------|--------------|
| `ceo.evaluate.$id.tsx` | `{ status_selection, remarks, evaluation_data }` | `{ remarks (required, 5-2000 chars), evaluation_data, save_draft }` | **Rewrite** |
| `final-decision.$id.tsx` | `{ decision, reason }` | `{ final_status, offered_ctc, joining_date, approved_by, final_remarks, hr_discussion_notes, hr_discussion, ceo_discussion, save_draft }` | **Rewrite** |

### Missing Routes

| Route | Purpose | Priority |
|-------|---------|----------|
| `/ceo/queue` | CEO evaluation queue with KPIs | HIGH |
| `/admin/review/$id` | Combined admin review (CEO eval + HR discussion + final decision) | HIGH |

### Missing Dashboard Features

| Feature | Description | Priority |
|---------|-------------|----------|
| CEO-specific KPIs | Pending CEO reviews, completed today, avg rating | HIGH |
| CEO queue widget | Candidates in CEO_ROUND status | HIGH |
| Final decision widget | Candidates in FINAL_DISCUSSION_PENDING | HIGH |
| Quick actions | CEO evaluate, final decision links | HIGH |

### Missing Sidebar Nav Items

| Item | Permission | Route |
|------|-----------|-------|
| CEO Review Queue | `workflow.ceo_evaluate` | `/ceo/queue` |

---

## 2. Backend API Reference

### CEO Evaluation
```
POST /api/workflow/ceo/evaluate/{candidate_id}
Permission: workflow.ceo_evaluate
Body: { remarks: str (5-2000, required), evaluation_data: dict, save_draft: bool }
Response: { success, message, data: InterviewRoundResponse }
Status: CEO_ROUND -> FINAL_DISCUSSION_PENDING (on submit)
```

### Final Discussion Details
```
GET /api/workflow/final-discussion/{candidate_id}
Permission: decision.final
Response: { success, candidate, technical_scores[], ceo_scores[], previous_evaluations[] }
```

### Final Decision
```
POST /api/workflow/final-decision/{candidate_id}
Permission: decision.final
Body: { final_status, offered_ctc, joining_date, approved_by, final_remarks,
        hr_discussion_notes, hr_discussion, ceo_discussion, save_draft }
Validation: If SELECTED -> offered_ctc > 0 + joining_date required
Status: FINAL_DISCUSSION_PENDING -> final_status
```

---

## 3. Role & Permission Matrix

| Role | CEO Evaluate | Final Decision | View All | View HR | View Assigned |
|------|-------------|---------------|----------|---------|---------------|
| SYSTEM_ADMIN | Yes | Yes | Yes | Yes | Yes |
| L2_PANEL | Yes | No | Yes | No | Yes |
| TECH_HEAD | No | Yes | Yes | No | Yes |
| HR_ADMIN | No | Yes | No | Yes | No |

---

## 4. Implementation Order

1. **Types** — Add `FinalDecisionDetail`, `FinalDiscussionResponse` types
2. **Sidebar** — Add CEO Review Queue nav item
3. **CEO Queue** — `/ceo/queue` route
4. **CEO Eval Form** — Fix API payload to match backend
5. **Final Discussion** — New combined page with eval summaries + discussion notes
6. **Final Decision** — Fix API payload, add full form fields
7. **Dashboard** — CEO KPIs, queue widgets, quick actions
8. **Build/Lint** — Verify everything compiles

---

## 5. Files to Create/Modify

| File | Action | Lines (est) |
|------|--------|-------------|
| `src/lib/types.ts` | Add types | +30 |
| `src/routes/_authenticated.tsx` | Add nav item | +5 |
| `src/routes/_authenticated.ceo.queue.tsx` | **NEW** | ~250 |
| `src/routes/_authenticated.ceo.evaluate.$id.tsx` | Rewrite | ~200 |
| `src/routes/_authenticated.final-discussion.$id.tsx` | **NEW** | ~350 |
| `src/routes/_authenticated.final-decision.$id.tsx` | Rewrite | ~300 |
| `src/routes/_authenticated.dashboard.tsx` | Enhance | +80 |
