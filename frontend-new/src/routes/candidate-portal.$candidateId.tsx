import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useOffer } from "@/lib/hooks";
import type { CandidateDetail } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Building,
} from "lucide-react";

export const Route = createFileRoute("/candidate-portal/$candidateId")({
  head: () => ({
    meta: [{ title: "Candidate Portal — Atlas HR" }],
  }),
  component: CandidatePortal,
});

function CandidatePortal() {
  const { candidateId } = Route.useParams();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const { data: offer } = useOffer(candidateId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8 space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-12 text-center">
          <FileCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <div className="text-2xl font-bold">Candidate Not Found</div>
          <p className="text-muted-foreground mt-2">
            The candidate ID you provided is invalid or the candidate record has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="Atlas Logo" className="h-8 w-auto" />
          <div>
            <div className="font-semibold tracking-tight">Abhiyanta India Solutions</div>
            <div className="text-xs text-muted-foreground">Candidate Portal</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <Card className="p-6 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
          <h1 className="text-2xl font-bold">Welcome, {candidate.first_name}!</h1>
          <p className="text-white/70 mt-1">
            Thank you for applying to Abhiyanta India Solutions. Here is the status of your
            application.
          </p>
        </Card>

        {/* Application Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Application Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {candidate.first_name} {candidate.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{candidate.phone}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">{candidate.position_applied_for ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Application:</span>
                <span className="font-medium">{candidate.application_number}</span>
              </div>
              {candidate.applied_from && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Applied via:</span>
                  <span className="font-medium">{candidate.applied_from}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Applied:</span>
                <span className="font-medium">{formatDate(candidate.created_at)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Application Status
          </h2>
          <div className="flex items-center gap-4">
            <Badge
              className={
                candidate.status === "SELECTED"
                  ? "bg-emerald-100 text-emerald-700 text-lg px-4 py-1"
                  : candidate.status === "REJECTED"
                    ? "bg-red-100 text-red-700 text-lg px-4 py-1"
                    : "bg-blue-100 text-blue-700 text-lg px-4 py-1"
              }
              variant="secondary"
            >
              {candidate.status === "SELECTED"
                ? "Selected"
                : candidate.status === "REJECTED"
                  ? "Rejected"
                   : candidate.status === "ON_HOLD"
                    ? "On Hold"
                    : candidate.status.replace(/_/g, " ")}
            </Badge>
            {candidate.status === "SELECTED" && (
              <span className="text-sm text-muted-foreground">
                Congratulations! You have been selected.
              </span>
            )}
          </div>
        </Card>

        {/* Offer Details */}
        {offer && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileCheck className="h-5 w-5" /> Offer Details
            </h2>

            {/* Offer Status */}
            <div className="flex items-center gap-3 mb-6">
              <div className="text-sm text-muted-foreground">Offer Status:</div>
              <Badge
                className={
                  offer.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-700"
                    : offer.status === "SENT"
                      ? "bg-blue-100 text-blue-700"
                      : offer.status === "DECLINED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                }
                variant="secondary"
              >
                {offer.status === "ACCEPTED"
                  ? "Accepted"
                  : offer.status === "SENT"
                    ? "Sent"
                    : offer.status === "DECLINED"
                      ? "Declined"
                      : "Draft"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Offered CTC</div>
                <div className="text-2xl font-bold mt-1">
                  {offer.offered_ctc ? `₹${offer.offered_ctc} LPA` : "—"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Joining Date</div>
                <div className="text-2xl font-bold mt-1">
                  {offer.joining_date ? formatDate(offer.joining_date) : "—"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Approved By</div>
                <div className="text-lg font-bold mt-1">{offer.approved_by ?? "—"}</div>
              </div>
              {offer.sent_at && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Offer Sent On</div>
                  <div className="text-lg font-bold mt-1">{formatDate(offer.sent_at)}</div>
                </div>
              )}
            </div>

            {/* Offer Letter Preview */}
            {offer.status === "SENT" && (
              <div className="mt-6 p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Offer Letter</div>
                <p className="text-sm text-muted-foreground">
                  An offer letter has been sent to your email address. Please check your inbox and
                  respond within 7 days.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* No Offer */}
        {!offer && candidate.status === "SELECTED" && (
          <Card className="p-6">
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <div className="text-lg font-semibold">Offer Being Prepared</div>
              <p className="text-sm text-muted-foreground mt-1">
                You have been selected! An offer letter is being prepared and will be shared with
                you soon.
              </p>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          Abhiyanta India Solutions · ATLAS HR Recruitment System
        </div>
      </main>
    </div>
  );
}
