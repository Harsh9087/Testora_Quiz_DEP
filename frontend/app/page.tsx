"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  KeyRound,
  Award,
  ChevronRight,
  Printer,
  Image as ImageIcon,
  Columns,
  Building2,
  Users,
  Coins,
  Cpu,
  Gift,
  Ticket,
  Plus,
  Minus,
  Menu,
  X,
  Layers,
  GraduationCap,
  ExternalLink,
  Laptop,
  CheckSquare,
  FileText,
  Clock,
  Compass,
  ArrowUp,
  HelpCircle,
  Lock,
  Zap,
  Download,
  Smartphone,
  Headphones,
  User,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";
import ThemeToggle from "../components/ThemeToggle";
import AppLogo from "../components/AppLogo";
import AIAgentGuideWidget from "../components/AIAgentGuideWidget";
import PromoDashboardPlayer from "../components/PromoDashboardPlayer";
import PlatformActivitySection from "../components/PlatformActivitySection";
import PricingSection from "../components/PricingSection";
import FdpSolutionsSection from "../components/FdpSolutionsSection";
import WorkflowStepsSection from "../components/WorkflowStepsSection";
import WebsiteFooter from "../components/WebsiteFooter";
import FeedbackSection from "../components/FeedbackSection";

export default function UnifiedHomePage() {
  const router = useRouter();
  const { token, role, fullName, avatarUrl, logout, setAvatarUrl } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    setAvatarImgError(false);
  }, [avatarUrl]);

  const profileHref =
    role === "super_admin"
      ? "/admin"
      : role === "student"
      ? "/dashboard/student/profile"
      : "/dashboard/teacher/profile";

  const dashboardHref =
    role === "super_admin"
      ? "/admin"
      : role === "student"
      ? "/dashboard/student"
      : "/dashboard/teacher";

  const getDisplayAvatarUrl = (url?: string | null) => {
    if (!url || typeof url !== "string" || url.trim() === "" || url.toLowerCase() === "none") return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Direct exam passcode state & modal
  const [directExamCode, setDirectExamCode] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showGuideWidget, setShowGuideWidget] = useState(false);

  // Mobile navbar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform Capabilities Active Tab
  const [capabilitiesTab, setCapabilitiesTab] = useState<"studio" | "student" | "proctor" | "gradebook">("studio");

  // FAQ accordion open index
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Genuine Database Platform Statistics
  const [dbStats, setDbStats] = useState<{
    active_users: number;
    assessments_created: number;
    submissions_evaluated: number;
    institutions_active: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    apiFetch("/public/platform-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDbStats(data);
      })
      .catch(() => { });

    if (token) {
      apiFetch("/auth/me", { token })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data?.avatar_url) {
              setAvatarUrl(data.avatar_url);
            }
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleDirectExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directExamCode.trim()) return;
    const cleanCode = directExamCode.trim().replace(/^.*\/exam\//, "");
    router.push(`/exam/${cleanCode}`);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">

      {/* ══════════════════════════════════════════════════════════════════════
          1. TOP CONTINUOUS MARQUEE TICKER (Right to Left)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[#071126] text-white text-xs py-2 border-b border-blue-900/40 select-none">
        {/* Subtle, Soft Edge Fade Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#071126] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#071126] to-transparent z-10" />

        {/* Scrolling Track (2 Identical Loops for Seamless Infinite Scrolling) */}
        <div className="animate-marquee-left flex items-center">
          {/* Loop Set 1 */}
          <div className="flex items-center shrink-0">
            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>Faculty &amp; Colleges:</strong> Get <strong>200 Free Assessment Credits</strong> upon Signup!</span>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Special <strong>FDP Institutional Grant Vouchers</strong> &amp; Department Subscriptions Available</span>
              <button
                type="button"
                onClick={() => scrollTo("fdp-solutions")}
                className="underline text-blue-300 hover:text-white transition-colors ml-1 font-semibold cursor-pointer"
              >
                Inquire Vouchers &rarr;
              </button>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span><strong>Google Gemini Pro AI:</strong> Dynamic Question Synthesis &amp; Semantic Evaluation</span>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span><strong>Real-Time Proctor Radar:</strong> Server-Enforced Tab Switch &amp; Focus Integrity</span>
            </span>
            <span className="text-blue-400/60">✦</span>
          </div>

          {/* Loop Set 2 (Exact Duplicate for Infinite Loop) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>Faculty &amp; Colleges:</strong> Get <strong>200 Free Assessment Credits</strong> upon Signup!</span>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Special <strong>FDP Institutional Grant Vouchers</strong> &amp; Department Subscriptions Available</span>
              <button
                type="button"
                onClick={() => scrollTo("fdp-solutions")}
                className="underline text-blue-300 hover:text-white transition-colors ml-1 font-semibold cursor-pointer"
              >
                Inquire Vouchers &rarr;
              </button>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span><strong>Google Gemini Pro AI:</strong> Dynamic Question Synthesis &amp; Semantic Evaluation</span>
            </span>
            <span className="text-blue-400/60">✦</span>

            <span className="inline-flex items-center gap-1.5 px-6 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span><strong>Real-Time Proctor Radar:</strong> Server-Enforced Tab Switch &amp; Focus Integrity</span>
            </span>
            <span className="text-blue-400/60">✦</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. STICKY MODERN NAVBAR (POLISHED & BALANCED - ALWAYS VISIBLE)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#071126]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 transition-colors shadow-xs">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo (Left) */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-transform hover:opacity-95 active:scale-98"
            aria-label="Testora Quiz Home"
          >
            <AppLogo variant="row" height={38} showBadge={false} />
          </Link>

          {/* Navigation Links (Center) */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => scrollTo("portals")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
            >
              Portals
            </button>
            <button
              type="button"
              onClick={() => scrollTo("capabilities")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollTo("fdp-solutions")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5 py-1"
            >
              <span>Institutions &amp; FDP</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                Vouchers
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo("faq")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
            >
              FAQ
            </button>
          </nav>

          {/* Action Buttons (Right) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Ask AI Guide */}
            <button
              type="button"
              onClick={() => setShowGuideWidget(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Ask AI Guide</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-mono font-bold tracking-wider uppercase">
                AI
              </span>
            </button>

            {/* Install App Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-install-pwa'))}
              className="hidden md:inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer"
              title="Install Testora Quiz as an Android / iOS app"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Install App</span>
            </button>

            {/* Theme Toggle - Hidden on mobile viewports (< sm) as requested */}
            <div className="hidden sm:inline-flex shrink-0">
              <ThemeToggle className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800" />
            </div>

            {/* Auth Buttons */}
            {mounted && token ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Profile Photo / Avatar - Clean, perfect & always visible */}
                <Link
                  href={profileHref}
                  className="relative flex items-center shrink-0 group cursor-pointer"
                  title={`View Profile (${fullName || "User"})`}
                >
                  {getDisplayAvatarUrl(avatarUrl) && !avatarImgError ? (
                    <div className="relative">
                      <img
                        src={getDisplayAvatarUrl(avatarUrl)!}
                        alt={fullName || "User Avatar"}
                        onError={() => setAvatarImgError(true)}
                        className="h-9 w-9 rounded-full object-cover border-2 border-blue-500/80 shadow-xs group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500/40 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#071126]" />
                    </div>
                  ) : (
                    <div className="relative h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs border-2 border-white dark:border-[#071126] group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500/40 transition-all">
                      <span>{fullName ? fullName.trim().charAt(0).toUpperCase() : "U"}</span>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#071126]" />
                    </div>
                  )}
                </Link>

                {/* Dashboard Button (Hidden on narrow mobile to keep navbar compact and leave room for 3-line menu) */}
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline-flex h-9 px-3.5 items-center justify-center rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Dashboard
                </Link>

                {/* Sign Out Button (Hidden on narrow mobile, available in mobile menu) */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  href="/login"
                  className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="hidden sm:inline-flex h-9 px-4 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-extrabold shadow-sm shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle (3 Horizontal Lines) - Always visible and perfectly sized on mobile (< lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 stroke-[2.2]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-3 border-t border-slate-200 dark:border-slate-800 mt-2.5 space-y-2 text-xs font-semibold animate-in fade-in duration-150">
            {/* If logged in on mobile, show User Account Card */}
            {mounted && token && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2.5 mb-2">
                <div className="flex items-center gap-3">
                  <Link
                    href={profileHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="relative shrink-0"
                  >
                    {getDisplayAvatarUrl(avatarUrl) && !avatarImgError ? (
                      <div className="relative">
                        <img
                          src={getDisplayAvatarUrl(avatarUrl)!}
                          alt={fullName || "User Avatar"}
                          onError={() => setAvatarImgError(true)}
                          className="h-11 w-11 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D182E]" />
                      </div>
                    ) : (
                      <div className="relative h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs border-2 border-white dark:border-[#0D182E]">
                        <span>{fullName ? fullName.trim().charAt(0).toUpperCase() : "U"}</span>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D182E]" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {fullName || "User Account"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                      {role === "super_admin" ? "Administrator" : role || "Member"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold text-center shadow-xs"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={profileHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    My Profile
                  </Link>
                </div>
              </div>
            )}
            {/* Mobile PWA Install Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-install-pwa'));
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Install Mobile App (Android &amp; iOS)</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                App
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollTo("portals")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Portals (Teacher &amp; Student)
            </button>
            <button
              type="button"
              onClick={() => scrollTo("capabilities")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Platform Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Architecture &amp; Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollTo("fdp-solutions")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Institutions &amp; FDP Vouchers
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Pricing &amp; Credits
            </button>
            <button
              type="button"
              onClick={() => scrollTo("faq")}
              className="block w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              FAQ
            </button>

            {/* Mobile Bottom Quick Actions */}
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowGuideWidget(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Guide</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCodeModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter Code</span>
              </button>
            </div>

            {/* Mobile Theme Toggle Row (Since theme toggle is hidden from top navbar on mobile mode) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Appearance (Light / Dark)
              </span>
              <ThemeToggle className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700" />
            </div>

            {/* If not logged in on mobile, show Get Started Free button full-width */}
            {(!mounted || !token) && (
              <div className="pt-2">
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-sm"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Sign Out Button when logged in */}
            {mounted && token && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          3. HERO SECTION (Strong First Impression + Interactive Showcase)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-5 sm:py-8 md:py-12 lg:py-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-radial from-blue-100/40 via-transparent to-transparent dark:from-blue-950/25">

        {/* Subtle Background Lighting & Dot Grid Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-7 xl:gap-8 items-center">

            {/* Left Column: Clear Headline, Subtitle, and CTAs (lg:col-span-6) */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 text-center lg:text-left order-1">

              {/* Live Eyebrow Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10.5px] sm:text-xs font-bold shadow-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span>AI-Powered Examination &amp; Assessment Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl xs:text-[26px] sm:text-3xl md:text-4xl lg:text-5xl xl:text-[52px] font-black tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-[1.12]">
                Create Smarter Exams.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                  Understand Better Results.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-normal sm:leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Create assessments, generate questions with AI, evaluate submissions, and understand student performance in one platform.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start sm:gap-3 pt-0.5 sm:pt-1 w-full max-w-lg lg:max-w-none mx-auto lg:mx-0">
                <Link
                  href="/login?mode=signup"
                  className="w-full sm:w-auto px-2 xs:px-2.5 sm:px-5 py-2 sm:py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] xs:text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-md shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="truncate">
                    <span className="hidden sm:inline">Get Started Free</span>
                    <span className="sm:hidden">Start Free</span>
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="w-full sm:w-auto px-2 xs:px-2.5 sm:px-5 py-2 sm:py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] xs:text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <KeyRound className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">Enter Exam Code</span>
                    <span className="sm:hidden">Exam Code</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("capabilities")}
                  className="w-full sm:w-auto px-2 xs:px-2.5 sm:px-5 py-2 sm:py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] xs:text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Features</span>
                </button>
              </div>

              {/* Verified Trust Pillars (Adjusted compact text boxes for mobile) */}
              <div className="hidden lg:grid pt-1 sm:pt-2 grid-cols-2 gap-1.5 sm:gap-2.5 text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                  <span className="truncate font-medium">Gemini Pro AI</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                  <span className="truncate font-medium">200 Free Credits</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  <span className="truncate font-medium">Server Proctoring</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">KaTeX Formulas</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Video Showcase (lg:col-span-6) */}
            <div className="lg:col-span-6 w-full pt-2 sm:pt-5 pb-2 order-2">
              <div className="relative">
                <PromoDashboardPlayer />
              </div>
              <div className="mt-2 text-center lg:text-left text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center lg:justify-start gap-1.5 pl-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Watch Testora Quiz in action: AI Synthesis, Automated Grading &amp; Proctor Radar.</span>
              </div>

              {/* Verified Trust Pillars (Mobile display directly below the video) */}
              <div className="grid lg:hidden mt-3.5 grid-cols-2 gap-1.5 text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 text-left max-w-md mx-auto">
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                  <span className="truncate font-medium">Gemini Pro AI</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                  <span className="truncate font-medium">200 Free Credits</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  <span className="truncate font-medium">Server Proctoring</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">KaTeX Formulas</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. SECTION 1: TEACHER AND STUDENT ENTRY CARDS (Reference Inspired)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="portals" className="py-6 sm:py-9 md:py-12 lg:py-16 bg-[#F8FAFC] dark:bg-[#080E1E] border-b border-slate-200/80 dark:border-slate-800/80 scroll-mt-20">
        <div className="w-full max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-8 space-y-4 sm:space-y-7 md:space-y-8">

          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Role-Based Portals
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Select Your Workspace to Get Started
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A9B9D3]">
              Dedicated interfaces tailored specifically for exam creators and student test takers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-5 lg:gap-6 items-stretch max-w-5xl mx-auto">

            {/* Left Card: Teacher / Instructor Studio */}
            <Link 
              href={mounted && token && role === "teacher" ? "/dashboard/teacher" : "/login?role=teacher"}
              data-fast-nav="true"
              className="relative rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#0D1830] border-2 border-blue-500/80 dark:border-[#2563EB]/70 shadow-xl shadow-blue-500/5 dark:shadow-[0_0_35px_rgba(37,99,235,0.22)] hover:shadow-2xl hover:border-blue-500 hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer block"
            >

              <div className="p-2.5 sm:p-5 lg:p-6 flex flex-col flex-1 justify-between space-y-2.5 sm:space-y-5">

                {/* Header: Role Pill & Access Level */}
                <div className="space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1 sm:gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-500/40 text-blue-600 dark:text-blue-300 text-[10px] sm:text-xs font-bold shadow-xs whitespace-nowrap">
                      <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Instructor Studio</span>
                    </div>
                    <span className="hidden sm:inline-block text-[9px] sm:text-[11px] font-mono text-slate-400 dark:text-blue-300/70 font-bold uppercase tracking-wider whitespace-nowrap">
                      FACULTY ACCESS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight">
                      Create <span className="text-blue-600 dark:text-[#38BDF8]">Smart Tests</span>
                    </h3>
                    <p className="hidden sm:block text-xs md:text-sm text-slate-500 dark:text-[#A9B9D3] mt-1 sm:mt-1.5 leading-snug">
                      Create assessments, organize questions, and prepare exams for your students with AI.
                    </p>
                  </div>
                </div>

                {/* 3D Illustration Stage (Dual Theme Support) */}
                <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl select-none my-0.5 sm:my-1">
                  <img
                    src="/images/card_teacher_light.png"
                    alt="Instructor Studio Dashboard"
                    className="w-full h-auto object-contain block dark:hidden pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                  <img
                    src="/images/card_teacher_dark.png"
                    alt="Instructor Studio Dashboard"
                    className="w-full h-auto object-contain hidden dark:block pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                </div>

                {/* Bottom Section: Feature Badges & Action CTA */}
                <div className="space-y-2 sm:space-y-3 pt-1">
                  {/* 3 Unified Feature Tiles - In 1 Single Row on Desktop to Save Vertical Space */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
                    {/* Tile 1: AI Questions */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-blue-300 dark:hover:border-blue-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-blue-100/80 dark:bg-blue-950/70 flex items-center justify-center text-blue-600 dark:text-[#38BDF8] shrink-0">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">AI Questions</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Generate with AI</div>
                      </div>
                    </div>
                    {/* Tile 2: PDF & Docs */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-purple-300 dark:hover:border-purple-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-purple-100/80 dark:bg-purple-950/70 flex items-center justify-center text-purple-600 dark:text-[#C084FC] shrink-0">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">PDF &amp; Docs</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Upload &amp; Convert</div>
                      </div>
                    </div>
                    {/* Tile 3: Auto Grade */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-teal-300 dark:hover:border-teal-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-teal-100/80 dark:bg-teal-950/70 flex items-center justify-center text-teal-600 dark:text-[#2DD4BF] shrink-0">
                        <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Auto Grade</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Save Time</div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div
                    className="w-full py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-blue-600 group-hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-all"
                  >
                    <span>Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </Link>

            {/* Right Card: Student Portal */}
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="relative text-left w-full rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#0D1830] border-2 border-emerald-500/80 dark:border-[#10B981]/70 shadow-xl shadow-emerald-500/5 dark:shadow-[0_0_35px_rgba(16,185,129,0.22)] hover:shadow-2xl hover:border-emerald-500 hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
            >

              <div className="p-2.5 sm:p-5 lg:p-6 flex flex-col flex-1 justify-between space-y-2.5 sm:space-y-5">

                {/* Header: Role Pill & Access Level */}
                <div className="space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1 sm:gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-[10px] sm:text-xs font-bold shadow-xs whitespace-nowrap">
                      <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Candidate Portal</span>
                    </div>
                    <div className="hidden sm:inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-500/40 text-emerald-600 dark:text-[#34D399] text-[8.5px] sm:text-[11px] font-bold tracking-wider uppercase whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>EXAM ACTIVE</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight">
                        Take <span className="text-emerald-600 dark:text-[#34D399]">Your Test</span>
                      </h3>
                      <p className="hidden sm:block text-xs md:text-sm text-slate-500 dark:text-[#A9B9D3] mt-1 sm:mt-1.5 leading-snug">
                        Access assigned assessments using your exam code and complete your test.
                      </p>
                    </div>
                    {/* Handwritten note style callout */}
                    <div className="hidden md:flex flex-col items-center pt-0.5 text-emerald-600 dark:text-[#34D399] select-none pointer-events-none shrink-0 -rotate-2">
                      <span className="italic text-[11px] font-bold tracking-tight text-right leading-tight font-serif">
                        Simple,<br />Secure &amp; Smooth
                      </span>
                      <svg className="w-4 h-5 text-emerald-500 dark:text-[#34D399] mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 4c-4 0-8 6-6 14" />
                        <path d="M8 15l4 4 4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 3D Illustration Stage (Dual Theme Support) */}
                <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl select-none my-0.5 sm:my-1">
                  <img
                    src="/images/card_student_light.png"
                    alt="Candidate Portal Exam HUD"
                    className="w-full h-auto object-contain block dark:hidden pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                  <img
                    src="/images/card_student_dark.png"
                    alt="Candidate Portal Exam HUD"
                    className="w-full h-auto object-contain hidden dark:block pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                </div>

                {/* Bottom Section: Feature Badges & Action CTA */}
                <div className="space-y-2 sm:space-y-3 pt-1">
                  {/* 3 Unified Feature Tiles - In 1 Single Row on Desktop to Save Vertical Space */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
                    {/* Tile 1: Exam Code */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-emerald-300 dark:hover:border-emerald-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-emerald-100/80 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-[#34D399] shrink-0">
                        <KeyRound className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Exam Code</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Quick Access</div>
                      </div>
                    </div>
                    {/* Tile 2: Autosave */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-teal-300 dark:hover:border-teal-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-teal-100/80 dark:bg-teal-950/70 flex items-center justify-center text-teal-600 dark:text-[#2DD4BF] shrink-0">
                        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Autosave</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Never Lose</div>
                      </div>
                    </div>
                    {/* Tile 3: Proctoring */}
                    <div className="bg-slate-50/90 dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 hover:border-amber-300 dark:hover:border-amber-700">
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-md sm:rounded-lg bg-amber-100/80 dark:bg-amber-950/70 flex items-center justify-center text-amber-500 dark:text-[#FBBF24] shrink-0">
                        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Proctoring</div>
                        <div className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-[#A9B9D3] font-medium truncate">Secure Exams</div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div
                    className="w-full py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-[#059669] group-hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-emerald-600/30 group-hover:shadow-emerald-600/50 transition-all"
                  >
                    <span>Open Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </button>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. VERIFIED PLATFORM ACTIVITY & REAL TELEMETRY (Reference UI)
      ══════════════════════════════════════════════════════════════════════ */}
      <PlatformActivitySection stats={dbStats} />

      {/* ══════════════════════════════════════════════════════════════════════
          6. SECTION 3: PLATFORM CAPABILITIES & SYSTEM ARCHITECTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="capabilities" className="relative py-9 md:py-12 lg:py-16 overflow-hidden bg-[#F0F6FF] dark:bg-[#070D1A] border-b border-slate-200/80 dark:border-slate-800/80 scroll-mt-20">
        
        {/* Subtle Ambient Background Lighting & Dot Grid Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute top-10 -left-20 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-blue-300/25 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 -right-20 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-purple-300/20 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7 md:space-y-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#EAF2FF] dark:bg-blue-950/80 border border-blue-200/90 dark:border-blue-800 text-[#0066FF] dark:text-[#38BDF8] text-xs font-semibold shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#38BDF8]" />
              <span>System Architecture &amp; Engine</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.15]">
              <span className="block sm:inline text-[#0B1B3D] dark:text-white">Platform </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] via-[#5B51D8] to-[#9333EA] dark:from-[#38BDF8] dark:to-[#C084FC]">
                Capabilities
              </span>
            </h2>
            
            <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-xl mx-auto font-normal leading-relaxed">
              Explore the tools available for creating, conducting, and evaluating assessments with Testora Quiz.
            </p>
          </div>

          {/* 4 Interactive Segmented Tabs (Responsive Grid on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-4 sm:flex sm:flex-nowrap items-center justify-between sm:justify-center gap-1 sm:gap-2 lg:gap-3 p-1.5 sm:p-2.5 bg-white dark:bg-[#0D1830] rounded-2xl sm:rounded-full w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto border border-slate-200/90 dark:border-slate-800 shadow-md shadow-blue-500/5">
            
            {/* Tab 1: Teacher Assessment Studio */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("studio")}
              className={`flex-1 p-2 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap ${
                capabilitiesTab === "studio"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-bold">Teacher<br />Studio</span>
              <span className="hidden sm:inline">Teacher Assessment Studio</span>
            </button>

            <span className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700/60 my-auto shrink-0" />

            {/* Tab 2: Student Test Experience */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("student")}
              className={`flex-1 p-2 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap ${
                capabilitiesTab === "student"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <GraduationCap className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-semibold">Student<br />Experience</span>
              <span className="hidden sm:inline">Student Test Experience</span>
            </button>

            <span className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700/60 my-auto shrink-0" />

            {/* Tab 3: Exam Monitoring */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("proctor")}
              className={`flex-1 p-2 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap ${
                capabilitiesTab === "proctor"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-semibold">Exam<br />Monitoring</span>
              <span className="hidden sm:inline">Exam Monitoring</span>
            </button>

            <span className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700/60 my-auto shrink-0" />

            {/* Tab 4: Evaluation & Gradebook */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("gradebook")}
              className={`flex-1 p-2 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap ${
                capabilitiesTab === "gradebook"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-semibold">Evaluation<br />&amp; Gradebook</span>
              <span className="hidden sm:inline">Evaluation &amp; Gradebook</span>
            </button>
          </div>

          {/* Main Stage Display Card */}
          <div className="relative rounded-[28px] sm:rounded-[36px] bg-white dark:bg-[#0D1830] border-2 border-[#DCE7F5] dark:border-slate-800 shadow-xl shadow-blue-950/5 p-4 sm:p-8 lg:p-10 overflow-hidden">
            
            {/* TAB 1: TEACHER ASSESSMENT STUDIO */}
            {capabilitiesTab === "studio" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center animate-in fade-in duration-300">
                
                {/* Left Column: Text, Workflow & Capabilities */}
                <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                  
                  {/* Top Badge & Headings */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4FF] dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[#0066FF] dark:text-[#38BDF8] text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#38BDF8]" />
                      <span>Stage 01 • Teacher Assessment Studio</span>
                    </div>
                    <h3 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#0B1B3D] dark:text-white tracking-tight leading-[1.15]">
                      Curriculum-Aligned{" "}
                      <span className="block sm:inline text-[#0066FF] dark:text-[#38BDF8]">Test Creation</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                      Configure exam parameters, synthesize questions using Google Gemini AI or uploaded Knowledge Base documents, and export print-ready papers.
                    </p>
                  </div>

                  {/* 4-Step Architecture Pipeline (Creator Workflow) */}
                  <div className="rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>CREATOR WORKFLOW</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md text-[10px]">4 STAGES</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      
                      {/* Card 1: 01 Parameter Setup (Blue) */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0066FF] dark:text-[#38BDF8] flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold">01</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0066FF] dark:text-[#38BDF8] flex items-center justify-center">
                            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </div>
                        <div className="font-bold text-[#0B1B3D] dark:text-white text-[11px] sm:text-xs pt-0.5 sm:pt-1">
                          Parameter Setup
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Set duration, total marks, and criteria.
                        </p>
                      </div>

                      {/* Card 2: 02 AI Synthesis (Purple) */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-purple-50 dark:bg-purple-950 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold">02</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </div>
                        <div className="font-bold text-[#0B1B3D] dark:text-white text-[11px] sm:text-xs pt-0.5 sm:pt-1">
                          AI Synthesis
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Upload PDF/DOCX or enter syllabus prompts.
                        </p>
                      </div>

                      {/* Card 3: 03 Bloom Taxonomy (Green) */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-emerald-50 dark:bg-emerald-950 text-[#10B981] dark:text-[#34D399] flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold">03</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#10B981] dark:text-[#34D399] flex items-center justify-center">
                            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </div>
                        <div className="font-bold text-[#0B1B3D] dark:text-white text-[11px] sm:text-xs pt-0.5 sm:pt-1">
                          Bloom Taxonomy
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Review questions with cognitive levels (L1 to L5).
                        </p>
                      </div>

                      {/* Card 4: 04 Publish or Export (Pink) */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-pink-50 dark:bg-pink-950 text-[#D946EF] dark:text-[#F472B6] flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold">04</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-pink-50 dark:bg-pink-950 text-[#D946EF] dark:text-[#F472B6] flex items-center justify-center">
                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </div>
                        <div className="font-bold text-[#0B1B3D] dark:text-white text-[11px] sm:text-xs pt-0.5 sm:pt-1">
                          Publish or Export
                        </div>
                        <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Launch CBT test code or export PDF.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Implemented Capabilities Checklist */}
                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      IMPLEMENTED CAPABILITIES
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">Knowledge Base ingestion</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">Gemini AI question synthesis</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">Bloom cognitive level tags</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">KaTeX mathematical formulas</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">Multi-column printable PDF</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate sm:whitespace-normal">Question Bank Studio</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Button (Full width on mobile, auto on desktop) */}
                  <div className="pt-2 sm:pt-4">
                    <Link
                      href={mounted && token && role === "teacher" ? "/dashboard/teacher" : "/login?role=teacher"}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0066FF] hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span>Try Assessment Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Column / Below CTA on Mobile: High-Definition Laptop Product Preview */}
                <div className="lg:col-span-6 relative flex items-center justify-center p-2 sm:p-4 mt-4 sm:mt-6 lg:mt-0 group">
                  {/* Ambient Colored Backlight Effect (Blue) */}
                  <div className="absolute w-[85%] h-[75%] bg-blue-500/25 dark:bg-blue-600/30 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
                  <div className="absolute w-[60%] h-[55%] bg-cyan-400/20 dark:bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 w-full flex flex-col items-center animate-laptop-float">
                    {/* Floating Badge 1: Gemini Pro AI Synthesis (Top-Left) */}
                    <div className="hidden sm:flex absolute sm:-top-5 sm:-left-3 lg:-left-6 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-blue-200/90 dark:border-blue-500/40 shadow-xl shadow-blue-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-slow">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-transparent shrink-0">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Gemini Pro AI</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>25 Questions Synthesized</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">2.3s</span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 2: Multi-Column Printable PDF (Top-Right) */}
                    <div className="hidden sm:flex absolute sm:-top-4 sm:-right-3 lg:-right-4 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-purple-200/90 dark:border-purple-500/40 shadow-xl shadow-purple-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-delayed">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-100 dark:border-transparent shrink-0">
                        <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Paper Studio</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>Print-Ready Offline PDF</span>
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 3: Bloom's Cognitive Tag (Bottom-Left) */}
                    <div className="absolute bottom-6 sm:bottom-8 -left-2 sm:-left-4 lg:-left-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081226]/95 dark:bg-[#070D1B]/95 text-white backdrop-blur-md border border-slate-700/80 shadow-xl shadow-black/40 text-[11px] font-semibold animate-float-reverse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-300">Bloom&apos;s Level:</span>
                      <span className="text-emerald-400 font-bold font-mono">L3 - Apply</span>
                    </div>

                    <img
                      src="/images/laptop_mockup.png"
                      alt="Teacher Assessment Studio Interface Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(37,99,235,0.22)] dark:drop-shadow-[0_25px_45px_rgba(37,99,235,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-blue-900/10 dark:bg-blue-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />

                    {/* Mobile Badges Row: Positioned below laptop image so laptop screen is completely visible */}
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-2 mt-3.5 w-full z-20">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-blue-200/90 dark:border-blue-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>25 Questions</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">2.3s</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-purple-200/90 dark:border-purple-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Printer className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>Print-Ready PDF</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STUDENT TEST EXPERIENCE */}
            {capabilitiesTab === "student" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Stage 02 • Student Test Experience</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      Focused Candidate Testing Environment
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      A distraction-free Computer-Based Testing (CBT) portal featuring an interactive question palette, in-exam scientific calculator, and continuous autosave progress persistence.
                    </p>
                  </div>

                  {/* 4-Step Architecture Pipeline */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Candidate Workflow</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">4 Stages</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                          <span>Exam Access Code</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Enter 6-character unique exam code and verify student identity.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                          <span>Guidelines &amp; Policy</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Review duration limits, negative marking, and proctoring rules.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                          <span>Interactive Palette</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Navigate color-coded questions: Answered, Flagged, Pending.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                          <span>Continuous Autosave</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Answers sync instantly to server; auto-submits on timeout.</p>
                      </div>
                    </div>
                  </div>

                  {/* Implemented Capabilities Checklist */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Implemented Capabilities:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Passcode-protected exam entry</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Color-coded question palette</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Built-in scientific calculator</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Continuous server autosave</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Server-enforced countdown timer</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Mobile &amp; low-bandwidth responsive UI</div>
                    </div>
                  </div>

                                    {/* Primary CTA Button */}
                  <div className="pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCodeModal(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Enter Exam Passcode</span>
                    </button>
                  </div>
                </div>

                {/* Right Column / Below CTA on Mobile: High-Definition Laptop Product Preview (Emerald) */}
                <div className="lg:col-span-6 relative flex items-center justify-center p-2 sm:p-4 mt-4 sm:mt-6 lg:mt-0 group">
                  {/* Ambient Colored Backlight Effect (Emerald) */}
                  <div className="absolute w-[85%] h-[75%] bg-emerald-500/25 dark:bg-emerald-600/30 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
                  <div className="absolute w-[60%] h-[55%] bg-teal-400/20 dark:bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 w-full flex flex-col items-center animate-laptop-float">
                    {/* Floating Badge 1: Timer (Top-Left) */}
                    <div className="hidden sm:flex absolute sm:-top-5 sm:-left-3 lg:-left-6 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-emerald-200/90 dark:border-emerald-500/40 shadow-xl shadow-emerald-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-slow">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-transparent shrink-0">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Active Session</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>00:45:20 Remaining</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 2: Auto-save (Top-Right) */}
                    <div className="hidden sm:flex absolute sm:-top-4 sm:-right-3 lg:-right-4 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-teal-200/90 dark:border-teal-500/40 shadow-xl shadow-teal-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-delayed">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-100 dark:border-transparent shrink-0">
                        <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Auto-Save Cloud</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>Responses Synced</span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.2 rounded-full border border-teal-200 dark:border-teal-800">100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 3: Anti-Cheat Status (Bottom-Left) */}
                    <div className="absolute bottom-6 sm:bottom-8 -left-2 sm:-left-4 lg:-left-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081226]/95 dark:bg-[#070D1B]/95 text-white backdrop-blur-md border border-slate-700/80 shadow-xl shadow-black/40 text-[11px] font-semibold animate-float-reverse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-300">Proctoring:</span>
                      <span className="text-emerald-400 font-bold font-mono">Fullscreen Enforced</span>
                    </div>

                    <img
                      src="/images/laptop_student_exam.png"
                      alt="Student CBT Exam Testing Interface Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(16,185,129,0.22)] dark:drop-shadow-[0_25px_45px_rgba(16,185,129,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-emerald-900/10 dark:bg-emerald-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />

                    {/* Mobile Badges Row: Positioned below laptop image so laptop screen is completely visible */}
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-2 mt-3.5 w-full z-20">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-emerald-200/90 dark:border-emerald-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>00:45:20 Left</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-teal-200/90 dark:border-teal-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>Auto-Saved</span>
                          <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono font-bold bg-teal-50 dark:bg-teal-950/60 px-1 py-0.2 rounded-full border border-teal-200 dark:border-teal-800">100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EXAM MONITORING */}
            {capabilitiesTab === "proctor" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Stage 03 • Server-Authoritative Proctoring</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      Exam Monitoring Radar
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Real-time telemetry tracking browser window focus and enforcing server-side violation policies to ensure examination integrity.
                    </p>
                  </div>

                  {/* 4-Step Architecture Pipeline */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Violation Policy Engine</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">Strict Server Policy</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                          <span>Focus Monitoring</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Browser monitors window blur and visibility changes continuously.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                          <span>1st Tab Switch</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Server records incident and triggers instant warning modal.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                          <span>2nd Tab Switch</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Exam is automatically locked and submitted server-side.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                          <span>Live Telemetry</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Faculty views candidate sessions and alert streams via WebSockets.</p>
                      </div>
                    </div>
                  </div>

                  {/* Implemented Capabilities Checklist */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Implemented Capabilities:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Browser visibility &amp; blur tracking</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 1st Tab Switch: Warning modal alert</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 2nd Tab Switch: Server auto-submit</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Teacher WebSocket alert stream</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Candidate session heartbeat</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Fullscreen testing enforcement</div>
                    </div>
                  </div>

                                    {/* Primary CTA Button */}
                  <div className="pt-2 sm:pt-4">
                    <Link
                      href={mounted && token && role === "teacher" ? "/dashboard/teacher" : "/login?role=teacher"}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold shadow-lg shadow-rose-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span>View Faculty Monitoring Tools</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Column / Below CTA on Mobile: High-Definition Laptop Product Preview (Rose) */}
                <div className="lg:col-span-6 relative flex items-center justify-center p-2 sm:p-4 mt-4 sm:mt-6 lg:mt-0 group">
                  {/* Ambient Colored Backlight Effect (Rose) */}
                  <div className="absolute w-[85%] h-[75%] bg-rose-500/30 dark:bg-rose-600/35 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
                  <div className="absolute w-[60%] h-[55%] bg-red-400/20 dark:bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 w-full flex flex-col items-center animate-laptop-float">
                    {/* Floating Badge 1: Strict Policy (Top-Left) */}
                    <div className="hidden sm:flex absolute sm:-top-5 sm:-left-3 lg:-left-6 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-rose-200/90 dark:border-rose-500/40 shadow-xl shadow-rose-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-slow">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-100 dark:border-transparent shrink-0">
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Proctor Radar</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>Tab-Switch Monitored</span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded-full border border-rose-200 dark:border-rose-800">Strict</span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 2: Candidates Live (Top-Right) */}
                    <div className="hidden sm:flex absolute sm:-top-4 sm:-right-3 lg:-right-4 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-emerald-200/90 dark:border-emerald-500/40 shadow-xl shadow-emerald-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-delayed">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-transparent shrink-0">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Live Telemetry</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>120 Candidates Live</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 3: Violation Counter (Bottom-Left) */}
                    <div className="absolute bottom-6 sm:bottom-8 -left-2 sm:-left-4 lg:-left-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081226]/95 dark:bg-[#070D1B]/95 text-white backdrop-blur-md border border-slate-700/80 shadow-xl shadow-black/40 text-[11px] font-semibold animate-float-reverse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-300">Live Violations:</span>
                      <span className="text-emerald-400 font-bold font-mono">0 Detected</span>
                    </div>

                    <img
                      src="/images/laptop_proctor_radar.png"
                      alt="Exam Monitoring Radar Telemetry Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(244,63,94,0.25)] dark:drop-shadow-[0_25px_45px_rgba(244,63,94,0.4)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-rose-900/10 dark:bg-rose-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />

                    {/* Mobile Badges Row: Positioned below laptop image so laptop screen is completely visible */}
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-2 mt-3.5 w-full z-20">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-rose-200/90 dark:border-rose-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>Tab-Switch Monitored</span>
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-950/60 px-1 py-0.2 rounded-full border border-rose-200 dark:border-rose-800">Strict</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-emerald-200/90 dark:border-emerald-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>120 Live</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EVALUATION & GRADEBOOK */}
            {capabilitiesTab === "gradebook" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Stage 04 • Instant Grading &amp; Performance Telemetry</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      Evaluation &amp; Gradebook
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Automated objective grading, intelligent AI semantic evaluation for subjective answers, and comprehensive class gradebook exports.
                    </p>
                  </div>

                  {/* 4-Step Architecture Pipeline */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Grading &amp; Analytics Workflow</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">Automated Pipeline</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                          <span>Objective Grading</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Instant MCQ and numerical evaluation with zero delay.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                          <span>Semantic AI Review</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Subjective theory answers evaluated against rubrics via Gemini AI.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                          <span>Cognitive Diagnosis</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Topic-wise cognitive mastery and class average breakdown.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                          <span>Excel &amp; CSV Export</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Download complete gradebooks and individual candidate logs.</p>
                      </div>
                    </div>
                  </div>

                  {/* Implemented Capabilities Checklist */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Implemented Capabilities:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Instant MCQ and numerical scoring</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Gemini semantic answer evaluation</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Topic accuracy &amp; weakness diagnoses</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Candidate question review screen</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Downloadable Excel &amp; CSV gradebooks</div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Percentile rank &amp; distribution metrics</div>
                    </div>
                  </div>

                                    {/* Primary CTA Button */}
                  <div className="pt-2 sm:pt-4">
                    <Link
                      href={mounted && token && role === "teacher" ? "/dashboard/teacher" : "/login?role=teacher"}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-extrabold shadow-lg shadow-purple-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <span>Try Evaluation Tools</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Column / Below CTA on Mobile: High-Definition Laptop Product Preview (Purple) */}
                <div className="lg:col-span-6 relative flex items-center justify-center p-2 sm:p-4 mt-4 sm:mt-6 lg:mt-0 group">
                  {/* Ambient Colored Backlight Effect (Purple) */}
                  <div className="absolute w-[85%] h-[75%] bg-purple-500/25 dark:bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
                  <div className="absolute w-[60%] h-[55%] bg-indigo-400/20 dark:bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 w-full flex flex-col items-center animate-laptop-float">
                    {/* Floating Badge 1: Automated Gradebook (Top-Left) */}
                    <div className="hidden sm:flex absolute sm:-top-5 sm:-left-3 lg:-left-6 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-indigo-200/90 dark:border-indigo-500/40 shadow-xl shadow-indigo-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-slow">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-transparent shrink-0">
                        <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Evaluation Engine</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>Instant Scorecards</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-full border border-indigo-200 dark:border-indigo-800">Auto</span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 2: Class Performance (Top-Right) */}
                    <div className="hidden sm:flex absolute sm:-top-4 sm:-right-3 lg:-right-4 z-20 items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-purple-200/90 dark:border-purple-500/40 shadow-xl shadow-purple-500/10 dark:shadow-black/60 transition-transform duration-300 hover:scale-105 animate-float-delayed">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-100 dark:border-transparent shrink-0">
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider font-semibold">Performance Analytics</div>
                        <div className="text-xs sm:text-[13px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1.5">
                          <span>Class Accuracy: 88%</span>
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Badge 3: Psychometrics (Bottom-Left) */}
                    <div className="absolute bottom-6 sm:bottom-8 -left-2 sm:-left-4 lg:-left-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081226]/95 dark:bg-[#070D1B]/95 text-white backdrop-blur-md border border-slate-700/80 shadow-xl shadow-black/40 text-[11px] font-semibold animate-float-reverse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-300">Analytics:</span>
                      <span className="text-emerald-400 font-bold font-mono">Rank &amp; Percentile Generated</span>
                    </div>

                    <img
                      src="/images/laptop_analytics_gradebook.png"
                      alt="Evaluation and Gradebook Analytics Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(168,85,247,0.22)] dark:drop-shadow-[0_25px_45px_rgba(168,85,247,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-purple-900/10 dark:bg-purple-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />

                    {/* Mobile Badges Row: Positioned below laptop image so laptop screen is completely visible */}
                    <div className="sm:hidden flex flex-wrap items-center justify-center gap-2 mt-3.5 w-full z-20">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-indigo-200/90 dark:border-indigo-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <BarChart3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>Instant Scorecards</span>
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.2 rounded-full border border-indigo-200 dark:border-indigo-800">Auto</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-purple-200/90 dark:border-purple-500/40 shadow-xs">
                        <div className="w-5 h-5 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0B1B3D] dark:text-white flex items-center gap-1">
                          <span>Accuracy: 88%</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════════════════
          8. HOW IT WORKS (Streamlined 4-Step User Workflow)
      ══════════════════════════════════════════════════════════════════════ */}
      <WorkflowStepsSection
        onSelectCapabilityTab={(tab) => {
          setCapabilitiesTab(tab);
          const el = document.getElementById("capabilities");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenExamCodeModal={() => setShowCodeModal(true)}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          9. INSTITUTIONS & FDP SOLUTIONS (Specialized Programs)
          Recreated to match reference UI: FDP Voucher Card with laptop mock-up,
          3 stacked governance cards with chevrons, and bottom 4 trust badges.
      ══════════════════════════════════════════════════════════════════════ */}
      <FdpSolutionsSection />

      {/* ══════════════════════════════════════════════════════════════════════
          10. HONEST & SIMPLE PRICING (Transparent Credit Economics)
          Recreated to match exact reference UI: layered cards, floating badges,
          hand-drawn annotations, focal hero card, and bottom trust benefits row.
      ══════════════════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ══════════════════════════════════════════════════════════════════════
          11. FREQUENTLY ASKED QUESTIONS (PREMIUM DUAL-THEME UI)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="faq"
        className="relative py-9 md:py-12 lg:py-16 bg-[#FFFFFF] dark:bg-[#0B1220] transition-colors duration-200 scroll-mt-20 overflow-hidden"
      >
        {/* Subtle decorative dotted pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.12]"
          aria-hidden="true"
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="faq-pattern-dots"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.1" className="fill-slate-400 dark:fill-slate-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#faq-pattern-dots)" />
          </svg>
        </div>

        {/* Soft background ambient glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200/70 dark:border-blue-800/60 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-tight">
              Frequently Asked <span className="text-[#2563EB] dark:text-[#3B82F6]">Questions</span>
            </h2>

            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] font-normal max-w-lg mx-auto">
              Quick answers to help you get started.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-3.5 sm:space-y-4">
            {[
              {
                q: "What do I get when I sign up as a teacher or faculty member?",
                a: "Every new faculty member automatically receives 200 free assessment credits with a 15-day validity period upon signup. You can immediately create exams, generate questions with Gemini AI, and conduct real assessments with your students."
              },
              {
                q: "How does the prepaid credit deduction work?",
                a: "Billing is unit-based: 1 Credit = 1 Candidate Question Attempt (equivalent to ₹0.10 / 10 paise). For example, an exam with 20 questions taken by 50 candidates requires 1,000 credits. Purchased paid credits do not expire."
              },
              {
                q: "What are FDP Vouchers and how do I redeem one?",
                a: "Faculty Development Program (FDP) vouchers are 12-character grant codes worth 10,000 credits each issued to partnered institutions. Teachers can redeem them directly from the Teacher Dashboard under 'Redeem Voucher' for instant credit top-up."
              },
              {
                q: "How does browser proctoring prevent malpractice?",
                a: "Testora tracks browser tab-switching and window visibility changes. On the first tab switch, the candidate receives a warning prompt. On the second tab switch, the test is automatically submitted server-side to prevent unauthorized browsing."
              },
              {
                q: "Can I download printable question papers for physical classroom exams?",
                a: "Yes. Testora Paper Studio compiles all questions into clean, multi-column HTML/PDF question papers complete with your institution header, section splits, and separate answer keys."
              },
              {
                q: "How do students take an exam?",
                a: "Students visit the portal, click 'Enter Exam Code' on the homepage, and type the 6-character access code provided by their teacher. No student registration fee is charged."
              }
            ].map((item, idx) => {
              const isOpen = openFaq === idx;
              const numStr = String(idx + 1).padStart(2, "0");

              return (
                <div
                  key={idx}
                  className={`rounded-[16px] sm:rounded-[18px] bg-[#FFFFFF] dark:bg-[#111827] overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "border border-[#2563EB] dark:border-[#3B82F6] border-l-4 border-l-[#2563EB] dark:border-l-[#3B82F6] shadow-[0_6px_20px_rgba(37,99,235,0.08)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.35)] ring-1 ring-[#2563EB]/20 dark:ring-[#3B82F6]/20"
                      : "border border-[#E2E8F0] dark:border-[#263449] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-md"
                  }`}
                >
                  <button
                    type="button"
                    id={`faq-question-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Number Label */}
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                          isOpen
                            ? "bg-[#2563EB] text-white dark:bg-[#3B82F6] dark:text-slate-900"
                            : "bg-[#F1F5F9] text-[#64748B] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                        }`}
                      >
                        {numStr}
                      </span>

                      {/* Question Text */}
                      <span className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-snug">
                        {item.q}
                      </span>
                    </div>

                    {/* Plus / Minus Action Indicator */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isOpen
                          ? "bg-[#2563EB] text-white dark:bg-[#3B82F6] dark:text-slate-900 shadow-xs"
                          : "bg-[#EFF6FF] text-[#2563EB] dark:bg-blue-950/60 dark:text-[#3B82F6]"
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Answer with soft blue-gray tinted background */}
                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-question-${idx}`}
                      className="bg-[#F1F6FD] dark:bg-[#172338] px-5 sm:px-6 py-4 sm:py-5 border-t border-[#E2E8F0] dark:border-[#263449] transition-all animate-in fade-in duration-200"
                    >
                      <p className="text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:pl-11">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          11.5. FEEDBACK & SUGGESTIONS SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <FeedbackSection />

      {/* ══════════════════════════════════════════════════════════════════════
          12. FINAL CALL TO ACTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-9 md:py-12 lg:py-16 relative overflow-hidden bg-slate-950 text-white text-center border-t border-blue-900/40">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/images/cta_banner_bg.png')" }}
        />
        {/* Ambient Gradient Overlays for High Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B18]/50 via-transparent to-[#060B18]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-blue-600/10 mix-blend-screen pointer-events-none" />

        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5 sm:space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 text-blue-200 border border-white/20 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Start Testing in Minutes</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
            Ready to Modernize Your Assessments with Testora Quiz?
          </h2>
          <p className="text-xs sm:text-base text-blue-100/90 max-w-xl mx-auto leading-relaxed drop-shadow-xs font-normal">
            Create online assessments, generate question papers with AI, and automate grading. Get 200 free credits today.
          </p>
          {/* Two CTA Buttons in ONE Single Row on Both Mobile & Desktop Mode */}
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3.5 max-w-sm sm:max-w-lg mx-auto pt-2">
            <Link
              href="/login?mode=signup"
              className="w-full py-2.5 xs:py-3 sm:py-3.5 px-2 xs:px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-white text-blue-950 font-extrabold text-[11px] xs:text-xs sm:text-sm text-center shadow-xl shadow-blue-950/40 hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <span className="truncate">
                <span className="hidden sm:inline">Claim 200 Free Credits Now &rarr;</span>
                <span className="sm:hidden">Claim 200 Credits &rarr;</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="w-full py-2.5 xs:py-3 sm:py-3.5 px-2 xs:px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-blue-950/70 border border-white/25 text-white font-bold text-[11px] xs:text-xs sm:text-sm text-center backdrop-blur-md hover:bg-blue-900/80 hover:-translate-y-0.5 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <span className="truncate">
                <span className="hidden sm:inline">Enter Exam Passcode 🔑</span>
                <span className="sm:hidden">Exam Passcode 🔑</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          13. PREMIUM ACADEMIC SaaS FOOTER (Dual-Theme Light & Dark Mode)
          Matches Reference UI: Soft light-blue to pale lavender gradient,
          thin dark navy top strip, educational workspace showcase image,
          5-column layout with rounded icon badges, status & security badges,
          interactive CTAs, and sleek bottom copyright/social bar.
      ══════════════════════════════════════════════════════════════════════ */}
      <WebsiteFooter
        onOpenCodeModal={() => setShowCodeModal(true)}
        onOpenGuideWidget={() => setShowGuideWidget(true)}
        onScrollTo={(id) => scrollTo(id)}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          14. DIRECT EXAM CODE ENTRY MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Enter Assessment Code</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the unique access passcode provided by your professor or exam supervisor.
            </p>

            <form onSubmit={handleDirectExamSubmit} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={directExamCode}
                onChange={(e) => setDirectExamCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS301A"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-black text-lg tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={!directExamCode.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Start Assessment &rarr;
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating AI Guide Widget */}
      <AIAgentGuideWidget isOpen={showGuideWidget} onOpenChange={setShowGuideWidget} onOpenExamModal={() => setShowCodeModal(true)} />
    </div>
  );
}
