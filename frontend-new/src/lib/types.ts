export type Role =
  "SYSTEM_ADMIN" | "HR_ADMIN" | "RECEPTIONIST" | "L1_PANEL" | "L2_PANEL" | "TECH_HEAD" | "CEO";

export interface AuthUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Role[];
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export type CandidateStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "Submitted — awaiting reception"
  | "RECEPTION_FORWARDED"
  | "TECHNICAL_PENDING"
  | "TECHNICAL_ROUND_2_PENDING"
  | "TECHNICAL_ROUND_3_PENDING"
  | "TECHNICAL_ROUND_4_PENDING"
  | "TECHNICAL_ROUND_5_PENDING"
  | "CEO_ROUND"
  | "FINAL_DISCUSSION_PENDING"
  | "SELECTED"
  | "REJECTED"
  | "ON_HOLD";

export interface ApplicantListItem {
  candidate_id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: CandidateStatus;
  position_applied_for?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewRound {
  round_id: string;
  round_number: number;
  round_type: string;
  assigned_interviewer?: string;
  next_interviewer_email?: string;
  interviewer_email?: string;
  status: string;
  remarks?: string;
  evaluation_data?: Record<string, { rating: number; remarks?: string }>;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface CandidateDetail extends ApplicantListItem {
  middle_name?: string;
  alternate_phone?: string;
  gender?: string;
  date_of_birth?: string;
  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  domain?: string;
  referred_by?: string;
  reference_number?: string;
  applied_from?: string;
  source_name?: string;
  professional_details?: {
    total_experience?: number;
    relevant_experience?: number;
    current_company?: string;
    current_designation?: string;
    current_ctc?: number;
    expected_ctc?: number;
    notice_period?: string;
    joining_availability?: string;
    preferred_location?: string;
    employment_type?: string;
  };
  education?: Array<{
    qualification?: string;
    specialization?: string;
    institution_name?: string;
    university?: string;
    passing_year?: number;
    percentage?: number;
    grade?: string;
  }>;
  employment_history?: Array<{
    company_name?: string;
    designation?: string;
    start_date?: string;
    end_date?: string;
    responsibilities?: string;
    reason_for_leaving?: string;
  }>;
  documents?: Array<{
    document_id: string;
    document_type: string;
    file_name: string;
    file_path: string;
  }>;
  interview_rounds?: InterviewRound[];
  personality_assessment?: Array<{ question_number: number; rating: number }>;
  situational_responses?: Array<{ question_number: number; selected_option: string }>;
  written_responses?: Array<{ question_number: number; answer_text: string }>;
  activity_logs?: Array<{
    log_id: string;
    action: string;
    performed_by: string;
    details?: string;
    timestamp: string;
  }>;
  final_decision?: FinalDecisionDetail;
}

export interface InterviewAssignment {
  assignment_id: string;
  candidate_id: string;
  candidate_name: string;
  position: string;
  domain: string;
  round_number: number;
  round_type: string;
  interviewer_email: string;
  status: string;
  assigned_at: string;
  application_number?: string;
  email?: string;
}

export interface ScorecardTopic {
  topic_id: string;
  topic_name: string;
  description: string;
  weightage: number;
  domain: string;
}

export interface FinalDiscussionResponse {
  success: boolean;
  candidate: CandidateDetail;
  technical_scores: InterviewRound[];
  ceo_scores: InterviewRound[];
  previous_evaluations: InterviewRound[];
}

export interface FinalDecisionDetail {
  decision_id: string;
  final_status: string;
  offered_ctc?: number;
  joining_date?: string;
  approved_by?: string;
  final_remarks?: string;
  hr_discussion?: string;
  ceo_discussion?: string;
  hr_discussion_notes?: string;
  created_by?: string;
  decision_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type OfferStatus = "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";

export interface OfferRecord {
  candidate_id: string;
  status: OfferStatus;
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

export interface OfferDetailResponse {
  success: boolean;
  candidate: CandidateDetail;
  technical_scores: InterviewRound[];
  ceo_scores: InterviewRound[];
  previous_evaluations: InterviewRound[];
}

export type VerificationStatus = "pending" | "verified" | "rejected" | "cleared" | "failed";

export interface VerificationItem {
  status: VerificationStatus;
  verified_at?: string;
  notes?: string;
}

export type AssetStatus = "pending" | "allocated" | "returned" | "configured";

export interface AssetItem {
  status: AssetStatus;
  allocated_at?: string;
  asset_id?: string;
  notes?: string;
  email_address?: string;
}

export interface OnboardingChecklist {
  offer_accepted: boolean;
  documents_received: boolean;
  background_complete: boolean;
  it_ready: boolean;
  payroll_ready: boolean;
  manager_assigned: boolean;
  joining_kit: boolean;
  orientation_scheduled: boolean;
}

export type OnboardingStatus = "pending" | "in_progress" | "completed";

export interface OnboardingRecord {
  candidate_id: string;
  status: OnboardingStatus;
  documents: {
    aadhaar: VerificationItem;
    pan: VerificationItem;
    passport: VerificationItem;
    driving_license: VerificationItem;
    education: VerificationItem;
    experience: VerificationItem;
    resume: VerificationItem;
    offer_letter: VerificationItem;
  };
  background_verification: {
    reference_check: VerificationItem;
    employment_verification: VerificationItem;
    education_verification: VerificationItem;
    criminal_verification: VerificationItem;
  };
  assets: {
    laptop: AssetItem;
    monitor: AssetItem;
    phone: AssetItem;
    email: AssetItem;
    access_card: AssetItem;
    vpn: AssetItem;
    software_licenses: AssetItem;
  };
  checklist: OnboardingChecklist;
  history: Array<{
    action: string;
    timestamp: string;
    by: string;
    details?: string;
  }>;
  created_at: string;
  updated_at: string;
}

// ── Interview Engine Types ──────────────────────────────────────

export interface SapDomain {
  id: string;
  code: string;
  name: string;
}

export interface ExperienceBracket {
  id: string;
  code: string;
  label: string;
  min_years: number;
  max_years: number | null;
}

export interface TechnicalQuestion {
  id: string;
  question_id_code: string;
  module_code: string;
  module_name: string;
  topic_category: string;
  question_topic: string;
  source: string | null;
  difficulty: string | null;
  weight: number | null;
}

export interface TopicGroup {
  topic_category: string;
  questions: TechnicalQuestion[];
}

export interface InterviewEngineAssignment {
  id: string;
  candidate_id: string;
  domain_code: string;
  domain_name: string | null;
  experience_bracket_code: string;
  experience_bracket_label: string | null;
  assigned_interviewer: string;
  assigned_by: string;
  interview_round: number;
  status: string;
  created_at: string | null;
}

export interface InterviewResponseItem {
  id: string;
  topic_id: string;
  rating: number | null;
  comment: string | null;
  question_id_code?: string;
  question_topic?: string;
  topic_category?: string;
  module_code?: string;
}

export interface InterviewScore {
  id: string;
  assignment_id: string;
  topic_scores: Record<string, number> | null;
  overall_percentage: number | null;
  recommendation: string | null;
  total_questions: number | null;
  answered_questions: number | null;
  average_rating: number | null;
  highest_topic: string | null;
  weakest_topic: string | null;
  calculated_at: string | null;
}

export interface InterviewSummary {
  id: string;
  assignment_id: string;
  summary_json: Record<string, any> | null;
  generated_at: string | null;
}

export interface InterviewProgressResponse {
  assignment_id: string;
  responses: InterviewResponseItem[];
  is_submitted: boolean;
}
