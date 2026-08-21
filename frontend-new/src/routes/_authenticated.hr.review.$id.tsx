import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, SapDomain, ExperienceBracket } from "@/lib/types";
import { HR_DIMENSIONS, statusMeta } from "@/lib/scorecard";
import { ScorecardEditor, useScorecard } from "@/components/scorecard";
import { toast } from "sonner";
import { ArrowLeft, Send, User, Briefcase, MapPin, FileText, LayoutDashboard, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hr/review/$id")({
  head: () => ({ meta: [{ title: "HR Review — Atlas HR" }] }),
  component: HrReview,
});

function HrReview() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api<{ data: CandidateDetail }>(`/api/applicants/${id}`).then((r) => r.data),
  });

  const { data: domainsData } = useQuery({
    queryKey: ["interview", "domains"],
    queryFn: () => api<{ domains: SapDomain[] }>("/api/interview/domains").then((r) => r.domains ?? []),
  });

  const { data: bracketsData } = useQuery({
    queryKey: ["interview", "brackets"],
    queryFn: () => api<{ brackets: ExperienceBracket[] }>("/api/interview/experience-brackets").then((r) => r.brackets ?? []),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<any[]>("/api/users?limit=200").then((r) => r ?? []),
  });

  const { state, update, isComplete } = useScorecard(HR_DIMENSIONS);
  const [domain, setDomain] = useState("FI");
  const [experienceBracket, setExperienceBracket] = useState("0-3 yrs");
  const [rounds, setRounds] = useState(2);
  const [hrStatus, setHrStatus] = useState<"SELECT" | "REJECT" | "HOLD">("SELECT");
  const [firstInterviewer, setFirstInterviewer] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const reviewResult = await api(`/api/workflow/hr/review/${id}`, {
        method: "POST",
        body: {
          domain,
          experience_bracket: experienceBracket,
          number_of_tech_rounds: rounds,
          hr_status: hrStatus,
          first_interviewer_email: firstInterviewer,
          evaluation_data: state,
        },
      });

      if (hrStatus === "SELECT" && firstInterviewer) {
        await api("/api/interview/assign", {
          method: "POST",
          body: {
            candidate_id: id,
            domain_code: domain,
            experience_bracket_code: experienceBracket,
            assigned_interviewer: firstInterviewer,
            interview_round: 1,
          },
        });
      }

      return reviewResult;
    },
    onSuccess: () => {
      toast.success("HR review submitted successfully");
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
      nav({ to: `/candidates/${id}` });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to submit"),
  });

  const canSubmit =
    isComplete &&
    (hrStatus !== "SELECT" ||
      (firstInterviewer.trim().length > 0 && firstInterviewer.includes("@")));

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-9 w-9 bg-gray-100 rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-16 w-full bg-gray-100 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const domains = domainsData ?? [];
  const brackets = bracketsData ?? [];
  const users = usersData ?? [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link 
          to="/hr/queue"
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center mr-3">
            <ArrowLeft className="h-4 w-4" />
          </div>
          HR Queue
        </Link>
        <span className="text-[#86868b] font-bold">/</span>
        <Link 
          to={`/candidates/${id}`}
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-[#f5f5f7] px-4 py-1.5 rounded-full"
        >
          Candidate Detail
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f] flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
          </div>
          HR Review
        </h1>
        <p className="text-sm font-medium text-[#86868b] mt-2 ml-[3.75rem]">
          Complete the evaluation below and assign the candidate to a technical round.
        </p>
      </div>

      {/* Candidate Summary Card */}
      {candidate && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-[#f5f5f7] flex items-center justify-center text-xl font-bold text-[#1d1d1f] shrink-0 border-2 border-white shadow-sm">
              <User className="h-6 w-6 text-[#1d1d1f]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-3">
                {candidate.first_name} {candidate.last_name}
                <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${statusMeta(candidate.status).className.replace('border-transparent', '')}`}>
                  {statusMeta(candidate.status).label}
                </span>
              </div>
              <div className="text-sm font-medium text-[#86868b] mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono font-bold bg-[#f5f5f7] px-2 py-0.5 rounded-md text-[#1d1d1f]">{candidate.application_number}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {candidate.position_applied_for ?? "—"}</span>
                <span>{candidate.email}</span>
                <span>{candidate.phone}</span>
                {candidate.applied_from && <span>via {candidate.applied_from}</span>}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-8" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 text-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-1.5 mb-1.5">
                <Briefcase className="h-3 w-3" /> Experience
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.total_experience
                  ? `${candidate.professional_details.total_experience} years`
                  : "Fresher"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] mb-1.5">
                Current Company
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.current_company ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] mb-1.5">
                Expected CTC
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.expected_ctc
                  ? `₹${candidate.professional_details.expected_ctc} LPA`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] mb-1.5">
                Current Designation
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.current_designation ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] mb-1.5">
                Notice Period
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.notice_period ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-3 w-3" /> Location
              </div>
              <div className="font-bold text-[#1d1d1f]">
                {candidate.professional_details?.preferred_location ?? candidate.city ?? "—"}
              </div>
            </div>
          </div>

          {(candidate.documents?.length ?? 0) > 0 && (
            <>
              <div className="h-px bg-gray-100 my-8" />
              <div className="flex flex-wrap gap-2">
                {candidate.documents?.map((d) => (
                  <span key={d.document_id} className="inline-flex items-center gap-1.5 bg-[#fbfbfd] border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-[#1d1d1f]">
                    <FileText className="h-3.5 w-3.5 text-[#86868b]" />
                    {d.document_type.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Review Form */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-2">Assignment Configuration</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Domain Assignment</label>
            <div className="relative">
              <select 
                value={domain} 
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1d1d1f] transition-all outline-none appearance-none"
              >
                {domains.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Experience Bracket</label>
            <div className="relative">
              <select 
                value={experienceBracket} 
                onChange={(e) => setExperienceBracket(e.target.value)}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1d1d1f] transition-all outline-none appearance-none"
              >
                {brackets.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Total technical rounds</label>
            <input
              type="number"
              min={1}
              max={5}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1d1d1f] transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">HR decision</label>
            <div className="relative">
              <select 
                value={hrStatus} 
                onChange={(e) => setHrStatus(e.target.value as any)}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1d1d1f] transition-all outline-none appearance-none"
              >
                <option value="SELECT">Select — proceed to technical</option>
                <option value="HOLD">Hold</option>
                <option value="REJECT">Reject</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">
              First interviewer email
              {hrStatus === "SELECT" && !firstInterviewer && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="relative">
              <select 
                value={firstInterviewer} 
                onChange={(e) => setFirstInterviewer(e.target.value)}
                disabled={hrStatus !== "SELECT"}
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1d1d1f] transition-all outline-none appearance-none disabled:opacity-50"
              >
                <option value="" disabled>Select an interviewer</option>
                {users
                  .filter((u) => u.role?.role_name === "L1_PANEL")
                  .map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.first_name} {u.last_name} ({u.email})
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Scorecard */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-1">Behavioral evaluation</h2>
        <p className="text-sm font-medium text-[#86868b] mb-6">
          Rate all {HR_DIMENSIONS.length} dimensions to complete the scorecard.
        </p>
        <ScorecardEditor dimensions={HR_DIMENSIONS} scorecard={state} onUpdate={update} />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pb-8">
        <Link 
          to={`/candidates/${id}`}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button 
          onClick={() => submit.mutate()} 
          disabled={!canSubmit || submit.isPending}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          <Send className="h-4 w-4 mr-2" />
          {submit.isPending ? "Submitting..." : "Submit HR review"}
        </button>
      </div>
    </motion.div>
  );
}
