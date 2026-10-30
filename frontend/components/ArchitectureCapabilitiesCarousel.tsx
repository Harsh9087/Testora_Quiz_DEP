"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  ShieldAlert,
  BarChart3,
  FileText,
  Sparkles,
  Calendar,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  Radio,
  FileUp,
  Sliders,
  ChevronRight,
  FileEdit,
  ShieldCheck,
  Database,
  Layers,
} from "lucide-react";
import MovableBadge from "./MovableBadge";
import { useAuthStore } from "../store/authStore";
import InfographicFeatureSection from "./InfographicFeatureSection";

export default function ArchitectureCapabilitiesCarousel() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [activeGuideTab, setActiveGuideTab] = useState<
    "creator" | "student" | "proctor" | "analytics"
  >("creator");

  return (
    <section
      id="capabilities"
      className="relative py-10 sm:py-14 md:py-18 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none"
    >
      <div id="platform-guide" className="scroll-mt-24" />

      {/* Background Ambience & Dotted Matrix Patterns */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-20 top-1/4 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-200/35 dark:bg-blue-900/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -right-20 top-1/3 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[1380px] mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
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

        {/* ───────────────────────────────────────────────────────────
            BOTTOM INFOGRAPHIC FEATURE PROGRESSION (Exact Reference Design)
            AI Powered, Print Ready, Organized, Secure
            Connected 2x2 grid on desktop, alternating vertical flow on mobile
        ─────────────────────────────────────────────────────────── */}
        <div className="pt-8 sm:pt-12 border-t border-slate-200/60 dark:border-slate-800/60">
          <InfographicFeatureSection withBackgroundDots={false} />
        </div>
      </div>
    </section>
  );
}
