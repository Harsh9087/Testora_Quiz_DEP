"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface MockTestLibraryHighlightProps {
  isLoggedIn?: boolean;
  userRole?: string | null;
  onLearnMore?: () => void;
}

export default function MockTestLibraryHighlight({
  isLoggedIn = false,
  userRole = null,
  onLearnMore,
}: MockTestLibraryHighlightProps) {
  // Target destination based on auth state
  const exploreHref = isLoggedIn
    ? userRole === "teacher"
      ? "/dashboard/teacher"
      : "/dashboard/student"
    : "/login?redirect=/dashboard/student";

  return (
    <section
      id="mock-tests"
      className="relative py-12 sm:py-16 lg:py-20 bg-[#FDFDFF] dark:bg-[#070D1B] border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden scroll-mt-16 transition-colors duration-200"
    >
      {/* ══════════════════════════════════════════════════════════
          FULL-BLEED BACKGROUND COVER (EXTENDS BEHIND TEXT AREA & ENTIRE SECTION)
         ══════════════════════════════════════════════════════════ */}
      {/* Light Theme Background Banner */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden block dark:hidden">
        <Image
          src="/images/mock_test_white_banner_bg.jpg"
          alt="Mock Test Light Background"
          fill
          className="object-cover object-right opacity-35 sm:opacity-45"
          priority
        />
        {/* Soft white gradient to ensure text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FDFDFF] via-[#FDFDFF]/90 sm:via-[#FDFDFF]/80 to-transparent" />
      </div>

      {/* Dark Theme Background Banner (Complete Dark Image covering behind text area too) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden hidden dark:block">
        <Image
          src="/images/mock_test_banner_bg.jpg"
          alt="Mock Test Dark Background"
          fill
          className="object-cover object-right opacity-60 sm:opacity-75"
          priority
        />
        {/* Deep navy dark gradient to seamlessly blend behind the text area */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070D1B] via-[#070D1B]/95 sm:via-[#070D1B]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070D1B] via-transparent to-[#070D1B]/90" />
      </div>

      {/* Subtle Background Lighting & Soft Ambient Grids */}
      <div className="absolute top-0 right-1/4 w-[420px] h-[420px] bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN: CONTENT, VALUE PROPOSITION & CAPABILITIES
              (48–50% on Desktop, First in DOM for SEO & Accessibility)
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Category / Kicker Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs backdrop-blur-xs">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Student Practice Portal • 100% Free Access</span>
            </div>

            {/* Main Section Heading */}
            <div className="space-y-1 sm:space-y-1.5">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] dark:text-white tracking-tight leading-[1.14]">
                Practice Smarter.
              </h2>
              <div className="relative inline-block">
                <span className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0066FF] tracking-tight leading-[1.14]">
                  Prepare Better.
                </span>
                {/* Royal blue curved underline swoosh matching reference */}
                <svg
                  className="w-full h-3 sm:h-3.5 text-[#0066FF] absolute -bottom-1.5 sm:-bottom-2 left-0 pointer-events-none"
                  viewBox="0 0 220 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 10C65 2 155 2 217 10"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Section Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal pt-1 sm:pt-2 max-w-xl">
              Explore a centralized library of mock tests, practice assessments, chapter-wise tests and exam-oriented preparation resources designed to help students improve their performance.
            </p>

            {/* ══════════════════════════════════════════════════════════
                MOBILE-ONLY WORKSPACE PREVIEW (Shown right below description)
               ══════════════════════════════════════════════════════════ */}
            <div className="block lg:hidden my-6">
              <div className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#070D1B] border border-slate-200/90 dark:border-blue-900/50 shadow-xl shadow-blue-900/10 dark:shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                {/* Status Indicator */}
                <div className="absolute top-3 right-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/80 dark:border-blue-900/60 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Exam Simulation</span>
                </div>

                <div className="relative w-full aspect-[549/473]">
                  {/* Light Mode Mockup */}
                  <Image
                    src="/images/mock_test_workspace_clean_2x.png"
                    alt="Testora Quiz Mock Test Examination Workspace"
                    width={1098}
                    height={946}
                    className="w-full h-full object-cover object-left-top block dark:hidden"
                    priority
                  />
                  {/* Dark Mode Mockup (Complete Dark Theme Image) */}
                  <Image
                    src="/images/mock_test_workspace_dark_2x.png"
                    alt="Testora Quiz Dark Mock Test Examination Workspace"
                    width={1200}
                    height={896}
                    className="w-full h-full object-cover object-left-top hidden dark:block"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SIX FEATURE CARDS (2-Column Grid)
               ══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-1 sm:pt-2">
              
              {/* Card 1: Centralized Mock Test Library */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Centralized Mock Test Library
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Organized by exam, class, subject &amp; domain
                  </p>
                </div>
              </div>

              {/* Card 2: Full-Length & Speed Tests */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Full-Length &amp; Speed Tests
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Timed examinations mirroring real exam conditions
                  </p>
                </div>
              </div>

              {/* Card 3: Chapter & Topic Wise Practice */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Chapter &amp; Topic Wise Practice
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Targeted drill questions with step solutions
                  </p>
                </div>
              </div>

              {/* Card 4: Authentic PYQ Source Tracking */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Authentic PYQ Source Tracking
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Verified exam papers with year &amp; shift origin
                  </p>
                </div>
              </div>

              {/* Card 5: Instant Performance Telemetry */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-100 dark:border-fuchsia-800/80 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Instant Performance Telemetry
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Accuracy % and topic mastery scorecards
                  </p>
                </div>
              </div>

              {/* Card 6: Diagrams & Formula Support */}
              <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0D182E] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <span className="font-serif font-black text-xs sm:text-sm italic">√x</span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    Diagrams &amp; Formula Support
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    LaTeX equations, zoomable charts and figures
                  </p>
                </div>
              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════
                ACTION CTA BUTTONS
               ══════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <Link
                href={exploreHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer text-center"
              >
                <span>Explore Mock Tests</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onLearnMore ? (
                <button
                  type="button"
                  onClick={onLearnMore}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer text-center"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ) : (
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer text-center"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}
            </div>

            {/* Zero Cost Guarantee Tag */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>100% Free Practice for all registered students • 0 credits required</span>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN: DESKTOP WORKSPACE VISUALIZATION
              (50–52% on Desktop, Hidden on mobile since it renders above)
             ══════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-6 relative items-center justify-center">
            
            {/* Soft Ambient Radial Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/10 via-sky-300/10 to-indigo-400/10 dark:from-blue-600/20 dark:via-cyan-500/15 dark:to-indigo-600/20 rounded-3xl blur-2xl pointer-events-none transform scale-95" />
            
            {/* Main Stage Frame */}
            <div className="relative w-full rounded-2xl lg:rounded-3xl overflow-hidden bg-white dark:bg-[#070D1B] border border-slate-200/90 dark:border-blue-900/50 shadow-2xl shadow-blue-900/10 dark:shadow-[0_0_40px_rgba(37,99,235,0.25)] transition-all duration-300 group">
              
              {/* Top subtle status pill */}
              <div className="absolute top-4 right-4 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/80 dark:border-blue-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Exam Simulation</span>
              </div>

              {/* Crisp Workspace Illustration */}
              <div className="relative w-full aspect-[549/473]">
                {/* Light Mode Mockup */}
                <Image
                  src="/images/mock_test_workspace_clean_2x.png"
                  alt="Testora Quiz Mock Test Examination Workspace"
                  width={1098}
                  height={946}
                  className="w-full h-full object-cover object-left-top transform group-hover:scale-[1.01] transition-transform duration-500 block dark:hidden"
                  priority
                />
                {/* Dark Mode Mockup (Complete Dark Theme Image) */}
                <Image
                  src="/images/mock_test_workspace_dark_2x.png"
                  alt="Testora Quiz Dark Mock Test Examination Workspace"
                  width={1200}
                  height={896}
                  className="w-full h-full object-cover object-left-top transform group-hover:scale-[1.01] transition-transform duration-500 hidden dark:block"
                  priority
                />
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
