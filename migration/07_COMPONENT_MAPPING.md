# Migration Document 07: Component Mapping

## 1. Scorecard Form Editors
*   `ScorecardEditor` (`components/scorecard.tsx`): Reusable slider/input scorecard ratings editor for HR screening, L1, L2, and CEO assessment scorecards.
*   `useScorecard` hook: Exposes rating state management and completeness validations (requires all dimensions to be graded).

## 2. Layout & Shells
*   `AuthenticatedLayout` (`routes/_authenticated.tsx`): Side navigation, staff profile controls, and route permission guards.
*   `QueueWidget` (`routes/_authenticated.dashboard.tsx`): Renders collapsible tables containing applicant details, matching badges, and context actions.
