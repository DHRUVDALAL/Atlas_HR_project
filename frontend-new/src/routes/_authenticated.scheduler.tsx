import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PlayCircle, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scheduler")({
  head: () => ({
    meta: [{ title: "Scheduler — Atlas HR" }],
  }),
  component: SchedulerPage,
});

function SchedulerPage() {
  const { data: status, refetch } = useQuery({
    queryKey: ["scheduler-status"],
    queryFn: () => api<any>("/api/scheduler/status"),
  });

  const runDailyMut = useMutation({
    mutationFn: () => api("/api/scheduler/run-daily", { method: "POST" }),
    onSuccess: () => {
      toast.success("Daily scheduler job executed");
      refetch();
    },
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8"
    >
      <header className="mb-10 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter text-[#1d1d1f]">System Scheduler</h1>
        <p className="text-sm font-medium text-[#86868b] mt-2">
          Manage background tasks and daily reminders.
        </p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Daily Reminders</h2>
                <p className="text-sm font-medium text-[#86868b] mt-1 max-w-md leading-relaxed">
                  Manually trigger the daily reminder job. This job sends interview reminder emails and updates overdue task statuses.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => runDailyMut.mutate()} 
              disabled={runDailyMut.isPending}
              className="flex items-center bg-[#1d1d1f] hover:bg-black text-white rounded-full px-8 py-3.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shrink-0"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> 
              {runDailyMut.isPending ? "Running..." : "Run Daily Reminders"}
            </button>
          </div>
          
          {status && (
            <div className="mt-8 rounded-2xl bg-[#1d1d1f] overflow-hidden shadow-inner">
              <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Scheduler Status</span>
              </div>
              <div className="p-6 overflow-auto">
                <pre className="text-[13px] leading-relaxed text-[#f5f5f7] font-mono">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
