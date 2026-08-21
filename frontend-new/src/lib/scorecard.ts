export const HR_DIMENSIONS = [
  "Communication & Articulation",
  "Confidence & Poise",
  "Technical / Domain Knowledge",
  "Attitude & Ownership Mindset",
  "Empathy & Team Orientation",
  "Problem-Solving Approach",
  "Cultural Fit & Values Alignment",
] as const;

export const TECHNICAL_DIMENSIONS = [
  "Core Technical Competency",
  "Problem-Solving Depth",
  "System Design & Architecture",
  "Coding / Implementation",
  "Communication of Technical Ideas",
] as const;

export const CEO_DIMENSIONS = [
  "Leadership Aptitude",
  "Strategic Thinking",
  "Cultural Alignment",
  "Business Acumen",
  "Overall Fit",
] as const;

export const DOMAINS = [
  { value: "FI", label: "Financial Accounting (FI)" },
  { value: "CO", label: "Controlling (CO)" },
  { value: "MM", label: "Materials Management (MM)" },
  { value: "SD", label: "Sales & Distribution (SD)" },
  { value: "PP", label: "Production Planning (PP)" },
  { value: "QM", label: "Quality Management (QM)" },
  { value: "PM", label: "Plant Maintenance (PM)" },
  { value: "WM", label: "Warehouse Management (WM)" },
  { value: "HCM", label: "Human Capital Management (HCM)" },
  { value: "BASIS", label: "SAP Basis" },
  { value: "ABAP", label: "SAP ABAP" },
  { value: "FIORI", label: "SAP Fiori" },
  { value: "BTP", label: "Business Technology Platform (BTP)" },
  { value: "SUCCESSFACTORS", label: "SuccessFactors" },
  { value: "ARIBA", label: "SAP Ariba" },
  { value: "BW", label: "SAP BW" },
  { value: "SAC", label: "SAP SAC & Datasphere (SAC)" },
  { value: "IBP", label: "Integrated Business Planning (IBP)" },
  { value: "GRC", label: "Governance Risk Compliance (GRC)" },
  { value: "MDG", label: "Master Data Governance (MDG)" },
  { value: "EWM", label: "Extended Warehouse Management (EWM)" },
  { value: "TM", label: "Transportation Management (TM)" },
  { value: "CPI", label: "Cloud Platform Integration (CPI)" },
  { value: "PI/PO", label: "Process Integration / Orchestration (PI/PO)" },
  { value: "CRM", label: "Customer Relationship Management (CRM)" },
  { value: "SNM", label: "Sales & Marketing (SNM)" },
  { value: "GFX", label: "Graphics / Design (GFX)" },
  { value: "AI", label: "Artificial Intelligence (AI)" },
  { value: "FIN", label: "Finance & Accounts (FIN)" },
];

export const STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "Submitted", className: "bg-info/15 text-info" },
  "Submitted — awaiting reception": { label: "Awaiting Reception", className: "bg-info/15 text-info" },
  RECEPTION_FORWARDED: {
    label: "Reception Forwarded",
    className: "bg-accent text-accent-foreground",
  },
  TECHNICAL_PENDING: {
    label: "Technical Round 1 Pending",
    className: "bg-primary/15 text-primary",
  },
  TECHNICAL_ROUND_2_PENDING: {
    label: "Technical Round 2 Pending",
    className: "bg-primary/15 text-primary",
  },
  TECH_ROUND_1: {
    label: "Technical Round 1",
    className: "bg-primary/15 text-primary",
  },
  TECH_ROUND_2: {
    label: "Technical Round 2",
    className: "bg-primary/15 text-primary",
  },
  TECH_ROUND_3: {
    label: "Technical Round 3",
    className: "bg-primary/15 text-primary",
  },
  TECH_ROUND_4: {
    label: "Technical Round 4",
    className: "bg-primary/15 text-primary",
  },
  TECH_ROUND_5: {
    label: "Technical Round 5",
    className: "bg-primary/15 text-primary",
  },
  CEO_ROUND: { label: "CEO Round", className: "bg-warning/20 text-warning-foreground" },
  FINAL_DISCUSSION_PENDING: {
    label: "Final Discussion",
    className: "bg-warning/20 text-warning-foreground",
  },
  SELECTED: { label: "Selected", className: "bg-success/15 text-success" },
  REJECTED: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
  ON_HOLD: { label: "On Hold", className: "bg-muted text-muted-foreground" },
};

export function statusMeta(s?: string) {
  return (
    STATUS_META[s ?? ""] ?? { label: s ?? "Unknown", className: "bg-muted text-muted-foreground" }
  );
}
