import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, Clock, Send, FileCheck, ArrowRight, TrendingUp } from "lucide-react";

interface OfferStats {
  total_offers: number;
  pending_offers: number;
  accepted_offers: number;
  declined_offers: number;
  avg_processing_days: number;
  offers_this_month: number;
}

interface OfferListItem {
  offer_id: string;
  candidate_id: string;
  application_number: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  offered_ctc: number;
  joining_date: string;
  created_at: string;
}

export const Route = createFileRoute("/_authenticated/offer/dashboard")({
  head: () => ({
    meta: [{ title: "Offer Dashboard — Atlas HR" }],
  }),
  component: OfferDashboard,
});

function OfferDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["offers", "stats"],
    queryFn: () => api<{ success: boolean; data: OfferStats }>("/api/offers/stats"),
  });

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ["offers", "list"],
    queryFn: () =>
      api<{ success: boolean; total: number; data: OfferListItem[] }>("/api/offers?limit=500"),
  });

  const isLoading = statsLoading || offersLoading;
  const stats = statsData?.data;
  const offers = offersData?.data ?? [];

  const kpis = [
    {
      label: "Total Offers",
      value: stats?.total_offers ?? 0,
      icon: Users,
      tint: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending",
      value: stats?.pending_offers ?? 0,
      icon: Clock,
      tint: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Accepted",
      value: stats?.accepted_offers ?? 0,
      icon: CheckCircle,
      tint: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Declined",
      value: stats?.declined_offers ?? 0,
      icon: FileCheck,
      tint: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "This Month",
      value: stats?.offers_this_month ?? 0,
      icon: Send,
      tint: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Avg Processing Days",
      value: stats?.avg_processing_days != null ? `${stats.avg_processing_days.toFixed(1)}d` : "—",
      icon: TrendingUp,
      tint: "text-violet-600",
      bg: "bg-violet-50",
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
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter relative z-10">Offer Management</h1>
        <p className="text-sm font-medium text-white/70 mt-2 relative z-10 max-w-lg">
          Track selected candidates, build offers, and manage offer lifecycle.
        </p>
        
        <div className="flex flex-wrap gap-8 mt-10 relative z-10">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              Total Offers
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.total_offers ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              Pending Offers
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.pending_offers ?? 0}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-1">
              Accepted
            </div>
            <div className="text-3xl font-bold tracking-tighter text-white">{stats?.accepted_offers ?? 0}</div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link 
          to="/offer/queue"
          className="flex items-center bg-white border border-gray-200 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <FileCheck className="h-4 w-4 mr-2" /> Offer Queue
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <Skeleton className="h-4 w-16 mb-4" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Recent Offers */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-[#fbfbfd]">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#1d1d1f]" />
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Recent Offers</h2>
              <span className="bg-[#f5f5f7] text-[#86868b] text-xs font-bold px-2 py-1 rounded-full">{offers.length}</span>
            </div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              Latest offer records and their current status.
            </p>
          </div>
          <Link 
            to="/offer/queue"
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
          ) : offers.length === 0 ? (
            <div className="p-16 text-center text-sm font-medium text-[#86868b]">
              No offers created yet. Offers will appear here once candidates are moved to SELECTED
              status and offers are generated.
            </div>
          ) : (
            <div>
              {offers.slice(0, 10).map((offer) => (
                <div key={offer.offer_id} className="grid grid-cols-[auto_1fr_auto_auto] gap-6 px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                    {offer.candidate_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{offer.candidate_name}</div>
                    <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                      {offer.application_number} · {offer.candidate_email}
                      {offer.offered_ctc ? ` · ₹${(offer.offered_ctc / 100000).toFixed(1)}L CTC` : ""}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                        offer.status === "ACCEPTED"
                          ? "bg-emerald-50 text-emerald-700"
                          : offer.status === "SENT"
                            ? "bg-blue-50 text-blue-700"
                            : offer.status === "DECLINED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-end w-24">
                    <Link
                      to={`/offer/preview/$candidateId`}
                      params={{ candidateId: offer.candidate_id }}
                      className="flex items-center bg-transparent hover:bg-gray-100 border border-gray-200 text-[#1d1d1f] rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                    >
                      View <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
