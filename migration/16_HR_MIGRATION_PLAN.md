# Migration Document 16: HR Admin Module Migration Plan

## Date: 2026-07-13

---

## 1. Executive Summary

The HR Administration Module is the second major workflow module in the ATLAS ATS pipeline. After a candidate is forwarded from Reception (RECEPTION_FORWARDED status), HR Admin reviews the candidate, fills out a behavioral evaluation scorecard, assigns a domain, sets the number of technical rounds, assigns the first technical interviewer, and routes the candidate forward (SELECT), holds (HOLD), or rejects (REJECT).

---

## 2. Page Inventory

| # | Page | Route | Old Frontend File | New Frontend File | Status |
|---|------|-------|-------------------|-------------------|--------|
| 1 | HR Dashboard | `/dashboard` | `Dashboard.jsx` (HrReviewQueueWidget) | `_authenticated.dashboard.tsx` | ✅ Exists — enhance with HR-specific KPIs |
| 2 | HR Review Queue | `/candidates?status=RECEPTION_FORWARDED` | `HrReviewQueueWidget.jsx` (832 lines) | NEW: `_authenticated.hr.queue.tsx` | 🔨 Build |
| 3 | HR Review Form | `/hr/review/$id` | N/A (inline in old widget via drawer + navigate) | `_authenticated.hr.review.$id.tsx` (153 lines) | ✅ Exists — enhance |
| 4 | Candidate Detail | `/candidates/$id` | `AdminCandidateReview.jsx` | `_authenticated.candidates.$id.tsx` (431 lines) | ✅ Exists — enhance with HR context |

---

## 3. Component Inventory

### Old Frontend Components (to migrate)

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `HrReviewQueueWidget` | `components/dashboard/HrReviewQueueWidget.jsx` | 832 | Full HR queue dashboard with KPIs, tabs, filters, table, drawer |
| `AdminCandidateReview` | `pages/AdminCandidateReview.jsx` | 1451 | Complete candidate review with all 8 sections, timeline, actions |

### New Frontend Components (already exist)

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `HrReview` | `_authenticated.hr.review.$id.tsx` | 153 | HR review form with scorecard, domain, rounds, interviewer |
| `ScorecardEditor` | `components/scorecard.tsx` | ~70 | Shared evaluation widget (5-button rating + remarks) |
| `CandidateDetailPage` | `_authenticated.candidates.$id.tsx` | 431 | Candidate detail with timeline, tabs, workflow actions |
| `Dashboard` | `_authenticated.dashboard.tsx` | 383 | Dashboard with KPIs and role-gated queue widgets |

---

## 4. API Inventory

### HR-Specific Endpoints

| Method | Endpoint | Permission | Request Body | Response |
|--------|----------|------------|--------------|----------|
| GET | `/api/applicants?status=RECEPTION_FORWARDED` | `candidate.list` | — | `{ total, applicants[] }` |
| GET | `/api/applicants/{id}` | `candidate.read` | — | `{ data: CandidateDetail }` |
| POST | `/api/workflow/hr/review/{id}` | `workflow.hr_review` | `{ domain, number_of_tech_rounds, hr_status, first_interviewer_email, evaluation_data }` | `{ success, message, data }` |

### Supporting Endpoints

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| GET | `/api/applicants` | `candidate.list` | List all candidates (for dashboard KPIs) |
| GET | `/api/applicants/{id}` | `candidate.read` | Candidate detail (profile, documents, rounds) |
| GET | `/api/workflow/my-assignments` | `workflow.technical_evaluate` | Interviewer's assigned rounds |
| GET | `/api/scorecard/domains` | PUBLIC | SAP domain list |
| GET | `/api/scorecard/{domain}` | PUBLIC | SAP topics for domain |

---

## 5. Route Inventory

### New Routes to Create

| Route | File | Purpose |
|-------|------|---------|
| `/hr/queue` | `_authenticated.hr.queue.tsx` | Dedicated HR review queue (replaces HrReviewQueueWidget) |

### Existing Routes to Enhance

| Route | File | Enhancement |
|-------|------|-------------|
| `/hr/review/$id` | `_authenticated.hr.review.$id.tsx` | Better candidate context, read-only mode, validation |
| `/candidates/$id` | `_authenticated.candidates.$id.tsx` | HR-specific action buttons, enhanced timeline |
| `/dashboard` | `_authenticated.dashboard.tsx` | HR-specific KPIs, HR queue widget |

---

## 6. Permission Inventory

### HR_ADMIN Permissions
- `candidate.list` — Browse/search candidate list
- `candidate.read` — Read candidate record
- `candidate.delete` — Delete candidate record
- `workflow.hr_review` — Submit HR review
- `decision.final` — Record final hiring decision
- `role.read` — List roles
- `evaluation.view_hr` — See HR rounds, logs, and (if selected) decision

### HR_PANEL Permissions
- `candidate.list` — Browse/search candidate list
- `candidate.read` — Read candidate record
- `workflow.hr_review` — Submit HR review
- `evaluation.view_hr` — See HR rounds, logs

---

## 7. Workflow Transitions

### HR Review Flow
```
RECEPTION_FORWARDED
       |
       v
  HR Review Form
       |
       +----> SELECT + first_interviewer_email
       |        |
       |        v
       |    TECH_ROUND_1 (Round 1 created)
       |
       +----> HOLD
       |        |
       |        v
       |    HOLD (terminal)
       |
       +----> REJECT
                |
                v
            REJECTED (terminal)
```

### HR Review Payload
```json
{
  "domain": "SD",
  "number_of_tech_rounds": 2,
  "hr_status": "SELECT",
  "first_interviewer_email": "tech1@atlas.com",
  "evaluation_data": {
    "Communication & Articulation": { "rating": 4, "remarks": "Good" },
    "Confidence & Poise": { "rating": 3, "remarks": "" },
    ...
  }
}
```

### Validation Rules (Backend)
- `domain`: required, 1-100 chars
- `number_of_tech_rounds`: required, 1-10
- `hr_status`: required, one of SELECT/REJECT/HOLD
- `first_interviewer_email`: required (EmailStr), required when hr_status=SELECT
- `evaluation_data`: Dict, default {}
- All 7 HR_DIMENSIONS must have rating > 0 (frontend validation)

---

## 8. Database Mappings

### Tables Written by HR Review
- `interview_rounds` — Round 0 (HR_REVIEW) created on submit
- `candidates` — Status updated, domain set, total_rounds set
- `candidate_activity_logs` — Audit trail entry

### Tables Read by HR Review
- `candidates` — Full candidate record
- `applicant_professional_details` — Experience, CTC, notice period
- `applicant_employment_history` — Work history
- `applicant_education` — Education
- `applicant_personality_assessment` — 18 personality ratings
- `applicant_situational_responses` — 5 situational responses
- `applicant_written_responses` — 5 written responses
- `applicant_declaration` — Declaration + consent
- `candidate_documents` — Resume, signature
- `interview_rounds` — Previous rounds (if any)
- `candidate_activity_logs` — Activity history

---

## 9. Execution Order

1. **Module 1: HR Auth Verification** — Verify login, JWT, permissions for HR_ADMIN
2. **Module 2: HR Dashboard Enhancement** — Add HR-specific KPIs to dashboard
3. **Module 3: HR Review Queue** — Build dedicated `/hr/queue` page
4. **Module 4: Candidate Review Screen** — Enhance candidate detail for HR context
5. **Module 5: HR Evaluation Form** — Enhance HR review form
6. **Module 6: HR Decision Workflow** — Verify SELECT/HOLD/REJECT flow
7. **Module 7: Candidate Timeline** — Verify timeline in candidate detail
8. **Module 8: Resume & Documents** — Verify document viewer
9. **Module 9-12: Search, Filters, Sorting, Pagination** — Server-side features
10. **Module 13-14: Loading States, Responsive** — Skeletons, responsive layout
11. **Module 15-16: API Verification + Regression** — Full regression test
12. **Module 17: Documentation** — Update migration docs

---

## 10. Testing Checklist

### HR Login
- [ ] HR_ADMIN can login
- [ ] JWT token obtained
- [ ] Session restores on reload
- [ ] Permissions loaded correctly
- [ ] Route guards work
- [ ] Logout works

### HR Dashboard
- [ ] KPIs display correct counts
- [ ] HR queue widget shows RECEPTION_FORWARDED candidates
- [ ] Quick actions work (navigate to queue, candidate list)
- [ ] Loading skeletons display

### HR Review Queue
- [ ] Queue loads from backend
- [ ] Search works
- [ ] Filters work (status, position, experience, date)
- [ ] Sorting works
- [ ] Pagination works
- [ ] Review button navigates to HR review form

### HR Review Form
- [ ] Candidate data loads
- [ ] Domain selector works
- [ ] Technical rounds input works
- [ ] HR decision selector works
- [ ] First interviewer email works
- [ ] Scorecard editor works
- [ ] Submit validation works
- [ ] Submit success works
- [ ] Cancel navigates back

### Candidate Review
- [ ] All 8 sections display
- [ ] Professional details display
- [ ] Documents display
- [ ] Timeline displays
- [ ] HR action buttons display correctly

### Regression
- [ ] Registration still works
- [ ] Reception still works
- [ ] Authentication works
- [ ] No runtime errors
- [ ] Build passes
- [ ] Lint passes

---

## 11. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend `GET /api/applicants` doesn't return `position_applied_for` in list | Low | Handle as optional in UI |
| Backend `GET /api/applicants` doesn't return `phone` in list | Low | Only needed in detail view |
| Backend `GET /api/applicants` doesn't return `professional_details` in list | Medium | Client-side filtering for experience won't work; use server-side search instead |
| Old frontend uses mock "priority" (based on name length) | Low | Skip priority column in new frontend |

---

## 12. Rollback Strategy

- All changes are in `frontend-new/src/routes/` only
- No backend or database changes
- Rollback = revert route files to Phase 3 state
- Git branch: all changes on current branch, easily revertible

---

## 13. Decision: What NOT to Build

The old frontend's `HrReviewQueueWidget` (832 lines) includes:
- **Charts** (Recharts AreaChart, BarChart) — decorative, not functional. Skip.
- **Mock priority** (based on name length) — fake data. Skip.
- **Mock "Match Rating"** (Rating component based on name length) — fake data. Skip.
- **Drawer with candidate details** — already have full candidate detail page. Skip.
- **"Assigned Recruiter" counter** (mock: `candidates.length - 2`) — fake data. Skip.
- **"Average Screening Velocity"** (hardcoded "4.2h") — fake data. Skip.
- **"Review Trends" chart** (hardcoded mock data) — fake data. Skip.

**What to build:**
- Real KPIs from backend data
- Real queue table with server-side pagination
- Real search and filters
- Real workflow actions
- Real candidate review screen
