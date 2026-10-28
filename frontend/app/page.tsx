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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";
import ThemeToggle from "../components/ThemeToggle";
import AppLogo from "../components/AppLogo";
import AIAgentGuideWidget from "../components/AIAgentGuideWidget";
import PromoDashboardPlayer from "../components/PromoDashboardPlayer";
import PlatformActivitySection from "../components/PlatformActivitySection";
import ArchitectureCapabilitiesCarousel from "../components/ArchitectureCapabilitiesCarousel";
import PricingSection from "../components/PricingSection";
import FdpSolutionsSection from "../components/FdpSolutionsSection";
import WorkflowStepsSection from "../components/WorkflowStepsSection";

export default function UnifiedHomePage() {
  const router = useRouter();
  const { token, role, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

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
  }, []);

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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white text-xs py-2 border-b border-blue-900/60 select-none">

        {/* Subtle Edge Fade Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#0F172A] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#0F172A] to-transparent z-10" />

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
          2. STICKY MODERN NAVBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2 transition-colors">
        <div className="w-full max-w-[1400px] 2xl:max-w-[1536px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 -ml-1 sm:-ml-2 transition-transform hover:scale-[1.02]">
            <AppLogo variant="row" height={44} showBadge={false} />
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <button
              type="button"
              onClick={() => scrollTo("portals")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Portals
            </button>
            <button
              type="button"
              onClick={() => scrollTo("capabilities")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollTo("fdp-solutions")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Institutions &amp; FDP</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">Vouchers</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo("faq")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Ask AI Pill */}
            <button
              type="button"
              onClick={() => setShowGuideWidget(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer ring-1 ring-white/20 select-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Ask AI Guide</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/25 text-[9px] font-mono font-black tracking-wider uppercase">
                AI
              </span>
            </button>

            {/* Theme Toggle (Direct 1-Click Sun/Moon) */}
            <ThemeToggle className="h-9 w-9" />

            {/* Auth Buttons */}
            {mounted && token ? (
              <div className="flex items-center gap-2">
                <Link
                  href={role === "super_admin" ? "/admin" : role === "student" ? "/dashboard/student" : "/dashboard/teacher"}
                  className="px-3.5 py-1.5 h-9 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {role === "super_admin" ? "Admin Panel" : "Go to Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-1.5 h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="hidden sm:inline-flex px-4 py-1.5 h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 mt-3 space-y-2 text-xs font-semibold animate-in fade-in duration-150">
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
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowGuideWidget(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter Code</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          3. HERO SECTION (Strong First Impression + Interactive Showcase)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-radial from-blue-100/40 via-transparent to-transparent dark:from-blue-950/25">

        {/* Subtle Background Lighting & Dot Grid Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1400px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">

            {/* Left Column: Clear Headline, Subtitle, and CTAs (lg:col-span-6) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">

              {/* Live Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                <span>AI-Powered Examination &amp; Assessment Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Create Smarter Exams.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                  Understand Better Results.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Create assessments, generate questions with AI, evaluate submissions, and understand student performance in one platform.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  href="/login?mode=signup"
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Enter Exam Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("capabilities")}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Features</span>
                </button>
              </div>

              {/* Verified Trust Pillars */}
              <div className="pt-2 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Gemini Pro AI Synthesis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>200 Free Credits on Signup</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Server Tab Proctoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>KaTeX Formula Support</span>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Video Showcase (lg:col-span-6) */}
            <div className="lg:col-span-6 w-full">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/15 dark:shadow-black/70 border border-slate-200/90 dark:border-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 group transition-colors duration-300">
                <PromoDashboardPlayer />
              </div>
              <div className="mt-2.5 text-center lg:text-left text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center lg:justify-start gap-1.5 pl-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Watch Testora Quiz in action: AI Synthesis, Automated Grading &amp; Proctor Radar.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. SECTION 1: TEACHER AND STUDENT ENTRY CARDS (Reference Inspired)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="portals" className="py-16 sm:py-24 bg-[#F8FAFC] dark:bg-[#080E1E] border-b border-slate-200/80 dark:border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-12">

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">

            {/* Left Card: Teacher / Instructor Studio */}
            <div className="relative rounded-[32px] bg-white dark:bg-[#0D1830] border-2 border-blue-500/80 dark:border-[#2563EB]/70 shadow-xl shadow-blue-500/5 dark:shadow-[0_0_35px_rgba(37,99,235,0.22)] hover:shadow-2xl hover:border-blue-500 transition-all duration-300 overflow-hidden flex flex-col justify-between group">

              <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between space-y-6">

                {/* Header: Role Pill & Access Level */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-500/40 text-blue-600 dark:text-blue-300 text-xs font-bold shadow-xs">
                      <BookOpen className="w-3.5 h-3.5 fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400" />
                      <span>Instructor Studio</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-blue-300/70 font-bold uppercase tracking-widest">
                      FACULTY ACCESS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                      Create <span className="text-blue-600 dark:text-[#38BDF8]">Smart Tests</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A9B9D3] mt-2 leading-relaxed">
                      Create assessments, organize questions, and prepare exams for your students with AI.
                    </p>
                  </div>
                </div>

                {/* 3D Illustration Stage (Dual Theme Support) */}
                <div className="relative w-full overflow-hidden rounded-2xl select-none my-1">
                  <img
                    src="/images/card_teacher_light.png"
                    alt="Instructor Studio Dashboard"
                    className="w-full h-auto object-contain block dark:hidden pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                    draggable={false}
                  />
                  <img
                    src="/images/card_teacher_dark.png"
                    alt="Instructor Studio Dashboard"
                    className="w-full h-auto object-contain hidden dark:block pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                    draggable={false}
                  />
                </div>

                {/* Bottom Section: Feature Badges & Action CTA */}
                <div className="space-y-4 pt-1">
                  {/* 3 Unified Feature Tiles */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Tile 1: AI Questions */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-[#38BDF8] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">AI Questions</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Generate with AI</div>
                      </div>
                    </div>
                    {/* Tile 2: PDF & Docs */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-[#C084FC] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">PDF &amp; Docs</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Upload &amp; Convert</div>
                      </div>
                    </div>
                    {/* Tile 3: Auto Grade */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-[#2DD4BF] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Auto Grade</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Save Time</div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <Link
                    href={mounted && token && role === "teacher" ? "/dashboard/teacher" : "/login?role=teacher"}
                    className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Open Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </div>

            {/* Right Card: Student Portal */}
            <div className="relative rounded-[32px] bg-white dark:bg-[#0D1830] border-2 border-emerald-500/80 dark:border-[#10B981]/70 shadow-xl shadow-emerald-500/5 dark:shadow-[0_0_35px_rgba(16,185,129,0.22)] hover:shadow-2xl hover:border-emerald-500 transition-all duration-300 overflow-hidden flex flex-col justify-between group">

              <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between space-y-6">

                {/* Header: Role Pill & Access Level */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold shadow-xs">
                      <GraduationCap className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                      <span>Candidate Portal</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-500/40 text-emerald-600 dark:text-[#34D399] text-[11px] font-bold tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>EXAM ACTIVE</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                        Take <span className="text-emerald-600 dark:text-[#34D399]">Your Test</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A9B9D3] mt-2 leading-relaxed">
                        Access assigned assessments using your exam code and complete your test.
                      </p>
                    </div>
                    {/* Handwritten note style callout */}
                    <div className="hidden sm:flex flex-col items-center pt-0.5 text-emerald-600 dark:text-[#34D399] select-none pointer-events-none shrink-0 -rotate-2">
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
                <div className="relative w-full overflow-hidden rounded-2xl select-none my-1">
                  <img
                    src="/images/card_student_light.png"
                    alt="Candidate Portal Exam HUD"
                    className="w-full h-auto object-contain block dark:hidden pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                    draggable={false}
                  />
                  <img
                    src="/images/card_student_dark.png"
                    alt="Candidate Portal Exam HUD"
                    className="w-full h-auto object-contain hidden dark:block pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]"
                    draggable={false}
                  />
                </div>

                {/* Bottom Section: Feature Badges & Action CTA */}
                <div className="space-y-4 pt-1">
                  {/* 3 Unified Feature Tiles */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Tile 1: Exam Code */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-[#34D399] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Exam Code</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Quick Access</div>
                      </div>
                    </div>
                    {/* Tile 2: Autosave */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-[#2DD4BF] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Autosave</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Never Lose Progress</div>
                      </div>
                    </div>
                    {/* Tile 3: Proctoring */}
                    <div className="bg-white dark:bg-[#111D35] border border-slate-200/90 dark:border-[#263957] shadow-xs dark:shadow-none rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 transition-colors">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-[#FBBF24] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Proctoring</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-[#A9B9D3] font-medium truncate">Secure Exams</div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => setShowCodeModal(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-[#059669] hover:bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Open Portal (Enter Code)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. SECTION 3: PLATFORM CAPABILITIES & SYSTEM ARCHITECTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="capabilities" className="relative py-12 sm:py-20 lg:py-28 overflow-hidden bg-[#F0F6FF] dark:bg-[#070D1A] border-b border-slate-200/80 dark:border-slate-800/80 scroll-mt-20">
        
        {/* Subtle Ambient Background Lighting & Dot Grid Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute top-10 -left-20 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-blue-300/25 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 -right-20 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-purple-300/20 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">

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
          <div className="grid grid-cols-4 sm:flex sm:flex-nowrap items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white dark:bg-[#0D1830] rounded-2xl sm:rounded-full max-w-4xl mx-auto border border-slate-200/90 dark:border-slate-800 shadow-sm">
            
            {/* Tab 1: Teacher Assessment Studio */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("studio")}
              className={`p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                capabilitiesTab === "studio"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-bold">Teacher<br />Studio</span>
              <span className="hidden sm:inline">Teacher Assessment Studio</span>
            </button>

            <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700/60 my-auto" />

            {/* Tab 2: Student Test Experience */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("student")}
              className={`p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                capabilitiesTab === "student"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <GraduationCap className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-semibold">Student<br />Experience</span>
              <span className="hidden sm:inline">Student Test Experience</span>
            </button>

            <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700/60 my-auto" />

            {/* Tab 3: Exam Monitoring */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("proctor")}
              className={`p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                capabilitiesTab === "proctor"
                  ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/25 dark:bg-[#0066FF] dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden text-[10px] leading-tight text-center font-semibold">Exam<br />Monitoring</span>
              <span className="hidden sm:inline">Exam Monitoring</span>
            </button>

            <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700/60 my-auto" />

            {/* Tab 4: Evaluation & Gradebook */}
            <button
              type="button"
              onClick={() => setCapabilitiesTab("gradebook")}
              className={`p-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
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
                    <img
                      src="/images/capabilities_laptop_studio.png"
                      alt="Teacher Assessment Studio Interface Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(37,99,235,0.22)] dark:drop-shadow-[0_25px_45px_rgba(37,99,235,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-blue-900/10 dark:bg-blue-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />
                  </div>
                </div>
              </div>
            )}
\r\n            {/* TAB 2: STUDENT TEST EXPERIENCE */}
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
                    <img
                      src="/images/laptop_student_exam.png"
                      alt="Student CBT Exam Testing Interface Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(16,185,129,0.22)] dark:drop-shadow-[0_25px_45px_rgba(16,185,129,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-emerald-900/10 dark:bg-emerald-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />
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
                    <img
                      src="/images/laptop_proctor_radar.png"
                      alt="Exam Monitoring Radar Telemetry Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(244,63,94,0.25)] dark:drop-shadow-[0_25px_45px_rgba(244,63,94,0.4)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-rose-900/10 dark:bg-rose-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />
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
                    <img
                      src="/images/laptop_analytics_gradebook.png"
                      alt="Evaluation and Gradebook Analytics Mockup"
                      className="w-full max-w-[580px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(168,85,247,0.22)] dark:drop-shadow-[0_25px_45px_rgba(168,85,247,0.35)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                    />
                    {/* Subtle 3D Depth Ground Reflection */}
                    <div className="w-[70%] h-3 sm:h-4 bg-purple-900/10 dark:bg-purple-500/20 blur-md rounded-full mt-[-10px] pointer-events-none transition-all duration-500 group-hover:w-[75%] group-hover:opacity-75" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. VERIFIED PLATFORM ACTIVITY & REAL TELEMETRY (Reference UI)
      ══════════════════════════════════════════════════════════════════════ */}
      <PlatformActivitySection stats={dbStats} />

      {/* ══════════════════════════════════════════════════════════════════════
          7. CORE ARCHITECTURE SUMMARY (Comprehensive Assessment Capabilities)
          Exact Premium 3D Side-Angle Carousel with interactive state, angled adjacent
          panels, touch swipe, pagination pills, and bottom summary.
      ══════════════════════════════════════════════════════════════════════ */}
      <ArchitectureCapabilitiesCarousel />

      {/* ══════════════════════════════════════════════════════════════════════
          8. HOW IT WORKS (Streamlined 4-Step User Workflow)
      ══════════════════════════════════════════════════════════════════════ */}
      <WorkflowStepsSection />

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
          11. ACCURATE FREQUENTLY ASKED QUESTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Got Questions?
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
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
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <Minus className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          12. FINAL CALL TO ACTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden bg-slate-950 text-white text-center border-t border-blue-900/40">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/images/cta_banner_bg.png')" }}
        />
        {/* Ambient Gradient Overlays for High Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B18]/50 via-transparent to-[#060B18]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-blue-600/10 mix-blend-screen pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
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
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login?mode=signup"
              className="px-6 py-3.5 rounded-2xl bg-white text-blue-950 font-extrabold text-xs shadow-xl shadow-blue-950/40 hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Claim 200 Free Credits Now &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-blue-950/70 border border-white/25 text-white font-bold text-xs backdrop-blur-md hover:bg-blue-900/80 hover:-translate-y-0.5 transition-all cursor-pointer shadow-lg"
            >
              Enter Exam Passcode 🔑
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          13. PREMIUM SaaS FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative bg-[#070D1A] text-slate-400 text-xs border-t border-slate-800/80 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 opacity-80" />

        {/* Ambient Radial Glows */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-14 pb-12 relative z-10 space-y-12">

          {/* Main 6-Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-10">

            {/* Col 1 & 2: Brand Identity & Trust Card (2 Columns Wide) */}
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="inline-block">
                <AppLogo variant="row" height={38} forceTheme="dark" showBadge={false} />
              </Link>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Testora Quiz is an AI-powered assessment synthesizer, automated question paper studio, and real-time proctoring platform designed for educators, universities, and students.
              </p>

              {/* Live Operational Status & Security */}
              <div className="space-y-2.5 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>All Evaluation Engines Operational</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Role-Based Access Control • Server-Enforced Anti-Cheat</span>
                </div>
              </div>

              {/* Quick Action Badges */}
              <div className="flex items-center gap-2.5 pt-2">
                <Link
                  href="/login?role=teacher"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[11px] transition-colors"
                >
                  Faculty Login &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  Enter Exam Code 🔑
                </button>
              </div>
            </div>

            {/* Col 3: Product Capabilities */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Product</span>
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button type="button" onClick={() => scrollTo("capabilities")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Platform Capabilities
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("features")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Paper Studio (PDFs)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("capabilities")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Tab-Switch Proctoring
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("how-it-works")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    AI Question Generator
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("pricing")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Prepaid Credit Wallet
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Portals & Workspaces */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Portals</span>
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/login?role=teacher" className="text-slate-400 hover:text-white transition-colors">
                    Instructor Studio
                  </Link>
                </li>
                <li>
                  <Link href="/portal" className="text-slate-400 hover:text-white transition-colors">
                    Candidate Exam Portal
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => setShowCodeModal(true)} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Direct Passcode Access
                  </button>
                </li>
                <li>
                  <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                    Admin Gateway
                  </Link>
                </li>
                <li>
                  <Link href="/login?mode=signup" className="text-slate-400 hover:text-white transition-colors">
                    Claim Free 200 Credits
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: Institutional & College Solutions */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Institutional</span>
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button type="button" onClick={() => scrollTo("fdp-solutions")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    FDP Grant Vouchers
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("fdp-solutions")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Department Plans
                  </button>
                </li>
                <li>
                  <a href="mailto:contact@dpramp.com" className="text-slate-400 hover:text-white transition-colors">
                    Campus Partnerships
                  </a>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("pricing")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Razorpay Secure Billing
                  </button>
                </li>
                <li>
                  <a href="mailto:contact@dpramp.com" className="text-slate-400 hover:text-white transition-colors">
                    Institutional Inquiries
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 6: Support & Assistance */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resources</span>
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button type="button" onClick={() => setShowGuideWidget(true)} className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>AI Guide Assistant</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("faq")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    Frequently Asked Questions
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollTo("capabilities")} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left">
                    System Architecture
                  </button>
                </li>
                <li>
                  <Link href="/guide" className="text-slate-400 hover:text-white transition-colors">
                    Faculty User Guide
                  </Link>
                </li>
                <li>
                  <a href="mailto:contact@dpramp.com" className="text-slate-400 hover:text-white transition-colors">
                    Dedicated Support Desk
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Sub-Footer: Copyright, Security Notice & Navigation */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
              <span>&copy; {new Date().getFullYear()} Testora Quiz. All rights reserved.</span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="text-slate-400">Crafted for academic integrity &amp; modern assessment excellence.</span>
            </div>

            <div className="flex items-center gap-4 text-xs pr-0 sm:pr-16 lg:pr-20">
              <button
                type="button"
                onClick={() => scrollTo("faq")}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                FAQ
              </button>
              <span className="text-slate-700">•</span>
              <a href="mailto:contact@dpramp.com" className="hover:text-slate-300 transition-colors">
                Support
              </a>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-semibold"
              >
                <span>Back to Top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </footer>

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
