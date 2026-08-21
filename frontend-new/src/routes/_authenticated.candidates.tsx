import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ApplicantListItem, CandidateStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusMeta, STATUS_META } from "@/lib/scorecard";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidates")({
  head: () => ({ meta: [{ title: "Candidates — Atlas HR" }] }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  const isDetail = segments.length > 1 && segments[0] === "candidates";

  if (isDetail) {
    return <Outlet />;
  }

  return <CandidatesList />;
}

const PAGE_SIZE = 10;

function CandidatesList() {
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setDebounceTimer(timer);
  };

  const skip = (page - 1) * PAGE_SIZE;

  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));
  params.set("skip", String(skip));
  if (status !== "ALL") params.set("status", status);
  if (debouncedSearch) params.set("search", debouncedSearch);
  params.set("sort_by", sortBy);
  params.set("sort_order", sortOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["applicants", status, debouncedSearch, page, sortBy, sortOrder],
    queryFn: () =>
      api<{
        success: boolean;
        total: number;
        applicants: ApplicantListItem[];
      }>(`/api/applicants?${params.toString()}`),
  });

  const rows = data?.applicants ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Candidates</h1>
          <p className="text-sm font-medium text-[#86868b] mt-1">
            Full applicant roster across every workflow stage.
          </p>
        </div>
        <Link 
          to="/register-candidate"
          className="flex items-center bg-[#1d1d1f] text-white hover:bg-black rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          New registration
        </Link>
      </header>

      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, email, application #"
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-[#f5f5f7] border-transparent rounded-2xl h-11 px-4 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                <SelectItem value="ALL" className="rounded-xl cursor-pointer">All statuses</SelectItem>
                {Object.keys(STATUS_META).map((s) => (
                  <SelectItem key={s} value={s} className="rounded-xl cursor-pointer">
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-[#f5f5f7] border-transparent rounded-2xl h-11 px-4 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                <SelectItem value="created_at" className="rounded-xl cursor-pointer">Sort by Date</SelectItem>
                <SelectItem value="experience" className="rounded-xl cursor-pointer">Sort by Experience</SelectItem>
              </SelectContent>
            </Select>

            <button
              className="h-11 w-11 flex items-center justify-center bg-[#f5f5f7] hover:bg-gray-200 text-[#1d1d1f] rounded-2xl transition-colors"
              onClick={() => {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                setPage(1);
              }}
            >
              {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </button>

            {(status !== "ALL" || debouncedSearch) && (
              <button
                className="h-11 px-5 flex items-center justify-center bg-transparent hover:bg-gray-50 text-[#86868b] border border-gray-200 rounded-2xl text-sm font-medium transition-colors"
                onClick={() => {
                  setStatus("ALL");
                  setSearch("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="text-xs font-medium text-[#86868b] px-2">
          {total} candidate{total !== 1 ? "s" : ""} found
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        {/* Header Row */}
        <div className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr_auto] gap-4 bg-[#fbfbfd] px-8 py-5 border-b border-gray-100 items-center">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Applicant</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Application #</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Position</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Status</div>
          <div 
            className="text-[11px] font-bold uppercase tracking-widest text-[#86868b] flex items-center cursor-pointer hover:text-[#1d1d1f] transition-colors"
            onClick={() => toggleSort("created_at")}
          >
            Applied <SortIcon field="created_at" />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b] text-right w-32">Actions</div>
        </div>

        {/* Data Rows */}
        <div className="flex flex-col">
          {isLoading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr_auto] gap-4 px-8 py-6 border-b border-gray-50/50 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 ml-auto" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm font-medium text-[#86868b]">
              No candidates found.
            </div>
          ) : (
            rows.map((c) => {
              const s = statusMeta(c.status);
              return (
                <div key={c.candidate_id} className="grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr_auto] gap-4 px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">{c.email}</div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#1d1d1f] truncate">
                    {c.application_number}
                  </div>
                  <div className="text-sm font-medium text-[#1d1d1f] truncate pr-4">
                    {c.position_applied_for ?? "—"}
                  </div>
                  <div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#86868b]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-end gap-2 w-32">
                    <Link 
                      to={`/candidates/${c.candidate_id}`}
                      className="bg-transparent hover:bg-gray-100 text-[#1d1d1f] rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                    >
                      Open
                    </Link>
                    <ContextAction status={c.status} id={c.candidate_id} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ContextAction({ status, id }: { status: CandidateStatus; id: string }) {
  if (status.startsWith("TECHNICAL_")) {
    return (
      <Link 
        to={`/interviewer/evaluate/${id}`}
        className="bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
      >
        Evaluate
      </Link>
    );
  }
  switch (status) {
    case "RECEPTION_FORWARDED":
      return (
        <Link 
          to={`/hr/review/${id}`}
          className="bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          Review
        </Link>
      );
    case "CEO_ROUND":
      return (
        <Link 
          to={`/ceo/evaluate/${id}`}
          className="bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          CEO Review
        </Link>
      );
    case "FINAL_DISCUSSION_PENDING":
      return (
        <Link 
          to={`/final-decision/${id}`}
          className="bg-[#1d1d1f] hover:bg-black text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          Decide
        </Link>
      );
    default:
      return null;
  }
}
