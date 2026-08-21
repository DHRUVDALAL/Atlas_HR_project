import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useOffer } from "@/lib/hooks";
import type { CandidateDetail } from "@/lib/types";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileCheck,
  User,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/offer/status/$candidateId")({
  head: () => ({
    meta: [{ title: "Offer Status — Atlas HR" }],
  }),
  component: OfferStatus,
});

function OfferStatus() {
  const { candidateId } = Route.useParams();

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const { data: offer, isLoading: offerLoading } = useOffer(candidateId);

  const isLoading = candidateLoading || offerLoading;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusSteps = [
    { key: "draft", label: "Draft Created", icon: FileCheck },
    { key: "sent", label: "Offer Sent", icon: Send },
    { key: "accepted", label: "Offer Accepted", icon: CheckCircle },
  ];

  const currentStepIndex = offer ? statusSteps.findIndex((s) => s.key === offer.status) : -1;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
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
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
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
      className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            to="/offer/queue"
            className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Offer Status</h1>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              Track the offer lifecycle for this candidate
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Summary */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-white rounded-bl-full -z-10 opacity-50" />
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-[#f5f5f7] text-[#1d1d1f] grid place-items-center font-bold text-2xl shrink-0">
            {candidate.first_name[0]}
            {candidate.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-[#1d1d1f] truncate">
                {candidate.first_name} {candidate.last_name}
              </h2>
              <span className="font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">
                {candidate.application_number}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#86868b]">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {candidate.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {candidate.phone}
              </span>
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {candidate.position_applied_for ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <h3 className="text-xl font-bold text-[#1d1d1f] mb-10 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <Clock className="h-4 w-4 text-[#86868b]" />
          </div>
          Status Timeline
        </h3>

        {!offer ? (
          <div className="text-center py-12 bg-[#fbfbfd] rounded-[2rem] border border-gray-50">
            <div className="w-20 h-20 mx-auto rounded-full bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
              <FileCheck className="h-10 w-10 text-[#86868b]" />
            </div>
            <div className="text-2xl font-bold text-[#1d1d1f] mb-2">No offer created</div>
            <p className="text-sm font-medium text-[#86868b] mb-8">
              Build an offer to start tracking its status here.
            </p>
            <Link 
              to="/offer/builder/$candidateId" params={{ candidateId }}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98]"
            >
              Build Offer
            </Link>
          </div>
        ) : (
          <div className="relative max-w-2xl mx-auto">
            {/* Vertical timeline line */}
            <div className="absolute left-[2.25rem] top-6 bottom-6 w-0.5 bg-gray-100" />

            <div className="space-y-12">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex || (offer.status === "DECLINED" && index === 0);
                const isCurrent = index === currentStepIndex;
                const isDeclined = offer.status === "DECLINED" && index === 1;

                return (
                  <div key={step.key} className="relative flex items-start gap-8">
                    <div
                      className={`relative z-10 h-[4.5rem] w-[4.5rem] rounded-full grid place-items-center border-[4px] shadow-sm shrink-0 transition-colors duration-500 bg-white ${
                        isDeclined
                          ? "border-red-500 text-red-500"
                          : isCompleted
                            ? step.key === "accepted" ? "border-emerald-500 text-emerald-500" : "border-[#1d1d1f] text-[#1d1d1f]"
                            : "border-gray-200 text-gray-300"
                      }`}
                    >
                      {isDeclined ? <XCircle className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
                    </div>

                    <div className="flex-1 pt-2 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4
                          className={`text-xl font-bold ${
                            isCompleted ? "text-[#1d1d1f]" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </h4>
                        
                        {isCurrent && !isDeclined && (
                          <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-[#1d1d1f]">
                            Current Stage
                          </span>
                        )}
                        {isDeclined && (
                          <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700">
                            Offer Declined
                          </span>
                        )}
                      </div>

                      {step.key === "draft" && (
                        <p className={`text-sm font-medium mt-1 ${isCompleted ? "text-[#86868b]" : "text-gray-400"}`}>
                          Offer draft has been generated and saved.
                        </p>
                      )}
                      {step.key === "sent" && offer.sent_at && (
                        <p className={`text-sm font-medium mt-1 ${isCompleted ? "text-[#86868b]" : "text-gray-400"}`}>
                          Offer was officially sent to the candidate on <span className="font-bold text-[#1d1d1f]">{formatDate(offer.sent_at)}</span>.
                        </p>
                      )}
                      {step.key === "accepted" && offer.responded_at && offer.status === "ACCEPTED" && (
                        <p className={`text-sm font-medium mt-1 ${isCompleted ? "text-[#86868b]" : "text-gray-400"}`}>
                          Candidate officially accepted the offer on <span className="font-bold text-[#1d1d1f]">{formatDate(offer.responded_at)}</span>.
                        </p>
                      )}
                      
                      {isDeclined && offer.responded_at && (
                        <p className="text-sm font-medium mt-1 text-red-600/80">
                          Candidate declined the offer on <span className="font-bold text-red-600">{formatDate(offer.responded_at)}</span>.
                        </p>
                      )}

                      {step.key === "draft" && offer.offered_ctc && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold bg-[#f5f5f7] text-[#1d1d1f]">
                            CTC: ₹{offer.offered_ctc} LPA
                          </span>
                          {offer.joining_date && (
                            <span className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold bg-[#f5f5f7] text-[#1d1d1f]">
                              Joining: {offer.joining_date}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Offer History */}
      {offer && offer.history.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
              <Clock className="h-4 w-4 text-[#86868b]" />
            </div>
            Activity History
          </h3>
          <div className="space-y-2">
            {offer.history
              .slice()
              .reverse()
              .map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-[#fbfbfd] transition-colors border border-transparent hover:border-gray-50"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    entry.action === "offer_accepted" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : entry.action === "offer_declined"
                        ? "bg-red-50 text-red-600"
                        : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}>
                    {entry.action === "offer_sent"
                      ? "S"
                      : entry.action === "offer_accepted"
                        ? "A"
                        : entry.action === "offer_declined"
                          ? "D"
                          : "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1d1d1f]">
                      {entry.action === "draft_saved"
                        ? "Draft Saved"
                        : entry.action === "offer_submitted"
                          ? "Offer Submitted"
                          : entry.action === "offer_sent"
                            ? "Offer Sent"
                            : entry.action === "offer_accepted"
                              ? "Offer Accepted"
                              : entry.action === "offer_declined"
                                ? "Offer Declined"
                                : entry.action}
                    </div>
                    {entry.details && (
                      <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">{entry.details}</div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider whitespace-nowrap">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {offer && (
        <div className="flex flex-wrap gap-3">
          <Link 
            to="/offer/preview/$candidateId" params={{ candidateId }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <FileCheck className="h-4 w-4 mr-2" /> View Offer Letter
          </Link>
          <Link 
            to="/offer/builder/$candidateId" params={{ candidateId }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <FileCheck className="h-4 w-4 mr-2" /> Edit Offer
          </Link>
          <Link 
            to="/candidates/$id" params={{ id: candidateId }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-gray-200 text-[#1d1d1f] text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <User className="h-4 w-4 mr-2" /> View Profile
          </Link>
        </div>
      )}
    </motion.div>
  );
}
