import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useOffer, useSendOffer, useAcceptOffer, useDeclineOffer } from "@/lib/hooks";
import type { CandidateDetail } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Send,
  Download,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/offer/preview/$candidateId")({
  head: () => ({
    meta: [{ title: "Offer Preview — Atlas HR" }],
  }),
  component: OfferPreview,
});

function OfferPreview() {
  const { candidateId } = Route.useParams();

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const { data: offer } = useOffer(candidateId);
  const sendOffer = useSendOffer();
  const acceptOffer = useAcceptOffer();
  const declineOffer = useDeclineOffer();

  const handlePrint = () => {
    window.print();
  };

  const handleMarkSent = () => {
    if (!offer) return;
    sendOffer.mutate(
      { offerId: offer.id },
      {
        onSuccess: () => toast.success("Offer sent successfully"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleMarkAccepted = () => {
    if (!offer) return;
    acceptOffer.mutate(
      { offerId: offer.id },
      {
        onSuccess: () => toast.success("Offer accepted"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleMarkDeclined = () => {
    if (!offer) return;
    declineOffer.mutate(
      { offerId: offer.id },
      {
        onSuccess: () => toast.success("Offer declined"),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (candidateLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-8 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  if (!candidate || !offer) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <div className="text-lg font-semibold">No offer found</div>
          <p className="text-sm text-muted-foreground mt-1">
            Please build an offer first before previewing.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/offer/builder/$candidateId" params={{ candidateId }}>
              Build Offer
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header Actions - hidden when printing */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/offer/queue">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offer Letter Preview</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and send the offer letter.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {offer.status === "DRAFT" && (
            <Button size="sm" onClick={handleMarkSent}>
              <Send className="h-4 w-4 mr-2" /> Mark as Sent
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {offer.status !== "draft" && (
        <Card
          className={`p-4 no-print ${
            offer.status === "ACCEPTED"
              ? "bg-emerald-50 border-emerald-200"
              : offer.status === "DECLINED"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {offer.status === "ACCEPTED" ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : offer.status === "DECLINED" ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <div className="font-medium">
                {offer.status === "ACCEPTED"
                  ? "Offer Accepted"
                  : offer.status === "DECLINED"
                    ? "Offer Declined"
                    : "Offer Sent"}
              </div>
              <div className="text-sm text-muted-foreground">
                {offer.status === "ACCEPTED"
                  ? `Accepted on ${offer.responded_at ? formatDate(offer.responded_at) : "—"}`
                  : offer.status === "DECLINED"
                    ? `Declined on ${offer.responded_at ? formatDate(offer.responded_at) : "—"}`
                    : `Sent on ${offer.sent_at ? formatDate(offer.sent_at) : "—"}`}
              </div>
            </div>
            {offer.status === "SENT" && (
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={handleMarkAccepted}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleMarkDeclined}>
                  <XCircle className="h-4 w-4 mr-1" /> Decline
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Offer Letter - Print-friendly */}
      <Card className="p-8 print:shadow-none print:border-none">
        <div className="max-w-2xl mx-auto">
          {/* Company Header */}
          <div className="text-center border-b pb-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Atlas Logo" className="h-10 w-auto" />
              <div className="text-left">
                <div className="font-bold text-xl tracking-tight">Abhiyanta India Solutions</div>
                <div className="text-xs text-muted-foreground">ATLAS HR — Talent Acquisition</div>
              </div>
            </div>
          </div>

          {/* Date & Reference */}
          <div className="flex justify-between mb-6">
            <div>
              <div className="text-sm text-muted-foreground">Date:</div>
              <div className="text-sm font-medium">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Ref:</div>
              <div className="text-sm font-medium">{candidate.application_number}</div>
            </div>
          </div>

          {/* Candidate Address */}
          <div className="mb-6">
            <div className="text-sm font-medium">
              {candidate.first_name} {candidate.last_name}
            </div>
            {candidate.current_address && (
              <div className="text-sm text-muted-foreground">{candidate.current_address}</div>
            )}
            <div className="text-sm text-muted-foreground">{candidate.email}</div>
            <div className="text-sm text-muted-foreground">{candidate.phone}</div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <div className="text-sm font-semibold uppercase tracking-wide">
              Subject: Offer of Employment
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p>Dear {candidate.first_name},</p>

            <p>
              We are pleased to extend this offer of employment for the position of{" "}
              <strong>{candidate.position_applied_for ?? "the advertised position"}</strong> at
              Abhiyanta India Solutions. We were impressed with your skills and experience, and
              believe you will be a valuable addition to our team.
            </p>

            <div className="border rounded-lg p-4 my-6 bg-muted/30">
              <div className="text-sm font-semibold mb-3">Offer Details</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Position:</span>{" "}
                  <strong>{candidate.position_applied_for ?? "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Domain:</span>{" "}
                  <strong>{candidate.domain ?? "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Offered CTC:</span>{" "}
                  <strong>₹{offer.offered_ctc ?? "—"} LPA</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Joining Date:</span>{" "}
                  <strong>{offer.joining_date ? formatDate(offer.joining_date) : "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Employment Type:</span>{" "}
                  <strong>{candidate.professional_details?.employment_type ?? "Full-time"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Approved By:</span>{" "}
                  <strong>{offer.approved_by ?? "—"}</strong>
                </div>
              </div>
            </div>

            <p>This offer is subject to the following terms and conditions:</p>

            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Your employment will commence on the joining date mentioned above, subject to
                successful completion of pre-employment verification.
              </li>
              <li>
                Your compensation package includes the CTC mentioned above, which includes basic
                salary, allowances, and benefits as per company policy.
              </li>
              <li>
                You will be entitled to benefits including health insurance, paid time off, and
                other benefits as per company policy.
              </li>
              <li>
                You will be required to sign a confidentiality agreement and any other agreements
                required by company policy.
              </li>
              <li>
                This offer is contingent upon satisfactory background verification and submission of
                required documents.
              </li>
              <li>
                Either party may terminate the employment with appropriate notice as per company
                policy.
              </li>
            </ol>

            <p>
              Please confirm your acceptance of this offer by signing and returning this letter by{" "}
              <strong>
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              .
            </p>

            <p>
              We look forward to welcoming you to the team. If you have any questions, please
              don&apos;t hesitate to reach out.
            </p>

            <p className="mt-6">Warm regards,</p>

            <div className="mt-8 pt-4 border-t">
              <div className="text-sm font-medium">
                {offer.approved_by ?? "Authorised Signatory"}
              </div>
              <div className="text-xs text-muted-foreground">Abhiyanta India Solutions</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Candidate Actions - hidden when printing */}
      {offer.status === "SENT" && (
        <Card className="p-4 no-print">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Has the candidate responded?</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleMarkAccepted}>
                <CheckCircle className="h-4 w-4 mr-1" /> Accepted
              </Button>
              <Button size="sm" variant="outline" onClick={handleMarkDeclined}>
                <XCircle className="h-4 w-4 mr-1" /> Declined
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
