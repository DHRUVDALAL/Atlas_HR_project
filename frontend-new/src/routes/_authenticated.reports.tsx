import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Users, FileText, Briefcase } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [{ title: "Reports — Atlas HR" }],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const download = (path: string) => {
    window.open(`${API_BASE_URL}${path}`, "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8"
    >
      <header className="mb-10 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter text-[#1d1d1f]">Reports & Exports</h1>
        <p className="text-sm font-medium text-[#86868b] mt-2">
          Download CSV data extracts for offline analysis.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Candidates Export</h2>
            <p className="text-sm font-medium text-[#86868b] mt-2 leading-relaxed">
              All applicants and their current pipeline status. Includes contact info, screening results, and interview scores.
            </p>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => download("/api/reports/candidates/export")}
              className="w-full flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Offers Export</h2>
            <p className="text-sm font-medium text-[#86868b] mt-2 leading-relaxed">
              Offer letters and candidate CTC details. Includes breakdown of salary components and offer status.
            </p>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => download("/api/reports/offers/export")}
              className="w-full flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-6">
              <Briefcase className="h-6 w-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Onboarding Export</h2>
            <p className="text-sm font-medium text-[#86868b] mt-2 leading-relaxed">
              Onboarding pipeline status and timelines. Includes document verification and IT asset allocation status.
            </p>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => download("/api/reports/onboarding/export")}
              className="w-full flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
