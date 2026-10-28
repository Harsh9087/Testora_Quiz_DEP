"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Database,
  Coins,
  ShieldCheck,
  Users,
  Infinity,
  CheckCircle2,
  Zap,
  Send,
  ArrowRight,
  Crown,
} from "lucide-react";

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none"
    >
      {/* Background Ambience & Dotted Grid Matrix Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-200/35 dark:bg-blue-900/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl pointer-events-none" />

      {/* Decorative Matrix Grids in Selected Corners */}
      <div className="absolute top-12 left-4 sm:left-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />
      <div className="absolute top-12 right-4 sm:right-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />

      {/* Subtle Floating Decorative Orbs */}
      <div className="absolute top-14 right-20 w-4 h-4 rounded-full bg-blue-200/60 dark:bg-blue-800/40 border border-blue-300/40 pointer-events-none hidden lg:block" />
      <div className="absolute top-24 left-16 w-3 h-3 rounded-full bg-indigo-200/60 dark:bg-indigo-800/40 pointer-events-none hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* ───────────────────────────────────────────────────────────
            HEADER BLOCK (Mobile-first responsive styling)
        ─────────────────────────────────────────────────────────── */}
        <div className="relative text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
          {/* Left Annotation on desktop: "Start for Free" pointing to Card 1 */}
          <div className="hidden xl:flex flex-col items-end absolute -left-28 top-5 pointer-events-none select-none text-right">
            <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 italic font-serif tracking-wide leading-tight">
              Start<br />for Free
            </span>
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="text-blue-500 mt-1 mr-1">
              <path d="M6 4C14 6 32 16 28 34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M22 29L28 35L34 29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Right Annotation on desktop: "Flexible for Every Need" pointing to Card 3 */}
          <div className="hidden xl:flex flex-col items-start absolute -right-28 top-5 pointer-events-none select-none text-left">
            <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400 italic font-serif tracking-wide leading-tight">
              Flexible<br />for Every Need
            </span>
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="text-emerald-500 mt-1 ml-1">
              <path d="M36 4C28 6 10 16 14 34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 29L14 35L20 29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 shadow-xs">
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Transparent Credit Economics</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Pay Only for What <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Candidates Attempt
            </span>
          </h2>

          {/* Subtitle & Pricing Note */}
          <div className="space-y-1 pt-0.5">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              No hidden fees, no per-teacher monthly lock-ins.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal">
              Unit economics:{" "}
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                1 Credit = 10 Paise (₹0.10)
              </span>{" "}
              per student attempt.
            </p>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            3 PRICING CARDS
            Vertical stack on mobile (<768px), 3-col horizontal on desktop (>=768px)
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-6 lg:gap-7 items-stretch max-w-6xl mx-auto relative pt-2">
          {/* ─────────────────────────────────────────────────────────
              CARD 1: Teacher Signup Bonus (Blue Accent)
          ───────────────────────────────────────────────────────── */}
          <div className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-900/60 shadow-md shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
            {/* Layered physical backing sheet */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 -z-10 group-hover:-bottom-2.5 group-hover:-right-2.5 transition-all" />

            <div className="space-y-4">
              {/* Header: Left Icon + Right Title/Badge/Price */}
              <div className="flex items-start gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                      Teacher Signup Bonus
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shrink-0">
                      100% Free
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                      ₹0
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500">
                      / 200 Free Credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Every new faculty member automatically receives 200 bonus test credits upon signup.
              </p>

              {/* Checklist */}
              <ul className="space-y-2 pt-1">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 fill-blue-50 dark:fill-blue-950" />
                  <span>200 candidate question attempts</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 fill-blue-50 dark:fill-blue-950" />
                  <span>Full Gemini AI question synthesis</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 fill-blue-50 dark:fill-blue-950" />
                  <span>Printable Paper Studio exports</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 fill-blue-50 dark:fill-blue-950" />
                  <span>15 days validity period</span>
                </li>
              </ul>
            </div>

            {/* Bottom CTA Button (min-h-[48px] touch target) */}
            <div className="pt-5">
              <Link
                href="/login?mode=signup"
                className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] text-white font-bold text-xs sm:text-sm text-center shadow-md flex items-center justify-center gap-2 group/btn transition-all cursor-pointer"
              >
                <span>Sign Up &amp; Get 200 Credits</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CARD 2: Standard Recharge (Purple Highlight Hero)
          ───────────────────────────────────────────────────────── */}
          <div className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border-2 border-purple-400/90 dark:border-purple-500/80 shadow-2xl shadow-purple-500/20 dark:shadow-purple-950/40 md:-mt-2 md:-mb-2 md:py-8 lg:-mt-3 lg:-mb-3 lg:py-9 z-20 hover:-translate-y-1 transition-all duration-300">
            {/* Top Floating Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap z-10">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>CONFIGURED RECHARGE</span>
            </div>

            {/* Top-Right Paper Peel / Folded Corner */}
            <div className="absolute -top-px -right-px w-8 sm:w-9 h-8 sm:h-9 pointer-events-none overflow-hidden rounded-tr-[26px]">
              <div
                className="absolute top-0 right-0 w-8 sm:w-9 h-8 sm:h-9 bg-gradient-to-bl from-purple-500 via-indigo-600 to-purple-700 shadow-sm"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
            </div>

            {/* Translucent Violet Backing Layer */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-purple-200/70 dark:bg-purple-950/60 border border-purple-300/60 dark:border-purple-800/50 -z-10 group-hover:-bottom-2.5 group-hover:-right-2.5 transition-all" />

            <div className="space-y-4">
              {/* Header: Left Icon + Right Title/Badge/Price */}
              <div className="flex items-start gap-3.5 pt-1">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Database className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                      Standard Recharge
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 shrink-0">
                      10% Extra
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                      ₹199
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500">
                      / 2,200 Credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Ideal for conducting regular class tests and midterms for batches of 50–100 students.
              </p>

              {/* Checklist */}
              <ul className="space-y-2 pt-1">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 fill-purple-50 dark:fill-purple-950" />
                  <span>2,200 candidate question attempts</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 fill-purple-50 dark:fill-purple-950" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">Purchased credits NEVER expire</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 fill-purple-50 dark:fill-purple-950" />
                  <span>Browser tab-switch proctoring</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 fill-purple-50 dark:fill-purple-950" />
                  <span>Secure Razorpay payment gateway</span>
                </li>
              </ul>
            </div>

            {/* Bottom CTA Button */}
            <div className="pt-5">
              <Link
                href="/login?mode=signup"
                className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm text-center shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2 group/btn transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white/20" />
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CARD 3: College & FDP Grant (Emerald Green)
          ───────────────────────────────────────────────────────── */}
          <div className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-900/60 shadow-md shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
            {/* Layered physical backing sheet */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 -z-10 group-hover:-bottom-2.5 group-hover:-right-2.5 transition-all" />

            <div className="space-y-4">
              {/* Header: Left Icon + Right Title/Badge/Price */}
              <div className="flex items-start gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                      College &amp; FDP Grant
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                      Institutional
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      Custom
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500">
                      / FDP Vouchers
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Tailored packages with bulk FDP vouchers for affiliated engineering colleges, universities, and coaching chains.
              </p>

              {/* Checklist */}
              <ul className="space-y-2 pt-1">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>10,000 credits per faculty voucher</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Multi-department admin access</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Dedicated onboarding support</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Custom branding on printable papers</span>
                </li>
              </ul>
            </div>

            {/* Bottom CTA Button */}
            <div className="pt-5">
              <a
                href="mailto:contact@dpramp.com?subject=Institution%20Custom%20Quote"
                className="w-full min-h-[48px] py-3.5 px-5 rounded-xl border-2 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-[0.98] text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 group/btn transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Request College Proposal</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            BOTTOM TRUST BENEFITS ROW (As shown in Reference Mobile UI)
            4 items: No Hidden Fees, Transparent Pricing, Flexible for All, Credits Never Expire
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-5xl mx-auto mt-8 sm:mt-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          {/* 1. No Hidden Fees */}
          <div className="p-2 sm:p-2.5 space-y-1.5 flex flex-col items-center">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 fill-blue-500/10" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                No Hidden Fees
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Pay only for attempts
              </div>
            </div>
          </div>

          {/* 2. Transparent Pricing */}
          <div className="p-2 sm:p-2.5 space-y-1.5 flex flex-col items-center pt-3 sm:pt-2.5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-xs">
              <Coins className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Transparent Pricing
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                1 Credit = ₹0.10
              </div>
            </div>
          </div>

          {/* 3. Flexible for All */}
          <div className="p-2 sm:p-2.5 space-y-1.5 flex flex-col items-center pt-3 sm:pt-2.5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-xs">
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Flexible for All
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Teachers, Colleges &amp; Institutions
              </div>
            </div>
          </div>

          {/* 4. Credits Never Expire */}
          <div className="p-2 sm:p-2.5 space-y-1.5 flex flex-col items-center pt-3 sm:pt-2.5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-xs">
              <Infinity className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Credits Never Expire
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Use anytime, no lock-ins
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
