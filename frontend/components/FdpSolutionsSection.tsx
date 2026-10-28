"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Database,
  Coins,
  Users,
  ShieldCheck,
  FileText,
  ChevronRight,
  ArrowRight,
  Laptop,
} from "lucide-react";

export default function FdpSolutionsSection() {
  return (
    <section
      id="fdp-solutions"
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none"
    >
      {/* Background Lighting & Dot Grid Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-200/35 dark:bg-blue-900/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl pointer-events-none" />

      {/* Decorative Dotted Grids in Corners */}
      <div className="absolute top-12 left-4 sm:left-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />
      <div className="absolute top-12 right-4 sm:right-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* ───────────────────────────────────────────────────────────
            HEADER BLOCK (As shown in Reference Desktop & Mobile UI)
        ─────────────────────────────────────────────────────────── */}
        <div className="relative text-center max-w-3xl mx-auto space-y-3">
          {/* Centered Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Faculty &amp; College Solutions</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Specialized Programs for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Academic Institutions
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 font-normal max-w-2xl mx-auto pt-1 leading-relaxed">
            Empower entire college faculties with institutional grant vouchers and department-level governance.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────
            2-COLUMN GRID ON DESKTOP, STACKED ON MOBILE
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
          {/* ─────────────────────────────────────────────────────────
              LEFT / TOP: Large Blue FDP Institutional Voucher Card
          ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 rounded-[28px] bg-gradient-to-br from-[#0B2568] via-[#0E3E9E] to-[#07194A] text-white p-6 sm:p-8 shadow-2xl shadow-blue-900/30 border border-blue-400/30 flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Background Light Blob */}
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              {/* Card Top Row: Program Tag + Gold Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                    Faculty Development Program
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wide shadow-sm">
                  <Coins className="w-3.5 h-3.5" />
                  <span>10,000 Credits Grant</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                  FDP Institutional <br className="hidden sm:inline" />Voucher Campaigns
                </h3>
                <p className="text-xs sm:text-[13px] text-blue-100/90 leading-relaxed max-w-xl">
                  We partner with engineering, science, and medical colleges to grant verified faculty members 10,000 credits each. Conduct semester exams, lab assessments, and practice tests at zero cost.
                </p>
              </div>

              {/* Center Laptop Preview Mockup */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-blue-300/30 p-3 sm:p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-mono text-blue-200">testora.quiz / faculty-grant</span>
                    <span className="text-[10px] text-emerald-400 font-bold">● Active</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">Create Test</div>
                      <span className="text-[9px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-md font-mono">
                        AI Generator
                      </span>
                    </div>
                    <div className="h-1.5 bg-blue-400/20 rounded-full w-3/4" />
                    <div className="h-1.5 bg-blue-400/15 rounded-full w-1/2" />
                  </div>
                </div>
              </div>

              {/* Two Metric Boxes */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-blue-200 text-[10px] sm:text-[11px] font-medium">Voucher Value</div>
                    <div className="text-sm sm:text-base font-extrabold text-white">10,000 Credits</div>
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-blue-200 text-[10px] sm:text-[11px] font-medium">Testing Capacity</div>
                    <div className="text-sm sm:text-base font-extrabold text-white">10,000 Question Units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Two CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 relative z-10">
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto flex-1 min-h-[46px] py-3 px-5 rounded-xl bg-white hover:bg-blue-50 text-slate-900 font-extrabold text-xs sm:text-sm text-center shadow-md flex items-center justify-center gap-2 group/btn transition-all cursor-pointer"
              >
                <span>Claim Free Faculty Account</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <a
                href="mailto:contact@dpramp.com?subject=FDP%20Institutional%20Voucher%20Inquiry"
                className="w-full sm:w-auto flex-1 min-h-[46px] py-3 px-5 rounded-xl bg-blue-950/70 hover:bg-blue-950 border border-blue-300/30 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center transition-all cursor-pointer"
              >
                Contact Institution Team
              </a>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT / BOTTOM: 3 Feature Cards (01, 02, 03)
          ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Card 01: Multi-Department Organization */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Multi-Department Organization
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Organize tests by academic department. Department Admins can supervise exam creation and monitor pass rates.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0 pl-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">01</span>
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Card 02: Centralized Institutional Credit Wallet */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:shadow-md hover:border-emerald-300 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Centralized Institutional Credit Wallet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Share prepaid credit pools across all college teachers or disburse individual allocations with complete transaction history.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0 pl-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">02</span>
                <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Card 03: Batch & Division Rosters */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:shadow-md hover:border-purple-300 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    Batch &amp; Division Rosters
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Collect student details via shareable enrollment forms or import bulk candidate spreadsheets (Excel / CSV).
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0 pl-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">03</span>
                <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            BOTTOM 4 TRUST BADGES (As shown in Reference UI)
            Faculty Growth, Department Control, Flexible Credits, Trusted Platform
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-10 max-w-4xl mx-auto text-center border-t border-slate-200/60 dark:border-slate-800/60">
          {/* 1. Faculty Growth */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Faculty Growth
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Provide learning and assessment tools
            </div>
          </div>

          {/* 2. Department Control */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center mx-auto shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Department Control
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Manage multiple departments easily
            </div>
          </div>

          {/* 3. Flexible Credits */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center mx-auto shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Flexible Credits
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Share or allocate credits with control
            </div>
          </div>

          {/* 4. Trusted Platform */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Trusted Platform
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Secure and reliable exams for institutions
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

