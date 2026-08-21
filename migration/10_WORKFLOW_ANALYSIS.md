# Migration Document 10: Workflow Analysis

The candidate lifecycle transitions dynamically through these status values matched by the database constraints:

*   **DRAFT**: Initial registration form saved (optional).
*   **SUBMITTED**: Wizard submission complete, signature signed.
*   **RECEPTION_FORWARDED**: Checked-in at reception desk.
*   **TECHNICAL_ROUND**: HR screening complete, domain assigned. Proceeding to technical interview rounds.
*   **CEO_ROUND**: All technical interview rounds completed successfully.
*   **FINAL_DISCUSSION_PENDING**: CEO scorecard submitted successfully.
*   **SELECTED** / **REJECTED** / **HOLD**: Final Decision released.
