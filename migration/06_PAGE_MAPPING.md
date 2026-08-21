# Migration Document 06: Page Mapping

| Old Route (React Router) | New Route (TanStack Router) | Target Page File |
| :--- | :--- | :--- |
| `/login` | `/login` | `src/routes/login.tsx` |
| `/dashboard` | `/dashboard` | `src/routes/_authenticated.dashboard.tsx` |
| `/candidates` | `/candidates` | `src/routes/_authenticated.candidates.tsx` |
| `/candidates/:id` | `/candidates/$id` | `src/routes/_authenticated.candidates.$id.tsx` |
| `/register-candidate` | `/register-candidate` | `src/routes/register-candidate.tsx` |
| `/hr/review/:id` | `/hr/review/$id` | `src/routes/_authenticated.hr.review.$id.tsx` |
| `/interviewer/evaluate/:id` | `/interviewer/evaluate/$id` | `src/routes/_authenticated.interviewer.evaluate.$id.tsx` |
| `/ceo/evaluate/:id` | `/ceo/evaluate/$id` | `src/routes/_authenticated.ceo.evaluate.$id.tsx` |
| `/final-decision/:id` | `/final-decision/$id` | `src/routes/_authenticated.final-decision.$id.tsx` |
