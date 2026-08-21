import { createFileRoute, Navigate, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  ClipboardCheck,
  ListChecks,
  Crown,
  FileCheck,
  UserPlus,
  Settings,
  UserCog,
  Mail,
  FileText,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import type { ComponentType } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles?: Role[];
  permissions?: string[];
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/candidates",
    label: "Candidates",
    icon: Users,
    permissions: ["candidate.list", "workflow.reception_forward"],
  },
  {
    to: "/hr/queue",
    label: "HR Review Queue",
    icon: ClipboardCheck,
    permissions: ["workflow.hr_review"],
  },
  {
    to: "/interviewer/queue",
    label: "Interview Queue",
    icon: ListChecks,
    permissions: ["evaluation.view_assigned"],
  },
  {
    to: "/ceo/queue",
    label: "CEO Review Queue",
    icon: Crown,
    permissions: ["workflow.ceo_evaluate", "decision.final"],
  },
  {
    to: "/offer/dashboard",
    label: "Offer Management",
    icon: FileCheck,
    permissions: ["decision.final"],
  },
  {
    to: "/onboarding/dashboard",
    label: "Onboarding",
    icon: UserPlus,
    permissions: ["decision.final"],
  },
  {
    to: "/users",
    label: "Employee Management",
    icon: UserCog,
    permissions: ["user.manage"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FileText,
    permissions: ["report.export"],
  },
  {
    to: "/email-management",
    label: "Email Queue",
    icon: Mail,
    permissions: ["email.admin"],
  },
  {
    to: "/scheduler",
    label: "Scheduler",
    icon: Timer,
    permissions: ["scheduler.admin"],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function AuthenticatedLayout() {
  const { user, loading, logout, hasAnyRole, hasAnyPermission } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  const visibleNav = NAV.filter((n) => {
    if (n.roles && !hasAnyRole(n.roles)) return false;
    if (n.permissions && !hasAnyPermission(n.permissions)) return false;
    return true;
  });

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-100 bg-white">
        <Link to="/dashboard" className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-colors" onClick={() => setMobileOpen(false)}>
          <img src="/logo.png" alt="Atlas Logo" className="h-8 w-auto" />
          <div>
            <div className="font-bold tracking-tight text-[#1d1d1f]">Atlas HR</div>
            <div className="text-[11px] text-[#86868b] font-medium tracking-wide uppercase">Recruitment Console</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto bg-white">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={
                "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-200 " +
                (active
                  ? "bg-[#f5f5f7] text-[#1d1d1f] font-semibold"
                  : "text-[#86868b] hover:bg-gray-50 hover:text-[#1d1d1f]")
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 mb-3 px-2">
          <NotificationBell />
        </div>
        <div className="px-3 py-2 mb-3 bg-[#f5f5f7] rounded-2xl">
          <div className="text-sm font-semibold text-[#1d1d1f] truncate">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-xs font-medium text-[#86868b] truncate mt-0.5">
            {user.roles.join(", ")}
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-200 hover:bg-gray-50 text-[#1d1d1f] rounded-full px-6 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#fbfbfd]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-white text-[#1d1d1f] flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 text-[#1d1d1f] hover:bg-[#f5f5f7]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white border-r border-gray-100">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="flex items-center gap-3 flex-1">
            <img src="/logo.png" alt="Atlas Logo" className="h-6 w-auto" />
            <span className="font-bold tracking-tight text-[#1d1d1f]">Atlas HR</span>
          </Link>
          <NotificationBell />
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
