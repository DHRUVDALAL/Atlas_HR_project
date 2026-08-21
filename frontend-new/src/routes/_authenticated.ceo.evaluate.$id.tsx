import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, InterviewScore, InterviewEngineAssignment } from "@/lib/types";
import { CEO_DIMENSIONS } from "@/lib/scorecard";
import { ScorecardEditor, useScorecard } from "@/components/scorecard";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Save,
  Crown,
  User,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ceo/evaluate/$id")({
  head: () => ({ meta: [{ title: "CEO Evaluation — Atlas HR" }] }),
  component: CeoEval,
});

function CeoEval() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api<{ data: CandidateDetail }>(`/api/applicants/${id}`).then((r) => r.data),
  });

  const { data: assignment } = useQuery({
    queryKey: ["interview", "assignment", id],
    queryFn: () =>
      api<{ assignment: InterviewEngineAssignment }>(`/api/interview/assignment/${id}`).then(
        (r) => r.assignment,
      ),
    enabled: !!id,
  });

  const { data: interviewScore } = useQuery({
    queryKey: ["interview", "result", id],
    queryFn: () =>
      api<{ score: InterviewScore | null }>(`/api/interview/result/${id}`).then((r) => r.score),
    enabled: !!id,
  });

  const { data: interviewSummary } = useQuery({
    queryKey: ["interview", "summary", id],
    queryFn: () =>
      api<{ summary: { summary_json: Record<string, any> } | null }>(
        `/api/interview/summary/${id}`,
      ).then((r) => r.summary?.summary_json),
    enabled: !!id,
  });

  const { state, update, isComplete } = useScorecard(CEO_DIMENSIONS);
  const [remarks, setRemarks] = useState("");

  const submit = useMutation({
    mutationFn: (saveDraft: boolean) =>
      api(`/api/workflow/ceo/evaluate/${id}`, {
        method: "POST",
        body: {
          remarks: remarks || "No remarks provided",
          evaluation_data: state,
          save_draft: saveDraft,
        },
      }),
    onSuccess: (_, saveDraft) => {
      toast.success(saveDraft ? "Draft saved" : "CEO evaluation submitted");
      qc.invalidateQueries();
      nav({ to: saveDraft ? `/ceo/queue` : `/candidates/${id}` });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (candidateLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div className="h-10 w-40 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-12 w-64 bg-gray-100 rounded-full animate-pulse" />
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const topicScores = interviewScore?.topic_scores ?? {};
  const overallPct = interviewScore?.overall_percentage ?? 0;
  const recommendation = interviewScore?.recommendation ?? "N/A";
  const highestTopic = interviewScore?.highest_topic;
  const weakestTopic = interviewScore?.weakest_topic;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link 
          to="/ceo/queue"
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center mr-3">
            <ArrowLeft className="h-4 w-4" />
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
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Crown className="h-6 w-6 text-indigo-600" />
          </div>
          CEO Evaluation
        </h1>
        {candidate && (
          <p className="text-sm font-medium text-[#86868b] mt-2 ml-[3.75rem]">
            Executive scorecard for <span className="font-bold text-[#1d1d1f]">{candidate.application_number}</span>
          </p>
        )}
      </div>

      {/* Candidate summary card */}
      {candidate && (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-[#f5f5f7] flex items-center justify-center text-xl font-bold text-[#1d1d1f] shrink-0 border-2 border-white shadow-sm">
              {candidate.first_name[0]}
              {candidate.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-3">
                {candidate.first_name} {candidate.last_name}
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold tracking-wide text-indigo-700 uppercase">
                  CEO Round
                </span>
              </div>
              <div className="text-sm font-medium text-[#86868b] mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {candidate.position_applied_for ?? "—"}</span>
                <span>{candidate.email}</span>
                <span>{candidate.professional_details?.total_experience ?? "—"} yrs exp</span>
                {candidate.applied_from && <span>via {candidate.applied_from}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Technical Results */}
      {interviewScore ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0066cc]" />
            Technical Interview Results
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-5 bg-[#fbfbfd] rounded-2xl border border-gray-100">
              <div className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">{overallPct.toFixed(1)}<span className="text-xl text-[#86868b]">%</span></div>
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-2">Overall Score</div>
            </div>
            <div className="text-center p-5 bg-[#fbfbfd] rounded-2xl border border-gray-100">
              <div className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">{interviewScore.answered_questions}<span className="text-xl text-[#86868b]">/{interviewScore.total_questions}</span></div>
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-2">Questions Rated</div>
            </div>
            <div className="text-center p-5 bg-[#fbfbfd] rounded-2xl border border-gray-100">
              <div className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">{interviewScore.average_rating?.toFixed(1) ?? "—"}</div>
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-2">Avg Rating</div>
            </div>
            <div className="text-center p-5 bg-[#fbfbfd] rounded-2xl border border-gray-100 flex flex-col justify-center items-center">
              <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                recommendation === "Excellent" || recommendation === "Very Strong"
                  ? "bg-emerald-50 text-emerald-700"
                  : recommendation === "Needs Improvement"
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-200 text-gray-800"
              }`}>
                {recommendation}
              </span>
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-3">Recommendation</div>
            </div>
          </div>

          {assignment && (
            <div className="flex flex-wrap gap-6 p-4 bg-[#f5f5f7] rounded-xl text-sm font-medium text-[#86868b] mb-8">
              <span>Domain: <strong className="text-[#1d1d1f]">{assignment.domain_code}</strong></span>
              <span>Experience: <strong className="text-[#1d1d1f]">{assignment.experience_bracket_code}</strong></span>
            </div>
          )}

          {/* Topic breakdown */}
          {Object.keys(topicScores).length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4 text-[#86868b]" /> Topic Breakdown
              </h3>
              <div className="grid gap-4">
                {Object.entries(topicScores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([topic, score]) => (
                    <div key={topic} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1d1d1f] truncate mb-1.5">{topic}</div>
                        <div className="w-full bg-[#f5f5f7] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#0066cc] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#86868b] shrink-0 mt-6">{score.toFixed(1)}/5</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {(highestTopic || weakestTopic) && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8 border-t border-gray-100 pt-8">
              {highestTopic && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-0.5">Strongest Topic</div>
                    <div className="text-sm font-bold text-[#1d1d1f]">{highestTopic}</div>
                  </div>
                </div>
              )}
              {weakestTopic && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-0.5">Weakest Topic</div>
                    <div className="text-sm font-bold text-[#1d1d1f]">{weakestTopic}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interviewer remarks */}
          {interviewSummary?.overall_remarks && (
            <div className="border-t border-gray-100 pt-8">
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3">
                Interviewer Remarks
              </div>
              <div className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100 text-sm font-medium text-[#1d1d1f] leading-relaxed">
                {interviewSummary.overall_remarks}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-[#86868b]">No technical interview results available yet.</p>
        </div>
      )}

      {/* CEO Scorecard */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-1 flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-600" />
          Executive Scorecard
        </h2>
        <p className="text-sm font-medium text-[#86868b] mb-8">Rate each dimension on a scale of 1-5.</p>
        
        <div className="mb-8">
          <ScorecardEditor dimensions={CEO_DIMENSIONS} scorecard={state} onUpdate={update} />
        </div>

        <div className="space-y-3 pt-6 border-t border-gray-100">
          <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Executive Remarks (Required, min 5 chars)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Provide your executive assessment of this candidate…"
            rows={4}
            className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm text-[#1d1d1f] transition-all outline-none resize-none"
          />
          {remarks.length > 0 && remarks.length < 5 && (
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide pl-1">Minimum 5 characters required</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4">
        <Link 
          to="/ceo/queue"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => submit.mutate(true)}
            disabled={remarks.length < 5 || submit.isPending}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </button>
          <button
            onClick={() => submit.mutate(false)}
            disabled={!isComplete || remarks.length < 5 || submit.isPending}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            <Send className="h-4 w-4 mr-2" /> Submit Evaluation
          </button>
        </div>
      </div>
    </motion.div>
  );
}
