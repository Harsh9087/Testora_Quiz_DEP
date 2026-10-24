"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";
import { 
  School, 
  FileEdit, 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert, 
  BarChart3, 
  KeyRound, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  FileCode2, 
  Play, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Lock,
  Clock,
  Award,
  Zap,
  HelpCircle,
  LogIn,
  ChevronRight,
  Calendar,
  Sliders,
  Settings,
  FileText,
  CloudUpload,
  FileUp,
  Radio
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import MovableBadge from "../components/MovableBadge";
import AppLogo from "../components/AppLogo";

export default function UnifiedHomePage() {
  const router = useRouter();
  const { token, fullName, role, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [directExamCode, setDirectExamCode] = useState("");
  const [copiedCred, setCopiedCred] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<"creator" | "student" | "proctor" | "analytics">("creator");
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  const handleQuickDemoLogin = async (email: string, pass: string, roleKey: string) => {
    setLoggingInRole(roleKey);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        useAuthStore.getState().setAuth(
          data.access_token,
          data.role,
          data.full_name,
          data.institution_id
        );
        if (data.workspace_id) {
          localStorage.setItem("workspaceId", data.workspace_id);
          localStorage.setItem("workspaceName", data.workspace_name || "Personal Workspace");
        }
        if (data.role === "student") {
          router.push("/dashboard/student");
        } else {
          router.push("/dashboard/teacher");
        }
      } else {
        router.push(`/login?role=${roleKey}`);
      }
    } catch {
      router.push(`/login?role=${roleKey}`);
    } finally {
      setLoggingInRole(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTeacher = role === "teacher" || role === "inst_admin" || role === "super_admin";

  const handleTeacherModeSelect = () => {
    if (token) {
      router.push("/dashboard/teacher");
    } else {
      router.push("/login?role=teacher&target=teacher_dashboard");
    }
  };

  const handleStudentModeSelect = () => {
    if (token) {
      router.push("/dashboard/student");
    } else {
      router.push("/login?role=student&target=student_dashboard");
    }
  };

  const handleDirectExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directExamCode.trim()) return;
    const cleanCode = directExamCode.trim().replace(/^.*\/exam\//, "");
    router.push(`/exam/${cleanCode}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCred(label);
    setTimeout(() => setCopiedCred(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F1F5F9] transition-colors duration-200 selection:bg-blue-500/20 flex flex-col justify-between">
      
      {/* ══════════════════════════════════════════════════════════════════════
          TOP NAVIGATION BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#263449] px-4 md:px-8 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group transition-transform hover:opacity-95">
          <AppLogo variant="row" height={36} showBadge={true} />
        </a>

        {/* Action Controls & User Auth Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Important Paths Only */}
          <button
            onClick={() => scrollToSection("mode-selection")}
            className="hidden sm:inline-flex text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors px-2 py-1 cursor-pointer"
          >
            Select Mode
          </button>
          <button
            onClick={() => scrollToSection("platform-guide")}
            className="hidden sm:inline-flex text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors px-2 py-1 cursor-pointer"
          >
            Platform Guide
          </button>

          {/* Universal Theme Toggle (Light / Dark / System Default) */}
          <ThemeToggle />

          {/* User Auth Status with Profile Avatar Icon */}
          {mounted && token ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(isTeacher ? "/dashboard/teacher" : "/dashboard/student")}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB] transition-all shadow-2xs cursor-pointer group"
                title={`Logged in as ${fullName} (${role}) — Click to open Dashboard`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] max-w-[100px] truncate block leading-tight group-hover:text-[#2563EB]">
                    {fullName || "User"}
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-[#2563EB] dark:text-[#60A5FA] leading-none block">
                    {role}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="p-2 rounded-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/login")}
                className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] text-xs font-bold text-[#111827] dark:text-[#F1F5F9] transition-all shadow-2xs cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/login?mode=signup")}
                className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO & MODE SELECTION HUB
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-5 pb-10 sm:pt-7 sm:pb-14 space-y-8 sm:space-y-10 w-full">
        
        {/* Hero Title */}
        <section className="text-center space-y-2.5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#172B4D] border border-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] text-[11px] font-semibold shadow-2xs">
            <Sparkles className="h-3 w-3" />
            <span>AI-Powered Examination Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-[#F1F5F9] leading-tight">
            Smart Examinations, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:via-[#60A5FA] dark:to-[#93C5FD]">
              Seamless Proctoring
            </span>
          </h1>

          <p className="text-xs sm:text-base text-[#64748B] dark:text-[#A3B1C6] font-medium max-w-xl mx-auto leading-relaxed">
            Create and manage tests as an instructor, or sign in to start your exam as a student.
          </p>
        </section>

        {/* ═══════ THE 2 CORE WORKSPACE MODE CARDS (EXPANDED & PROPORTIONAL IN DESKTOP) ═══════ */}
        <section id="mode-selection" className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-[1100px] mx-auto w-full">
          
          {/* CARD 1: CREATE TEST (TEACHER STUDIO) */}
          <div
            onClick={handleTeacherModeSelect}
            className="group relative bg-white dark:bg-[#111C31] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB] dark:hover:border-[#3B82F6] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] z-10" />
            
            <div>
              {/* Photo Banner on Top - Spacious & Well-Framed */}
              <div className="relative w-full h-44 sm:h-52 md:h-56 lg:h-60 overflow-hidden bg-white dark:bg-[#111C31] flex items-center justify-center p-3">
                <img
                  src="/images/teacher_mode_3d.png"
                  alt="Instructor Studio"
                  className="w-full h-full object-contain scale-105 sm:scale-110 group-hover:scale-115 transition-transform duration-300"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#0B1120]/80 text-white backdrop-blur-xs border border-white/20 shadow-xs">
                  Instructor Studio
                </span>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors leading-tight">
                      Create Smart Tests
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#2563EB] dark:text-[#60A5FA] border border-blue-500/20">
                      Faculty
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] font-medium leading-relaxed">
                    Generate complete tests in seconds from your syllabus, docs, or PDFs.
                  </p>
                </div>

                {/* Creative Feature Pills (Easy to read & scan) */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/25 text-[#2563EB] dark:text-[#60A5FA] border border-blue-100 dark:border-blue-800/40">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    AI Questions
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <FileUp className="w-3 h-3 text-blue-500 shrink-0" />
                    PDF & Docs
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <BarChart3 className="w-3 h-3 text-emerald-500 shrink-0" />
                    Auto Grade
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6 pt-0">
              <button 
                type="button"
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 group-hover:gap-2.5 cursor-pointer"
              >
                <span>{mounted && token && isTeacher ? "Open Studio" : "Create Test"}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* CARD 2: TAKE TEST (STUDENT PORTAL) */}
          <div
            onClick={handleStudentModeSelect}
            className="group relative bg-white dark:bg-[#111C31] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#263449] hover:border-emerald-600 dark:hover:border-emerald-500 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 z-10" />
            
            <div>
              {/* Photo Banner on Top - Spacious & Well-Framed */}
              <div className="relative w-full h-44 sm:h-52 md:h-56 lg:h-60 overflow-hidden bg-white dark:bg-[#111C31] flex items-center justify-center p-3">
                <img
                  src="/images/student_mode_3d.png"
                  alt="Candidate Portal"
                  className="w-full h-full object-contain scale-105 sm:scale-110 group-hover:scale-115 transition-transform duration-300"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#0B1120]/80 text-white backdrop-blur-xs border border-white/20 shadow-xs">
                  Candidate Portal
                </span>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      Take Live Test
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Students
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] font-medium leading-relaxed">
                    Join assigned assessments with your access code and submit with instant cloud sync.
                  </p>
                </div>

                {/* Creative Feature Pills (Easy to read & scan) */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                    <KeyRound className="w-3 h-3 shrink-0" />
                    Direct PIN
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    Cloud Autosave
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    Anti-Cheat
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6 pt-0">
              <button 
                type="button"
                className="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 group-hover:gap-2.5 cursor-pointer"
              >
                <span>{mounted && token ? "Open Portal" : "Take Test"}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </section>

        {/* ═══════ FAST DIRECT EXAM CODE JUMP BAR (MATCHING EXPANDED WIDTH) ═══════ */}
        <section className="max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-[1100px] mx-auto w-full">
          <div className="p-4 sm:p-5 lg:p-6 bg-white dark:bg-[#111C31] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172B4D] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                <FileCode2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                  Have a Direct Exam Code from Your Instructor?
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6]">
                  Paste your test code below to jump directly into the candidate testing gateway.
                </p>
              </div>
            </div>

            <form onSubmit={handleDirectExamSubmit} className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
              <input
                type="text"
                value={directExamCode}
                onChange={(e) => setDirectExamCode(e.target.value)}
                placeholder="e.g. ex-compi-6356"
                className="w-full md:w-56 lg:w-64 px-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#263449] text-xs sm:text-sm font-mono text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Join Room
              </button>
            </form>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            INTEGRATED PLATFORM ARCHITECTURE & CAPABILITIES (EXACT REFERENCE UI)
        ══════════════════════════════════════════════════════════════════════ */}
        <section id="platform-guide" className="max-w-[1380px] w-full mx-auto space-y-7 pt-8 px-2 sm:px-4">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Testora Quiz</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#F1F5F9] tracking-tight">
              Platform Capabilities & <span className="text-[#2563EB] dark:text-[#60A5FA]">System Architecture</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] max-w-2xl mx-auto leading-relaxed">
              Explore how Testora Quiz orchestrates AI question synthesis, multi-format knowledge indexing, and live telemetry proctoring.
            </p>
          </div>

          {/* 4 Horizontally Aligned Navigation Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-5xl mx-auto">
            <button
              onClick={() => setActiveGuideTab("creator")}
              className={`relative py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                activeGuideTab === "creator"
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md shadow-blue-500/25"
                  : "bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
              }`}
            >
              <BookOpen className={`w-4 h-4 shrink-0 ${activeGuideTab === "creator" ? "text-white" : "text-[#2563EB] dark:text-[#60A5FA]"}`} />
              <span className="truncate">1. Teacher Creator Studio</span>
              {activeGuideTab === "creator" && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-[#2563EB] dark:border-t-[#3B82F6] z-20" />
              )}
            </button>

            <button
              onClick={() => setActiveGuideTab("student")}
              className={`relative py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                activeGuideTab === "student"
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md shadow-blue-500/25"
                  : "bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
              }`}
            >
              <GraduationCap className={`w-4 h-4 shrink-0 ${activeGuideTab === "student" ? "text-white" : "text-[#2563EB] dark:text-[#60A5FA]"}`} />
              <span className="truncate">2. Student Test Runner</span>
              {activeGuideTab === "student" && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-[#2563EB] dark:border-t-[#3B82F6] z-20" />
              )}
            </button>

            <button
              onClick={() => setActiveGuideTab("proctor")}
              className={`relative py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                activeGuideTab === "proctor"
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md shadow-blue-500/25"
                  : "bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
              }`}
            >
              <ShieldAlert className={`w-4 h-4 shrink-0 ${activeGuideTab === "proctor" ? "text-white" : "text-[#2563EB] dark:text-[#60A5FA]"}`} />
              <span className="truncate">3. Anti-Cheat Telemetry</span>
              {activeGuideTab === "proctor" && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-[#2563EB] dark:border-t-[#3B82F6] z-20" />
              )}
            </button>

            <button
              onClick={() => setActiveGuideTab("analytics")}
              className={`relative py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                activeGuideTab === "analytics"
                  ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-md shadow-blue-500/25"
                  : "bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9] hover:border-[#2563EB] hover:text-[#2563EB] dark:hover:text-[#60A5FA]"
              }`}
            >
              <BarChart3 className={`w-4 h-4 shrink-0 ${activeGuideTab === "analytics" ? "text-white" : "text-[#2563EB] dark:text-[#60A5FA]"}`} />
              <span className="truncate">4. Evaluation & Gradebook</span>
              {activeGuideTab === "analytics" && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-[#2563EB] dark:border-t-[#3B82F6] z-20" />
              )}
            </button>
          </div>

          {/* Main Large White Rounded Container */}
          <div className="bg-white dark:bg-[#111C31] rounded-3xl border border-[#E2E8F0] dark:border-[#263449] p-6 sm:p-8 lg:p-10 shadow-sm">
            
            {/* ══════ TAB 1: TEACHER CREATOR STUDIO ══════ */}
            {activeGuideTab === "creator" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                
                {/* LEFT SECTION (50% width) - SEAMLESS, NO INNER BORDER BOX */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full space-y-6 p-1 sm:p-2">
                  
                  {/* Top Header & Labels */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/40 shadow-xs flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                        <FileEdit className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#2563EB] dark:text-[#60A5FA] uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
                          CREATE • CONFIGURE • SCHEDULE
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight leading-snug mt-1">
                          Instructor 4-Step <br />
                          <span className="text-[#2563EB] dark:text-[#60A5FA]">Assessment Creator</span>
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
                      From your content to a secure, ready-to-run assessment in just a few guided steps.
                    </p>
                  </div>

                  {/* REALISTIC 3D LAPTOP INTERFACE PREVIEW WITH MOVABLE BADGES, RADIANT AMBIENT GLOW FLARE & FLOAT ANIMATION */}
                  <div className="relative my-auto py-5 sm:py-7 flex items-center justify-center">
                    {/* Glowing Radiant Flare Backdrop */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
                      <div className="w-[360px] sm:w-[520px] h-[240px] sm:h-[340px] bg-gradient-to-tr from-blue-500/25 via-sky-400/30 to-indigo-500/25 dark:from-blue-600/40 dark:via-cyan-400/30 dark:to-indigo-500/35 rounded-full blur-3xl transform scale-110 opacity-85 animate-pulse" />
                      <div className="absolute w-[240px] sm:w-[360px] h-[160px] sm:h-[230px] bg-sky-400/30 dark:bg-blue-400/35 rounded-full blur-2xl" />
                      <div className="absolute w-[140px] sm:w-[190px] h-[90px] sm:h-[130px] bg-white/50 dark:bg-sky-300/20 rounded-full blur-xl" />
                    </div>

                    <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[490px] flex items-center justify-center animate-float-slow">
                      <img
                        src="/images/laptop_mockup.png"
                        alt="Testora Assessment Creator Studio"
                        className="w-full h-auto object-contain drop-shadow-[0_22px_40px_rgba(37,99,235,0.28)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.75)] select-none pointer-events-none transition-transform duration-300"
                        draggable={false}
                      />

                      {/* Interactive Movable Badges */}
                      <MovableBadge
                        icon={FileText}
                        text="PDF / PPT / TXT"
                        iconColorClass="text-rose-500"
                        initialPos={{ top: "0%", right: "-8px" }}
                        animationClass="animate-float-slow"
                      />

                      <MovableBadge
                        icon={Sparkles}
                        text="AI Questions"
                        iconColorClass="text-[#2563EB] dark:text-[#60A5FA]"
                        initialPos={{ top: "42%", right: "-20px" }}
                        animationClass="animate-float-delayed"
                      />

                      <MovableBadge
                        icon={Calendar}
                        text="Schedule Test"
                        iconColorClass="text-emerald-500"
                        initialPos={{ bottom: "0%", right: "-6px" }}
                        animationClass="animate-float-reverse"
                      />

                      <MovableBadge
                        icon={CheckCircle2}
                        text="KaTeX Math"
                        iconColorClass="text-blue-500"
                        initialPos={{ bottom: "14%", left: "-12px" }}
                        animationClass="animate-float-slow"
                      />
                    </div>
                  </div>

                  {/* 3 Compact Feature Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Multiple File Formats</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">PDF, PPTX, TXT and more</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">AI Question Generation</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">MCQ, Short Answer, Subjective</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Flexible Scheduling</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Test windows, rules & passcodes</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT SECTION: 4-STEP WORKFLOW (EQUAL TOP & BOTTOM ALIGNMENT) */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full relative pl-0 sm:pl-3 p-1 sm:p-2">
                  
                  {/* Vertical Connecting Line (Desktop Only) */}
                  <div className="absolute left-[24px] sm:left-[36px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-blue-500/25 z-0 hidden lg:block" />

                  {/* Mobile Swipe Hint */}
                  <div className="flex lg:hidden items-center justify-between px-1 mb-2 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <span>Interactive Workflow (Swipe 1 → 4)</span>
                    </span>
                    <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold flex items-center gap-0.5">
                      Swipe &rarr;
                    </span>
                  </div>

                  {/* 4 Workflow Rows: Stretched Evenly on Desktop, Horizontal Scrolling Row on Mobile */}
                  <div className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-between gap-3 sm:gap-3.5 pb-2 lg:pb-0 px-1 sm:px-0 -mx-1 sm:mx-0">
                    
                    {/* Row 1: Knowledge Base */}
                    <div 
                      onClick={() => router.push(token ? "/dashboard/teacher" : "/login")}
                      className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-1 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">
                        1
                      </div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileUp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                              Knowledge Base
                            </h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">
                              Select existing document or upload new PDF/PPTX/TXT files directly for instant ChromaDB vector embedding.
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: AI Blueprint */}
                    <div 
                      onClick={() => router.push(token ? "/dashboard/teacher" : "/login")}
                      className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-2 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">
                        2
                      </div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Sliders className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                              AI Blueprint
                            </h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">
                              Configure MCQ / short answer distributions, difficulty levels, and syllabus coverage targets.
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Question Editor */}
                    <div 
                      onClick={() => router.push(token ? "/dashboard/teacher" : "/login")}
                      className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-3 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">
                        3
                      </div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileEdit className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                              Question Editor
                            </h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">
                              Review AI generated questions with LaTeX math rendering, live editing, and custom question additions.
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Scheduling */}
                    <div 
                      onClick={() => router.push(token ? "/dashboard/teacher" : "/login")}
                      className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-4 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">
                        4
                      </div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                              Scheduling
                            </h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">
                              Assign test windows, fullscreen enforcement rules, calculators, and generate candidate passcodes.
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Mobile Scroll Indicator Dots */}
                  <div className="flex lg:hidden items-center justify-center gap-1.5 pt-2">
                    <div className="w-5 h-1 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>

                </div>

              </div>
            )}

            {/* ══════ TAB 2: STUDENT TEST RUNNER ══════ */}
            {activeGuideTab === "student" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch animate-fadeIn">
                
                {/* Left Preview - BORDERLESS */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full space-y-6 p-1 sm:p-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/40 shadow-xs flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#2563EB] dark:text-[#60A5FA] uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
                          AUTHENTICATE • ATTEMPT • AUTOSAVE
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight leading-snug mt-1">
                          Candidate Testing & <br />
                          <span className="text-[#2563EB] dark:text-[#60A5FA]">Response Sync Engine</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
                      Secure, low-latency testing environment with dual background recovery and real-time keystroke sync.
                    </p>
                  </div>

                  {/* Student Screen Preview WITH GLOW FLARE & FLOATING ANIMATION */}
                  <div className="relative my-auto py-5 sm:py-7 flex items-center justify-center">
                    {/* Glowing Radiant Flare Backdrop */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
                      <div className="w-[360px] sm:w-[520px] h-[240px] sm:h-[340px] bg-gradient-to-tr from-blue-500/25 via-sky-400/30 to-indigo-500/25 dark:from-blue-600/40 dark:via-cyan-400/30 dark:to-indigo-500/35 rounded-full blur-3xl transform scale-110 opacity-85 animate-pulse" />
                      <div className="absolute w-[240px] sm:w-[360px] h-[160px] sm:h-[230px] bg-sky-400/30 dark:bg-blue-400/35 rounded-full blur-2xl" />
                      <div className="absolute w-[140px] sm:w-[190px] h-[90px] sm:h-[130px] bg-white/50 dark:bg-sky-300/20 rounded-full blur-xl" />
                    </div>

                    <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[490px] flex items-center justify-center animate-float-slow">
                      <img
                        src="/images/laptop_student_exam.png"
                        alt="Testora Candidate Testing Interface"
                        className="w-full h-auto object-contain drop-shadow-[0_22px_40px_rgba(37,99,235,0.28)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.75)] select-none pointer-events-none transition-transform duration-300"
                        draggable={false}
                      />
                      
                      <MovableBadge
                        icon={Zap}
                        text="Dual Cloud Autosave"
                        iconColorClass="text-amber-500"
                        initialPos={{ top: "-12px", right: "-8px" }}
                        animationClass="animate-float-slow"
                      />
                      <MovableBadge
                        icon={Sparkles}
                        text="KaTeX Math Engine"
                        iconColorClass="text-[#2563EB] dark:text-[#60A5FA]"
                        initialPos={{ top: "42%", right: "-12px" }}
                        animationClass="animate-float-delayed"
                      />
                      <MovableBadge
                        icon={Clock}
                        text="Live Sync Timer"
                        iconColorClass="text-blue-600"
                        initialPos={{ bottom: "-8px", right: "-4px" }}
                        animationClass="animate-float-reverse"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">1-Click Fast Gateway</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Direct login & PIN access</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Dual Sync Engine</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Local & Cloud real-time sync</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Scientific Toolset</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Calculator & KaTeX math</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Steps - EQUAL TOP & BOTTOM ALIGNMENT */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full relative pl-0 sm:pl-3 p-1 sm:p-2">
                  <div className="absolute left-[20px] sm:left-[38px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-blue-500/25 z-0 hidden lg:block" />

                  {/* Mobile Swipe Hint */}
                  <div className="flex lg:hidden items-center justify-between px-1 mb-2 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <span>Candidate Testing Journey (Swipe 1 → 4)</span>
                    </span>
                    <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold flex items-center gap-0.5">
                      Swipe &rarr;
                    </span>
                  </div>

                  <div className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-between gap-3 sm:gap-3.5 h-full pb-2 lg:pb-0 px-1 sm:px-0 -mx-1 sm:mx-0">
                    
                    {/* Step 1 */}
                    <div onClick={() => router.push("/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-1 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">1</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">1-Click Gateway</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Authenticated students launch assessments instantly without passwords, or use 6-digit access PINs.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div onClick={() => router.push("/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-2 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">2</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Dual Sync Engine</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Every keystroke is saved to LocalStorage and synchronized to the database on blur and selection.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div onClick={() => router.push("/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-3 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">3</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Scientific Toolset</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Floating scientific calculator, formula rendering, flag-for-review navigation, and keyboard shortcuts.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div onClick={() => router.push("/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-4 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">4</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Atomic Submission</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Idempotent compare-and-swap submission engine preventing race conditions and double submission.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Mobile Scroll Indicator Dots */}
                  <div className="flex lg:hidden items-center justify-center gap-1.5 pt-2">
                    <div className="w-5 h-1 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

              </div>
            )}

            {/* ══════ TAB 3: ANTI-CHEAT TELEMETRY ══════ */}
            {activeGuideTab === "proctor" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch animate-fadeIn">
                
                {/* Left Preview - BORDERLESS */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full space-y-6 p-1 sm:p-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/40 shadow-xs flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#2563EB] dark:text-[#60A5FA] uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
                          MONITOR • DETECT • INTERCEPT
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight leading-snug mt-1">
                          Real-Time Proctoring <br />
                          <span className="text-[#2563EB] dark:text-[#60A5FA]">Command Center</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
                      Zero-trust browser sandbox with live WebSocket telemetry push directly to faculty dashboards.
                    </p>
                  </div>

                  {/* Proctor Screen Preview WITH GLOW FLARE & FLOATING ANIMATION */}
                  <div className="relative my-auto py-5 sm:py-7 flex items-center justify-center">
                    {/* Glowing Radiant Flare Backdrop */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
                      <div className="w-[360px] sm:w-[520px] h-[240px] sm:h-[340px] bg-gradient-to-tr from-blue-500/25 via-sky-400/30 to-indigo-500/25 dark:from-blue-600/40 dark:via-cyan-400/30 dark:to-indigo-500/35 rounded-full blur-3xl transform scale-110 opacity-85 animate-pulse" />
                      <div className="absolute w-[240px] sm:w-[360px] h-[160px] sm:h-[230px] bg-sky-400/30 dark:bg-blue-400/35 rounded-full blur-2xl" />
                      <div className="absolute w-[140px] sm:w-[190px] h-[90px] sm:h-[130px] bg-white/50 dark:bg-sky-300/20 rounded-full blur-xl" />
                    </div>

                    <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[490px] flex items-center justify-center animate-float-slow">
                      <img
                        src="/images/laptop_proctor_radar.png"
                        alt="Testora Anti-Cheat Proctoring Telemetry"
                        className="w-full h-auto object-contain drop-shadow-[0_22px_40px_rgba(244,63,94,0.25)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.75)] select-none pointer-events-none transition-transform duration-300"
                        draggable={false}
                      />
                      
                      {/* Movable Badges */}
                      <MovableBadge
                        icon={ShieldAlert}
                        text="Tab-Switch Alert"
                        iconColorClass="text-rose-500"
                        initialPos={{ top: "-12px", right: "-8px" }}
                        animationClass="animate-float-slow"
                      />
                      <MovableBadge
                        icon={Lock}
                        text="Fullscreen Lock"
                        iconColorClass="text-[#2563EB] dark:text-[#60A5FA]"
                        initialPos={{ top: "42%", right: "-12px" }}
                        animationClass="animate-float-delayed"
                      />
                      <MovableBadge
                        icon={Zap}
                        text="Remote Eject"
                        iconColorClass="text-amber-500"
                        initialPos={{ bottom: "-8px", right: "-4px" }}
                        animationClass="animate-float-reverse"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Tab-Switch Interception</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Strict 1-warning policy</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">WebSocket Stream</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Live telemetry radar</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Sandbox Hardening</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">DevTools & Clipboard lock</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Steps - EQUAL TOP & BOTTOM ALIGNMENT */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full relative pl-0 sm:pl-3 p-1 sm:p-2">
                  <div className="absolute left-[20px] sm:left-[38px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-blue-500/25 z-0 hidden lg:block" />

                  {/* Mobile Swipe Hint */}
                  <div className="flex lg:hidden items-center justify-between px-1 mb-2 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <span>Telemetry & Defense Chain (Swipe 1 → 4)</span>
                    </span>
                    <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold flex items-center gap-0.5">
                      Swipe &rarr;
                    </span>
                  </div>

                  <div className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-between gap-3 sm:gap-3.5 h-full pb-2 lg:pb-0 px-1 sm:px-0 -mx-1 sm:mx-0">
                    
                    {/* Step 1 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-1 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">1</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Fullscreen Lockdown</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Candidates are constrained to full-screen mode with ESC interception and persistent warnings.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-2 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">2</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Tab-Switch Tracker</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Real-time window blur and visibilitychange listeners logging exact departure timestamps.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-3 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">3</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Clipboard & DevTools Block</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">F12, developer console, right-click, and copy-paste events are intercepted and silenced.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-4 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">4</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Live WebSocket Broadcast</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Telemetry frames stream directly to teacher dashboards with remote 1-click eject controls.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Mobile Scroll Indicator Dots */}
                  <div className="flex lg:hidden items-center justify-center gap-1.5 pt-2">
                    <div className="w-5 h-1 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

              </div>
            )}

            {/* ══════ TAB 4: EVALUATION & GRADEBOOK ══════ */}
            {activeGuideTab === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch animate-fadeIn">
                
                {/* Left Preview - BORDERLESS */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full space-y-6 p-1 sm:p-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/40 shadow-xs flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#2563EB] dark:text-[#60A5FA] uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block">
                          EVALUATE • DIAGNOSE • EXPORT
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight leading-snug mt-1">
                          Instant AI Grading & <br />
                          <span className="text-[#2563EB] dark:text-[#60A5FA]">Cohort Analytics</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
                      Hybrid grading engine combining deterministic objective evaluation with Gemini AI subjective rubrics.
                    </p>
                  </div>

                  {/* Analytics Screen Preview WITH GLOW FLARE & FLOATING ANIMATION */}
                  <div className="relative my-auto py-5 sm:py-7 flex items-center justify-center">
                    {/* Glowing Radiant Flare Backdrop */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
                      <div className="w-[360px] sm:w-[520px] h-[240px] sm:h-[340px] bg-gradient-to-tr from-blue-500/25 via-sky-400/30 to-indigo-500/25 dark:from-blue-600/40 dark:via-cyan-400/30 dark:to-indigo-500/35 rounded-full blur-3xl transform scale-110 opacity-85 animate-pulse" />
                      <div className="absolute w-[240px] sm:w-[360px] h-[160px] sm:h-[230px] bg-sky-400/30 dark:bg-blue-400/35 rounded-full blur-2xl" />
                      <div className="absolute w-[140px] sm:w-[190px] h-[90px] sm:h-[130px] bg-white/50 dark:bg-sky-300/20 rounded-full blur-xl" />
                    </div>

                    <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[490px] flex items-center justify-center animate-float-slow">
                      <img
                        src="/images/laptop_analytics_gradebook.png"
                        alt="Testora Cohort Analytics & Gradebook"
                        className="w-full h-auto object-contain drop-shadow-[0_22px_40px_rgba(16,185,129,0.25)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.75)] select-none pointer-events-none transition-transform duration-300"
                        draggable={false}
                      />
                      
                      {/* Movable Badges */}
                      <MovableBadge
                        icon={CheckCircle2}
                        text="Instant MCQ Grading"
                        iconColorClass="text-emerald-600"
                        initialPos={{ top: "-12px", right: "-8px" }}
                        animationClass="animate-float-slow"
                      />
                      <MovableBadge
                        icon={Sparkles}
                        text="Gemini AI Rubrics"
                        iconColorClass="text-[#2563EB] dark:text-[#60A5FA]"
                        initialPos={{ top: "42%", right: "-12px" }}
                        animationClass="animate-float-delayed"
                      />
                      <MovableBadge
                        icon={BarChart3}
                        text="Topic Mastery Radar"
                        iconColorClass="text-blue-600"
                        initialPos={{ bottom: "-8px", right: "-4px" }}
                        animationClass="animate-float-reverse"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Instant Scoring</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">MCQ & negative marking</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">Gemini Rubrics</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">Constructive AI feedback</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-[11px]">1-Click Export</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">PDF booklets & Excel</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Steps - EQUAL TOP & BOTTOM ALIGNMENT */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full relative pl-0 sm:pl-3 p-1 sm:p-2">
                  <div className="absolute left-[20px] sm:left-[38px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-blue-500/25 z-0 hidden lg:block" />

                  {/* Mobile Swipe Hint */}
                  <div className="flex lg:hidden items-center justify-between px-1 mb-2 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <span>Grading & Analytics Flow (Swipe 1 → 4)</span>
                    </span>
                    <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold flex items-center gap-0.5">
                      Swipe &rarr;
                    </span>
                  </div>

                  <div className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-between gap-3 sm:gap-3.5 h-full pb-2 lg:pb-0 px-1 sm:px-0 -mx-1 sm:mx-0">
                    
                    {/* Step 1 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-1 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">1</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Instant Objective Scoring</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Objective questions graded immediately; subjective answers evaluated by Gemini with feedback.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-2 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">2</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Topic Mastery Heatmaps</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Radar charts break down candidate strengths, weak topics, cohort percentile ranks, and passing trends.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-3 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">3</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Subjective AI Evaluation</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">Written answers evaluated against structured rubrics awarding partial marks with constructive notes.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div onClick={() => router.push(token ? "/dashboard/teacher" : "/login")} className="relative z-10 w-[84vw] max-w-[340px] sm:max-w-[380px] lg:w-auto shrink-0 snap-center lg:flex-1 flex items-center gap-3 sm:gap-4 group cursor-pointer animate-step-float-4 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-4 ring-white dark:ring-[#111C31]">4</div>
                      <div className="flex-1 h-full min-h-[96px] bg-[#F8FAFC]/80 dark:bg-[#17243A]/80 border border-[#E2E8F0] dark:border-[#263449] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">Export & PDF Generation</h4>
                            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed mt-0.5 line-clamp-2">1-click PDF booklet downloads, official cohort gradebook spreadsheets, and audit logs.</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#94A3B8] group-hover:border-[#2563EB] group-hover:text-[#2563EB] group-hover:bg-[#EFF6FF] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Mobile Scroll Indicator Dots */}
                  <div className="flex lg:hidden items-center justify-center gap-1.5 pt-2">
                    <div className="w-5 h-1 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER (CLEAN & PROFESSIONAL)
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="w-full border-t border-[#E2E8F0] dark:border-[#263449] bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 sm:py-5 mt-10">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {/* Security & System */}
          <div className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-[#111827] dark:text-[#F1F5F9]">Testora</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>AES-256 Secure</span>
            </span>
          </div>

          {/* Developer Credit */}
          <div className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
            <span>Developed by</span>
            <a 
              href="https://dpramp.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 font-bold text-[#2563EB] dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span>dpramp.com</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Minimal Quick Links */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs font-medium">
            <a href="/guide" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors">Guide</a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="/login" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors">Portal</a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="/dashboard/teacher" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors">Studio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
