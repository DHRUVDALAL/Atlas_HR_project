import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, API_BASE_URL } from "@/lib/api";
import type { CandidateDetail } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { statusMeta } from "@/lib/scorecard";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  FileText,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Download,
  ExternalLink,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  Crown,
  Gavel,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidates/$id")({
  head: () => ({ meta: [{ title: "Candidate — Atlas HR" }] }),
  component: CandidateDetailPage,
});

const TIMELINE_STEPS = [
  { status: "SUBMITTED", label: "Application Submitted", icon: FileText },
  { status: "Submitted — awaiting reception", label: "Application Submitted", icon: FileText },
  { status: "RECEPTION_FORWARDED", label: "Reception Check-In", icon: UserCheck },
  { status: "TECHNICAL_PENDING", label: "HR Review Complete", icon: ClipboardCheck },
  { status: "TECHNICAL_ROUND_2_PENDING", label: "Technical Round 1", icon: Briefcase },
  { status: "TECHNICAL_ROUND_3_PENDING", label: "Technical Round 2", icon: Briefcase },
  { status: "TECHNICAL_ROUND_4_PENDING", label: "Technical Round 3", icon: Briefcase },
  { status: "TECHNICAL_ROUND_5_PENDING", label: "Technical Round 4", icon: Briefcase },
  { status: "FINAL_DISCUSSION_PENDING", label: "Final Discussion", icon: Gavel },
  { status: "SELECTED", label: "Selected", icon: CheckCircle },
];

function getTimelineIndex(status: string): number {
  if (status.startsWith("TECHNICAL_")) {
    const n = parseInt(status.split("_")[2], 10);
    if (n <= 1) return 2;
    if (n <= 2) return 3;
    if (n <= 3) return 4;
    return 4;
  }
  const idx = TIMELINE_STEPS.findIndex((s) => s.status === status);
  if (idx >= 0) return idx;
  if (status === "REJECTED") return 0;
  if (status === "ON_HOLD") return 6;
  return 0;
}

function CandidateDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { user, hasPermission } = useAuth();
  const qc = useQueryClient();
  const isReceptionist = hasPermission("workflow.reception_forward") && !hasPermission("workflow.hr_review");

  const [arriveDialogOpen, setArriveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api<{ data: CandidateDetail }>(`/api/applicants/${id}`).then((r) => r.data),
  });

  const forward = useMutation({
    mutationFn: () => api(`/api/workflow/receptionist/forward/${id}`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Candidate arrived and forwarded to HR");
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      setArriveDialogOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to forward candidate"),
  });

  const reject = useMutation({
    mutationFn: () =>
      api(`/api/workflow/receptionist/reject/${id}`, {
        method: "POST",
        body: { reason: rejectReason },
      }),
    onSuccess: () => {
      toast.success("Candidate rejected");
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to reject candidate"),
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-40 rounded-full" />
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="bg-white p-16 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Candidate Not Found</h2>
          <p className="text-sm font-medium text-[#86868b] mt-2">
            The candidate you are looking for does not exist or has been removed.
          </p>
          <Link 
            to="/candidates"
            className="inline-flex items-center justify-center mt-8 px-6 py-3 rounded-full bg-[#1d1d1f] text-white text-sm font-bold hover:bg-black transition-all active:scale-[0.98]"
          >
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const s = statusMeta(data.status);
  const timelineIndex = getTimelineIndex(data.status);
  const isRejected = data.status === "REJECTED";
  const isHold = data.status === "ON_HOLD";
  const isPreArrival = ["SUBMITTED", "DRAFT", "Submitted — awaiting reception"].includes(data.status);
  const canShowReceptionActions = isReceptionist && isPreArrival;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      {/* Back button */}
      <div className="flex items-center">
        <Link 
          to="/candidates"
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center mr-3">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to candidates
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 flex-wrap mb-2">
              <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">
                {data.first_name} {data.last_name}
              </h1>
              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className?.replace('bg-', 'bg-opacity-20 text-').replace('text-white', 'text-gray-800') || 'bg-gray-100 text-gray-800'}`}>
                {s.label}
              </span>
            </div>
            <div className="text-sm font-medium text-[#86868b]">
              <span className="font-bold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-md">{data.application_number}</span> ·{" "}
              {data.position_applied_for ?? "—"}
            </div>
            <div className="text-sm font-medium text-[#86868b] mt-1">
              {data.email} · {data.phone}
            </div>
          </div>

          {/* Action buttons based on status and role */}
          <div className="flex flex-wrap gap-3">
            {data.status === "RECEPTION_FORWARDED" && hasPermission("workflow.hr_review") && (
              <Link 
                to={`/hr/review/${id}`}
                className="flex items-center bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                Start HR Review
              </Link>
            )}
            {data.status.startsWith("TECHNICAL_") && hasPermission("workflow.technical_evaluate") && (
              <Link 
                to={`/interviewer/evaluate/${id}`}
                className="flex items-center bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                Submit Evaluation
              </Link>
            )}
            {data.status === "CEO_ROUND" && hasPermission("workflow.ceo_evaluate") && (
              <Link 
                to={`/ceo/evaluate/${id}`}
                className="flex items-center bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                CEO Review
              </Link>
            )}
            {data.status === "FINAL_DISCUSSION_PENDING" && hasPermission("decision.final") && (
              <Link 
                to={`/final-decision/${id}`}
                className="flex items-center bg-[#1d1d1f] hover:bg-black text-white rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                Final Decision
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full flex overflow-x-auto bg-[#f5f5f7] rounded-2xl p-1 h-auto no-scrollbar justify-start mb-6">
              <TabsTrigger value="profile" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Profile</TabsTrigger>
              <TabsTrigger value="professional" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Professional</TabsTrigger>
              <TabsTrigger value="experience" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Experience</TabsTrigger>
              <TabsTrigger value="education" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Education</TabsTrigger>
              <TabsTrigger value="rounds" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Rounds ({data.interview_rounds?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Docs ({data.documents?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Activity Log</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="profile" className="outline-none">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <Field label="Full Name" value={`${data.first_name} ${data.middle_name ?? ""} ${data.last_name}`.trim()} icon={<User className="h-4 w-4" />} />
                  <Field label="Email" value={data.email} />
                  <Field label="Phone" value={data.phone} />
                  {data.alternate_phone && <Field label="Alternate Phone" value={data.alternate_phone} />}
                  <Field label="Gender" value={data.gender} icon={<User className="h-4 w-4" />} />
                  <Field label="Date of Birth" value={data.date_of_birth} icon={<Calendar className="h-4 w-4" />} />
                  <Field
                    label="Current Address"
                    value={[data.current_address, data.city, data.state, data.pincode].filter(Boolean).join(", ")}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  {data.permanent_address && (
                    <Field label="Permanent Address" value={data.permanent_address} icon={<MapPin className="h-4 w-4" />} />
                  )}
                  <Field label="Country" value={data.country} />
                  <div className="sm:col-span-2 h-px bg-gray-100 my-2" />
                  <Field label="Position Applied For" value={data.position_applied_for} icon={<Briefcase className="h-4 w-4" />} />
                  {data.applied_from && <Field label="Applied From" value={data.applied_from} />}
                  {data.applied_from === "REFERRAL" && data.source_name && <Field label="Referred By" value={data.source_name} />}
                  {data.applied_from === "VENDOR" && data.source_name && <Field label="Vendor Name" value={data.source_name} />}
                  {data.reference_number && <Field label="Reference Number" value={data.reference_number} />}
                </div>
              </div>
            </TabsContent>

            {/* Professional Information */}
            <TabsContent value="professional" className="outline-none">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Professional Details</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <Field label="Current Company" value={data.professional_details?.current_company} icon={<Briefcase className="h-4 w-4" />} />
                  <Field label="Current Designation" value={data.professional_details?.current_designation} />
                  <Field
                    label="Total Experience"
                    value={data.professional_details?.total_experience ? `${data.professional_details.total_experience} yrs` : "—"}
                  />
                  <Field
                    label="Relevant Experience"
                    value={data.professional_details?.relevant_experience ? `${data.professional_details.relevant_experience} yrs` : "—"}
                  />
                  <Field
                    label="Current CTC"
                    value={data.professional_details?.current_ctc ? `₹${data.professional_details.current_ctc} LPA` : "—"}
                  />
                  <Field
                    label="Expected CTC"
                    value={data.professional_details?.expected_ctc ? `₹${data.professional_details.expected_ctc} LPA` : "—"}
                  />
                  <Field label="Notice Period" value={data.professional_details?.notice_period} />
                  <Field label="Joining Availability" value={data.professional_details?.joining_availability} />
                  <Field label="Preferred Location" value={data.professional_details?.preferred_location} />
                  <Field label="Employment Type" value={data.professional_details?.employment_type} />
                </div>
              </div>
            </TabsContent>

            {/* Experience */}
            <TabsContent value="experience" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Employment History</h3>
              {(data.employment_history ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <Briefcase className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No employment history captured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.employment_history ?? []).map((h, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                        <div className="text-lg font-bold text-[#1d1d1f]">
                          {h.designation} <span className="text-[#86868b] font-medium mx-1">at</span> {h.company_name}
                        </div>
                        <div className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-bold text-[#86868b]">
                          {h.start_date} — {h.end_date || "Present"}
                        </div>
                      </div>
                      {h.responsibilities && (
                        <p className="text-sm font-medium text-[#86868b] leading-relaxed mb-4">{h.responsibilities}</p>
                      )}
                      {h.reason_for_leaving && (
                        <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-gray-100">
                          <div className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Reason for Leaving</div>
                          <p className="text-sm font-medium text-[#86868b]">{h.reason_for_leaving}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Education */}
            <TabsContent value="education" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Education</h3>
              {(data.education ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <GraduationCap className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No education captured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.education ?? []).map((e, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Field label="Qualification" value={e.qualification} icon={<GraduationCap className="h-4 w-4" />} />
                        <Field label="Specialization" value={e.specialization} />
                        <Field label="Institution" value={e.institution_name} />
                        <Field label="University" value={e.university} />
                        <Field label="Passing Year" value={e.passing_year?.toString()} />
                        <Field label="Score" value={e.percentage ? `${e.percentage}%` : e.grade} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Interview Rounds */}
            <TabsContent value="rounds" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Interview Rounds</h3>
              {(data.interview_rounds ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <ClipboardCheck className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No rounds recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.interview_rounds ?? []).map((r) => (
                    <div key={r.round_id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div>
                          <div className="text-lg font-bold text-[#1d1d1f] mb-1">
                            {r.round_type.replace(/_/g, " ")} <span className="text-[#86868b] font-medium mx-1">·</span> Round {r.round_number}
                          </div>
                          <div className="text-sm font-medium text-[#86868b] flex items-center gap-2">
                            <User className="h-4 w-4" /> {r.interviewer_email}
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                            r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'
                          }`}>
                            {r.status}
                          </span>
                          {r.completed_at && (
                            <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                              {new Date(r.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {r.evaluation_data && Object.keys(r.evaluation_data).length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-6">
                          {Object.entries(r.evaluation_data).map(([k, v]) => (
                            <div key={k} className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100">
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <div className="text-sm font-bold text-[#1d1d1f]">{k}</div>
                                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 text-sm font-bold text-[#1d1d1f] shadow-sm shrink-0">
                                  {v.rating}
                                </div>
                              </div>
                              {v.remarks && <p className="text-sm font-medium text-[#86868b] leading-relaxed">{v.remarks}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-[#86868b] text-center p-4 bg-[#fbfbfd] rounded-2xl border border-gray-50">
                          No evaluation data available yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Uploaded Documents</h3>
              {(data.documents ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <FileText className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No documents uploaded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.documents ?? []).map((d) => {
                    const fileUrl = `${API_BASE_URL}${d.file_path.startsWith("/") ? "" : "/"}${d.file_path}`;
                    const isPdf = d.file_name?.toLowerCase().endsWith(".pdf");
                    return (
                      <div key={d.document_id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 pr-4">
                              <div className="text-sm font-bold text-[#1d1d1f] mb-0.5">{d.document_type.replace(/_/g, " ")}</div>
                              <div className="text-xs font-medium text-[#86868b] truncate max-w-md">{d.file_name}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <a 
                              href={fileUrl} 
                              download={d.file_name}
                              className="flex items-center justify-center h-10 w-10 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        {isPdf && (
                          <div className="mt-6 rounded-2xl border border-gray-100 overflow-hidden bg-[#f5f5f7]">
                            <iframe src={fileUrl} className="w-full h-[400px]" title={d.file_name} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Activity Log / Timeline */}
            <TabsContent value="timeline" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Activity Log</h3>
              {(data.activity_logs ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <Clock className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="space-y-6">
                    {(data.activity_logs ?? [])
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log, i) => (
                        <div key={log.log_id ?? i} className="flex gap-4 relative">
                          {i < (data.activity_logs?.length ?? 0) - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-gray-100" />
                          )}
                          <div className="h-5 w-5 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center mt-1 relative z-10 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-[#0066cc]" />
                          </div>
                          <div className="flex-1 min-w-0 bg-[#fbfbfd] p-4 rounded-2xl border border-gray-50">
                            <div className="text-sm font-bold text-[#1d1d1f]">{log.action}</div>
                            {log.details && (
                              <div className="text-sm font-medium text-[#86868b] mt-1">{log.details}</div>
                            )}
                            <div className="text-xs font-bold text-[#1d1d1f]/40 uppercase tracking-wider mt-3 flex items-center gap-2">
                              <span>{log.performed_by}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Timeline & Actions */}
        <div className="space-y-6">
          {/* Reception Actions Panel */}
          {canShowReceptionActions && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#0066cc]/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-2">Reception Actions</h3>
              <p className="text-sm font-medium text-[#86868b] mb-6">
                Process this candidate by marking them as arrived or rejecting their application.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setArriveDialogOpen(true)}
                  className="w-full flex items-center justify-center bg-[#0066cc] text-white rounded-full px-6 py-3.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] hover:bg-[#005bb5]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark as Arrived
                </button>
                <button 
                  onClick={() => setRejectDialogOpen(true)}
                  className="w-full flex items-center justify-center bg-red-50 text-red-600 rounded-full px-6 py-3.5 text-sm font-bold transition-all active:scale-[0.98] hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Candidate
                </button>
              </div>
            </div>
          )}

          {/* Application Timeline Tracker */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-6">
            <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-8">Application Progress</h3>
            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isCurrentStep = i === timelineIndex && !isRejected;
                const isCompleted = i < timelineIndex || (isRejected && i === 0);
                const isPending = i > timelineIndex && !isRejected;

                return (
                  <div key={`${step.status}-${i}`} className="flex gap-4 relative">
                    {/* Vertical line */}
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-16px)] rounded-full ${
                          isCompleted ? "bg-[#1d1d1f]" : "bg-gray-100"
                        }`}
                      />
                    )}
                    {/* Node */}
                    <div
                      className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isCurrentStep
                          ? "bg-[#1d1d1f] text-white ring-4 ring-black/5"
                          : isCompleted
                            ? "bg-[#1d1d1f] text-white"
                            : "bg-gray-100 text-[#86868b]"
                      }`}
                    >
                      {isCompleted && !isCurrentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-8 pt-1 transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
                      <div className={`text-sm font-bold ${isCurrentStep || isCompleted ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>
                        {step.label}
                      </div>
                      <div className="text-xs font-bold tracking-wide uppercase mt-1 text-[#86868b]">
                        {isCompleted || isCurrentStep ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Rejected node */}
              {isRejected && (
                <div className="flex gap-4 relative mt-2">
                  <div className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-red-500 text-white shadow-md shadow-red-500/20">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <div className="text-sm font-bold text-red-500">Rejected</div>
                    <div className="text-xs font-medium text-[#86868b] mt-1">Candidate was rejected</div>
                  </div>
                </div>
              )}

              {/* On Hold node */}
              {isHold && (
                <div className="flex gap-4 relative mt-2">
                  <div className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-amber-500 text-white shadow-md shadow-amber-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <div className="text-sm font-bold text-amber-500">On Hold</div>
                    <div className="text-xs font-medium text-[#86868b] mt-1">Candidate is on hold</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Arrived Confirmation Dialog */}
      <Dialog open={arriveDialogOpen} onOpenChange={setArriveDialogOpen}>
        <DialogContent className="max-w-md sm:rounded-[2.5rem] p-8 border-none shadow-[0_20px_60px_rgb(0,0,0,0.12)]">
          <DialogHeader className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-[#0066cc]/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-[#0066cc]" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tighter text-[#1d1d1f]">Confirm Candidate Arrival</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#86868b] mt-2">
              This will mark the candidate as arrived and forward them to the HR review queue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
              <span className="font-bold text-[#86868b]">Candidate</span>
              <span className="font-bold text-[#1d1d1f]">{data.first_name} {data.last_name}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
              <span className="font-bold text-[#86868b]">Application</span>
              <span className="font-bold text-[#1d1d1f] bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">{data.application_number}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
              <span className="font-bold text-[#86868b]">Email</span>
              <span className="font-medium text-[#1d1d1f] truncate pl-4 max-w-[200px]">{data.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-[#86868b]">Position</span>
              <span className="font-medium text-[#1d1d1f] text-right">{data.position_applied_for ?? "—"}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={() => setArriveDialogOpen(false)}
              className="px-6 py-3 rounded-full bg-white text-[#1d1d1f] border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => forward.mutate()} 
              disabled={forward.isPending}
              className="px-6 py-3 rounded-full bg-[#0066cc] text-white text-sm font-bold hover:bg-[#005bb5] transition-colors disabled:opacity-50 flex items-center"
            >
              {forward.isPending ? "Processing..." : "Confirm Arrival"}
              {!forward.isPending && <ChevronRight className="h-4 w-4 ml-1" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Candidate Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md sm:rounded-[2.5rem] p-8 border-none shadow-[0_20px_60px_rgb(0,0,0,0.12)]">
          <DialogHeader className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tighter text-[#1d1d1f]">Reject Candidate</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#86868b] mt-2">
              This will reject the candidate and remove them from the recruitment pipeline. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#86868b]">Candidate</span>
                <span className="font-bold text-[#1d1d1f]">{data.first_name} {data.last_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#86868b]">Application</span>
                <span className="font-bold text-[#1d1d1f] bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">{data.application_number}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#86868b] uppercase tracking-wide ml-1">Reason for Rejection *</label>
              <textarea
                className="w-full bg-[#f5f5f7] border-transparent focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-2xl p-4 text-sm text-[#1d1d1f] transition-all outline-none resize-none min-h-[120px]"
                placeholder="Please provide a clear reason for rejecting this candidate..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={() => { setRejectDialogOpen(false); setRejectReason(""); }}
              className="px-6 py-3 rounded-full bg-white text-[#1d1d1f] border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => reject.mutate()}
              disabled={reject.isPending || rejectReason.trim().length < 3}
              className="px-6 py-3 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {reject.isPending ? "Rejecting..." : "Reject Candidate"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
        {icon && <span className="opacity-70">{icon}</span>} 
        {label}
      </div>
      <div className="text-sm font-medium text-[#1d1d1f] break-words">{value ?? "—"}</div>
    </div>
  );
}
