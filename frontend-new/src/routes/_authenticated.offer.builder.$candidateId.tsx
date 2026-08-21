import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, InterviewScore, InterviewEngineAssignment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, User, Mail, Phone, Briefcase, FileCheck, BarChart3, GraduationCap } from "lucide-react";

interface OfferData {
  offer_id: string;
  candidate_id: string;
  status: string;
  offered_ctc: number | null;
  joining_date: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export const Route = createFileRoute("/_authenticated/offer/builder/$candidateId")({
  head: () => ({
    meta: [{ title: "Build Offer — Atlas HR" }],
  }),
  component: OfferBuilder,
});

function OfferBuilder() {
  const { candidateId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const { data: existingOffer } = useQuery({
    queryKey: ["offer", candidateId],
    queryFn: () =>
      api<{ success: boolean; data: OfferData }>(`/api/offers/candidate/${candidateId}`).then(
        (r) => (r.success ? r.data : null),
      ),
    retry: false,
  });

  const { data: interviewAssignment } = useQuery({
    queryKey: ["interview", "assignment", candidateId],
    queryFn: () =>
      api<{ assignment: InterviewEngineAssignment }>(`/api/interview/assignment/${candidateId}`).then(
        (r) => r.assignment,
      ),
    retry: false,
  });

  const { data: interviewScore } = useQuery({
    queryKey: ["interview", "result", candidateId],
    queryFn: () =>
      api<{ score: InterviewScore | null }>(`/api/interview/result/${candidateId}`).then(
        (r) => r.score,
      ),
    retry: false,
  });

  const [offeredCtc, setOfferedCtc] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingOffer) {
      setOfferedCtc(existingOffer.offered_ctc?.toString() || "");
      setJoiningDate(existingOffer.joining_date || "");
      setNotes(existingOffer.notes || "");
    }
  }, [existingOffer]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        candidate_id: candidateId,
      };
      if (offeredCtc) payload.offered_ctc = parseFloat(offeredCtc);
      if (joiningDate) payload.joining_date = joiningDate;
      if (notes) payload.notes = notes;

      return api("/api/offers", { method: "POST", body: payload });
    },
    onSuccess: () => {
      toast.success("Offer created successfully");
      queryClient.invalidateQueries({ queryKey: ["offer", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create offer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      if (offeredCtc) payload.offered_ctc = parseFloat(offeredCtc);
      if (joiningDate) payload.joining_date = joiningDate;
      if (notes) payload.notes = notes;

      return api(`/api/offers/${existingOffer?.offer_id}`, { method: "PUT", body: payload });
    },
    onSuccess: () => {
      toast.success("Offer updated successfully");
      queryClient.invalidateQueries({ queryKey: ["offer", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update offer");
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      return api(`/api/offers/${existingOffer?.offer_id}/send`, {
        method: "POST",
        body: { notes: "Offer letter sent to candidate" },
      });
    },
    onSuccess: () => {
      toast.success("Offer sent successfully");
      queryClient.invalidateQueries({ queryKey: ["offer", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      navigate({ to: `/offer/preview/$candidateId`, params: { candidateId } });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send offer");
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!offeredCtc || parseFloat(offeredCtc) <= 0) {
      newErrors.offeredCtc = "Offered CTC must be provided and greater than 0";
    }
    if (!joiningDate) {
      newErrors.joiningDate = "Joining date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (existingOffer) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleSaveDraft = () => {
    if (existingOffer) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleSendOffer = () => {
    if (!validate()) return;
    if (existingOffer && existingOffer.status === "DRAFT") {
      sendMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || sendMutation.isPending;

  if (candidateLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="text-lg font-semibold">Candidate not found</div>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/offer/queue">Back to Queue</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/offer/queue">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Build Offer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create an offer letter for {candidate.first_name} {candidate.last_name}
          </p>
        </div>
      </div>

      {/* Candidate Summary Card */}
      <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold text-lg">
            {candidate.first_name?.[0] || ""}
            {candidate.last_name?.[0] || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">
              {candidate.first_name} {candidate.last_name}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {candidate.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {candidate.phone}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {candidate.position_applied_for ?? "—"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{candidate.application_number}</Badge>
              {candidate.professional_details?.current_company && (
                <Badge variant="outline">{candidate.professional_details.current_company}</Badge>
              )}
              {candidate.professional_details?.current_ctc && (
                <Badge variant="outline">
                  Current CTC: ₹{candidate.professional_details.current_ctc} LPA
                </Badge>
              )}
              {candidate.professional_details?.expected_ctc && (
                <Badge variant="outline">
                  Expected: ₹{candidate.professional_details.expected_ctc} LPA
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Interview Data */}
      {(interviewAssignment || interviewScore) && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Technical Interview Details</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {interviewAssignment && (
              <>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Domain</div>
                  <div className="mt-1 font-medium">{interviewAssignment.domain_code}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Experience Bracket</div>
                  <div className="mt-1 font-medium">{interviewAssignment.experience_bracket_label ?? interviewAssignment.experience_bracket_code}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Interviewer</div>
                  <div className="mt-1 font-medium">{interviewAssignment.assigned_interviewer}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Interview Date</div>
                  <div className="mt-1 font-medium">
                    {interviewAssignment.created_at
                      ? new Date(interviewAssignment.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </>
            )}
          </div>

          {interviewScore && (
            <>
              <Separator className="my-4" />
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {interviewScore.overall_percentage?.toFixed(1) ?? 0}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Technical Score</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Badge
                    variant={
                      interviewScore.recommendation === "Excellent" || interviewScore.recommendation === "Very Strong"
                        ? "default"
                        : interviewScore.recommendation === "Needs Improvement"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-sm font-semibold"
                  >
                    {interviewScore.recommendation ?? "N/A"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">Recommendation</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {interviewScore.answered_questions ?? 0}/{interviewScore.total_questions ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Questions Rated</div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Offer Status */}
      {existingOffer && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Offer Status:</span>
            <Badge
              variant={
                existingOffer.status === "ACCEPTED"
                  ? "default"
                  : existingOffer.status === "DECLINED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {existingOffer.status}
            </Badge>
            {existingOffer.status === "DRAFT" && (
              <span className="text-xs text-muted-foreground ml-2">
                — You can edit and send this offer
              </span>
            )}
            {existingOffer.status === "SENT" && (
              <span className="text-xs text-muted-foreground ml-2">
                — Waiting for candidate response
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Offer Form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Offer Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offered CTC */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Offered CTC (Annual LPA) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={offeredCtc}
              onChange={(e) => setOfferedCtc(e.target.value)}
              placeholder="e.g. 12.5"
              disabled={existingOffer?.status !== "DRAFT" && !!existingOffer}
              className={
                "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring " +
                (errors.offeredCtc ? "border-destructive" : "") +
                (existingOffer?.status !== "DRAFT" && !!existingOffer
                  ? " opacity-50 cursor-not-allowed"
                  : "")
              }
            />
            {errors.offeredCtc && <p className="text-xs text-destructive">{errors.offeredCtc}</p>}
          </div>

          {/* Joining Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Joining Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              disabled={existingOffer?.status !== "DRAFT" && !!existingOffer}
              className={
                "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring " +
                (errors.joiningDate ? "border-destructive" : "") +
                (existingOffer?.status !== "DRAFT" && !!existingOffer
                  ? " opacity-50 cursor-not-allowed"
                  : "")
              }
            />
            {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the offer..."
              rows={3}
              disabled={existingOffer?.status !== "DRAFT" && !!existingOffer}
              className={
                "w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" +
                (existingOffer?.status !== "DRAFT" && !!existingOffer
                  ? " opacity-50 cursor-not-allowed"
                  : "")
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : existingOffer ? "Update Draft" : "Save Draft"}
          </Button>
          {(!existingOffer || existingOffer.status === "DRAFT") && (
            <>
              <Button onClick={handleSubmit} disabled={isPending}>
                <Send className="h-4 w-4 mr-2" />
                {isPending ? "Saving..." : existingOffer ? "Update & Send" : "Create & Send"}
              </Button>
              {existingOffer && existingOffer.status === "DRAFT" && (
                <Button onClick={handleSendOffer} disabled={isPending} variant="default">
                  <Send className="h-4 w-4 mr-2" />
                  {isPending ? "Sending..." : "Send Offer"}
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
