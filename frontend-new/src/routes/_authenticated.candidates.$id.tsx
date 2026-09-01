import { CandidateProfileTabs } from "@/components/candidate-profile-tabs";
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
              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className?.replace('bg-', 'bg-opacity-20 text-')?.replace('text-white', 'text-gray-800') || 'bg-gray-100 text-gray-800'}`}>
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
          <CandidateProfileTabs data={data} />
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


