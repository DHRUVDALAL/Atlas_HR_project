# ATLAS Backend Extension Plan — Phase 10.1

**Date:** July 13, 2026  
**Scope:** Complete backend extension for Offer Management & Employee Onboarding

---

## 1. Executive Summary

This document outlines the complete backend extension plan to add Offer Management and Employee Onboarding support to the ATLAS HR system. The extension follows existing backend patterns and conventions.

### Current State
- **Database:** PostgreSQL 16 with 15 tables (via Alembic)
- **Backend:** FastAPI with 41 endpoints across 5 routers
- **Permission System:** 13 permissions across 7 roles
- **Workflow:** Candidate lifecycle from DRAFT → SELECTED/REJECTED/HOLD

### Target State
- **Database:** 27 tables (15 existing + 12 new)
- **Backend:** 67 endpoints (41 existing + 26 new)
- **Permission System:** 19 permissions (13 existing + 6 new)
- **Workflow:** Extended to include Offer → Onboarding lifecycle

---

## 2. Existing Architecture Analysis

### Database Tables (Current)
| Table | Purpose |
|-------|---------|
| candidates | Candidate personal details + status |
| applicant_professional_details | Professional information |
| applicant_employment_history | Work experience |
| applicant_education | Educational qualifications |
| applicant_personality_assessment | Personality ratings |
| applicant_situational_responses | Situational answers |
| applicant_written_responses | Written responses |
| applicant_declaration | Declaration & consent |
| candidate_documents | Uploaded documents |
| interview_panel_assessment | Panel evaluations |
| interview_rounds | Multi-round interviews |
| final_decisions | Final hiring decision |
| candidate_assignments | Panel assignments |
| candidate_activity_logs | Audit trail |
| users | User accounts |
| roles | Role definitions |
| permissions | Permission codes |
| role_permissions | Role-permission mapping |
| refresh_tokens | JWT refresh tokens |

### Workflow Statuses (Current)
```
DRAFT → SUBMITTED → RECEPTION_FORWARDED → TECH_ROUND_1 → TECH_ROUND_N → CEO_ROUND → FINAL_DISCUSSION_PENDING → SELECTED/REJECTED/HOLD
```

### Permission System (Current)
- 13 permissions across 7 roles
- Permission codes (not role names) drive access
- `require_permission()` dependency for route protection

---

## 3. New Tables Design

### 3.1 Offer Management Tables

#### Table: `offers`
```sql
CREATE TABLE offers (
    offer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SENT, ACCEPTED, DECLINED
    offered_ctc NUMERIC(12,2),
    joining_date DATE,
    approved_by VARCHAR(100),
    sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_id)
);
```

#### Table: `offer_documents`
```sql
CREATE TABLE offer_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(offer_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,  -- OFFER_LETTER, SIGNED_OFFER, ADDENDUM
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table: `offer_history`
```sql
CREATE TABLE offer_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(offer_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Employee Onboarding Tables

#### Table: `onboarding`
```sql
CREATE TABLE onboarding (
    onboarding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_id)
);
```

#### Table: `document_verification`
```sql
CREATE TABLE document_verification (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_id UUID NOT NULL REFERENCES onboarding(onboarding_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,  -- AADHAAR, PAN, PASSPORT, DL, EDUCATION, EXPERIENCE, RESUME, OFFER_LETTER
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, VERIFIED, REJECTED
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(onboarding_id, document_type)
);
```

#### Table: `background_verification`
```sql
CREATE TABLE background_verification (
    bgv_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_id UUID NOT NULL REFERENCES onboarding(onboarding_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,  -- REFERENCE, EMPLOYMENT, EDUCATION, CRIMINAL
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, CLEARED, FAILED
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(onboarding_id, category)
);
```

#### Table: `asset_allocation`
```sql
CREATE TABLE asset_allocation (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_id UUID NOT NULL REFERENCES onboarding(onboarding_id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,  -- LAPTOP, MONITOR, PHONE, EMAIL, ACCESS_CARD, VPN, SOFTWARE_LICENSES
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, ALLOCATED, CONFIGURED, RETURNED
    asset_id VARCHAR(100),  -- Physical asset ID/serial number
    allocated_by VARCHAR(100),
    allocated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(onboarding_id, asset_type)
);
```

#### Table: `employee_checklist`
```sql
CREATE TABLE employee_checklist (
    checklist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_id UUID NOT NULL REFERENCES onboarding(onboarding_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,  -- offer_accepted, documents_received, etc.
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by VARCHAR(100),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(onboarding_id, item_name)
);
```

#### Table: `onboarding_activity`
```sql
CREATE TABLE onboarding_activity (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_id UUID NOT NULL REFERENCES onboarding(onboarding_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. New Permissions

### Permission Codes
```python
# Offer Management
"offer.create": "Create offer for candidate",
"offer.view": "View offer details",
"offer.update": "Update offer details",
"offer.send": "Send offer letter to candidate",
"offer.approve": "Approve/accept offer",
"offer.decline": "Decline offer",

# Onboarding
"onboarding.manage": "Manage onboarding process",
"onboarding.view": "View onboarding details",
"onboarding.verify": "Verify documents and background checks",
"onboarding.allocate": "Allocate IT assets",
```

### Role Mapping
```python
ROLE_PERMISSIONS = {
    "SYSTEM_ADMIN": set(PERMISSIONS.keys()),  # everything
    "HR_ADMIN": {
        # ... existing permissions ...
        "offer.create", "offer.view", "offer.update", "offer.send",
        "onboarding.manage", "onboarding.view", "onboarding.verify", "onboarding.allocate",
    },
    "HR_PANEL": {
        # ... existing permissions ...
        "offer.view", "onboarding.view",
    },
    "CEO": {
        # ... existing permissions ...
        "offer.view", "offer.approve", "onboarding.view",
    },
    "TECH_HEAD": {
        # ... existing permissions ...
        "offer.view", "onboarding.view",
    },
}
```

---

## 5. API Endpoints Design

### 5.1 Offer Management Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/offers` | `offer.create` | Create offer for candidate |
| GET | `/api/offers` | `offer.view` | List offers (search/filter/paginate) |
| GET | `/api/offers/{id}` | `offer.view` | Get offer details |
| PUT | `/api/offers/{id}` | `offer.update` | Update offer |
| DELETE | `/api/offers/{id}` | `offer.delete` | Delete offer |
| POST | `/api/offers/{id}/send` | `offer.send` | Send offer letter |
| POST | `/api/offers/{id}/accept` | `offer.approve` | Accept offer |
| POST | `/api/offers/{id}/decline` | `offer.decline` | Decline offer |
| GET | `/api/offers/{id}/history` | `offer.view` | Get offer history |
| GET | `/api/offers/{id}/documents` | `offer.view` | Get offer documents |
| POST | `/api/offers/{id}/documents` | `offer.create` | Upload offer document |
| GET | `/api/offers/stats` | `offer.view` | Dashboard statistics |

### 5.2 Onboarding Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/onboarding` | `onboarding.manage` | Start onboarding |
| GET | `/api/onboarding` | `onboarding.view` | List onboarding records |
| GET | `/api/onboarding/{id}` | `onboarding.view` | Get onboarding details |
| PUT | `/api/onboarding/{id}` | `onboarding.manage` | Update onboarding |
| GET | `/api/onboarding/{id}/checklist` | `onboarding.view` | Get checklist status |
| PUT | `/api/onboarding/{id}/checklist/{item}` | `onboarding.manage` | Update checklist item |
| POST | `/api/onboarding/{id}/documents/{type}/verify` | `onboarding.verify` | Verify document |
| POST | `/api/onboarding/{id}/documents/{type}/reject` | `onboarding.verify` | Reject document |
| POST | `/api/onboarding/{id}/bgv/{category}/clear` | `onboarding.verify` | Clear background check |
| POST | `/api/onboarding/{id}/bgv/{category}/fail` | `onboarding.verify` | Fail background check |
| POST | `/api/onboarding/{id}/assets/{type}/allocate` | `onboarding.allocate` | Allocate IT asset |
| GET | `/api/onboarding/{id}/assets` | `onboarding.view` | Get allocated assets |
| GET | `/api/onboarding/stats` | `onboarding.view` | Dashboard statistics |

---

## 6. Workflow Extension

### Extended Status Flow
```
SELECTED → OFFER_DRAFT → OFFER_SENT → OFFER_ACCEPTED → ONBOARDING_STARTED → DOCUMENTS_VERIFIED → ASSETS_ASSIGNED → BACKGROUND_CLEARED → CHECKLIST_COMPLETED → EMPLOYEE_ACTIVATED
```

### State Transitions
| From | To | Trigger | Permission |
|------|----|---------|------------|
| SELECTED | OFFER_DRAFT | Create offer | `offer.create` |
| OFFER_DRAFT | OFFER_SENT | Send offer | `offer.send` |
| OFFER_SENT | OFFER_ACCEPTED | Accept offer | `offer.approve` |
| OFFER_SENT | OFFER_DECLINED | Decline offer | `offer.decline` |
| OFFER_ACCEPTED | ONBOARDING_STARTED | Start onboarding | `onboarding.manage` |
| ONBOARDING_STARTED | DOCUMENTS_VERIFIED | All docs verified | `onboarding.verify` |
| DOCUMENTS_VERIFIED | ASSETS_ASSIGNED | All assets allocated | `onboarding.allocate` |
| ASSETS_ASSIGNED | BACKGROUND_CLEARED | BGV cleared | `onboarding.verify` |
| BACKGROUND_CLEARED | CHECKLIST_COMPLETED | All items done | `onboarding.manage` |
| CHECKLIST_COMPLETED | EMPLOYEE_ACTIVATED | Final activation | `onboarding.manage` |

---

## 7. Service Layer Design

### 7.1 OfferService
```python
class OfferService:
    def create_offer(candidate_id, offered_ctc, joining_date, notes, created_by) -> Offer
    def get_offer(offer_id) -> Offer
    def list_offers(skip, limit, status, search) -> (total, offers)
    def update_offer(offer_id, data) -> Offer
    def delete_offer(offer_id) -> bool
    def send_offer(offer_id, performed_by) -> Offer
    def accept_offer(offer_id, performed_by) -> Offer
    def decline_offer(offer_id, performed_by) -> Offer
    def get_offer_history(offer_id) -> List[OfferHistory]
    def get_offer_documents(offer_id) -> List[OfferDocument]
    def upload_offer_document(offer_id, file, doc_type, uploaded_by) -> OfferDocument
    def get_stats() -> dict
```

### 7.2 OnboardingService
```python
class OnboardingService:
    def start_onboarding(candidate_id, created_by) -> Onboarding
    def get_onboarding(onboarding_id) -> Onboarding
    def list_onboardings(skip, limit, status, search) -> (total, onboardings)
    def update_onboarding(onboarding_id, data) -> Onboarding
    def get_checklist(onboarding_id) -> List[EmployeeChecklist]
    def update_checklist_item(onboarding_id, item_name, is_completed, performed_by) -> EmployeeChecklist
    def verify_document(onboarding_id, doc_type, verified_by, notes) -> DocumentVerification
    def reject_document(onboarding_id, doc_type, verified_by, notes) -> DocumentVerification
    def clear_bgv(onboarding_id, category, verified_by, notes) -> BackgroundVerification
    def fail_bgv(onboarding_id, category, verified_by, notes) -> BackgroundVerification
    def allocate_asset(onboarding_id, asset_type, asset_id, allocated_by, notes) -> AssetAllocation
    def get_assets(onboarding_id) -> List[AssetAllocation]
    def get_stats() -> dict
```

---

## 8. File Structure

### New Files to Create
```
backend/
├── models/
│   └── offer_onboarding.py          # New SQLAlchemy models
├── schemas/
│   ├── offer.py                     # Offer Pydantic schemas
│   └── onboarding.py                # Onboarding Pydantic schemas
├── services/
│   ├── offer_service.py             # Offer business logic
│   └── onboarding_service.py        # Onboarding business logic
├── routes/
│   ├── offer.py                     # Offer API routes
│   └── onboarding.py                # Onboarding API routes
└── alembic/versions/
    └── XXXX_add_offer_onboarding_tables.py  # New migration
```

### Files to Modify
```
backend/
├── app.py                           # Register new routers
├── utils/
│   └── permissions.py               # Add new permissions
└── alembic/env.py                   # Import new models
```

---

## 9. Frontend Integration Points

### Current Frontend Routes (localStorage)
| Route | Current State | Target State |
|-------|--------------|--------------|
| `/offer/dashboard` | localStorage | Backend API |
| `/offer/queue` | localStorage | Backend API |
| `/offer/builder/$id` | localStorage | Backend API |
| `/offer/preview/$id` | localStorage | Backend API |
| `/offer/status/$id` | localStorage | Backend API |
| `/offer/$id` | localStorage | Backend API |
| `/onboarding/dashboard` | localStorage | Backend API |
| `/onboarding/queue` | localStorage | Backend API |
| `/onboarding/$id` | localStorage | Backend API |

### API Calls to Replace
```typescript
// Current (localStorage)
const offers = JSON.parse(localStorage.getItem('atlas.offers') || '{}');

// Target (Backend API)
const { data } = await api('/api/offers', { method: 'GET' });
```

---

## 10. Testing Strategy

### Unit Tests
- Service layer methods
- Schema validation
- Permission checks

### Integration Tests
- API endpoint responses
- Database operations
- Workflow transitions

### E2E Tests
- Complete offer lifecycle
- Complete onboarding lifecycle
- Role-based access control

---

## 11. Migration Strategy

### Alembic Migration
1. Create new migration file
2. Add all new tables
3. Add new permissions
4. Update role-permission mappings
5. Verify upgrade/downgrade

### Data Migration
1. Migrate existing localStorage data (if any)
2. Set default permissions for existing roles
3. Verify data integrity

---

## 12. Risk Assessment

### Low Risk
- Adding new tables (no impact on existing)
- Adding new permissions (additive only)
- Adding new endpoints (additive only)

### Medium Risk
- Workflow extension (careful state management needed)
- Permission mapping (must not break existing access)

### Mitigation
- Comprehensive testing before deployment
- Rollback plan for each migration
- Feature flags for gradual rollout

---

## 13. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 10.1 Architecture Analysis | Complete | None |
| 10.2 Database Design | 1 hour | 10.1 |
| 10.3 SQLAlchemy Models | 2 hours | 10.2 |
| 10.4 Pydantic Schemas | 1 hour | 10.3 |
| 10.5 Service Layer | 3 hours | 10.4 |
| 10.6 FastAPI Routes | 2 hours | 10.5 |
| 10.7 RBAC Integration | 1 hour | 10.6 |
| 10.8 Workflow State Machine | 2 hours | 10.7 |
| 10.9 Alembic Migrations | 1 hour | 10.8 |
| 10.10 Frontend Integration | 4 hours | 10.9 |
| 10.11 File Storage | 1 hour | 10.10 |
| 10.12 Testing | 3 hours | 10.11 |
| 10.13 Documentation | 1 hour | 10.12 |
| **Total** | **22 hours** | |

---

## 14. Conclusion

This extension plan provides a comprehensive approach to adding Offer Management and Employee Onboarding to the ATLAS HR system. The design follows existing patterns and conventions, ensuring consistency and maintainability.

**Next Step:** Proceed to Phase 10.2 — Database Design.
