# Phase 8: Employee Onboarding — Implementation Plan

**Date:** 2026-07-13  
**Status:** IN PROGRESS

---

## 1. Overview

Frontend-only Employee Onboarding module using existing API data (applicants + FinalDecision) + localStorage for onboarding state. Backend has NO onboarding capabilities.

---

## 2. Routes & Files

| Route | File | Description |
|---|---|---|
| `/onboarding/dashboard` | `_authenticated.onboarding.dashboard.tsx` | Onboarding dashboard with KPIs |
| `/onboarding/queue` | `_authenticated.onboarding.queue.tsx` | Employee queue with search/filter |
| `/onboarding/$id` | `_authenticated.onboarding.$id.tsx` | Employee profile (tabs) |
| `/onboarding/checklist/$id` | `_authenticated.onboarding.checklist.$id.tsx` | HR checklist |
| `/onboarding/timeline/$id` | `_authenticated.onboarding.timeline.$id.tsx` | Onboarding timeline |

---

## 3. Data Flow

```
GET /api/applicants?limit=500
  → Filter by status === "SELECTED"
  → Show in Onboarding Queue

GET /api/candidate/{id}
  → Full candidate detail for employee profile

GET /api/workflow/final-discussion/{candidate_id}
  → Returns: { candidate, technical_scores, ceo_scores }
  → Use candidate.offered_ctc, candidate.joining_date

localStorage ("atlas.onboarding")
  → OnboardingRecord per candidate
  → Tracks: documents, background verification, assets, checklist, timeline
```

---

## 4. localStorage Schema

```typescript
interface OnboardingRecord {
  candidate_id: string;
  status: "pending" | "in_progress" | "completed";
  
  // Document Verification
  documents: {
    aadhaar: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    pan: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    passport: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    driving_license: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    education: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    experience: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    resume: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
    offer_letter: { status: "pending" | "verified" | "rejected"; verified_at?: string; notes?: string };
  };
  
  // Background Verification
  background_verification: {
    reference_check: { status: "pending" | "cleared" | "failed"; completed_at?: string; notes?: string };
    employment_verification: { status: "pending" | "cleared" | "failed"; completed_at?: string; notes?: string };
    education_verification: { status: "pending" | "cleared" | "failed"; completed_at?: string; notes?: string };
    criminal_verification: { status: "pending" | "cleared" | "failed"; completed_at?: string; notes?: string };
  };
  
  // IT Assets
  assets: {
    laptop: { status: "pending" | "allocated" | "returned"; allocated_at?: string; asset_id?: string; notes?: string };
    monitor: { status: "pending" | "allocated" | "returned"; allocated_at?: string; asset_id?: string; notes?: string };
    phone: { status: "pending" | "allocated" | "returned"; allocated_at?: string; asset_id?: string; notes?: string };
    email: { status: "pending" | "configured"; configured_at?: string; email_address?: string };
    access_card: { status: "pending" | "allocated" | "returned"; allocated_at?: string; notes?: string };
    vpn: { status: "pending" | "configured"; configured_at?: string; notes?: string };
    software_licenses: { status: "pending" | "allocated"; allocated_at?: string; notes?: string };
  };
  
  // HR Checklist
  checklist: {
    offer_accepted: boolean;
    documents_received: boolean;
    background_complete: boolean;
    it_ready: boolean;
    payroll_ready: boolean;
    manager_assigned: boolean;
    joining_kit: boolean;
    orientation_scheduled: boolean;
  };
  
  // Timeline
  history: Array<{
    action: string;
    timestamp: string;
    by: string;
    details?: string;
  }>;
  
  created_at: string;
  updated_at: string;
}
```

---

## 5. Components

### 5.1 Onboarding Dashboard (`/onboarding/dashboard`)
- 8 KPI cards: Joining Today, Pending Documents, Pending Verification, Background Checks, IT Assets Pending, Induction Pending, Completed Onboarding, Total In Progress
- Quick actions: Go to Queue, View Candidates
- Recent activity feed
- Joining date calendar widget

### 5.2 Employee Queue (`/onboarding/queue`)
- Server-side search/pagination
- Status filter: All, Pending, In Progress, Completed
- Joining date range filter
- Candidate cards with onboarding progress indicators
- Action: View Profile, Start Onboarding

### 5.3 Employee Profile (`/onboarding/$id`)
- 6-tab layout: Overview, Documents, Background Check, IT Assets, Checklist, Timeline
- Overview: Personal info, professional details, offer summary, onboarding status
- Documents: Verification status for each document type
- Background Check: BGV status for each category
- IT Assets: Asset allocation status
- Checklist: Visual checklist with checkboxes
- Timeline: Onboarding activity timeline

### 5.4 Document Verification (`/onboarding/checklist/$id`)
- Document type cards with status indicators
- Verify/Reject/Request Resubmission buttons
- Notes field for each document
- Overall document completion percentage

### 5.5 Background Verification (`/onboarding/checklist/$id`)
- BGV category cards with status indicators
- Clear/Fail buttons
- Notes field for each category
- Overall BGV completion percentage

### 5.6 IT Asset Allocation (`/onboarding/checklist/$id`)
- Asset type cards with allocation status
- Allocate/Return buttons
- Asset ID and notes fields
- Overall IT readiness percentage

### 5.7 HR Checklist (`/onboarding/checklist/$id`)
- 8-item visual checklist with checkboxes
- Status indicators (pending/in-progress/completed)
- Overall completion percentage
- Quick actions for each item

### 5.8 Employee Timeline (`/onboarding/timeline/$id`)
- Visual timeline: Offer → Accepted → Documents → Verification → Assets → Orientation → Joined → Completed
- Status indicators for each step
- Activity history with timestamps

---

## 6. Sidebar Integration

Add "Onboarding" nav item to sidebar:
- Label: "Onboarding"
- Icon: `UserPlus` from lucide-react
- Permissions: `decision.final` (HR_ADMIN, CEO, SYSTEM_ADMIN)
- Route: `/onboarding/dashboard`

---

## 7. Implementation Order

1. **Task-042**: Add types (`OnboardingRecord`, `DocumentStatus`, etc.) to `types.ts`
2. **Task-043**: Add sidebar nav item for Onboarding
3. **Task-044**: Create Onboarding Dashboard
4. **Task-045**: Create Employee Queue
5. **Task-046**: Create Employee Profile (tabs)
6. **Task-047**: Create Document Verification
7. **Task-048**: Create Background Verification
8. **Task-049**: Create IT Asset Allocation
9. **Task-050**: Create HR Checklist
10. **Task-051**: Create Employee Timeline
11. **Task-052**: Update dashboard with onboarding KPIs
12. **Task-053**: Build + Lint + Documentation

---

## 8. API Mapping

| Onboarding Feature | API Used | Notes |
|---|---|---|
| List selected candidates | `GET /api/applicants?limit=500` | Filter by `SELECTED` status |
| Candidate detail | `GET /api/candidate/{id}` | Full profile data |
| Final decision data | `GET /api/workflow/final-discussion/{id}` | CTC, joining date, scores |
| Document upload | `POST /api/candidate/{id}/documents` | Existing endpoint |
| Document download | `GET /api/candidate/{id}/documents/{doc_id}/download` | Existing endpoint |
| Onboarding state | localStorage | Client-side only |
| Notifications | Toast | Client-side only |
