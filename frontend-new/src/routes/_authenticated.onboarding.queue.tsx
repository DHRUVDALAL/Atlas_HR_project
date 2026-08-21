import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, UserPlus, FileCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingQueueItem {
  onboarding_id: string;
  candidate_id: string;
  application_number: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  progress_percent: number;
}

interface OnboardingQueueResponse {
  success: boolean;
  total: number;
  data: OnboardingQueueItem[];
}

export const Route = createFileRoute("/_authenticated/onboarding/queue")({
  head: () => ({
    meta: [{ title: "Employee Queue — Atlas HR" }],
  }),
  component: EmployeeQueue,
});

type OnboardingFilter = "all" | "pending" | "in_progress" | "completed";

const statusParamMap: Record<OnboardingFilter, string | undefined> = {
  all: undefined,
  pending: "PENDING",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
};

function EmployeeQueue() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OnboardingFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const skip = (page - 1) * pageSize;

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(pageSize),
    sort_by: "created_at",
    sort_order: "desc",
  });

  const statusParam = statusParamMap[filter];
  if (statusParam) params.set("status", statusParam);
  if (search) params.set("search", search);

  const { data: onboardingData, isLoading } = useQuery<OnboardingQueueResponse>({
    queryKey: [
      "onboarding",
      {
        skip,
        limit: pageSize,
        status: statusParam,
        search,
        sort_by: "created_at",
        sort_order: "desc",
      },
    ],
    queryFn: () => api<OnboardingQueueResponse>(`/api/onboarding?${params.toString()}`),
  });

  const items = onboardingData?.data ?? [];
  const total = onboardingData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Employee Queue</h1>
          <p className="text-sm font-medium text-[#86868b] mt-1">
            Manage onboarding for selected candidates.
          </p>
        </div>
        <Link 
          to="/onboarding/dashboard"
          className="flex items-center bg-white border border-gray-200 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Dashboard
        </Link>
      </header>

      {/* Search & Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
            <input
              type="text"
              placeholder="Search by name, email, application number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition-all outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(["all", "pending", "in_progress", "completed"] as OnboardingFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-5 py-2.5 text-sm font-bold rounded-2xl transition-colors ${
                  filter === f
                    ? "bg-[#1d1d1f] text-white shadow-sm"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "pending"
                    ? "Pending"
                    : f === "in_progress"
                      ? "In Progress"
                      : "Completed"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
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
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <UserPlus className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <div className="text-lg font-bold text-[#1d1d1f]">No candidates found</div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              {search
                ? "Try adjusting your search terms."
                : filter !== "all"
                  ? "No candidates match this filter."
                  : "No selected candidates yet. Onboarding will appear here once candidates reach SELECTED status."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => {
              const statusUpper = item.status?.toUpperCase();
              const nameParts = item.candidate_name?.split(" ") ?? [];
              const initials =
                nameParts.length >= 2
                  ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                  : (item.candidate_name?.[0]?.toUpperCase() ?? "?");

              return (
                <div key={item.candidate_id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                    {initials}
                  </div>
                  
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{item.candidate_name}</div>
                    <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                      {item.application_number}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-end">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#86868b]">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span className={item.progress_percent === 100 ? "text-emerald-600" : ""}>
                        {item.progress_percent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                        statusUpper === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : statusUpper === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {statusUpper === "COMPLETED"
                        ? "Completed"
                        : statusUpper === "IN_PROGRESS"
                          ? "In Progress"
                          : statusUpper === "PENDING"
                            ? "Pending"
                            : item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-end w-24">
                    <Link
                      to="/onboarding/$candidateId"
                      params={{ candidateId: item.candidate_id }}
                      className={`flex items-center ${statusUpper === "PENDING" ? "bg-[#0066cc] hover:bg-[#005bb5] text-white" : "bg-transparent hover:bg-gray-100 border border-gray-200 text-[#1d1d1f]"} rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98]`}
                    >
                      {statusUpper === "PENDING" ? <>Start <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></> : <>View <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-[#fbfbfd] border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm font-medium text-[#86868b]">
              Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
