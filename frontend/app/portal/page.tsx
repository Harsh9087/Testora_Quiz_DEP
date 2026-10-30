"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  FileText,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Zap,
  Users,
  KeyRound,
  ChevronRight,
  X,
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function PortalSelectionPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"teacher" | "student">("teacher");
  const [showDirectCode, setShowDirectCode] = useState(false);
  const [examCode, setExamCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const handleContinue = () => {
    router.push(`/login?role=${selectedMode}`);
  };

  const handleDirectExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = examCode.trim().toUpperCase();
    if (!clean) {
      setCodeError("Please enter a valid exam code");
      return;
    }
    if (clean.length < 3) {
      setCodeError("Exam code must be at least 3 characters");
      return;
    }
    router.push(`/exam/${clean}/instructions`);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#F4F7FB] dark:bg-[#070F1E] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. REAL CAMPUS BACKGROUND (Crisp, High-Resolution Architectural Photography)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 dark:opacity-20 transition-opacity duration-300"
        style={{ backgroundImage: "url('/images/campus_bg_highres.jpg')" }}
        aria-hidden="true"
      />
      {/* Soft gradient wash ensuring high contrast & readability */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#F4F7FB]/90 via-[#F4F7FB]/80 to-[#EEF4FC]/95 dark:from-[#070F1E]/90 dark:via-[#070F1E]/85 dark:to-[#0B1528]/98"
        aria-hidden="true"
      />

      {/* Floating Theme Toggle (Top-right corner for quick theme testing) */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP HEADER (Framing the card width exactly as in reference)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-[560px] mx-auto px-4 pt-5 sm:pt-7 pb-2 sm:pb-3 flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          className="inline-flex flex-col items-center justify-center transition-transform hover:opacity-95 active:scale-95"
          aria-label="Testora Quiz Home"
        >
          <AppLogo variant="stacked" height={64} />
        </Link>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT CONTAINER (Matching Reference Screenshot)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-[560px] mx-auto px-4 pb-8 flex-1 flex flex-col justify-center">
        <div className="bg-white dark:bg-[#0E1626] rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_-15px_rgba(16,29,58,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800/90 backdrop-blur-md transition-all">
          
          {/* Step Progress Stepper */}
          <div className="flex items-center justify-between pb-5 sm:pb-6">
            {/* Step 1: Active */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1765F5] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/25">
                1
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#1765F5] dark:text-blue-400">
                Choose Mode
              </span>
            </div>

            {/* Connecting Line */}
            <div className="flex-1 h-[2px] bg-slate-200 dark:bg-slate-800 mx-3 sm:mx-4" />

            {/* Step 2: Inactive */}
            <div className="flex items-center gap-2 opacity-60 dark:opacity-40">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0">
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Sign In
              </span>
            </div>
          </div>

          {/* Heading & Role Tag */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div>
              <h1 className="text-2xl sm:text-[26px] font-bold text-[#101D3A] dark:text-white tracking-tight leading-tight">
                Select Portal Mode
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose your role to get tailored assessment tools &amp; analytics
              </p>
            </div>

            <div className="shrink-0 mt-0.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF5FF] dark:bg-blue-950/70 text-[#1765F5] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs whitespace-nowrap">
                {selectedMode === "teacher" ? "Instructor Mode" : "Student Mode"}
              </span>
            </div>
          </div>

          {/* Two Mode Cards (Side by side on desktop, stacked on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-6">
            {/* 1. TEACHER MODE CARD */}
            <button
              type="button"
              onClick={() => setSelectedMode("teacher")}
              className={`group relative rounded-2xl p-2 sm:p-2.5 pb-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col ${
                selectedMode === "teacher"
                  ? "bg-white dark:bg-[#121E36] border-2 border-[#1765F5] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/10"
                  : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                <img
                  src="/images/teacher_group_faculty.jpg?v=3"
                  alt="Teacher Mode - Faculty and Educators Group"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/teacher_mode.jpg?v=3";
                  }}
                />
                {/* Subtle bottom gradient vignette for contrast and legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Selection Checkmark on Top-Right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  {selectedMode === "teacher" ? (
                    <div className="w-6 h-6 rounded-full bg-[#1765F5] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 shadow-xs backdrop-blur-xs" />
                  )}
                </div>

                {/* Tag on Bottom-Left */}
                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md shadow-2xs inline-flex items-center gap-1 border border-white/10">
                    <Users className="w-2.5 h-2.5 text-blue-300" />
                    <span>Faculty &amp; Admins</span>
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mt-3">
                <h2 className="text-sm sm:text-base font-bold text-[#101D3A] dark:text-white leading-tight">
                  Teacher Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create &amp; Proctor
                </p>
              </div>
            </button>

            {/* 2. STUDENT MODE CARD */}
            <button
              type="button"
              onClick={() => setSelectedMode("student")}
              className={`group relative rounded-2xl p-2 sm:p-2.5 pb-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col ${
                selectedMode === "student"
                  ? "bg-white dark:bg-[#121E36] border-2 border-[#1765F5] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/10"
                  : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                <img
                  src="/images/student_group_college.jpg?v=3"
                  alt="Student Mode - University Student Study Group"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/student_mode.jpg?v=3";
                  }}
                />
                {/* Subtle bottom gradient vignette for contrast and legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Selection Checkmark on Top-Right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  {selectedMode === "student" ? (
                    <div className="w-6 h-6 rounded-full bg-[#1765F5] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 shadow-xs backdrop-blur-xs" />
                  )}
                </div>

                {/* Tag on Bottom-Left */}
                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md shadow-2xs inline-flex items-center gap-1 border border-white/10">
                    <Users className="w-2.5 h-2.5 text-cyan-300" />
                    <span>Candidate Group</span>
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mt-3">
                <h2 className="text-sm sm:text-base font-bold text-[#101D3A] dark:text-white leading-tight">
                  Student Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Take Assessments
                </p>
              </div>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              4. PORTAL HIGHLIGHTS PANEL (Matching Reference)
              ───────────────────────────────────────────────────────── */}
          <div className="mt-5 bg-[#F0F6FF] dark:bg-[#121E36] border border-blue-100/90 dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 transition-all">
            {/* Header */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#1765F5] dark:text-blue-400 mb-3.5">
              <Zap className="w-3.5 h-3.5 fill-[#1765F5] dark:fill-blue-400" />
              <span>
                {selectedMode === "teacher"
                  ? "INSTRUCTOR PORTAL HIGHLIGHTS"
                  : "CANDIDATE PORTAL HIGHLIGHTS"}
              </span>
            </div>

            {/* Three Rows */}
            <div className="space-y-3">
              {selectedMode === "teacher" ? (
                <>
                  {/* Highlight 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        AI Quiz &amp; Question Generator
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Instantly generate multi-tier quizzes from syllabus files and custom topics.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>

                  {/* Highlight 2 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        Live Anti-Cheat Proctoring
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Real-time face verification, tab switch telemetry &amp; automated cheating logs.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>

                  {/* Highlight 3 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        Automated Grading &amp; Student Directories
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Detailed analytics, class score distribution and student roster management.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>
                </>
              ) : (
                <>
                  {/* Student Highlight 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        Distraction-Free Exam Console
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Seamless assessment environment with continuous autosave and timer alerts.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>

                  {/* Student Highlight 2 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        Zero-Latency Submission Guarantee
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Tamper-proof response verification and offline response sync protection.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>

                  {/* Student Highlight 3 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 text-[#1765F5] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#101D3A] dark:text-white leading-tight">
                        Diagnostic Score Reports &amp; Solutions
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Instant question breakdown, marks distribution, and peer performance insights.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400/80 dark:text-blue-500/80 shrink-0 ml-1" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              5. PRIMARY ACTION BUTTON
              ───────────────────────────────────────────────────────── */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1765F5] hover:bg-[#1253cf] active:bg-[#0f49b8] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              6. DIVIDER & DIRECT EXAM CODE ACCESS
              ───────────────────────────────────────────────────────── */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute px-3 bg-white dark:bg-[#0E1626] text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Direct Exam Code Trigger / Inline Form */}
          {!showDirectCode ? (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDirectCode(true);
                  setCodeError("");
                }}
                className="text-xs sm:text-sm font-semibold text-[#1765F5] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <FileText className="w-4 h-4" />
                <span>Taking a Test? Enter Exam Code Directly →</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleDirectExamSubmit}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/60 space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#1765F5]" />
                  Enter Assessment Passcode
                </span>
                <button
                  type="button"
                  onClick={() => setShowDirectCode(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. CS301A"
                  value={examCode}
                  onChange={(e) => {
                    setExamCode(e.target.value.toUpperCase());
                    if (codeError) setCodeError("");
                  }}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1765F5] hover:bg-[#1253cf] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  Start Test →
                </button>
              </div>

              {codeError && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                  {codeError}
                </p>
              )}
            </form>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            7. FOOTER TRUST & SECURITY BADGES (Below Card)
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#10B981] stroke-[2.5]" />
            <span>AES-256 Secure</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            |
          </span>

          <div className="inline-flex items-center gap-1">
            <span>Developed by</span>
            <a
              href="https://dpramp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[#1765F5] dark:hover:text-blue-400 inline-flex items-center gap-1 transition-colors underline-offset-2 hover:underline"
            >
              <span>dpramp.com</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          8. BOTTOM SPACER
          ───────────────────────────────────────────────────────────── */}
      <div className="h-4" />
    </div>
  );
}
