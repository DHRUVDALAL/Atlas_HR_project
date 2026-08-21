import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CandidateDetail, OnboardingRecord, VerificationItem, AssetItem } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  FileCheck,
  Shield,
  Laptop,
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  GraduationCap,
  FileText,
  UserPlus,
} from "lucide-react";

interface ApiOnboardingResponse {
  success: boolean;
  data: {
    onboarding_id: string;
    candidate_id: string;
    application_number: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string;
    position_applied: string;
    status: string;
    started_at: string;
    completed_at: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    progress_percent: number;
    documents: Array<{
      document_type: string;
      status: string;
      verified_by: string;
      verified_at: string;
      notes: string;
    }>;
    background_checks: Array<{
      category: string;
      status: string;
      verified_by: string;
      verified_at: string;
      notes: string;
    }>;
    assets: Array<{
      asset_type: string;
      status: string;
      asset_id: string;
      allocated_by: string;
      allocated_at: string;
      notes: string;
    }>;
    checklist: Array<{
      item_name: string;
      is_completed: boolean;
      completed_by: string;
      completed_at: string;
    }>;
    activities: Array<{
      activity_id: string;
      action: string;
      performed_by: string;
      details: string;
      created_at: string;
    }>;
  };
}

const DOC_TYPE_MAP: Record<string, string> = {
  aadhaar: "AADHAAR",
  pan: "PAN",
  passport: "PASSPORT",
  driving_license: "DL",
  education: "EDUCATION",
  experience: "EXPERIENCE",
  resume: "RESUME",
  offer_letter: "OFFER_LETTER",
};

const DOC_TYPE_REVERSE: Record<string, string> = {
  AADHAAR: "aadhaar",
  PAN: "pan",
  PASSPORT: "passport",
  DL: "driving_license",
  EDUCATION: "education",
  EXPERIENCE: "experience",
  RESUME: "resume",
  OFFER_LETTER: "offer_letter",
};

const BGV_TYPE_MAP: Record<string, string> = {
  reference_check: "REFERENCE",
  employment_verification: "EMPLOYMENT",
  education_verification: "EDUCATION",
  criminal_verification: "CRIMINAL",
};

const BGV_TYPE_REVERSE: Record<string, string> = {
  REFERENCE: "reference_check",
  EMPLOYMENT: "employment_verification",
  EDUCATION: "education_verification",
  CRIMINAL: "criminal_verification",
};

const ASSET_TYPE_MAP: Record<string, string> = {
  laptop: "LAPTOP",
  monitor: "MONITOR",
  phone: "PHONE",
  email: "EMAIL",
  access_card: "ACCESS_CARD",
  vpn: "VPN",
  software_licenses: "SOFTWARE_LICENSES",
};

const ASSET_TYPE_REVERSE: Record<string, string> = {
  LAPTOP: "laptop",
  MONITOR: "monitor",
  PHONE: "phone",
  EMAIL: "email",
  ACCESS_CARD: "access_card",
  VPN: "vpn",
  SOFTWARE_LICENSES: "software_licenses",
};

function transformApiToOnboarding(apiData: ApiOnboardingResponse["data"]): OnboardingRecord {
  const docKeys = [
    "aadhaar",
    "pan",
    "passport",
    "driving_license",
    "education",
    "experience",
    "resume",
    "offer_letter",
  ] as const;

  const documents = {} as OnboardingRecord["documents"];
  for (const key of docKeys) {
    const apiDoc = apiData.documents.find((d) => DOC_TYPE_REVERSE[d.document_type] === key);
    documents[key] = {
      status: (apiDoc?.status?.toLowerCase() as VerificationItem["status"]) ?? "pending",
      verified_at: apiDoc?.verified_at || undefined,
      notes: apiDoc?.notes || undefined,
    };
  }

  const bgvKeys = [
    "reference_check",
    "employment_verification",
    "education_verification",
    "criminal_verification",
  ] as const;

  const background_verification = {} as OnboardingRecord["background_verification"];
  for (const key of bgvKeys) {
    const apiBgv = apiData.background_checks.find((b) => BGV_TYPE_REVERSE[b.category] === key);
    background_verification[key] = {
      status: (apiBgv?.status?.toLowerCase() as VerificationItem["status"]) ?? "pending",
      verified_at: apiBgv?.verified_at || undefined,
      notes: apiBgv?.notes || undefined,
    };
  }

  const assetKeys = [
    "laptop",
    "monitor",
    "phone",
    "email",
    "access_card",
    "vpn",
    "software_licenses",
  ] as const;

  const assets = {} as OnboardingRecord["assets"];
  for (const key of assetKeys) {
    const apiAsset = apiData.assets.find((a) => ASSET_TYPE_REVERSE[a.asset_type] === key);
    assets[key] = {
      status: (apiAsset?.status?.toLowerCase() as AssetItem["status"]) ?? "pending",
      asset_id: apiAsset?.asset_id || undefined,
      allocated_at: apiAsset?.allocated_at || undefined,
      notes: apiAsset?.notes || undefined,
    };
  }

  const checklistKeys = [
    "offer_accepted",
    "documents_received",
    "background_complete",
    "it_ready",
    "payroll_ready",
    "manager_assigned",
    "joining_kit",
    "orientation_scheduled",
  ] as const;

  const checklist = {} as OnboardingRecord["checklist"];
  for (const key of checklistKeys) {
    const apiItem = apiData.checklist.find((c) => c.item_name === key);
    checklist[key] = apiItem?.is_completed ?? false;
  }

  const history = (apiData.activities ?? []).map((a) => ({
    action: a.action,
    timestamp: a.created_at,
    by: a.performed_by,
    details: a.details,
  }));

  return {
    candidate_id: apiData.candidate_id,
    status: apiData.status?.toLowerCase() as OnboardingRecord["status"],
    documents,
    background_verification,
    assets,
    checklist,
    history,
    created_at: apiData.created_at,
    updated_at: apiData.updated_at,
  };
}

function getDocProgress(docs: OnboardingRecord["documents"]): number {
  const items = Object.values(docs);
  return Math.round((items.filter((d) => d.status === "verified").length / items.length) * 100);
}

function getBgProgress(bgv: OnboardingRecord["background_verification"]): number {
  const items = Object.values(bgv);
  return Math.round((items.filter((d) => d.status === "cleared").length / items.length) * 100);
}

function getAssetProgress(assets: OnboardingRecord["assets"]): number {
  const items = Object.values(assets);
  return Math.round(
    (items.filter((a) => a.status === "allocated" || a.status === "configured").length /
      items.length) *
      100,
  );
}

function getChecklistProgress(checklist: OnboardingRecord["checklist"]): number {
  const items = Object.values(checklist);
  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

export const Route = createFileRoute("/_authenticated/onboarding/$candidateId")({
  head: () => ({
    meta: [{ title: "Employee Profile — Atlas HR" }],
  }),
  component: EmployeeProfile,
});

type Tab = "overview" | "documents" | "background" | "assets" | "checklist" | "timeline";

function EmployeeProfile() {
  const { candidateId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const queryClient = useQueryClient();

  const { data: candidate, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api<CandidateDetail>(`/api/applicants/${candidateId}`),
  });

  const {
    data: onboardingData,
    isLoading: isLoadingOnboarding,
    refetch: refetchOnboarding,
  } = useQuery({
    queryKey: ["onboarding", candidateId],
    queryFn: async () => {
      try {
        return await api<ApiOnboardingResponse>(`/api/onboarding/candidate/${candidateId}`);
      } catch (err: unknown) {
        if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
          return null;
        }
        throw err;
      }
    },
  });

  const rec = onboardingData?.data ? transformApiToOnboarding(onboardingData.data) : null;

  const startOnboardingMutation = useMutation({
    mutationFn: () =>
      api<ApiOnboardingResponse>("/api/onboarding", {
        method: "POST",
        body: { candidate_id: candidateId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("Onboarding started");
    },
    onError: () => toast.error("Failed to start onboarding"),
  });

  const verifyDocMutation = useMutation({
    mutationFn: ({ docType, notes }: { docType: string; notes: string }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/documents/${docType}/verify`, {
        method: "POST",
        body: { notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("Document verified");
    },
    onError: () => toast.error("Failed to verify document"),
  });

  const rejectDocMutation = useMutation({
    mutationFn: ({ docType, notes }: { docType: string; notes: string }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/documents/${docType}/reject`, {
        method: "POST",
        body: { notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("Document rejected");
    },
    onError: () => toast.error("Failed to reject document"),
  });

  const clearBgvMutation = useMutation({
    mutationFn: ({ category, notes }: { category: string; notes: string }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/bgv/${category}/clear`, {
        method: "POST",
        body: { notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("BGV cleared");
    },
    onError: () => toast.error("Failed to clear BGV"),
  });

  const failBgvMutation = useMutation({
    mutationFn: ({ category, notes }: { category: string; notes: string }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/bgv/${category}/fail`, {
        method: "POST",
        body: { notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("BGV failed");
    },
    onError: () => toast.error("Failed to mark BGV as failed"),
  });

  const allocateAssetMutation = useMutation({
    mutationFn: ({
      assetType,
      assetId,
      notes,
    }: {
      assetType: string;
      assetId: string;
      notes: string;
    }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/assets/${assetType}/allocate`, {
        method: "POST",
        body: { asset_id: assetId, notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("Asset allocated");
    },
    onError: () => toast.error("Failed to allocate asset"),
  });

  const checklistMutation = useMutation({
    mutationFn: ({ itemName, isCompleted }: { itemName: string; isCompleted: boolean }) =>
      api(`/api/onboarding/${onboardingData!.data.onboarding_id}/checklist/${itemName}`, {
        method: "PUT",
        body: { is_completed: isCompleted },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", candidateId] });
      toast.success("Checklist updated");
    },
    onError: () => toast.error("Failed to update checklist"),
  });

  const isLoading = isLoadingCandidate || isLoadingOnboarding;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleStartOnboarding = () => {
    startOnboardingMutation.mutate();
  };

  const handleUpdateVerification = (
    category: "documents" | "background_verification",
    key: string,
    status: string,
  ) => {
    if (!onboardingData?.data) return;
    if (category === "documents") {
      const apiDocType = DOC_TYPE_MAP[key];
      if (!apiDocType) return;
      if (status === "verified") {
        verifyDocMutation.mutate({ docType: apiDocType, notes: "" });
      } else {
        rejectDocMutation.mutate({ docType: apiDocType, notes: "" });
      }
    } else {
      const apiCategory = BGV_TYPE_MAP[key];
      if (!apiCategory) return;
      if (status === "cleared") {
        clearBgvMutation.mutate({ category: apiCategory, notes: "" });
      } else {
        failBgvMutation.mutate({ category: apiCategory, notes: "" });
      }
    }
  };

  const handleUpdateAsset = (key: string, status: string) => {
    if (!onboardingData?.data) return;
    const apiAssetType = ASSET_TYPE_MAP[key];
    if (!apiAssetType) return;
    allocateAssetMutation.mutate({ assetType: apiAssetType, assetId: "", notes: "" });
  };

  const handleToggleChecklist = (key: keyof OnboardingRecord["checklist"]) => {
    if (!onboardingData?.data) return;
    const current = rec?.checklist?.[key] ?? false;
    checklistMutation.mutate({ itemName: key, isCompleted: !current });
  };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "documents", label: "Documents", icon: FileCheck },
    { key: "background", label: "Background", icon: Shield },
    { key: "assets", label: "IT Assets", icon: Laptop },
    { key: "checklist", label: "Checklist", icon: ClipboardList },
    { key: "timeline", label: "Timeline", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        <div className="h-10 w-48 bg-gray-100 rounded-full animate-pulse" />
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
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
            to="/onboarding/queue"
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
            to="/onboarding/queue"
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
          {!rec && (
            <button 
              onClick={handleStartOnboarding}
              disabled={startOnboardingMutation.isPending}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white text-sm font-bold shadow-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Start Onboarding
            </button>
          )}
          {rec && (
            <span
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                rec.status === "completed"
                  ? "bg-emerald-50 text-emerald-700"
                  : rec.status === "in_progress"
                    ? "bg-[#0066cc]/10 text-[#0066cc]"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {rec.status === "completed"
                ? "Completed"
                : rec.status === "in_progress"
                  ? "In Progress"
                  : "Pending"}
            </span>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      {rec && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Documents", value: getDocProgress(rec.documents), icon: FileCheck, color: "text-[#0066cc]" },
            { label: "Background", value: getBgProgress(rec.background_verification), icon: Shield, color: "text-purple-500" },
            { label: "IT Assets", value: getAssetProgress(rec.assets), icon: Laptop, color: "text-amber-500" },
            { label: "Checklist", value: getChecklistProgress(rec.checklist), icon: ClipboardList, color: "text-emerald-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${item.value === 100 ? "bg-emerald-500" : "bg-[#1d1d1f]"}`}
                    />
                  </div>
                  <span className={`text-lg font-bold ${item.value === 100 ? "text-emerald-500" : "text-[#1d1d1f]"}`}>{item.value}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <FileCheck className="h-4 w-4 text-[#86868b]" />
                </div>
                Document Verification
              </h3>
              {!rec ? (
                <EmptyState 
                  icon={FileCheck} 
                  title="Start onboarding first" 
                  description="Begin the onboarding process to track document verification." 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(rec.documents).map(([key, doc]) => (
                    <VerificationCard
                      key={key}
                      title={key.replace(/_/g, " ")}
                      status={doc.status}
                      onVerify={() => handleUpdateVerification("documents", key, "verified")}
                      onReject={() => handleUpdateVerification("documents", key, "rejected")}
                      isPending={verifyDocMutation.isPending || rejectDocMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "background" && (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[#86868b]" />
                </div>
                Background Verification
              </h3>
              {!rec ? (
                <EmptyState 
                  icon={Shield} 
                  title="Start onboarding first" 
                  description="Begin the onboarding process to track background verification." 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(rec.background_verification).map(([key, bgv]) => (
                    <VerificationCard
                      key={key}
                      title={key.replace(/_/g, " ")}
                      status={bgv.status}
                      onVerify={() => handleUpdateVerification("background_verification", key, "cleared")}
                      onReject={() => handleUpdateVerification("background_verification", key, "failed")}
                      verifyLabel="Clear"
                      rejectLabel="Fail"
                      isPending={clearBgvMutation.isPending || failBgvMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "assets" && (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Laptop className="h-4 w-4 text-[#86868b]" />
                </div>
                IT Asset Allocation
              </h3>
              {!rec ? (
                <EmptyState 
                  icon={Laptop} 
                  title="Start onboarding first" 
                  description="Begin the onboarding process to track IT asset allocation." 
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(rec.assets).map(([key, asset]) => (
                    <div key={key} className="p-5 rounded-[2rem] border border-gray-100 bg-[#fbfbfd] hover:border-gray-200 transition-colors group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-sm text-[#1d1d1f] capitalize">{key.replace(/_/g, " ")}</div>
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            asset.status === "allocated" || asset.status === "configured"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {asset.status === "allocated"
                            ? "Allocated"
                            : asset.status === "configured"
                              ? "Configured"
                              : asset.status === "returned"
                                ? "Returned"
                                : "Pending"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpdateAsset(key, key === "email" || key === "vpn" ? "configured" : "allocated")}
                        disabled={allocateAssetMutation.isPending || asset.status === "allocated" || asset.status === "configured"}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          asset.status === "allocated" || asset.status === "configured"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 active:scale-[0.98] shadow-sm"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {key === "email" || key === "vpn" ? "Configure" : "Allocate"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-[#86868b]" />
                </div>
                HR Onboarding Checklist
              </h3>
              {!rec ? (
                <EmptyState 
                  icon={ClipboardList} 
                  title="Start onboarding first" 
                  description="Begin the onboarding process to track the HR checklist." 
                />
              ) : (
                <div className="grid gap-3 max-w-3xl">
                  {Object.entries(rec.checklist).map(([key, completed]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-4 p-4 rounded-[1.5rem] cursor-pointer transition-colors border ${
                        completed ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-gray-100 hover:border-gray-200 hover:bg-[#fbfbfd]"
                      }`}
                      onClick={() => handleToggleChecklist(key as keyof OnboardingRecord["checklist"])}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                          completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"
                        }`}
                      >
                        {completed && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold capitalize truncate ${completed ? "text-emerald-900" : "text-[#1d1d1f]"}`}>
                          {key.replace(/_/g, " ")}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          completed ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {completed ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#86868b]" />
                </div>
                Onboarding Timeline
              </h3>
              {!rec || rec.history.length === 0 ? (
                <EmptyState 
                  icon={Calendar} 
                  title="No activity yet" 
                  description="Timeline will appear as onboarding progresses." 
                />
              ) : (
                <div className="relative max-w-3xl">
                  <div className="absolute left-[2.25rem] top-6 bottom-6 w-0.5 bg-gray-100" />
                  <div className="space-y-8">
                    {rec.history
                      .slice()
                      .reverse()
                      .map((entry, i) => (
                        <div key={i} className="relative flex items-start gap-6">
                          <div className="relative z-10 h-[4.5rem] w-[4.5rem] rounded-full bg-white border-[4px] border-[#1d1d1f] text-[#1d1d1f] flex items-center justify-center shrink-0 shadow-sm">
                            <CheckCircle className="h-7 w-7" />
                          </div>
                          <div className="flex-1 pt-2 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                            <h4 className="text-lg font-bold text-[#1d1d1f] capitalize">
                              {entry.action.replace(/_/g, " ")}
                            </h4>
                            {entry.details && (
                              <p className="text-sm font-medium text-[#86868b] mt-1">{entry.details}</p>
                            )}
                            <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-3">
                              {formatDate(entry.timestamp)} <span className="mx-1">•</span> {entry.by}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
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

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="text-center py-12 bg-[#fbfbfd] rounded-[2rem] border border-gray-50">
      <div className="w-20 h-20 mx-auto rounded-full bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
        <Icon className="h-10 w-10 text-[#86868b]" />
      </div>
      <div className="text-2xl font-bold text-[#1d1d1f] mb-2">{title}</div>
      <p className="text-sm font-medium text-[#86868b] max-w-sm mx-auto">
        {description}
      </p>
    </div>
  );
}

function VerificationCard({ 
  title, 
  status, 
  onVerify, 
  onReject, 
  verifyLabel = "Verify", 
  rejectLabel = "Reject",
  isPending = false
}: { 
  title: string, 
  status: string, 
  onVerify: () => void, 
  onReject: () => void,
  verifyLabel?: string,
  rejectLabel?: string,
  isPending?: boolean
}) {
  const isVerified = status === "verified" || status === "cleared";
  const isRejected = status === "rejected" || status === "failed";
  const isFinished = isVerified || isRejected;

  return (
    <div className="p-5 rounded-[2rem] border border-gray-100 bg-[#fbfbfd] hover:border-gray-200 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-sm text-[#1d1d1f] capitalize">{title}</div>
        <span
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isVerified
              ? "bg-emerald-50 text-emerald-700"
              : isRejected
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {isVerified ? "Cleared" : isRejected ? "Failed" : "Pending"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onVerify}
          disabled={isPending || isFinished}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isVerified 
              ? "bg-emerald-50 text-emerald-700 cursor-not-allowed" 
              : isFinished 
                ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 active:scale-[0.98] shadow-sm"
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {verifyLabel}
        </button>
        <button
          onClick={onReject}
          disabled={isPending || isFinished}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isRejected 
              ? "bg-red-50 text-red-700 cursor-not-allowed" 
              : isFinished 
                ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-[#1d1d1f] hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98] shadow-sm"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          {rejectLabel}
        </button>
      </div>
    </div>
  );
}
