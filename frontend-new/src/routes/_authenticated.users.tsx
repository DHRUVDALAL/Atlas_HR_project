import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, KeyRound, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Employee Management — Atlas HR" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<any[]>("/api/users?limit=200").then((r) => r ?? []),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api<any[]>("/api/roles").then((r) => r ?? []),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api(`/api/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User deleted successfully.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete user."),
  });

  const filteredUsers = (users || []).filter(u => 
    `${u.first_name} ${u.last_name} ${u.email} ${u.employee_code}`.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">Employee Management</h1>
          <p className="text-sm font-medium text-[#86868b] mt-1">
            Manage system users, roles, and access.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center bg-[#1d1d1f] hover:bg-black text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </button>
      </header>

      {/* Search */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <div className="relative flex-1 w-full max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl pl-11 pr-5 py-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition-all outline-none"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-12 w-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
              <Search className="h-5 w-5 text-[#86868b]" />
            </div>
            <div className="text-lg font-bold text-[#1d1d1f]">No employees found</div>
            <p className="text-sm font-medium text-[#86868b] mt-1">
              Try adjusting your search terms or add a new employee.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredUsers.map((u) => {
              return (
                <div key={u.user_id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 px-6 md:px-8 py-5 border-b border-gray-50/50 hover:bg-[#f5f5f7]/60 transition-colors items-center">
                  <div className="h-10 w-10 rounded-full bg-[#f5f5f7] grid place-items-center text-[#1d1d1f] font-bold text-xs">
                    {u.first_name?.[0]?.toUpperCase()}{u.last_name?.[0]?.toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-[#1d1d1f] truncate">{u.first_name} {u.last_name}</div>
                    <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
                      {u.email} • {u.employee_code}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-700 tracking-wide">
                      {u.role?.role_name || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 w-20">
                    <button
                      onClick={() => setEditUser(u)}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-transparent text-[#86868b] hover:bg-gray-100 hover:text-[#1d1d1f] transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${u.first_name}?`)) {
                          deleteMutation.mutate(u.user_id);
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-full border border-transparent text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <UserModal
          roles={roles || []}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            qc.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      )}

      {/* Edit Modal */}
      {editUser && (
        <UserModal
          user={editUser}
          roles={roles || []}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            qc.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      )}
    </motion.div>
  );
}

function UserModal({ user, roles, onClose, onSuccess }: any) {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    employee_code: user?.employee_code || "",
    role_id: user?.role_id || "",
      secondary_role_id: user?.secondary_role_id || "none",
    department: user?.department || "",
    password: "", // Only for create, or optional for edit (reset)
    is_active: user ? user.is_active : true,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        // Exclude empty password on edit
        const payload: any = { ...formData };
        if (payload.secondary_role_id === 'none') payload.secondary_role_id = null;
        if (!payload.password) delete payload.password;
        return api(`/api/users/${user.user_id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        return api("/api/users", {
          method: "POST",
          body: { ...formData, secondary_role_id: formData.secondary_role_id === 'none' ? null : formData.secondary_role_id },
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "User updated" : "User created");
      onSuccess();
    },
    onError: (e: any) => toast.error(e.message || "Operation failed"),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:rounded-[2.5rem] p-8 border-none shadow-[0_20px_60px_rgb(0,0,0,0.12)]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold tracking-tighter text-[#1d1d1f]">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">First Name</Label>
              <input
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Last Name</Label>
              <input
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Email</Label>
            <input
              type="email"
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Employee ID</Label>
              <input
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none disabled:opacity-50"
                value={formData.employee_code}
                onChange={e => setFormData({ ...formData, employee_code: e.target.value })}
                disabled={isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Secondary Role (Optional)</Label>
              <Select
                value={formData.secondary_role_id}
                onValueChange={v => setFormData({ ...formData, secondary_role_id: v })}
              >
                <SelectTrigger className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 h-12 text-sm text-[#1d1d1f] transition-all outline-none">
                  <SelectValue placeholder="Select secondary role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden">
                  <SelectItem value="none" className="cursor-pointer py-3 rounded-xl focus:bg-[#f5f5f7] focus:text-[#1d1d1f] m-1">
                    None
                  </SelectItem>
                  {roles.map((r: any) => (
                    <SelectItem key={r.role_id} value={r.role_id} className="cursor-pointer py-3 rounded-xl focus:bg-[#f5f5f7] focus:text-[#1d1d1f] m-1">
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Department</Label>
              <input
                className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">Role</Label>
            <Select
              value={formData.role_id}
              onValueChange={v => setFormData({ ...formData, role_id: v })}
            >
              <SelectTrigger className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 h-12 text-sm text-[#1d1d1f] transition-all outline-none">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl overflow-hidden">
                {roles.map((r: any) => (
                  <SelectItem key={r.role_id} value={r.role_id} className="cursor-pointer py-3 rounded-xl focus:bg-[#f5f5f7] focus:text-[#1d1d1f] m-1">
                    {r.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#86868b] uppercase tracking-wide">
              {isEdit ? "Reset Password (Optional)" : "Password"}
            </Label>
            <input
              type="password"
              placeholder={isEdit ? "Leave blank to keep current" : "Temporary password"}
              className="w-full bg-[#f5f5f7] border-transparent focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm text-[#1d1d1f] transition-all outline-none placeholder:text-[#86868b]"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3 pt-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34c759]"></div>
                <span className="ml-3 text-sm font-medium text-[#1d1d1f]">Active Account</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-full bg-white text-[#1d1d1f] border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-6 py-3 rounded-full bg-[#0066cc] text-white text-sm font-bold hover:bg-[#005bb5] transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
