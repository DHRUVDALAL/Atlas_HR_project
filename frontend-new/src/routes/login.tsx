import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, Users, LineChart, FileText } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Atlas HR" },
      { name: "description", content: "Sign in to the Atlas HR recruitment management console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#86868b]" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Signed in");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  const smoothEase = [0.16, 1, 0.3, 1];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white font-sans text-[#1d1d1f] selection:bg-[#0066cc] selection:text-white">
      
      {/* Left Pane - Abstract Bento Grid */}
      <div className="hidden lg:flex flex-col justify-between bg-[#fbfbfd] p-12 relative overflow-hidden border-r border-gray-100">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
          className="flex items-center gap-4 z-10"
        >
          <img src="/logo.png" alt="Atlas Logo" className="h-10 w-auto" />
          <div>
            <div className="font-bold tracking-tight text-xl text-[#1d1d1f]">Atlas HR</div>
            <div className="text-sm font-medium text-[#86868b]">Recruitment Console</div>
          </div>
        </motion.div>
        
        <div className="space-y-16 z-10 max-w-lg mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: smoothEase }}
            className="text-[3.5rem] font-bold tracking-tighter leading-[1.05] text-[#1d1d1f]"
          >
            Move candidates through every stage with confidence.
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: smoothEase }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mb-5">
                <Users size={20} />
              </div>
              <div className="font-bold text-[#1d1d1f] mb-1">7 Dimensions</div>
              <div className="text-sm font-medium text-[#86868b]">SAP Screening</div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mb-5">
                <LineChart size={20} />
              </div>
              <div className="font-bold text-[#1d1d1f] mb-1">L1 / L2 Panels</div>
              <div className="text-sm font-medium text-[#86868b]">Technical Rounds</div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mb-5">
                <ShieldCheck size={20} />
              </div>
              <div className="font-bold text-[#1d1d1f] mb-1">CEO Review</div>
              <div className="text-sm font-medium text-[#86868b]">Executive Offer</div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mb-5">
                <FileText size={20} />
              </div>
              <div className="font-bold text-[#1d1d1f] mb-1">Full Audit</div>
              <div className="text-sm font-medium text-[#86868b]">Activity Logs</div>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-xs font-bold text-[#86868b] mt-20 z-10"
        >
          &copy; {new Date().getFullYear()} Abhiyanta India Solutions. All rights reserved.
        </motion.div>
      </div>

      {/* Right Pane - Clean Form Canvas */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: smoothEase }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 lg:hidden mb-12">
            <img src="/logo.png" alt="Atlas Logo" className="h-8 w-auto" />
            <span className="font-bold text-xl tracking-tight text-[#1d1d1f]">Atlas HR</span>
          </div>
          
          <h2 className="text-[2.5rem] font-bold tracking-tight mb-3 text-[#1d1d1f] leading-none">Sign in</h2>
          <p className="text-base font-medium text-[#86868b] mb-10">Use your Atlas HR staff credentials to access the portal.</p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-[#1d1d1f]">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@abhiyanta.com"
                className="rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 focus:border-[#0066cc] transition-all h-[3.5rem] px-5 shadow-none text-base font-medium placeholder:text-[#86868b]"
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="password" className="text-sm font-bold text-[#1d1d1f]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 focus:border-[#0066cc] transition-all h-[3.5rem] px-5 pr-12 shadow-none text-base font-medium placeholder:text-[#86868b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-full bg-[#1d1d1f] text-white hover:bg-black h-[3.5rem] text-base font-bold shadow-sm transition-all active:scale-[0.98] mt-8" 
              disabled={busy}
            >
              {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm font-medium text-[#86868b]">
            Are you a candidate?{" "}
            <Link to="/register-candidate" className="text-[#1d1d1f] font-bold hover:underline transition-all">
              Start your application
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
