import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ApplicantListItem } from "@/lib/types";
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
  Crown,
  Gavel,
  CheckCircle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ceo/queue")({
  head: () => ({ meta: [{ title: "CEO Review Queue — Atlas HR" }] }),
  component: CeoQueue,
});

function CeoQueue() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"ceo" | "final">("ceo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useQuery({
    queryKey: ["applicants", "ceo-queue", view, search, sortOrder],
    queryFn: () =>
      api<{ applicants: ApplicantListItem[] }>("/api/applicants?limit=500").then((r) => {
        let list = r.applicants ?? [];
        const targetStatus = view === "ceo" ? "CEO_ROUND" : "FINAL_DISCUSSION_PENDING";
        list = list.filter((c) => c.status === targetStatus);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (c) =>
              c.first_name.toLowerCase().includes(q) ||
              c.last_name.toLowerCase().includes(q) ||
              c.application_number.toLowerCase().includes(q) ||
              c.position_applied_for?.toLowerCase().includes(q),
          );
        }
        list.sort((a, b) => {
          const da = new Date(a.created_at).getTime();
          const db = new Date(b.created_at).getTime();
          return sortOrder === "asc" ? da - db : db - da;
        });
        return list;
      }),
  });

  const ceoCount = isLoading ? 0 : (data ?? []).length;

  const { data: allData } = useQuery({
    queryKey: ["applicants", "all"],
    queryFn: () =>
      api<{ applicants: ApplicantListItem[] }>("/api/applicants?limit=500").then(
        (r) => r.applicants ?? [],
      ),
  });

  const allList = allData ?? [];
  const totalCeo = allList.filter((c) => c.status === "CEO_ROUND").length;
  const totalFinal = allList.filter((c) => c.status === "FINAL_DISCUSSION_PENDING").length;
  const totalSelected = allList.filter((c) => c.status === "SELECTED").length;
  const totalRejected = allList.filter((c) => c.status === "REJECTED").length;

  const candidates = data ?? [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f] flex items-center gap-3">
          <Crown className="h-8 w-8 text-indigo-600" />
          CEO Review Queue
        </h1>
        <p className="text-sm font-medium text-[#86868b] mt-1 ml-11">
          Candidates awaiting executive evaluation or final discussion.
        </p>
      </header>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-8 w-12 mb-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">CEO Pending</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalCeo}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 grid place-items-center">
                <Crown className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">Final Discussion</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalFinal}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-amber-50 grid place-items-center">
                <Gavel className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">Selected</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalSelected}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-green-50 grid place-items-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase">Rejected</div>
                <div className="text-4xl font-bold tracking-tighter text-[#1d1d1f] mt-4">{totalRejected}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-red-50 grid place-items-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View toggle + Search */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-[#f5f5f7] p-1.5 rounded-[1.25rem]">
          <button
            onClick={() => setView("ceo")}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === "ceo" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            <Crown className="h-4 w-4 mr-2" /> CEO Reviews ({totalCeo})
          </button>
          <button
            onClick={() => setView("final")}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === "final" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#86868b] hover:text-[#1d1d1f]"
            }`}
          >
            <Gavel className="h-4 w-4 mr-2" /> Final Decisions ({totalFinal})
          </button>
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            placeholder="Search candidates…"
            className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button
          className="h-11 px-5 flex items-center justify-center bg-transparent hover:bg-gray-50 text-[#86868b] border border-gray-200 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {sortOrder === "asc" ? "Oldest first" : "Newest first"}
        </button>
      </div>

      {/* Candidate list */}
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
        ) : candidates.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-lg font-bold text-[#1d1d1f]">No candidates</div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              {view === "ceo"
                ? "No candidates awaiting CEO evaluation."
                : "No candidates in final discussion."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {candidates.map((c) => {
              const s = statusMeta(c.status);
              const actionHref =
                view === "ceo"
                  ? `/ceo/evaluate/${c.candidate_id}`
                  : `/final-decision/${c.candidate_id}`;
              const actionLabel = view === "ceo" ? "Evaluate" : "Decide";
              
              return (
                <div key={c.candidate_id} className="grid grid-cols-[auto_1fr_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="min-w-0 pr-4">
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
                  <div className="flex items-center justify-end w-28">
                    <Link 
                      to={actionHref}
                      className={`flex items-center ${view === "ceo" ? "bg-[#0066cc] hover:bg-[#005bb5]" : "bg-[#1d1d1f] hover:bg-black"} text-white rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98]`}
                    >
                      {actionLabel} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
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
