import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, API_BASE_URL } from "@/lib/api";
import { useOffer } from "@/lib/hooks";
import type { CandidateDetail, InterviewRound } from "@/lib/types";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Calendar,
  Building,
  GraduationCap,
  FileText,
  MapPin
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/offer/$candidateId")({
  head: () => ({
    meta: [{ title: "Offer Detail — Atlas HR" }],
  }),
  component: OfferDetail,
});

type Tab = "overview" | "offer" | "status" | "documents" | "timeline";

function OfferDetail() {
  const { candidateId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const { data: offer } = useOffer(candidateId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "offer", label: "Offer Letter", icon: FileText },
    { key: "status", label: "Status", icon: Clock },
    { key: "documents", label: "Documents", icon: FileCheck },
    { key: "timeline", label: "Timeline", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        <div className="h-10 w-48 bg-gray-100 rounded-full animate-pulse" />
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="text-xl font-bold text-[#1d1d1f]">Candidate not found</div>
          <Link 
            to="/offer/queue"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-sm font-bold hover:bg-gray-200 transition-colors mt-6"
          >
            Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <Link 
            to="/offer/queue"
            className="h-10 w-10 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <div className="text-sm font-medium text-[#86868b] mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono font-bold bg-[#f5f5f7] px-2 py-0.5 rounded-md text-[#1d1d1f]">{candidate.application_number}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {candidate.position_applied_for ?? "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 ml-[4rem] md:ml-0">
          {offer ? (
            <Link 
              to="/offer/preview/$candidateId" params={{ candidateId }}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
            >
              <FileCheck className="h-4 w-4 mr-2" /> View Offer
            </Link>
          ) : (
            <Link 
              to="/offer/builder/$candidateId" params={{ candidateId }}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
            >
              <FileCheck className="h-4 w-4 mr-2" /> Build Offer
            </Link>
          )}
        </div>
      </div>

      {/* Custom Apple-style Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#f5f5f7] rounded-full w-fit scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key 
                  ? "bg-white text-[#1d1d1f] shadow-sm" 
                  : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-200/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <User className="h-4 w-4 text-[#86868b]" />
                  </div>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Full Name" value={`${candidate.first_name} ${candidate.last_name}`} />
                  <InfoRow label="Email" value={candidate.email} />
                  <InfoRow label="Phone" value={candidate.phone} />
                  {candidate.gender && <InfoRow label="Gender" value={candidate.gender} />}
                  {candidate.city && <InfoRow label="Location" value={`${candidate.city}, ${candidate.state}`} />}
                  {candidate.applied_from && <InfoRow label="Applied From" value={candidate.applied_from} />}
                  {candidate.applied_from === "REFERRAL" && candidate.source_name && (
                    <InfoRow label="Referred By" value={candidate.source_name} />
                  )}
                  {candidate.applied_from === "VENDOR" && candidate.source_name && (
                    <InfoRow label="Vendor Name" value={candidate.source_name} />
                  )}
                </div>
              </div>

              {/* Professional Info */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-[#86868b]" />
                  </div>
                  Professional Details
                </h3>
                <div className="space-y-4">
                  {candidate.professional_details?.current_company && (
                    <InfoRow label="Current Company" value={candidate.professional_details.current_company} />
                  )}
                  {candidate.professional_details?.current_designation && (
                    <InfoRow label="Current Designation" value={candidate.professional_details.current_designation} />
                  )}
                  {candidate.professional_details?.total_experience && (
                    <InfoRow label="Total Experience" value={`${candidate.professional_details.total_experience} years`} />
                  )}
                  {candidate.professional_details?.current_ctc && (
                    <InfoRow label="Current CTC" value={`₹${candidate.professional_details.current_ctc} LPA`} />
                  )}
                  {candidate.professional_details?.expected_ctc && (
                    <InfoRow label="Expected CTC" value={`₹${candidate.professional_details.expected_ctc} LPA`} />
                  )}
                  {candidate.professional_details?.notice_period && (
                    <InfoRow label="Notice Period" value={candidate.professional_details.notice_period} />
                  )}
                </div>
              </div>

              {/* Offer Summary */}
              {offer && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-2">
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <FileCheck className="h-4 w-4 text-[#86868b]" />
                    </div>
                    Offer Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1">Offered CTC</div>
                      <div className="text-xl font-bold text-[#1d1d1f]">
                        {offer.offered_ctc ? `₹${offer.offered_ctc} LPA` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1">Joining Date</div>
                      <div className="text-xl font-bold text-[#1d1d1f]">
                        {offer.joining_date ? formatDate(offer.joining_date) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1">Approved By</div>
                      <div className="text-lg font-medium text-[#1d1d1f]">{offer.approved_by ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-2">Status</div>
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
                          offer.status === "ACCEPTED"
                            ? "bg-emerald-50 text-emerald-700"
                            : offer.status === "SENT"
                              ? "bg-[#0066cc]/10 text-[#0066cc]"
                              : offer.status === "DECLINED"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {offer.status === "ACCEPTED"
                          ? "Accepted"
                          : offer.status === "SENT"
                            ? "Sent"
                            : offer.status === "DECLINED"
                              ? "Declined"
                              : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "offer" && (
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {offer ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
                    <FileCheck className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f] mb-2">Offer Letter Ready</div>
                  <p className="text-sm font-medium text-[#86868b] mb-8 max-w-md mx-auto">
                    View the full offer letter in the preview page to review or send to the candidate.
                  </p>
                  <Link 
                    to="/offer/preview/$candidateId" params={{ candidateId }}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
                  >
                    View Offer Letter
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
                    <FileCheck className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f] mb-2">No offer created</div>
                  <p className="text-sm font-medium text-[#86868b] mb-8 max-w-md mx-auto">
                    Build an offer to generate the offer letter for this candidate.
                  </p>
                  <Link 
                    to="/offer/builder/$candidateId" params={{ candidateId }}
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
                  >
                    Build Offer
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "status" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {!offer ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
                    <Clock className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f] mb-2">No offer status</div>
                  <p className="text-sm font-medium text-[#86868b]">
                    Build an offer to start tracking status.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <Clock className="h-4 w-4 text-[#86868b]" />
                    </div>
                    Status Tracker
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    <div className="hidden md:block absolute top-10 left-10 right-10 h-0.5 bg-gray-100 z-0" />
                    
                    <div className="text-center relative z-10">
                      <div className="w-20 h-20 mx-auto rounded-full bg-white border-[4px] border-emerald-500 flex items-center justify-center mb-4 shadow-sm">
                        <FileCheck className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div className="text-base font-bold text-[#1d1d1f] mb-1">Draft Created</div>
                      <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Completed</div>
                    </div>
                    
                    <div className="text-center relative z-10">
                      <div className={`w-20 h-20 mx-auto rounded-full bg-white border-[4px] flex items-center justify-center mb-4 shadow-sm transition-colors duration-500 ${
                        offer.status === "SENT" || offer.status === "ACCEPTED" || offer.status === "DECLINED"
                          ? "border-[#0066cc]" 
                          : "border-gray-200"
                      }`}>
                        <Send className={`h-8 w-8 ${offer.status === "SENT" || offer.status === "ACCEPTED" || offer.status === "DECLINED" ? "text-[#0066cc]" : "text-gray-300"}`} />
                      </div>
                      <div className="text-base font-bold text-[#1d1d1f] mb-1">Offer Sent</div>
                      {offer.sent_at ? (
                        <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">{formatDate(offer.sent_at)}</div>
                      ) : (
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</div>
                      )}
                    </div>
                    
                    <div className="text-center relative z-10">
                      <div className={`w-20 h-20 mx-auto rounded-full bg-white border-[4px] flex items-center justify-center mb-4 shadow-sm transition-colors duration-500 ${
                        offer.status === "ACCEPTED" 
                          ? "border-emerald-500" 
                          : offer.status === "DECLINED" 
                            ? "border-red-500"
                            : "border-gray-200"
                      }`}>
                        {offer.status === "DECLINED" ? (
                          <XCircle className={`h-8 w-8 ${offer.status === "DECLINED" ? "text-red-500" : "text-gray-300"}`} />
                        ) : (
                          <CheckCircle className={`h-8 w-8 ${offer.status === "ACCEPTED" ? "text-emerald-500" : "text-gray-300"}`} />
                        )}
                      </div>
                      <div className="text-base font-bold text-[#1d1d1f] mb-1">
                        {offer.status === "DECLINED" ? "Offer Declined" : "Offer Accepted"}
                      </div>
                      {offer.responded_at ? (
                        <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                          {formatDate(offer.responded_at)}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Response</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {candidate.documents && candidate.documents.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <FileCheck className="h-4 w-4 text-[#86868b]" />
                    </div>
                    Candidate Documents
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {candidate.documents.map((doc) => (
                      <div
                        key={doc.document_id}
                        className="flex items-center gap-4 p-5 rounded-[2rem] border border-gray-100 hover:border-gray-200 transition-colors bg-[#fbfbfd]"
                      >
                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-[#86868b]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#1d1d1f] truncate mb-0.5">{doc.file_name}</div>
                          <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">{doc.document_type}</div>
                        </div>
                        <a
                          href={`${API_BASE_URL}/api/documents/${doc.document_id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f] mb-2">No documents</div>
                  <p className="text-sm font-medium text-[#86868b]">
                    No documents uploaded for this candidate.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {candidate.interview_rounds && candidate.interview_rounds.length > 0 ? (
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#86868b]" />
                    </div>
                    Interview Timeline
                  </h3>
                  <div className="relative">
                    <div className="absolute left-6 top-6 bottom-6 w-px bg-gray-100" />
                    <div className="space-y-8">
                      {candidate.interview_rounds.map((round, i) => (
                        <div key={round.round_id} className="relative flex items-start gap-6">
                          <div
                            className={`relative z-10 h-12 w-12 rounded-full grid place-items-center border-[4px] shadow-sm shrink-0 ${
                              round.status === "COMPLETED"
                                ? "bg-white border-[#1d1d1f] text-[#1d1d1f]"
                                : "bg-white border-gray-200 text-gray-400"
                            }`}
                          >
                            {round.status === "COMPLETED" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 bg-[#fbfbfd] p-6 rounded-[2rem] border border-gray-50">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-[#1d1d1f]">Round {round.round_number}</h3>
                              <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                                {round.round_type}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                  round.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {round.status}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-[#1d1d1f] mb-1">
                              <span className="text-[#86868b] mr-1">Interviewer:</span> {round.interviewer_email}
                            </div>
                            {round.completed_at && (
                              <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                                Completed {formatDate(round.completed_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-[#86868b]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f] mb-2">No interview rounds</div>
                  <p className="text-sm font-medium text-[#86868b]">
                    Interview timeline will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-50 last:border-0 gap-1 sm:gap-4">
      <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm font-bold text-[#1d1d1f] text-left sm:text-right">{value}</span>
    </div>
  );
}
