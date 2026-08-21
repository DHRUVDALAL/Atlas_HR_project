import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { safeDate } from "@/lib/utils";
import type { InterviewAssignment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusMeta } from "@/lib/scorecard";
import {
  Search,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Clock,
  UserCheck,
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/interviewer/queue")({
  head: () => ({ meta: [{ title: "Interview Queue — Atlas HR" }] }),
  component: InterviewQueue,
});

function InterviewQueue() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useQuery({
    queryKey: ["assignments", "my", search, statusFilter, sortOrder],
    queryFn: () =>
      api<{ assignments: InterviewAssignment[] }>(
        `/api/workflow/my-assignments?only_pending=true`,
      ).then((r) => {
        let list = r.assignments ?? [];
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (a) =>
              a.candidate_name.toLowerCase().includes(q) ||
              a.position?.toLowerCase().includes(q) ||
              a.domain?.toLowerCase().includes(q),
          );
        }
        if (statusFilter !== "all") {
          list = list.filter((a) => a.status === statusFilter);
        }
        list.sort((a, b) => {
          const da = safeDate(a.assigned_at)?.getTime() ?? 0;
          const db = safeDate(b.assigned_at)?.getTime() ?? 0;
          return sortOrder === "asc" ? da - db : db - da;
        });
        return list;
      }),
  });

  const assignments = data ?? [];
  const totalPending = assignments.filter((a) => a.status === "PENDING").length;
  const totalInProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Interview Queue</h1>
        <p className="text-sm font-medium text-[#86868b] mt-1">
          Your assigned interviews — evaluate candidates after each round.
        </p>
      </header>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-8 w-12 mb-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">Total Assigned</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{assignments.length}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-blue-50 grid place-items-center">
                <ListChecks className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">Pending</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalPending}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-amber-50 grid place-items-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">In Progress</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalInProgress}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 grid place-items-center">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            placeholder="Search by name, position, or domain…"
            className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-[#f5f5f7] border-transparent rounded-2xl h-11 px-4 text-sm font-medium">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
              <SelectItem value="all" className="rounded-xl cursor-pointer">All statuses</SelectItem>
              <SelectItem value="PENDING" className="rounded-xl cursor-pointer">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS" className="rounded-xl cursor-pointer">In Progress</SelectItem>
              <SelectItem value="COMPLETED" className="rounded-xl cursor-pointer">Completed</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="h-11 px-5 flex items-center justify-center bg-transparent hover:bg-gray-50 text-[#86868b] border border-gray-200 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === "asc" ? "Oldest first" : "Newest first"}
          </button>
        </div>
      </div>

      {/* Assignment list */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
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
        ) : assignments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-lg font-bold text-[#1d1d1f]">No interviews assigned</div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              You don't have any pending interview assignments.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {assignments.map((a) => {
              const s = statusMeta(a.status);
              return (
                <div key={a.assignment_id} className="grid grid-cols-[auto_1fr_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                    {a.candidate_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{a.candidate_name}</div>
                    <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                      {a.position ?? "—"} · {a.domain ?? "—"} · Round {a.round_number} · Assigned{" "}
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-end w-28">
                    <Link 
                      to={`/interviewer/evaluate/${a.candidate_id}`}
                      className="flex items-center bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                    >
                      Evaluate <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
