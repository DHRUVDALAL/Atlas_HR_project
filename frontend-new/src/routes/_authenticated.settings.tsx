import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      return api("/api/auth/change-password", {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to change password.");
    },
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 lg:p-10 max-w-2xl mx-auto space-y-8"
    >
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Settings</h1>
        <p className="text-sm font-medium text-[#86868b] mt-2">
          Manage your account settings and security.
        </p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3 bg-[#fbfbfd]">
          <div className="h-10 w-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-[#1d1d1f]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Change Password</h2>
            <p className="text-sm font-medium text-[#86868b] mt-0.5">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Current Password</Label>
            <input
              type="password"
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 h-12 text-sm text-[#1d1d1f] transition-all outline-none placeholder:text-[#86868b]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">New Password</Label>
            <input
              type="password"
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 h-12 text-sm text-[#1d1d1f] transition-all outline-none placeholder:text-[#86868b]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Confirm New Password</Label>
            <input
              type="password"
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 h-12 text-sm text-[#1d1d1f] transition-all outline-none placeholder:text-[#86868b]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        
        <div className="px-8 py-5 bg-[#fbfbfd] border-t border-gray-100 flex justify-end">
          <button
            onClick={() => changePassword.mutate()}
            disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending}
            className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-sm font-bold shadow-sm hover:bg-[#005bb5] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {changePassword.isPending ? "Changing..." : "Update Password"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
