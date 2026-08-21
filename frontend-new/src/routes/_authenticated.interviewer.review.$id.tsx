import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, API_BASE_URL } from "@/lib/api";
import type { CandidateDetail } from "@/lib/types";
import { statusMeta } from "@/lib/scorecard";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Download,
  ExternalLink,
  ClipboardCheck,
  Clock,
  Star,
  FolderOpen
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/interviewer/review/$id")({
  head: () => ({ meta: [{ title: "Candidate Review — Atlas HR" }] }),
  component: InterviewerReview,
});

function InterviewerReview() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<string>("profile");

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api<{ data: CandidateDetail }>(`/api/applicants/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="h-8 w-64 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="h-12 w-full bg-gray-100 rounded-full animate-pulse" />
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] grid sm:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-5 w-40 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-8 text-center text-sm font-bold text-[#86868b]">Not found</div>;

  const s = statusMeta(data.status);

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "rounds", label: `Rounds (${data.interview_rounds?.length ?? 0})` },
    { id: "documents", label: `Documents (${data.documents?.length ?? 0})` },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between gap-4">
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
        </div>
        <Link 
          to={`/interviewer/evaluate/${id}`}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
        >
          <ClipboardCheck className="h-4 w-4 mr-2" /> Start Evaluation
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="h-16 w-16 rounded-full bg-[#f5f5f7] flex items-center justify-center text-xl font-bold text-[#1d1d1f] shrink-0 border-2 border-white shadow-sm">
                {data.first_name[0]}{data.last_name[0]}
             </div>
             <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                    {data.first_name} {data.last_name}
                  </h1>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${s.className.replace('border-transparent', '')}`}>
                    {s.label}
                  </span>
                </div>
                <div className="text-sm font-medium text-[#86868b] mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-mono font-bold bg-[#f5f5f7] px-2 py-0.5 rounded-md text-[#1d1d1f]">{data.application_number}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {data.position_applied_for ?? "—"}</span>
                  <span>{data.email}</span>
                  <span>{data.phone}</span>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              to={`/interviewer/evaluate/${id}`}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" /> Submit Evaluation
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Apple-style Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#f5f5f7] rounded-full w-fit scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-white text-[#1d1d1f] shadow-sm" 
                : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <Field label="Gender" value={data.gender} icon={<User className="h-4 w-4" />} />
              <Field
                label="Date of birth"
                value={data.date_of_birth}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field
                label="Address"
                value={[data.current_address, data.city, data.state, data.pincode]
                  .filter(Boolean)
                  .join(", ")}
                icon={<MapPin className="h-4 w-4" />}
              />
              <Field label="Country" value={data.country} icon={<MapPin className="h-4 w-4" />} />
              {data.applied_from && <Field label="Applied From" value={data.applied_from} icon={<Briefcase className="h-4 w-4" />} />}
              {data.applied_from === "REFERRAL" && data.source_name && <Field label="Referred By" value={data.source_name} icon={<User className="h-4 w-4" />} />}
              {data.applied_from === "VENDOR" && data.source_name && <Field label="Vendor Name" value={data.source_name} icon={<Briefcase className="h-4 w-4" />} />}
              <div className="sm:col-span-2 h-px bg-gray-100 my-2" />
              <Field
                label="Total experience"
                value={
                  data.professional_details?.total_experience
                    ? `${data.professional_details.total_experience} yrs`
                    : "—"
                }
                icon={<Clock className="h-4 w-4" />}
              />
              <Field
                label="Relevant experience"
                value={
                  data.professional_details?.relevant_experience
                    ? `${data.professional_details.relevant_experience} yrs`
                    : "—"
                }
                icon={<Clock className="h-4 w-4" />}
              />
              <Field label="Current company" value={data.professional_details?.current_company} icon={<Briefcase className="h-4 w-4" />} />
              <Field
                label="Current designation"
                value={data.professional_details?.current_designation}
                icon={<Briefcase className="h-4 w-4" />}
              />
              <Field
                label="Current CTC"
                value={
                  data.professional_details?.current_ctc
                    ? `₹${data.professional_details.current_ctc} LPA`
                    : "—"
                }
                icon={<Briefcase className="h-4 w-4" />}
              />
              <Field
                label="Expected CTC"
                value={
                  data.professional_details?.expected_ctc
                    ? `₹${data.professional_details.expected_ctc} LPA`
                    : "—"
                }
                icon={<Briefcase className="h-4 w-4" />}
              />
              <Field label="Notice period" value={data.professional_details?.notice_period} icon={<Calendar className="h-4 w-4" />} />
              <Field
                label="Preferred location"
                value={data.professional_details?.preferred_location}
                icon={<MapPin className="h-4 w-4" />}
              />
              <Field
                label="Joining availability"
                value={data.professional_details?.joining_availability}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Field label="Employment type" value={data.professional_details?.employment_type} icon={<Briefcase className="h-4 w-4" />} />
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4">
              {(data.employment_history ?? []).length === 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center text-sm font-bold text-[#86868b]">No history captured.</div>
              )}
              {(data.employment_history ?? []).map((h, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
                    <div className="font-bold text-[#1d1d1f] text-lg">
                      {h.designation} <span className="text-[#86868b] font-medium px-2">at</span> {h.company_name}
                    </div>
                    <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider bg-[#f5f5f7] px-3 py-1 rounded-full">
                      {h.start_date} — {h.end_date || "Present"}
                    </div>
                  </div>
                  {h.responsibilities && (
                    <p className="text-sm font-medium text-[#1d1d1f] leading-relaxed mt-4 bg-[#fbfbfd] p-4 rounded-2xl border border-gray-50">{h.responsibilities}</p>
                  )}
                  {h.reason_for_leaving && (
                    <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-4">
                      Reason for leaving: <span className="text-[#1d1d1f] normal-case tracking-normal text-sm font-medium">{h.reason_for_leaving}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4">
              {(data.education ?? []).length === 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center text-sm font-bold text-[#86868b]">No education captured.</div>
              )}
              {(data.education ?? []).map((e, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field
                    label="Qualification"
                    value={e.qualification}
                    icon={<GraduationCap className="h-4 w-4" />}
                  />
                  <Field label="Specialization" value={e.specialization} icon={<GraduationCap className="h-4 w-4" />} />
                  <Field label="Institution" value={e.institution_name} icon={<Briefcase className="h-4 w-4" />} />
                  <Field label="University" value={e.university} icon={<GraduationCap className="h-4 w-4" />} />
                  <Field label="Passing year" value={e.passing_year?.toString()} icon={<Calendar className="h-4 w-4" />} />
                  <Field label="Score" value={e.percentage ? `${e.percentage}%` : e.grade} icon={<Star className="h-4 w-4" />} />
                </div>
              ))}
            </div>
          )}

          {activeTab === "rounds" && (
            <div className="space-y-4">
              {(data.interview_rounds ?? []).length === 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center text-sm font-bold text-[#86868b]">No rounds recorded yet.</div>
              )}
              {(data.interview_rounds ?? []).map((r) => (
                <div key={r.round_id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                    <div className="font-bold text-lg text-[#1d1d1f]">
                      {r.round_type.replace(/_/g, " ")} <span className="text-[#86868b] font-medium px-1">·</span> Round {r.round_number}
                    </div>
                    <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-6 pb-4 border-b border-gray-50">
                    <span>{r.interviewer_email}</span>
                    {r.completed_at && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>Completed {new Date(r.completed_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {r.evaluation_data && (
                    <div className="space-y-4">
                      {Object.entries(r.evaluation_data).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-sm font-medium text-[#1d1d1f]">{k}</div>
                            {v.remarks && (
                              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wide mt-1">{v.remarks}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#fbfbfd] px-3 py-1 rounded-full border border-gray-100 shrink-0">
                            <Star className="h-3.5 w-3.5 text-[#0066cc] fill-[#0066cc]" />
                            <span className="font-mono text-sm font-bold text-[#1d1d1f]">{v.rating}<span className="text-[#86868b]">/5</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              {(data.documents ?? []).length === 0 && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center text-sm font-bold text-[#86868b]">No documents uploaded.</div>
              )}
              {(data.documents ?? []).map((d) => {
                const fileUrl = `${API_BASE_URL}${d.file_path.startsWith("/") ? "" : "/"}${d.file_path}`;
                const isPdf = d.file_name?.toLowerCase().endsWith(".pdf");
                return (
                  <div key={d.document_id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-[#86868b]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1d1d1f]">{d.document_type.replace(/_/g, " ")}</div>
                        <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">{d.file_name}</div>
                      </div>
                      <div className="flex gap-2">
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-xs font-bold hover:bg-gray-200 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                        </a>
                        <a href={fileUrl} download={d.file_name} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200 transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    {isPdf && (
                      <div className="mt-6 border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                        <iframe src={fileUrl} className="w-full h-80 bg-[#f5f5f7]" title={d.file_name} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "timeline" && (
            <TimelineTab candidateId={id} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function TimelineTab({ candidateId }: { candidateId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-timeline", candidateId],
    queryFn: () =>
      api<{
        activities: Array<{
          activity_id: string;
          activity_type: string;
          description: string;
          performed_by: string;
          created_at: string;
        }>;
      }>(`/api/workflow/candidate/${candidateId}/timeline`).then((r) => r.activities ?? []),
  });

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="h-3 w-3 bg-gray-200 rounded-full mt-1.5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-32 bg-gray-50 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activities = data ?? [];

  if (activities.length === 0) {
    return <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-center text-sm font-bold text-[#86868b]">No timeline events recorded.</div>;
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative">
      <div className="absolute left-[2.35rem] top-8 bottom-8 w-px bg-gray-100" />
      <div className="space-y-8 relative z-10">
        {activities.map((a, i) => (
          <div key={a.activity_id} className="flex gap-6">
            <div className="h-4 w-4 rounded-full bg-white border-[3px] border-[#1d1d1f] shrink-0 mt-1 shadow-sm" />
            <div className="flex-1 min-w-0 bg-[#fbfbfd] p-4 rounded-2xl border border-gray-50">
              <div className="text-sm font-bold text-[#1d1d1f]">{a.description}</div>
              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-2 flex items-center gap-2">
                <span>{a.performed_by}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{new Date(a.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
