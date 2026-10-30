"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InstitutionalPlanRequestModal from "./InstitutionalPlanRequestModal";
import {
  GraduationCap,
  Building2,
  Database,
  Coins,
  Users,
  ShieldCheck,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export default function FdpSolutionsSection() {
  const router = useRouter();
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  return (
    <section
      id="fdp-solutions"
      className="relative py-9 md:py-12 lg:py-16 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none transition-colors duration-200"
    >
      {/* Background Lighting & Dot Grid Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:opacity-15 pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-80 h-80 rounded-full bg-blue-200/30 dark:bg-blue-900/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-80 h-80 rounded-full bg-purple-200/25 dark:bg-purple-900/15 blur-3xl pointer-events-none" />

      {/* Decorative Dotted Grids in Corners */}
      <div className="absolute top-10 left-4 sm:left-8 w-20 h-20 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-40 pointer-events-none hidden sm:block" />
      <div className="absolute top-10 right-4 sm:right-8 w-20 h-20 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-40 pointer-events-none hidden sm:block" />

      <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7 md:space-y-8">
        {/* ───────────────────────────────────────────────────────────
            HEADER BLOCK (Compact, Centered)
        ─────────────────────────────────────────────────────────── */}
        <div className="relative text-center max-w-2xl mx-auto space-y-2.5">
          {/* Centered Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Faculty &amp; College Solutions</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Specialized Programs for{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Academic Institutions
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal max-w-xl mx-auto leading-relaxed">
            Empower entire college faculties with institutional grant vouchers and department-level governance.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────
            2-COLUMN GRID (52% Left / 48% Right, Aligned Boundaries)
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-4 sm:gap-5 lg:gap-6 items-stretch max-w-5xl mx-auto">
          {/* ─────────────────────────────────────────────────────────
              LEFT FEATURE CARD: FDP Institutional Voucher Campaigns
          ───────────────────────────────────────────────────────── */}
          <div className="rounded-[24px] sm:rounded-[26px] bg-gradient-to-br from-[#061B48] via-[#0A2E7A] to-[#0D3B98] text-white p-5 sm:p-6 lg:p-7 shadow-xl shadow-blue-950/20 border border-blue-400/25 flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Background Light Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Card Top Row: Program Tag + Gold Badge Aligned */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                    Faculty Development Program
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-slate-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wide shadow-xs">
                  <Coins className="w-3 h-3" />
                  <span>10,000 Credits Grant</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-white tracking-tight leading-tight">
                  FDP Institutional <br className="hidden sm:inline" />
                  Voucher Campaigns
                </h3>
                <p className="text-xs text-blue-100/85 leading-relaxed max-w-lg">
                  We partner with engineering, science, and medical colleges to grant verified faculty members 10,000 credits each. Conduct semester exams, lab assessments, and practice tests at zero cost.
                </p>
              </div>

              {/* Compact Dashboard Mockup Preview */}
              <div className="rounded-xl bg-[#07132C]/90 border border-blue-300/20 p-2.5 sm:p-3 shadow-inner backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-blue-200/80">testora.quiz / faculty-grant</span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white">Create Test</div>
                    <div className="h-1 bg-blue-400/20 rounded-full w-32 sm:w-44 mt-1.5" />
                  </div>
                  <span className="text-[9px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded font-mono border border-blue-400/20 shrink-0">
                    AI Generator
                  </span>
                </div>
              </div>

              {/* Two Metric Boxes in Compact 2-Column Row */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/12 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-blue-200/80 text-[10px] font-medium leading-tight">Voucher Value</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">10,000 Credits</div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/12 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-400/20 text-purple-300 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-blue-200/80 text-[10px] font-medium leading-tight">Testing Capacity</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">10,000 Question Units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Two CTA Buttons - Shown in One Row on Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-3 sm:pt-4 relative z-10">
              <Link
                href="/login?mode=signup"
                className="w-full py-2.5 px-2 xs:px-3 sm:px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-[10.5px] xs:text-xs sm:text-[13px] text-center shadow-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="truncate">
                  <span className="hidden sm:inline">Claim Free Faculty Account</span>
                  <span className="sm:hidden">Claim Free Account</span>
                </span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              </Link>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full py-2.5 px-2 xs:px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.99] border border-white/20 text-white font-bold text-[10.5px] xs:text-xs sm:text-[13px] text-center flex items-center justify-center transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="truncate">
                  <span className="hidden sm:inline">Contact Institution Team</span>
                  <span className="sm:hidden">Contact Team</span>
                </span>
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT FEATURE CARDS: 3 Vertically Stacked Cards (01, 02, 03)
              With interactive "Read More" expansion & detailed bullets
          ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between gap-3 sm:gap-3.5 h-full">
            {/* Card 01: Multi-Department Organization */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expandedCards[1] ? "true" : "false"}
              onClick={() => toggleCard(1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCard(1);
                }
              }}
              className={`p-4 sm:p-4.5 rounded-[20px] bg-white dark:bg-[#111827] border transition-all duration-200 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 ${
                expandedCards[1]
                  ? "border-blue-400 dark:border-blue-600 shadow-md ring-1 ring-blue-400/20"
                  : "border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60"
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Multi-Department Organization
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      Organize tests by academic department. Department Admins can supervise exam creation and monitor pass rates.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(1);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      <span>{expandedCards[1] ? "Read less" : "Read more"}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          expandedCards[1] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 pl-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">01</span>
                  <div
                    className={`w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform duration-200 ${
                      expandedCards[1] ? "rotate-90" : "group-hover:translate-x-0.5"
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCards[1] && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-fadeIn"
                >
                  <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Departmental Isolation:</strong> Dedicated subject question banks for CSE, Mech, Civil, &amp; Science branches.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Hierarchical Roles:</strong> Deans &amp; HODs supervise paper generation, exam schedules, and faculty evaluation logs.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Accreditation Support:</strong> Export Course Outcome (CO) &amp; Program Outcome (PO) compliance reports for NAAC / NBA.
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50">
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                    >
                      <span>Claim Free Department Account</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleCard(1)}
                      className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
                    >
                      Show less
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Card 02: Centralized Institutional Credit Wallet */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expandedCards[2] ? "true" : "false"}
              onClick={() => toggleCard(2)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCard(2);
                }
              }}
              className={`p-4 sm:p-4.5 rounded-[20px] bg-white dark:bg-[#111827] border transition-all duration-200 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 ${
                expandedCards[2]
                  ? "border-emerald-400 dark:border-emerald-600 shadow-md ring-1 ring-emerald-400/20"
                  : "border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60"
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-900/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Centralized Institutional Credit Wallet
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      Share prepaid credit pools across all college teachers or disburse individual allocations with complete transaction history.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(2);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                    >
                      <span>{expandedCards[2] ? "Read less" : "Read more"}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          expandedCards[2] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 pl-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">02</span>
                  <div
                    className={`w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform duration-200 ${
                      expandedCards[2] ? "rotate-90" : "group-hover:translate-x-0.5"
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCards[2] && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-fadeIn"
                >
                  <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Unified Credit Pools:</strong> Share prepaid pools across departments or assign monthly quotas per professor.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Audit-Ready Logs:</strong> Full ledger transparency showing test generations, proctoring time, and paper downloads.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">GST Invoicing &amp; POs:</strong> Centralized institutional invoicing with purchase order support and tax credits.
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("pricing");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                    >
                      <span>View Institutional Credit Pricing</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCard(2)}
                      className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
                    >
                      Show less
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Card 03: Batch & Division Rosters */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expandedCards[3] ? "true" : "false"}
              onClick={() => toggleCard(3)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCard(3);
                }
              }}
              className={`p-4 sm:p-4.5 rounded-[20px] bg-white dark:bg-[#111827] border transition-all duration-200 group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 ${
                expandedCards[3]
                  ? "border-purple-400 dark:border-purple-600 shadow-md ring-1 ring-purple-400/20"
                  : "border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700/60"
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100/80 dark:border-purple-900/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Batch &amp; Division Rosters
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      Collect student details via shareable enrollment forms or import bulk candidate spreadsheets (Excel / CSV).
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(3);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer"
                    >
                      <span>{expandedCards[3] ? "Read less" : "Read more"}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          expandedCards[3] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 pl-1">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">03</span>
                  <div
                    className={`w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform duration-200 ${
                      expandedCards[3] ? "rotate-90" : "group-hover:translate-x-0.5"
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCards[3] && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-fadeIn"
                >
                  <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Instant Spreadsheet Import:</strong> Upload hundreds of student records with roll numbers and division tags in 1 click.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">QR &amp; Web Self-Enrollment:</strong> Shareable QR code for students to register with section codes directly on mobile.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Cohorts &amp; Division Gradebooks:</strong> Compare section performance, average score curves, and attendance in real time.
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50">
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
                    >
                      <span>Start Roster Management</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleCard(3)}
                      className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
                    >
                      Show less
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            BOTTOM 4 TRUST BADGES (Compact Proportions)
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 pt-5 sm:pt-6 max-w-4xl mx-auto text-center border-t border-slate-200/60 dark:border-slate-800/60">
          {/* 1. Faculty Growth */}
          <div className="space-y-1 p-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Faculty Growth
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Provide learning &amp; assessment tools
            </div>
          </div>

          {/* 2. Department Control */}
          <div className="space-y-1 p-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center mx-auto shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Department Control
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Manage multiple departments easily
            </div>
          </div>

          {/* 3. Flexible Credits */}
          <div className="space-y-1 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center mx-auto shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Flexible Credits
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Share or allocate credits with control
            </div>
          </div>

          {/* 4. Trusted Platform */}
          <div className="space-y-1 p-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Trusted Platform
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Secure &amp; reliable exams for institutions
            </div>
          </div>
        </div>
      </div>

      <InstitutionalPlanRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultVouchers={25}
      />
    </section>
  );
}
