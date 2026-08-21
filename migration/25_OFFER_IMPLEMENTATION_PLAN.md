# Phase 7: Offer Management — Implementation Plan

**Date:** 2026-07-13  
**Status:** IN PROGRESS

---

## 1. Overview

Frontend-only Offer Management module using existing API data (applicants + FinalDecision) + client-side state.

---

## 2. Routes & Files

| Route | File | Description |
|---|---|---|
| `/offer/dashboard` | `_authenticated.offer.dashboard.tsx` | Offer dashboard with KPIs |
| `/offer/queue` | `_authenticated.offer.queue.tsx` | Offer queue with search/filter |
| `/offer/builder/$id` | `_authenticated.offer.builder.$id.tsx` | Offer builder form |
| `/offer/preview/$id` | `_authenticated.offer.preview.$id.tsx` | Offer letter preview (printable) |
| `/offer/status/$id` | `_authenticated.offer.status.$id.tsx` | Offer status tracking |
| `/offer/$id` | `_authenticated.offer.$id.tsx` | Offer detail view (tabs) |
| `/candidate-portal/$id` | `_authenticated.candidate-portal.$id.tsx` | Public candidate portal |

---

## 3. Data Flow

```
GET /api/applicants?limit=500
  → Filter by status === "SELECTED"
  → Show in Offer Queue

GET /api/workflow/final-discussion/{candidate_id}
  → Returns: { candidate, technical_scores, ceo_scores, previous_evaluations }
  → Use candidate.offered_ctc, candidate.joining_date

POST /api/workflow/final-decision/{candidate_id}
  → Body: { final_status, offered_ctc, joining_date, approved_by, hr_discussion, ceo_discussion, save_draft }
  → Updates FinalDecision table

GET /api/candidate/{id}
  → Full candidate detail for offer letter

GET /api/candidate/{id}/documents
  → Resume and other documents
```

---

## 4. Components

### 4.1 Offer Dashboard (`/offer/dashboard`)
- 4 KPI cards: Total Selected, Offer Pending, Offer Sent, Offer Accepted
- Quick actions: Go to Queue, View Candidates
- Queue widget: Selected candidates pending offer

### 4.2 Offer Queue (`/offer/queue`)
- Server-side search/pagination (reuse pattern from HR/Technical queues)
- Status filter: All, Offer Pending, Offer Sent, Offer Accepted, Offer Declined
- Candidate cards with: name, position, offered CTC, joining date, status badge
- Action: Build Offer / View Offer

### 4.3 Offer Builder (`/offer/builder/$id`)
- Candidate summary card (name, position, email, phone)
- Form fields: Offered CTC (LPA), Joining Date, Approved By, HR Discussion Notes, CEO Discussion Notes
- Pre-fill from existing FinalDecision data
- Save Draft / Submit buttons
- Uses `POST /api/workflow/final-decision/{candidate_id}`

### 4.4 Offer Preview (`/offer/preview/$id`)
- Professional HTML offer letter (company header, candidate details, terms)
- Print button (window.print())
- Uses candidate + FinalDecision data
- Client-side generated (no backend PDF)

### 4.5 Offer Status (`/offer/status/$id`)
- Status timeline: Draft → Sent → Accepted/Declined
- Status update buttons (localStorage)
- Offer details summary
- Notes/history

### 4.6 Offer Detail (`/offer/$id`)
- Tabbed view: Overview, Offer Letter, Status, Documents, Timeline
- Overview: candidate info + offer terms
- Offer Letter: preview tab
- Status: status tracking
- Documents: resume viewer
- Timeline: interview progression

### 4.7 Candidate Portal (`/candidate-portal/$id`)
- Public route (no auth required for viewing)
- Offer letter display
- Status check
- Limited functionality

---

## 5. Sidebar Integration

Add "Offer Management" nav item to sidebar:
- Label: "Offer Management"
- Icon: `FileCheck` from lucide-react
- Permissions: `decision.final` (HR_ADMIN, CEO, SYSTEM_ADMIN)
- Route: `/offer/dashboard`

---

## 6. Implementation Order

1. **Task-031**: Add types (`OfferRecord`, `OfferStatus`) to `types.ts`
2. **Task-032**: Add sidebar nav item for Offer Management
3. **Task-033**: Create Offer Dashboard
4. **Task-034**: Create Offer Queue
5. **Task-035**: Create Offer Builder
6. **Task-036**: Create Offer Preview
7. **Task-037**: Create Offer Status
8. **Task-038**: Create Offer Detail (tabs)
9. **Task-039**: Create Candidate Portal
10. **Task-040**: Update dashboard with offer KPIs
11. **Task-041**: Run build + lint + documentation

---

## 7. Offer Letter Template

The offer letter will be a client-side HTML/CSS template with:
- Company header (Atlas HR branding)
- Candidate details (name, position, domain)
- Offer terms (CTC, joining date, approved by)
- Terms and conditions
- Signature line
- Print-friendly styling

---

## 8. localStorage Schema

```typescript
interface OfferRecord {
  candidate_id: string;
  status: "draft" | "sent" | "accepted" | "declined";
  offered_ctc?: number;
  joining_date?: string;
  approved_by?: string;
  sent_at?: string;
  responded_at?: string;
  notes?: string;
  history: Array<{
    action: string;
    timestamp: string;
    by: string;
    details?: string;
  }>;
}
```

Storage key: `atlas.offers` (JSON object keyed by candidate_id)
