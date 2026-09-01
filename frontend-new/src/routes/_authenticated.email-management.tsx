import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw, PlayCircle, Send, Clock, AlertCircle, Mail } from "lucide-react";
import { safeDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/email-management")({
  head: () => ({
    meta: [{ title: "Email Management — Atlas HR" }],
  }),
  component: EmailManagementPage,
});

function EmailManagementPage() {
  const { data: stats, refetch } = useQuery({
    queryKey: ["email-stats"],
    queryFn: () => api<any>("/api/email/stats"),
  });

  const processQueueMut = useMutation({
    mutationFn: () => api("/api/email/process-queue", { method: "POST" }),
    onSuccess: (data: any) => {
      toast.success(`Processed ${data.processed} emails`);
      refetch();
    },
  });

  const retryFailedMut = useMutation({
    mutationFn: () => api("/api/email/retry-failed", { method: "POST" }),
    onSuccess: (data: any) => {
      toast.success(`Retried ${data.retried} emails`);
      refetch();
    },
  });

  const { data: history } = useQuery({
    queryKey: ["email-history"],
    queryFn: () => api<any>("/api/email/history?limit=20"),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Email Management</h1>
          <p className="text-sm font-medium text-[#86868b] mt-1">
            Monitor and control the email sending queue.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => retryFailedMut.mutate()} 
            disabled={retryFailedMut.isPending}
            className="flex items-center bg-white border border-gray-200 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Failed
          </button>
          <button 
            onClick={() => processQueueMut.mutate()} 
            disabled={processQueueMut.isPending}
            className="flex items-center bg-[#1d1d1f] hover:bg-black text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            <PlayCircle className="mr-2 h-4 w-4" /> Process Queue
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#86868b] leading-tight">
                Total Sent
              </div>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 flex-shrink-0 grid place-items-center ml-2">
                <Send className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-auto text-3xl font-bold tracking-tighter text-[#1d1d1f]">{stats?.total_sent || 0}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#86868b] leading-tight">
                Pending
              </div>
              <div className="h-8 w-8 rounded-xl bg-blue-50 flex-shrink-0 grid place-items-center ml-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-auto text-3xl font-bold tracking-tighter text-[#1d1d1f]">{stats?.pending || 0}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#86868b] leading-tight">
                Failed
              </div>
              <div className="h-8 w-8 rounded-xl bg-red-50 flex-shrink-0 grid place-items-center ml-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="mt-auto text-3xl font-bold tracking-tighter text-[#1d1d1f]">{stats?.failed || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3 bg-[#fbfbfd]">
          <div className="h-10 w-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <Mail className="h-5 w-5 text-[#1d1d1f]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Recent Email History</h2>
            <p className="text-sm font-medium text-[#86868b] mt-0.5">
              Latest emails processed by the system.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col">
          {history?.items?.map((item: any) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors">
              <div className="min-w-0 pr-4">
                <div className="text-sm font-bold text-[#1d1d1f] truncate">{item.subject}</div>
                <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                  To: {item.recipient_email}
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                <span
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wide ${
                    item.status === 'SENT' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : item.status === 'FAILED' 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs font-medium text-[#86868b]">
                  {safeDate(item.created_at)?.toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          {(!history?.items || history.items.length === 0) && (
            <div className="p-16 text-center text-sm font-medium text-[#86868b]">
              No recent emails.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

