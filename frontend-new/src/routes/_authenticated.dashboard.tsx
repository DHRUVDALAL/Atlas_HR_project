import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { safeDate } from "@/lib/utils";
import type { ApplicantListItem, InterviewAssignment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusMeta } from "@/lib/scorecard";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  Crown,
  Gavel,
  ArrowRight,
  Copy,
  Clock,
  UserPlus,
  Inbox,
  CheckCircle,
  PauseCircle,
  Calendar,
  Send,
  FolderOpen,
  TrendingUp,
  ListChecks,
  Timer,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Atlas HR" }],
  }),
  component: Dashboard,
});

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isToday(dateString: string | null | undefined) {
  const d = safeDate(dateString);
  if (!d) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function Dashboard() {
  const { user, hasAnyRole, hasAnyPermission } = useAuth();

  const { data: all, isLoading } = useQuery({
    queryKey: ["applicants", "all"],
    queryFn: () =>
      api<{ applicants: ApplicantListItem[] }>("/api/applicants?limit=500").then(
        (r) => r.applicants ?? [],
      ),
    enabled: hasAnyPermission(["candidate.list"]),
    retry: false,
  });

  const list = all ?? [];
  const count = (s: string) => list.filter((c) => c.status === s).length;

  const SUBMITTED_STATUSES = ["DRAFT", "SUBMITTED", "Submitted — awaiting reception"];
  const countAwaiting = list.filter((c) => SUBMITTED_STATUSES.includes(c.status)).length;
  const countArrivedToday = list.filter(
    (c) => !SUBMITTED_STATUSES.includes(c.status) && isToday(c.updated_at),
  ).length;
  const countAppsToday = list.filter((c) => isToday(c.created_at)).length;
  const countForwardedToHr = count("RECEPTION_FORWARDED");
  const countTechRounds = list.filter((c) => c.status.startsWith("TECHNICAL_")).length;
  const countCeoRound = count("CEO_ROUND");
  const countFinalDiscussion = count("FINAL_DISCUSSION_PENDING");
  const countSelected = count("SELECTED");
  const countOnHold = count("ON_HOLD");
  const countRejected = count("REJECTED");

  const kpis = [
    { label: "Total", value: list.length, icon: Users, tint: "text-info", bg: "bg-info/10" },
    {
      label: "Awaiting Check-in",
      value: countAwaiting,
      icon: Inbox,
      tint: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Arrived Today",
      value: countArrivedToday,
      icon: CheckCircle,
      tint: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Awaiting HR",
      value: countForwardedToHr,
      icon: Send,
      tint: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Technical",
      value: countTechRounds,
      icon: ClipboardCheck,
      tint: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "CEO Review",
      value: countCeoRound,
      icon: Crown,
      tint: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Selected",
      value: countSelected,
      icon: CheckCircle,
      tint: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "On Hold",
      value: countOnHold,
      icon: PauseCircle,
      tint: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const isReception = hasAnyRole(["RECEPTIONIST", "SYSTEM_ADMIN"]);
  const isHr = hasAnyRole(["HR_ADMIN", "SYSTEM_ADMIN"]);
  const isInterviewer = hasAnyRole(["L1_PANEL", "L2_PANEL", "TECH_HEAD"]);
  const isCeo = hasAnyRole(["CEO", "SYSTEM_ADMIN"]);

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments", "my"],
    queryFn: () =>
      api<{ assignments: InterviewAssignment[] }>(
        "/api/workflow/my-assignments?only_pending=true",
      ).then((r) => r.assignments ?? []),
    enabled: isInterviewer,
  });

  const assignmentList = assignments ?? [];
  const assignedTotal = assignmentList.length;
  const assignedToday = assignmentList.filter((a) => {
    const d = safeDate(a.assigned_at);
    if (!d) return false;
    return isToday(d.toISOString());
  }).length;

  const { data: offerStats } = useQuery({
    queryKey: ["offers", "stats"],
    queryFn: () => api<{ success: boolean; data: { total: number; pending: number } }>("/api/offers/stats").then(r => r.data),
    enabled: isHr && hasAnyPermission(["decision.final"]),
  });

  const { data: onboardingStats } = useQuery({
    queryKey: ["onboarding", "stats"],
    queryFn: () => api<{ success: boolean; data: { total: number; pending: number } }>("/api/onboarding/stats").then(r => r.data),
    enabled: isHr && hasAnyPermission(["decision.final"]),
  });

  const selectedList = list.filter((c) => c.status === "SELECTED");
  const offerPending = offerStats ? offerStats.pending : selectedList.length;
  const onboardingPending = onboardingStats ? onboardingStats.pending : selectedList.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10"
    >
      {/* Welcome Banner */}
      <header className="rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 lg:p-10 relative overflow-hidden">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter text-[#1d1d1f] relative">
          {greet()}, {user?.first_name} 👋
        </h1>
        <p className="text-sm font-medium text-[#86868b] mt-2 relative">
          Today is{" "}
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="flex flex-wrap gap-8 mt-8 relative">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
              New Applications
            </div>
            <div className="text-3xl font-mono tracking-tight text-[#1d1d1f] mt-1">{countAppsToday}</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
              Candidates Waiting
            </div>
            <div className="text-3xl font-mono tracking-tight text-[#1d1d1f] mt-1">{countAwaiting}</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
              Active Interviews
            </div>
            <div className="text-3xl font-mono tracking-tight text-[#1d1d1f] mt-1">
              {countTechRounds + countCeoRound}
            </div>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
              Pending HR Reviews
            </div>
            <div className="text-3xl font-mono tracking-tight text-[#1d1d1f] mt-1">{countForwardedToHr}</div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {isReception && (
          <>
            <Link to="/register-candidate" className="flex items-center bg-[#1d1d1f] text-white hover:bg-black rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98]">
              <UserPlus className="h-4 w-4 mr-2" /> Register Candidate
            </Link>
            <button
              className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]"
              onClick={() => {
                const url = `${window.location.origin}/register-candidate`;
                navigator.clipboard.writeText(url);
                toast.success("Registration link copied");
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Registration Link
            </button>
          </>
        )}
        {isHr && hasAnyPermission(["workflow.hr_review", "candidate.list"]) && (
          <>
            <Link to="/hr/queue" className="flex items-center bg-[#1d1d1f] text-white hover:bg-black rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98]">
              <ClipboardCheck className="h-4 w-4 mr-2" /> HR Review Queue
            </Link>
            <Link to="/candidates" className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]">
              <FolderOpen className="h-4 w-4 mr-2" /> Full Directory
            </Link>
          </>
        )}
        {isInterviewer && (
          <>
            <Link to="/interviewer/queue" className="flex items-center bg-[#1d1d1f] text-white hover:bg-black rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98]">
              <ListChecks className="h-4 w-4 mr-2" /> Interview Queue
            </Link>
            <Link to="/candidates" className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]">
              <FolderOpen className="h-4 w-4 mr-2" /> Candidate Directory
            </Link>
          </>
        )}
        {isCeo && (
          <>
            <Link to="/ceo/queue" className="flex items-center bg-[#1d1d1f] text-white hover:bg-black rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98]">
              <Crown className="h-4 w-4 mr-2" /> CEO Review Queue
            </Link>
            <Link to="/candidates" className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]">
              <FolderOpen className="h-4 w-4 mr-2" /> Candidate Directory
            </Link>
          </>
        )}
        {isHr && hasAnyPermission(["decision.final"]) && (
          <>
            <Link to="/offer/dashboard" className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]">
              <FileCheck className="h-4 w-4 mr-2" /> Offer Management
            </Link>
            <Link to="/onboarding/dashboard" className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]">
              <UserPlus className="h-4 w-4 mr-2" /> Onboarding
            </Link>
          </>
        )}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : isCeo ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "CEO Pending",
              value: countCeoRound,
              icon: Crown,
              tint: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Final Discussion",
              value: countFinalDiscussion,
              icon: Gavel,
              tint: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Selected",
              value: countSelected,
              icon: CheckCircle,
              tint: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Rejected",
              value: countRejected,
              icon: PauseCircle,
              tint: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
                      {k.label}
                    </div>
                    <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{k.value}</div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl ${k.bg} grid place-items-center`}>
                    <Icon className={`h-5 w-5 ${k.tint}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : isInterviewer ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Assigned Interviews",
              value: assignedTotal,
              icon: ListChecks,
              tint: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Assigned Today",
              value: assignedToday,
              icon: Calendar,
              tint: "text-violet-600",
              bg: "bg-violet-50",
            },
            {
              label: "Technical Queue",
              value: countTechRounds,
              icon: ClipboardCheck,
              tint: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "CEO Queue",
              value: countCeoRound,
              icon: Crown,
              tint: "text-indigo-600",
              bg: "bg-indigo-50",
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
                      {k.label}
                    </div>
                    <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{k.value}</div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl ${k.bg} grid place-items-center`}>
                    <Icon className={`h-5 w-5 ${k.tint}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">
                      {k.label}
                    </div>
                    <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{k.value}</div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl ${k.bg} grid place-items-center`}>
                    <Icon className={`h-5 w-5 ${k.tint}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role-specific queue widgets */}
      {isReception && (
        <QueueWidget
          title="Reception check-in queue"
          description="Candidates who have submitted and are awaiting arrival check-in."
          list={list.filter((c) => SUBMITTED_STATUSES.includes(c.status))}
          actionLabel="Open"
          hrefBuilder={(c) => `/candidates/${c.candidate_id}`}
          icon={Inbox}
        />
      )}

      {isHr && hasAnyPermission(["workflow.hr_review", "candidate.list"]) && (
        <QueueWidget
          title="Pending HR screenings"
          description="Candidates forwarded from reception awaiting your recruiter review."
          list={list.filter((c) => c.status === "RECEPTION_FORWARDED")}
          actionLabel="Review"
          hrefBuilder={(c) => `/hr/review/${c.candidate_id}`}
          icon={ClipboardCheck}
        />
      )}

      {isInterviewer && (
        <AssignmentWidget
          title="Your assigned interviews"
          description="Interviews assigned to you that are pending evaluation."
          assignments={assignmentList}
          isLoading={assignmentsLoading}
          actionLabel="Evaluate"
          hrefBuilder={(a) => `/interviewer/evaluate/${a.candidate_id}`}
          icon={UserCheck}
        />
      )}

      {isCeo && (
        <QueueWidget
          title="CEO evaluation queue"
          description="Candidates awaiting your executive review."
          list={list.filter((c) => c.status === "CEO_ROUND")}
          actionLabel="Evaluate"
          hrefBuilder={(c) => `/ceo/evaluate/${c.candidate_id}`}
          icon={Crown}
        />
      )}

      {isCeo && hasAnyPermission(["decision.final"]) && (
        <QueueWidget
          title="Final decisions pending"
          description="Aggregate all panel feedback and release the offer, hold, or reject."
          list={list.filter((c) => c.status === "FINAL_DISCUSSION_PENDING")}
          actionLabel="Decide"
          hrefBuilder={(c) => `/final-decision/${c.candidate_id}`}
          icon={Gavel}
        />
      )}

      {isHr && hasAnyPermission(["decision.final"]) && (
        <QueueWidget
          title="Offer management queue"
          description="Selected candidates awaiting offer letter generation and status tracking."
          list={selectedList}
          actionLabel="Build Offer"
          hrefBuilder={(c) => `/offer/builder/${c.candidate_id}`}
          icon={FileCheck}
        />
      )}

      {isHr && hasAnyPermission(["decision.final"]) && (
        <QueueWidget
          title="Onboarding queue"
          description="Selected candidates awaiting onboarding process initiation."
          list={selectedList}
          actionLabel="Start Onboarding"
          hrefBuilder={(c) => `/onboarding/${c.candidate_id}`}
          icon={UserPlus}
        />
      )}

      {/* Empty state for roles with no modules */}
      {!isReception && !isHr && !isInterviewer && !isCeo && (
        <Card className="p-12 text-center">
          <div className="text-lg font-semibold">Nothing to show yet</div>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have any dashboard modules assigned. Contact your administrator.
          </p>
        </Card>
      )}
    </motion.div>
  );
}

function QueueWidget({
  title,
  description,
  list,
  actionLabel,
  hrefBuilder,
  icon: Icon = Users,
}: {
  title: string;
  description: string;
  list: ApplicantListItem[];
  actionLabel: string;
  hrefBuilder: (c: ApplicantListItem) => string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="p-6 md:p-8 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#1d1d1f]" />
            <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">{title}</h2>
            <span className="ml-2 inline-flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f] rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide">
              {list.length}
            </span>
          </div>
          <p className="text-sm font-medium text-[#86868b] mt-1.5">{description}</p>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="p-12 text-center text-sm font-medium text-[#86868b]">
          No candidates in this queue.
        </div>
      ) : (
        <div className="flex flex-col">
          {list.slice(0, 8).map((c) => {
            const s = statusMeta(c.status);
            return (
              <div key={c.candidate_id} className="grid grid-cols-[1fr_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1d1d1f] truncate">
                    {c.first_name} {c.last_name}
                  </div>
                  <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                    {c.application_number} · {c.position_applied_for ?? "—"} · {c.email}
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className}`}>
                    {s.label}
                  </span>
                </div>
                <Link 
                  to={hrefBuilder(c)}
                  className="flex items-center bg-transparent border border-gray-200 hover:bg-gray-100 text-[#1d1d1f] rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
                >
                  {actionLabel} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentWidget({
  title,
  description,
  assignments,
  isLoading,
  actionLabel,
  hrefBuilder,
  icon: Icon = Users,
}: {
  title: string;
  description: string;
  assignments: InterviewAssignment[];
  isLoading: boolean;
  actionLabel: string;
  hrefBuilder: (a: InterviewAssignment) => string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="p-6 md:p-8 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#1d1d1f]" />
            <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">{title}</h2>
            <span className="ml-2 inline-flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f] rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide">
              {assignments.length}
            </span>
          </div>
          <p className="text-sm font-medium text-[#86868b] mt-1.5">{description}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center text-sm font-medium text-[#86868b]">No pending assignments.</div>
      ) : (
        <div className="flex flex-col">
          {assignments.slice(0, 8).map((a) => {
            const s = statusMeta(a.status);
            return (
              <div key={a.assignment_id} className="grid grid-cols-[1fr_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1d1d1f] truncate">{a.candidate_name}</div>
                  <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                    {a.position ?? "—"} · {a.domain ?? "—"} · Round {a.round_number}
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className}`}>
                    {s.label}
                  </span>
                </div>
                <Link 
                  to={hrefBuilder(a)}
                  className="flex items-center bg-transparent border border-gray-200 hover:bg-gray-100 text-[#1d1d1f] rounded-full px-5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
                >
                  {actionLabel} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
