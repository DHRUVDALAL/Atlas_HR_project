// Permission code catalog (mirrors the backend contract).
// The frontend gates UI on these codes only — never on hardcoded role names.
export const PERMISSIONS = {
  CANDIDATE_LIST: 'candidate.list',
  CANDIDATE_READ: 'candidate.read',
  CANDIDATE_UPDATE: 'candidate.update',
  CANDIDATE_UPDATE_ANY: 'candidate.update_any',
  CANDIDATE_DELETE: 'candidate.delete',
  WORKFLOW_RECEPTION_FORWARD: 'workflow.reception_forward',
  WORKFLOW_HR_REVIEW: 'workflow.hr_review',
  WORKFLOW_TECHNICAL_EVALUATE: 'workflow.technical_evaluate',
  WORKFLOW_CEO_EVALUATE: 'workflow.ceo_evaluate',
  DECISION_FINAL: 'decision.final',
  EVALUATION_VIEW_ALL: 'evaluation.view_all',
  EVALUATION_VIEW_HR: 'evaluation.view_hr',
  EVALUATION_VIEW_ASSIGNED: 'evaluation.view_assigned',
  USER_MANAGE: 'user.manage',
  ROLE_READ: 'role.read',
};
