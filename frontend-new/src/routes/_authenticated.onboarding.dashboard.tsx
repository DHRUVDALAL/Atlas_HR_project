import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  FileCheck,
  Shield,
  Laptop,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface OnboardingStats {
  total_employees: number;
  in_progress: number;
  completed: number;
  documents_pending: number;
  bgv_pending: number;
  assets_pending: number;
  onboarding_this_month: number;
}

interface OnboardingListItem {
  onboarding_id: string;
  candidate_id: string;
  application_number: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  progress_percent: number;
}

export const Route = createFileRoute("/_authenticated/onboarding/dashboard")({
  head: () => ({
    meta: [{ title: "Onboarding Dashboard — Atlas HR" }],
  }),
  component: OnboardingDashboard,
});

function OnboardingDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["onboarding", "stats"],
    queryFn: () =>
      api<{ success: boolean; data: OnboardingStats }>("/api/onboarding/stats").then((r) => r.data),
  });

  const { data: onboardings, isLoading: onboardingsLoading } = useQuery({
    queryKey: ["onboarding", "list"],
    queryFn: () =>
      api<{ success: boolean; total: number; data: OnboardingListItem[] }>(
        "/api/onboarding?limit=500",
      ).then((r) => r.data ?? []),
  });

  const isLoading = statsLoading || onboardingsLoading;

  const kpis = [
    {
      label: "Total Employees",
      value: stats?.total_employees ?? 0,
      icon: Users,
      tint: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "In Progress",
      value: stats?.in_progress ?? 0,
      icon: TrendingUp,
      tint: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      icon: CheckCircle,
      tint: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pending Documents",
      value: stats?.documents_pending ?? 0,
      icon: FileCheck,
      tint: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "BGV Pending",
      value: stats?.bgv_pending ?? 0,
      icon: Shield,
      tint: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "IT Assets Pending",
      value: stats?.assets_pending ?? 0,
      icon: Laptop,
      tint: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Joining This Month",
      value: stats?.onboarding_this_month ?? 0,
      icon: Calendar,
      tint: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <header className="rounded-[2.5rem] bg-[#1d1d1f] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter relative z-10">
          Employee Onboarding
        </h1>
        <p className="text-sm font-medium text-white/70 mt-2 relative z-10 max-w-lg">
          Manage the complete onboarding lifecycle for selected candidates.
        </p>
        
        <div className="flex flex-wrap gap-8 mt-10 relative z-10">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              Total Employees
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.total_employees ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              In Progress
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.in_progress ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              Completed
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.completed ?? 0}</div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link 
          to="/onboarding/queue"
          className="flex items-center bg-white border border-gray-200 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Employee Queue
        </Link>
        <Link 
          to="/candidates"
          className="flex items-center bg-white border border-gray-200 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Users className="h-4 w-4 mr-2" /> Candidate Directory
        </Link>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-[#86868b] leading-tight">
                      {k.label}
                    </div>
                    <div className={`h-8 w-8 rounded-xl ${k.bg} flex-shrink-0 grid place-items-center ml-2`}>
                      <Icon className={`h-4 w-4 ${k.tint}`} />
                    </div>
                  </div>
                  <div className="mt-auto text-2xl font-bold tracking-tighter text-[#1d1d1f]">{k.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-[#fbfbfd]">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#1d1d1f]" />
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Recent Onboarding Activity</h2>
            </div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              Latest onboarding actions across all selected candidates.
            </p>
          </div>
          <Link 
            to="/onboarding/queue"
            className="flex items-center bg-transparent hover:bg-gray-100 text-[#1d1d1f] rounded-full px-5 py-2 text-xs font-bold transition-all"
          >
            View All <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </div>
        
        <div className="flex flex-col">
          {isLoading ? (
            <div className="p-4 space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-8 py-6 border-b border-gray-50/50">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const recent = (onboardings ?? [])
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 8);

              if (recent.length === 0) {
                return (
                  <div className="p-16 text-center text-sm font-medium text-[#86868b]">
                    No onboarding activity yet. Start onboarding for selected candidates.
                  </div>
                );
              }

              return (
                <div>
                  {recent.map((item) => (
                    <div key={item.onboarding_id} className="grid grid-cols-[auto_1fr_auto] gap-6 px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                      <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                        {item.candidate_name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 pr-4">
                        <div className="text-sm font-bold text-[#1d1d1f] truncate">{item.candidate_name}</div>
                        <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                          {item.status.replace(/_/g, " ")} · {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Link
                          to="/onboarding/$candidateId"
                          params={{ candidateId: item.candidate_id }}
                          className="flex items-center bg-transparent hover:bg-gray-100 border border-gray-200 text-[#1d1d1f] rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                        >
                          View <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </motion.div>
  );
}
