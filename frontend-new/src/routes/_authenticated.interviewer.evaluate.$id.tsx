import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, TopicGroup, TechnicalQuestion, InterviewEngineAssignment } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  ClipboardCheck,
  User,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  PauseCircle,
  XCircle
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/interviewer/evaluate/$id")({
  head: () => ({ meta: [{ title: "Technical Evaluation — Atlas HR" }] }),
  component: TechEval,
});

function TechEval() {
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

  const domainCode = assignment?.domain_code || candidate?.domain || "";
  const bracketCode = assignment?.experience_bracket_code || "";

  const { data: topicGroups, isLoading: topicsLoading } = useQuery({
    queryKey: ["interview", "questions", domainCode, bracketCode],
    queryFn: () =>
      api<{ groups: TopicGroup[] }>(
        `/api/interview/questions?domain=${domainCode}&experience=${bracketCode}&grouped=true`,
      ).then((r) => r.groups ?? []),
    enabled: !!domainCode && !!bracketCode,
  });

  const completedTech = (candidate?.interview_rounds ?? []).filter(
    (r) => r.round_type === "TECHNICAL",
  ).length;
  const nextRound = completedTech + 1;

  const [status, setStatus] = useState<"COMPLETED" | "REJECTED" | "HOLD">("COMPLETED");
  const [remarks, setRemarks] = useState("");
  const [nextInterviewer, setNextInterviewer] = useState("");
  const [roundNumber, setRoundNumber] = useState(nextRound);

  const [responses, setResponses] = useState<
    Record<string, { rating: number | null; comment: string }>
  >({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved progress
  const { data: savedProgress } = useQuery({
    queryKey: ["interview", "auto-save", id],
    queryFn: () =>
      api<{ responses: Array<{ topic_id: string; rating: number | null; comment: string | null }>; is_submitted: boolean }>(
        `/api/interview/auto-save/${id}`,
      ).then((r) => r),
    enabled: !!id,
  });

  // Initialize responses from saved progress or defaults
  useEffect(() => {
    if (topicGroups && topicGroups.length > 0) {
      const initial: Record<string, { rating: number | null; comment: string }> = {};
      topicGroups.forEach((group) => {
        group.questions.forEach((q) => {
          initial[q.id] = { rating: null, comment: "" };
        });
      });

      if (savedProgress?.responses) {
        savedProgress.responses.forEach((r) => {
          if (initial[r.topic_id]) {
            initial[r.topic_id] = {
              rating: r.rating ?? null,
              comment: r.comment ?? "",
            };
          }
        });
      }

      setResponses(initial);
    }
  }, [topicGroups, savedProgress]);

  // Initialize expanded state — all categories expanded by default
  useEffect(() => {
    if (topicGroups) {
      const expanded: Record<string, boolean> = {};
      topicGroups.forEach((g) => {
        expanded[g.topic_category] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [topicGroups]);

  // Auto-save (debounced 2s)
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (!assignment) return;
      const responseList = Object.entries(responses).map(([topicId, data]) => ({
        topic_id: topicId,
        rating: data.rating || null,
        comment: data.comment,
      }));
      api(`/api/interview/auto-save/${id}`, {
        method: "POST",
        body: { responses: responseList },
      }).catch(() => {});
    }, 2000);
  }, [responses, assignment, id]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [responses, triggerAutoSave]);

  const updateRating = (topicId: string, rating: number) => {
    setResponses((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], rating },
    }));
  };

  const updateComment = (topicId: string, comment: string) => {
    setResponses((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], comment },
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const RATING_OPTIONS = [
    { value: 5, label: "Good" },
    { value: 4, label: "OK" },
    { value: 3, label: "Basic" },
    { value: 2, label: "Has Knowledge (Not Worked)" },
    { value: 1, label: "Not Worked" },
    { value: 0, label: "Bad" },
  ];

  // Validation
  const allQuestions = topicGroups?.flatMap((g) => g.questions) ?? [];
  const totalQuestions = allQuestions.length;
  const answeredQuestions = allQuestions.filter(
    (q) => responses[q.id]?.rating !== undefined && responses[q.id]?.rating !== null,
  ).length;
  const allRated = totalQuestions > 0 && answeredQuestions === totalQuestions;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const submit = useMutation({
    mutationFn: async () => {
      const responseList = Object.entries(responses).map(([topicId, data]) => ({
        topic_id: topicId,
        rating: data.rating !== null && data.rating !== undefined ? data.rating : null,
        comment: data.comment,
      }));
      
      // Submit to interview engine (now handles workflow internally)
      const interviewResult = await api(`/api/interview/submit/${id}`, {
        method: "POST",
        body: {
          responses: responseList,
          overall_remarks: remarks,
          status_selection: status,
          round_number: roundNumber,
          next_interviewer_email: status === "COMPLETED" ? nextInterviewer : null,
        },
      });

      return interviewResult;
    },
    onSuccess: () => {
      toast.success("Interview submitted successfully");
      qc.invalidateQueries();
      nav({ to: `/candidates/${id}` });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to submit"),
  });

  if (candidateLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link 
          to="/interviewer/queue"
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center mr-3">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to queue
        </Link>
        <span className="text-[#86868b] font-bold">/</span>
        <Link 
          to={`/interviewer/review/${id}`}
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-[#f5f5f7] px-4 py-1.5 rounded-full"
        >
          <User className="h-3.5 w-3.5 mr-1.5" /> View profile
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f] flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-6 w-6 text-[#0066cc]" />
          </div>
          Technical Evaluation
        </h1>
        {candidate && (
          <p className="text-sm font-medium text-[#86868b] mt-2 ml-[3.75rem]">
            Round {roundNumber} · <span className="font-mono font-bold bg-[#f5f5f7] px-2 py-0.5 rounded-md text-[#1d1d1f]">{candidate.application_number}</span>
          </p>
        )}
      </div>

      {/* Candidate summary card */}
      {candidate && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-[#f5f5f7] flex items-center justify-center text-xl font-bold text-[#1d1d1f] shrink-0 border-2 border-white shadow-sm">
              {candidate.first_name[0]}
              {candidate.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-1">
                {candidate.first_name} {candidate.last_name}
              </div>
              <div className="text-sm font-medium text-[#86868b] flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {candidate.position_applied_for ?? "—"}</span>
                <span>{candidate.email}</span>
                <span>{candidate.professional_details?.total_experience ?? "—"} yrs exp</span>
                {candidate.applied_from && <span>via {candidate.applied_from}</span>}
              </div>
            </div>
            <div className="md:text-right flex md:flex-col gap-6 md:gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 mt-4 md:mt-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Domain</div>
                <div className="font-bold text-[#1d1d1f]">{domainCode || "—"}</div>
              </div>
              {bracketCode && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Experience</div>
                  <div className="font-bold text-[#1d1d1f]">{bracketCode}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Round & Decision */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-2">Round Conclusion</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Round number</label>
            <input
              type="number"
              min={1}
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value))}
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1d1d1f] transition-all outline-none"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setStatus("COMPLETED")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  status === "COMPLETED" 
                    ? "border-[#0066cc] bg-[#0066cc]/5 text-[#0066cc] shadow-sm" 
                    : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 mb-1.5 ${status === "COMPLETED" ? "text-[#0066cc]" : ""}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Select</span>
              </button>
              <button
                onClick={() => setStatus("HOLD")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  status === "HOLD" 
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm" 
                    : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                }`}
              >
                <PauseCircle className={`w-5 h-5 mb-1.5 ${status === "HOLD" ? "text-amber-500" : ""}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Hold</span>
              </button>
              <button
                onClick={() => setStatus("REJECTED")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  status === "REJECTED" 
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm" 
                    : "border-transparent bg-[#f5f5f7] text-[#86868b] hover:bg-gray-200"
                }`}
              >
                <XCircle className={`w-5 h-5 mb-1.5 ${status === "REJECTED" ? "text-red-500" : ""}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Reject</span>
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {status === "COMPLETED" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 sm:col-span-2 overflow-hidden"
              >
                <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Next interviewer email (optional routing)</label>
                <input
                  type="email"
                  value={nextInterviewer}
                  onChange={(e) => setNextInterviewer(e.target.value)}
                  placeholder="panel2@atlas.com"
                  className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1d1d1f] transition-all outline-none placeholder:font-medium placeholder:text-gray-400"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">Overall remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Summary of the interview round…"
              rows={3}
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {totalQuestions > 0 && (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#1d1d1f]">Evaluation Progress</span>
            <span className="text-sm font-mono font-bold text-[#86868b]">
              {answeredQuestions} / {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-[#f5f5f7] rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#0066cc]'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {!allRated && answeredQuestions > 0 && (
            <p className="text-xs font-bold text-amber-600 mt-4 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg w-fit">
              <AlertCircle className="h-4 w-4" />
              All questions must be rated before submitting
            </p>
          )}
          {allRated && (
             <p className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg w-fit">
               <CheckCircle2 className="h-4 w-4" />
               All questions evaluated. Ready to submit.
             </p>
          )}
        </div>
      )}

      {/* Domain-specific questions by category */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6 flex items-center gap-2">
          Interview Questions
        </h2>

        {topicsLoading ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-8 w-full bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-16 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : topicGroups && topicGroups.length > 0 ? (
          <div className="space-y-6">
            {topicGroups.map((group) => {
              const isExpanded = expandedCategories[group.topic_category] !== false;
              const groupAnswered = group.questions.filter(
                (q) => responses[q.id]?.rating !== undefined && responses[q.id]?.rating !== null,
              ).length;
              const isGroupComplete = groupAnswered === group.questions.length;

              return (
                <div key={group.topic_category} className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300">
                  {/* Collapsible header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.topic_category)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-transparent text-[#86868b]'}`}>
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                      </div>
                      <div>
                        <div className="font-bold text-[#1d1d1f]">{group.topic_category}</div>
                        <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-0.5">
                          {group.questions.length} questions
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold font-mono tracking-wide ${
                      isGroupComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f5f5f7] text-[#86868b]'
                    }`}>
                      {groupAnswered}/{group.questions.length}
                    </span>
                  </button>

                  {/* Questions */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-gray-100 border-t border-gray-100 px-6">
                          {group.questions.map((question, qIdx) => {
                            const r = responses[question.id] ?? { rating: null, comment: "" };
                            return (
                              <div key={question.id} className="py-6 space-y-4">
                                {/* Question header */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold font-mono text-[#0066cc] bg-[#0066cc]/10">
                                      {question.question_id_code}
                                    </span>
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[#86868b] bg-[#f5f5f7]">
                                      {question.module_code}
                                    </span>
                                  </div>
                                  <div className="text-base font-bold text-[#1d1d1f] leading-snug">
                                    {question.question_topic}
                                  </div>
                                </div>

                                {/* Rating buttons */}
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                                    Rating
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {RATING_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => updateRating(question.id, opt.value)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                          r.rating === opt.value
                                            ? "bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-sm"
                                            : "bg-[#f5f5f7] text-[#86868b] border-transparent hover:bg-gray-200"
                                        }`}
                                      >
                                        {opt.value} - {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Comment */}
                                <div className="pt-2">
                                  <textarea
                                    value={r.comment}
                                    onChange={(e) => updateComment(question.id, e.target.value)}
                                    placeholder="Optional comment on this question…"
                                    rows={2}
                                    className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl p-4 text-sm font-medium text-[#1d1d1f] transition-all outline-none resize-none placeholder:text-gray-400"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center">
            <p className="text-sm font-bold text-[#86868b]">No interview questions are available for the selected Domain and Experience Bracket.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pb-8">
        <Link 
          to={`/interviewer/queue`}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={() => submit.mutate()}
          disabled={!allRated || submit.isPending}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          <Send className="h-4 w-4 mr-2" />
          {submit.isPending ? "Submitting..." : "Submit evaluation"}
        </button>
      </div>
    </motion.div>
  );
}
