import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, InterviewRound } from "@/lib/types";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Send, 
  Save, 
  Gavel, 
  Star, 
  FileText, 
  User, 
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  PauseCircle
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/final-discussion/$id")({
  head: () => ({ meta: [{ title: "Final Discussion — Atlas HR" }] }),
  component: FinalDiscussion,
});

function FinalDiscussion() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api<{ data: CandidateDetail }>(`/api/applicants/${id}`).then((r) => r.data),
  });

  const rounds = candidate?.interview_rounds ?? [];
  const techRounds = rounds.filter((r) => r.round_type === "TECHNICAL");
  const ceoRounds = rounds.filter((r) => r.round_type === "CEO_ROUND");

  const [finalStatus, setFinalStatus] = useState<"SELECTED" | "REJECTED" | "HOLD">("SELECTED");
  const [offeredCtc, setOfferedCtc] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [finalRemarks, setFinalRemarks] = useState("");
  const [hrDiscussionNotes, setHrDiscussionNotes] = useState("");
  const [hrDiscussion, setHrDiscussion] = useState("");
  const [ceoDiscussion, setCeoDiscussion] = useState("");
  const [activeTab, setActiveTab] = useState<"technical" | "ceo" | "profile">(techRounds.length > 0 ? "technical" : "ceo");

  const submit = useMutation({
    mutationFn: (saveDraft: boolean) =>
      api(`/api/workflow/final-decision/${id}`, {
        method: "POST",
        body: {
          final_status: saveDraft ? undefined : finalStatus,
          offered_ctc:
            !saveDraft && finalStatus === "SELECTED" && offeredCtc ? Number(offeredCtc) : undefined,
          joining_date:
            !saveDraft && finalStatus === "SELECTED" && joiningDate ? joiningDate : undefined,
          approved_by: approvedBy || undefined,
          final_remarks: finalRemarks || undefined,
          hr_discussion_notes: hrDiscussionNotes || undefined,
          hr_discussion: hrDiscussion || undefined,
          ceo_discussion: ceoDiscussion || undefined,
          save_draft: saveDraft,
        },
      }),
    onSuccess: (_, saveDraft) => {
      toast.success(saveDraft ? "Draft saved" : "Final decision recorded");
      qc.invalidateQueries();
      nav({ to: saveDraft ? `/ceo/queue` : `/candidates/${id}` });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (candidateLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="h-12 w-64 bg-gray-100 rounded-full animate-pulse" />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="h-12 w-96 bg-gray-100 rounded-full animate-pulse" />
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-32 bg-gray-100 rounded-full animate-pulse" />
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link 
          to="/ceo/queue"
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-[#f5f5f7] px-4 py-1.5 rounded-full"
        >
          <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center mr-2 shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          Back to queue
        </Link>
        <Link 
          to={`/candidates/${id}`}
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-[#f5f5f7] px-4 py-1.5 rounded-full"
        >
          <User className="h-3.5 w-3.5 mr-1.5" /> View profile
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f] flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Gavel className="h-6 w-6 text-amber-600" />
          </div>
          Final Discussion & Decision
        </h1>
        {candidate && (
          <p className="text-sm font-medium text-[#86868b] mt-2 ml-[3.75rem]">
            <span className="font-bold text-[#1d1d1f]">{candidate.first_name} {candidate.last_name}</span> · <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#f5f5f7]">{candidate.application_number}</span>
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Left: Read-only evaluation summaries */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Evaluation Summary</h2>

          {/* Custom Apple-style Tabs */}
          <div className="flex gap-2 p-1.5 bg-[#f5f5f7] rounded-full w-fit">
            {techRounds.length > 0 && (
              <button
                onClick={() => setActiveTab("technical")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "technical" 
                    ? "bg-white text-[#1d1d1f] shadow-sm" 
                    : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200/50"
                }`}
              >
                <Briefcase className="h-4 w-4" /> Technical ({techRounds.length})
              </button>
            )}
            {ceoRounds.length > 0 && (
              <button
                onClick={() => setActiveTab("ceo")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "ceo" 
                    ? "bg-white text-[#1d1d1f] shadow-sm" 
                    : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200/50"
                }`}
              >
                <Star className="h-4 w-4" /> CEO ({ceoRounds.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === "profile" 
                  ? "bg-white text-[#1d1d1f] shadow-sm" 
                  : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200/50"
              }`}
            >
              <FileText className="h-4 w-4" /> Profile
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "technical" && techRounds.length > 0 && (
              <motion.div
                key="technical"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {techRounds.map((r) => (
                  <RoundCard key={r.round_id} round={r} />
                ))}
              </motion.div>
            )}

            {activeTab === "ceo" && ceoRounds.length > 0 && (
              <motion.div
                key="ceo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {ceoRounds.map((r) => (
                  <RoundCard key={r.round_id} round={r} />
                ))}
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <Field icon={<User className="w-4 h-4" />} label="Name" value={`${candidate?.first_name} ${candidate?.last_name}`} />
                  <Field icon={<Briefcase className="w-4 h-4" />} label="Position" value={candidate?.position_applied_for} />
                  {candidate?.applied_from && <Field icon={<Building className="w-4 h-4" />} label="Applied From" value={candidate.applied_from} />}
                  {candidate?.applied_from === "REFERRAL" && candidate?.source_name && <Field icon={<User className="w-4 h-4" />} label="Referred By" value={candidate.source_name} />}
                  {candidate?.applied_from === "VENDOR" && candidate?.source_name && <Field icon={<Building className="w-4 h-4" />} label="Vendor Name" value={candidate.source_name} />}
                  <Field icon={<Building className="w-4 h-4" />} label="Domain" value={candidate?.domain} />
                  <Field
                    icon={<Clock className="w-4 h-4" />}
                    label="Experience"
                    value={
                      candidate?.professional_details?.total_experience
                        ? `${candidate.professional_details.total_experience} yrs`
                        : "—"
                    }
                  />
                  <Field
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Current CTC"
                    value={
                      candidate?.professional_details?.current_ctc
                        ? `₹${candidate.professional_details.current_ctc} LPA`
                        : "—"
                    }
                  />
                  <Field
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Expected CTC"
                    value={
                      candidate?.professional_details?.expected_ctc
                        ? `₹${candidate.professional_details.expected_ctc} LPA`
                        : "—"
                    }
                  />
                  <Field
                    icon={<Calendar className="w-4 h-4" />}
                    label="Notice Period"
                    value={candidate?.professional_details?.notice_period}
                  />
                  <Field
                    icon={<MapPin className="w-4 h-4" />}
                    label="Preferred Location"
                    value={candidate?.professional_details?.preferred_location}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Discussion notes + Decision form */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-8">
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Discussion & Decision</h2>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">HR Discussion Notes</label>
              <textarea
                value={hrDiscussionNotes}
                onChange={(e) => setHrDiscussionNotes(e.target.value)}
                placeholder="Notes from HR discussion with candidate…"
                rows={3}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">HR Discussion Summary</label>
              <textarea
                value={hrDiscussion}
                onChange={(e) => setHrDiscussion(e.target.value)}
                placeholder="Salary negotiation, benefits, expectations…"
                rows={3}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">CEO Discussion Notes</label>
              <textarea
                value={ceoDiscussion}
                onChange={(e) => setCeoDiscussion(e.target.value)}
                placeholder="CEO's feedback and discussion points…"
                rows={3}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
            <h3 className="font-bold tracking-tight text-[#1d1d1f]">Final Decision Formulation</h3>
            
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Outcome</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFinalStatus("SELECTED")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    finalStatus === "SELECTED" 
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" 
                      : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 mb-1.5 ${finalStatus === "SELECTED" ? "text-emerald-500" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Select</span>
                </button>
                <button
                  onClick={() => setFinalStatus("HOLD")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    finalStatus === "HOLD" 
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm" 
                      : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                  }`}
                >
                  <PauseCircle className={`w-5 h-5 mb-1.5 ${finalStatus === "HOLD" ? "text-amber-500" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Hold</span>
                </button>
                <button
                  onClick={() => setFinalStatus("REJECTED")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    finalStatus === "REJECTED" 
                      ? "border-red-500 bg-red-50 text-red-700 shadow-sm" 
                      : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                  }`}
                >
                  <XCircle className={`w-5 h-5 mb-1.5 ${finalStatus === "REJECTED" ? "text-red-500" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Reject</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {finalStatus === "SELECTED" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Offered CTC (LPA)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.1"
                        value={offeredCtc}
                        onChange={(e) => setOfferedCtc(e.target.value)}
                        placeholder="e.g. 12.5"
                        className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-[#1d1d1f] transition-all outline-none placeholder:font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Joining Date</label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1d1d1f] transition-all outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Approved By</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="Approver name or email"
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 px-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none placeholder:text-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Final Remarks</label>
              <textarea
                value={finalRemarks}
                onChange={(e) => setFinalRemarks(e.target.value)}
                placeholder="Final decision remarks…"
                rows={3}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => submit.mutate(true)}
                disabled={submit.isPending}
                className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" /> Draft
              </button>
              <button
                onClick={() => submit.mutate(false)}
                disabled={
                  finalStatus === "SELECTED" && (!offeredCtc || !joiningDate)
                    ? true
                    : submit.isPending
                }
                className="flex-[2] inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                <Send className="h-4 w-4 mr-2" /> Submit Decision
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoundCard({ round }: { round: InterviewRound }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold tracking-tight text-[#1d1d1f]">
          {round.round_type.replace(/_/g, " ")}
          {round.round_type === "TECHNICAL" ? ` #${round.round_number}` : ""}
        </div>
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          round.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {round.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-6 pb-4 border-b border-gray-50">
        <span>{round.interviewer_email}</span>
        {round.completed_at && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{new Date(round.completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
      
      {round.evaluation_data && (
        <div className="space-y-4 mb-6">
          {Object.entries(round.evaluation_data).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-4"
            >
              <div className="text-sm font-medium text-[#1d1d1f]">{k}</div>
              <div className="flex items-center gap-1.5 bg-[#fbfbfd] px-3 py-1 rounded-full border border-gray-100">
                <Star className="h-3.5 w-3.5 text-[#0066cc] fill-[#0066cc]" />
                <span className="font-mono text-sm font-bold text-[#1d1d1f]">{v.rating}<span className="text-[#86868b]">/5</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
      {round.remarks && (
        <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-gray-50">
          <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-2">Remarks</div>
          <p className="text-sm font-medium text-[#1d1d1f] leading-relaxed">{round.remarks}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value?: string | null, icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="mt-0.5 text-gray-400 shrink-0">
          {icon}
        </div>
      )}
      <div>
        <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">{label}</div>
        <div className="text-sm font-medium text-[#1d1d1f] mt-1">{value ?? "—"}</div>
      </div>
    </div>
  );
}
