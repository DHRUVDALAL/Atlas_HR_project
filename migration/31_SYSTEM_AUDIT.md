# ATLAS System Audit Report — Phase 9

**Date:** July 13, 2026  
**Auditor:** Phase 9 Step 1 — Full Project Audit  
**Scope:** Complete frontend-new/ codebase, backend/ API, database models, permissions, RBAC

---

## 1. Executive Summary

Three parallel audits were conducted: (1) Frontend Code Quality, (2) Backend API & Database Inventory, (3) State Management & Performance. **4 critical issues** and **6 high-priority issues** were identified.

### Critical Issues (Must Fix)
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Hardcoded password exposed in UI** | `login.tsx` MOCK_ACCOUNTS | Security — password visible in source |
| 2 | **navigate() during render** | `login.tsx` line 122 | Bug — potential React error |
| 3 | **No Error Boundaries** | Entire app | Crash propagation — any error kills page |
| 4 | **No global TanStack Query config** | `__root.tsx` | Performance — staleTime=0, gcTime=5min defaults |

### High-Priority Issues
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Unused localStorage key** | `atlas.onboarding_doc` | Dead code |
| 2 | **Blank loading screens** | `index.tsx`, `login.tsx` | UX — blank screen on load |
| 3 | **No AbortController** in API calls | All routes | Race conditions possible |
| 4 | **No request deduplication** | `api.ts` | Duplicate API calls |
| 5 | **No retry with exponential backoff** | `api.ts` | Transient failures not handled |
| 6 | **`api()` lacks generic typing** | `api.ts` | TypeScript strictness gap |

---

## 2. Frontend Route Inventory (31 routes)

### Auth (3)
- `/login` — CRITICAL: hardcoded password exposed
- `/` — Root redirect, returns null during loading
- `/register-candidate` — Public applicant registration

### Authenticated Layout (28)
| Route | Nav | Permission | Module |
|-------|-----|------------|--------|
| `_authenticated.dashboard` | ✅ | None (role-gated content) | Dashboard |
| `_authenticated.candidates` | ✅ | `candidate.view` | Candidate Directory |
| `_authenticated.candidates.$id` | — | — | Candidate Detail |
| `_authenticated.hr.queue` | ✅ | `hr.review` | HR Review Queue |
| `_authenticated.hr.review.$id` | — | — | HR Review Form |
| `_authenticated.interviewer.queue` | ✅ | `technical.evaluate` | Interview Queue |
| `_authenticated.interviewer.evaluate.$id` | — | — | Technical Evaluation |
| `_authenticated.interviewer.review.$id` | — | — | Read-only Candidate Review |
| `_authenticated.ceo.queue` | ✅ | `ceo.evaluate` | CEO Review Queue |
| `_authenticated.ceo.evaluate.$id` | — | — | CEO Evaluation Form |
| `_authenticated.final-discussion.$id` | — | `final.discuss` | Final Discussion |
| `_authenticated.final-decision.$id` | — | `decision.final` | Final Decision |
| `_authenticated.offer.dashboard` | ✅ | `decision.final` | Offer Dashboard |
| `_authenticated.offer.queue` | — | — | Offer Queue |
| `_authenticated.offer.builder.$candidateId` | — | — | Offer Builder Form |
| `_authenticated.offer.preview.$candidateId` | — | — | Offer Letter Preview |
| `_authenticated.offer.status.$candidateId` | — | — | Offer Status Timeline |
| `_authenticated.offer.$candidateId` | — | — | Offer Detail |
| `_authenticated.onboarding.dashboard` | ✅ | `decision.final` | Onboarding Dashboard |
| `_authenticated.onboarding.queue` | — | — | Employee Queue |
| `_authenticated.onboarding.$candidateId` | — | — | Employee Profile |

---

## 3. Backend API Inventory (41 endpoints)

### Auth Router (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | ✅ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Blacklist refresh token |
| GET | `/api/auth/me` | ✅ | Get current user |

### Applicant Router (16 endpoints)
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/api/applicant` | ❌ | None (public) | Create applicant (multipart: JSON + PDF) |
| GET | `/api/applicants` | ✅ | `candidate.view` | Search/filter/paginate candidates |
| GET | `/api/applicants/stats` | ✅ | `candidate.view` | Dashboard statistics |
| GET | `/api/candidate/{id}` | ✅ | `candidate.view` | Get candidate full details |
| PUT | `/api/candidate/{id}` | ✅ | `candidate.edit` | Update candidate |
| DELETE | `/api/candidate/{id}` | ✅ | `candidate.delete` | Soft delete candidate |
| POST | `/api/candidate/{id}/submit` | ✅ | `candidate.submit` | Submit for review |
| GET | `/api/candidate/{id}/documents` | ✅ | `candidate.view` | Get candidate documents |
| GET | `/api/candidate/{id}/documents/{type}` | ✅ | `candidate.view` | Get specific document |
| POST | `/api/candidate/{id}/documents` | ✅ | `candidate.edit` | Upload document |
| DELETE | `/api/candidate/{id}/documents/{doc_id}` | ✅ | `candidate.edit` | Delete document |
| GET | `/api/candidate/{id}/activity` | ✅ | `candidate.view` | Get activity log |
| POST | `/api/candidate/{id}/activity` | ✅ | `candidate.view` | Add activity log |
| GET | `/api/candidate/{id}/timeline` | ✅ | `candidate.view` | Get timeline |
| GET | `/api/applicants/export` | ✅ | `candidate.view` | Export candidates CSV |
| GET | `/api/applicants/search` | ✅ | `candidate.view` | Quick search |

### Workflow Router (8 endpoints)
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/api/workflow/hr/review/{candidate_id}` | ✅ | `hr.review` | Submit HR review |
| POST | `/api/workflow/technical/evaluate/{candidate_id}` | ✅ | `technical.evaluate` | Submit technical evaluation |
| GET | `/api/workflow/my-assignments` | ✅ | Any assigned | Get my interview assignments |
| POST | `/api/workflow/ceo/evaluate/{candidate_id}` | ✅ | `ceo.evaluate` | Submit CEO evaluation |
| POST | `/api/workflow/final-discussion/{candidate_id}` | ✅ | `final.discuss` | Save final discussion notes |
| POST | `/api/workflow/final-decision/{candidate_id}` | ✅ | `decision.final` | Make final hiring decision |
| GET | `/api/workflow/dashboard/stats` | ✅ | None | Workflow statistics |
| GET | `/api/workflow/ceo/candidates` | ✅ | `ceo.evaluate` | CEO candidates list |

### User Router (3 endpoints)
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/users` | ✅ | `user.view` | List all users |
| POST | `/api/users` | ✅ | `user.create` | Create new user |
| GET | `/api/users/{user_id}` | ✅ | `user.view` | Get user details |

### Scorecard Router (3 endpoints)
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/scorecard/domains` | ✅ | None | List scorecard domains |
| GET | `/api/scorecard/topics` | ✅ | None | List scorecard topics |
| POST | `/api/scorecard/topics` | ✅ | None | Save scorecard topics |

---

## 4. Database Model Inventory (13 models)

| Model | Table | Key Fields |
|-------|-------|------------|
| User | users | id, email, password_hash, full_name, role, employee_code, is_active |
| Candidate | candidates | id, first_name, last_name, email, phone, status, workflow_stage, position_applied |
| CandidatePersonalDetails | candidate_personal_details | candidate_id, date_of_birth, gender, address, city, state |
| CandidateProfessionalDetails | candidate_professional_details | candidate_id, current_company, current_designation, total_experience, current_ctc, expected_ctc |
| CandidateEmploymentHistory | candidate_employment_history | candidate_id, company, designation, start_date, end_date, reason_for_leaving |
| CandidateEducation | candidate_education | candidate_id, degree, institution, year_of_passing, percentage |
| CandidateAssessment | candidate_assessments | candidate_id, assessment_type, score, remarks |
| CandidatePersonalityQuestion | candidate_personality_questions | candidate_id, question_number, answer |
| CandidateSituationalQuestion | candidate_situational_questions | candidate_id, question_number, answer |
| CandidateWrittenQuestion | candidate_written_questions | candidate_id, question_number, answer |
| CandidateDeclaration | candidate_declarations | candidate_id, declaration_text, is_signed |
| CandidateDocument | candidate_documents | candidate_id, document_type, file_path, original_filename |
| CandidateActivityLog | candidate_activity_logs | candidate_id, action, description, performed_by |

---

## 5. Permission System (15 permissions, 7 roles)

### Permissions
```
candidate.view, candidate.edit, candidate.delete, candidate.submit
hr.review, technical.evaluate, ceo.evaluate
final.discuss, decision.final
user.view, user.create, user.edit, user.delete
system.admin, report.view
```

### Role Matrix
| Role | Permissions |
|------|------------|
| SYSTEM_ADMIN | All 15 |
| HR_ADMIN | candidate.view, candidate.edit, candidate.delete, hr.review, decision.final, user.view, user.create, report.view |
| HR_PANEL | candidate.view, hr.review |
| RECEPTIONIST | candidate.view, candidate.edit, candidate.submit |
| L1_PANEL | candidate.view, technical.evaluate |
| L2_PANEL | candidate.view, technical.evaluate |
| TECH_HEAD | candidate.view, technical.evaluate, ceo.evaluate |
| CEO | candidate.view, ceo.evaluate, final.discuss, decision.final, report.view |

---

## 6. Security Issues

### CRITICAL: Hardcoded Password in Login UI
**File:** `frontend-new/src/routes/login.tsx`  
**Issue:** MOCK_ACCOUNTS contains `password: "ChangeMe!Admin123!"` exposed in plain text  
**Fix:** Remove MOCK_ACCOUNTS entirely; login should only use API endpoint

### navigate() During Render
**File:** `frontend-new/src/routes/login.tsx` line 122  
**Issue:** `navigate({ to: '/' })` called directly during render, not in useEffect  
**Fix:** Wrap in useEffect or move to success callback

### No CSRF Protection
- Backend uses JWT tokens (stateless), mitigating CSRF risk
- Frontend uses Authorization header, not cookies
- **Risk Level:** Low

---

## 7. Performance Issues

### No Global TanStack Query Config
- Default staleTime: 0 (always stale)
- Default gcTime: 5 minutes
- No query deduplication window
- **Impact:** Excessive API calls, wasted bandwidth

### No AbortController Usage
- None of the routes use AbortController for cleanup
- Race conditions possible when navigating rapidly
- **Impact:** Potential stale data display

### Large Bundle
- 31 routes, all bundled together
- No route-level code splitting configured
- **Impact:** Slow initial load

---

## 8. Recommendations

### Immediate (Must Fix)
1. Remove MOCK_ACCOUNTS from login.tsx — use API-only authentication
2. Fix navigate() timing in login.tsx
3. Add Error Boundaries at route level
4. Configure global TanStack Query defaults

### Short-Term (Should Fix)
5. Remove unused localStorage keys
6. Add AbortController to API calls
7. Add loading skeletons instead of blank screens
8. Add retry with exponential backoff to api.ts

### Medium-Term (Nice to Have)
9. Add route-level code splitting
10. Add request deduplication
11. Add global error handler
12. Add API response caching strategy
