"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Coins,
  Ticket,
  ScrollText,
  Sliders,
  Activity,
  LogOut,
  ShieldCheck,
  LifeBuoy,
  MessageSquare,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Tag
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Institutional Requests", href: "/admin/institutional-requests", icon: Building2 },
  { name: "Free Credit Requests", href: "/admin/credit-requests", icon: Sparkles },
  { name: "Help & Support", href: "/admin/support", icon: LifeBuoy },
  { name: "Feedback & Ratings", href: "/admin/feedback", icon: MessageSquare },
  { name: "User Directory", href: "/admin/users", icon: Users },
  { name: "Institutions", href: "/admin/institutions", icon: Building2 },
  { name: "Assessments", href: "/admin/exams", icon: FileSpreadsheet },
  { name: "Credit Ledger", href: "/admin/credits", icon: Coins },
  { name: "Coupons & Vouchers", href: "/admin/coupons", icon: Ticket },
  { name: "Pricing Plans", href: "/admin/pricing-plans", icon: Tag },
  { name: "Audit Trail", href: "/admin/audit-logs", icon: ScrollText },
  { name: "Settings", href: "/admin/settings", icon: Sliders },
  { name: "Diagnostics", href: "/admin/system", icon: Activity }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, role, fullName, logout, setAuth, syncFromStorage } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Admin In-Page Gateway Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    syncFromStorage();
    setMounted(true);
  }, [syncFromStorage]);

  const handleAdminLogin = async (e?: React.FormEvent, directEmail?: string, directPassword?: string) => {
    if (e) e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    const emailToUse = (directEmail || adminEmail).trim();
    const passwordToUse = directPassword || adminPassword;

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed. Please verify admin credentials.");
      }
      if (data.role !== "super_admin" && data.role !== "inst_admin") {
        throw new Error(`Access Denied: Account role '${data.role}' is not granted Administrator privileges.`);
      }
      setAuth(data.access_token, data.role, data.full_name, data.institution_id, data.avatar_url);
    } catch (err: any) {
      setAdminError(err.message || "Failed to authenticate administrator.");
    } finally {
      setAdminLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Initializing Control Center...</span>
        </div>
      </div>
    );
  }

  const isAuthorized = token && (role === "super_admin" || role === "inst_admin");

  // ═════════════════════════════════════════════════════════════════════════
  // IN-PAGE ADMIN ACCESS GATEWAY (Displays if unauthenticated or not super_admin)
  // ═════════════════════════════════════════════════════════════════════════
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-950 via-[#0B1528] to-slate-900 text-slate-100 p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient Glow Circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              Testora <span className="text-blue-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Center Gateway Card (Django-style Secure Admin Login) */}
        <main className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            {/* Header Branding */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Restricted · Staff &amp; Superuser Area</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Testora Administration
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Enter your administrative credentials to manage system state, grant credits, resolve tickets, and configure platform settings.
              </p>
            </div>

            {/* Error Notice */}
            {adminError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Non-Admin Session Warning */}
            {token && role && role !== "super_admin" && role !== "inst_admin" && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Non-Admin Account Signed In</span>
                </div>
                <p className="text-[11.5px] text-amber-200/90 leading-relaxed">
                  You are currently logged into a <strong className="text-white capitalize">{role}</strong> account ({fullName || role}). Please sign in with an Administrator account below.
                </p>
              </div>
            )}

            {/* Clean Admin Sign-In Form */}
            <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Admin Email / Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="dpramptech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{adminLoading ? "Verifying Administrator..." : "Log In to Administration"}</span>
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 w-full max-w-md mx-auto text-center text-xs text-slate-500 py-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>End-to-End Encrypted</span>
          </div>
          <span>•</span>
          <Link href="/login" className="text-blue-400 hover:underline">
            Standard Login
          </Link>
        </footer>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FULL AUTHORIZED ADMIN CONSOLE
  // ═════════════════════════════════════════════════════════════════════════
  const currentNav = navItems.find((i) => i.href === pathname) || navItems[0];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ─── DESKTOP SIDEBAR ────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
              Testora <span className="text-blue-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800">Admin</span>
            </div>
            <div className="text-[11px] text-slate-400">Global Control Center</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile & Return to Studio */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard/teacher"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Teacher Studio</span>
          </Link>

          <div className="px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{fullName || "Administrator"}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {role === "super_admin" ? "SUPER_ADMIN" : "INST_ADMIN"}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 px-4 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="text-slate-400">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 dark:text-slate-100">{currentNav.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Full Platform Authority</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
            <div className="w-72 bg-slate-900 text-white h-full p-4 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-sm">Navigation</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                        isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
