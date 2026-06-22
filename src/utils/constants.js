export const ROLES = {
  RECEPTIONIST: 'receptionist',
  HR_ADMIN: 'hr_admin',
  TECH_HEAD: 'tech_head',
  SYSTEM_ADMIN: 'system_admin',
};

export const INTERVIEW_STATUS = {
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  HOLD: 'Hold',
  PENDING: 'Pending',
};

export const INTERVIEW_ROUNDS = {
  ROUND_1: 'Round 1',
  ROUND_2: 'Round 2',
  HR_ROUND: 'HR Round',
  FINAL_ROUND: 'Final Round',
};

export const CANDIDATE_STATUS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  ON_HOLD: 'On Hold',
};

export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];

export const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '60 Days',
  '90 Days',
];

export const DEGREE_OPTIONS = [
  'B.Tech',
  'B.E.',
  'B.Sc',
  'BCA',
  'M.Tech',
  'M.E.',
  'M.Sc',
  'MCA',
  'MBA',
  'Ph.D',
  'Diploma',
  'Other',
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
};

export const STATUS_COLORS = {
  [CANDIDATE_STATUS.NEW]: 'info',
  [CANDIDATE_STATUS.IN_PROGRESS]: 'warning',
  [CANDIDATE_STATUS.SELECTED]: 'success',
  [CANDIDATE_STATUS.REJECTED]: 'error',
  [CANDIDATE_STATUS.ON_HOLD]: 'default',
  [INTERVIEW_STATUS.SELECTED]: 'success',
  [INTERVIEW_STATUS.REJECTED]: 'error',
  [INTERVIEW_STATUS.HOLD]: 'warning',
  [INTERVIEW_STATUS.PENDING]: 'info',
};
