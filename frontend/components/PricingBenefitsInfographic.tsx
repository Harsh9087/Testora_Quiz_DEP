"use client";

import React from "react";
import { ShieldCheck, Coins, Users, Infinity, CheckCircle2 } from "lucide-react";

export default function PricingBenefitsInfographic() {
  return (
    <div className="relative w-full max-w-[580px] sm:max-w-[620px] aspect-square mx-auto my-6 sm:my-10 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. SUBTLE AMBIENT BACKGROUND & DOT MATRIX CANVAS
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1.2px,transparent_1.2px)] [background-size:22px_22px] opacity-70 dark:opacity-20 rounded-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-blue-100/50 dark:bg-blue-900/15 blur-3xl pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          2. SVG CONNECTOR & ARC LAYER (0-600 Coordinate System)
      ───────────────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 600 600"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top Arc: Blue Gradient */}
          <linearGradient id="topArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Right Arc: Purple Gradient */}
          <linearGradient id="rightArcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>

          {/* Bottom Arc: Violet / Indigo Gradient */}
          <linearGradient id="bottomArcGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>

          {/* Left Arc: Emerald / Teal Gradient */}
          <linearGradient id="leftArcGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* ── 4 OUTER COLORED CIRCULAR ARCS ── */}
        {/* Top Arc: wraps top of No Hidden Fees node */}
        <path
          d="M 218.6 53 A 94 94 0 0 1 381.4 53"
          stroke="url(#topArcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Right Arc: wraps right of Transparent Pricing node */}
        <path
          d="M 547 218.6 A 94 94 0 0 1 547 381.4"
          stroke="url(#rightArcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Bottom Arc: wraps bottom of Credits Never Expire node */}
        <path
          d="M 381.4 547 A 94 94 0 0 1 218.6 547"
          stroke="url(#bottomArcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Left Arc: wraps left of Flexible for All node */}
        <path
          d="M 53 381.4 A 94 94 0 0 1 53 218.6"
          stroke="url(#leftArcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* ── 4 CURVED CONNECTORS BETWEEN NODES ── */}
        {/* Top to Left curve */}
        <path
          d="M 240 145 C 180 145, 145 180, 145 240"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.2"
        />
        {/* Top to Right curve */}
        <path
          d="M 360 145 C 420 145, 455 180, 455 240"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.2"
        />
        {/* Left to Bottom curve */}
        <path
          d="M 145 360 C 145 420, 180 455, 240 455"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.2"
        />
        {/* Right to Bottom curve */}
        <path
          d="M 455 360 C 455 420, 420 455, 360 455"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2.2"
        />

        {/* ── COLORED CONNECTION DOTS ON OUTER CURVES ── */}
        <circle cx="240" cy="145" r="4.5" fill="#2563EB" />
        <circle cx="145" cy="240" r="4.5" fill="#059669" />
        <circle cx="360" cy="145" r="4.5" fill="#2563EB" />
        <circle cx="455" cy="240" r="4.5" fill="#9333EA" />
        <circle cx="145" cy="360" r="4.5" fill="#059669" />
        <circle cx="240" cy="455" r="4.5" fill="#7C3AED" />
        <circle cx="455" cy="360" r="4.5" fill="#9333EA" />
        <circle cx="360" cy="455" r="4.5" fill="#7C3AED" />

        {/* ── INWARD CONNECTORS & POINTERS TO CENTER LOGO BOX ── */}
        {/* Top: Downward pointer & connection dot */}
        <line
          x1="300"
          y1="182"
          x2="300"
          y2="210"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2"
        />
        <polygon points="294,208 306,208 300,218" fill="#2563EB" />
        <circle
          cx="300"
          cy="232"
          r="6.5"
          fill="white"
          className="dark:fill-[#0D182E]"
          stroke="#2563EB"
          strokeWidth="2.5"
        />
        <circle cx="300" cy="232" r="2.5" fill="#2563EB" />

        {/* Right: Leftward connection dot */}
        <line
          x1="418"
          y1="300"
          x2="376"
          y2="300"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2"
        />
        <circle
          cx="368"
          cy="300"
          r="6.5"
          fill="white"
          className="dark:fill-[#0D182E]"
          stroke="#9333EA"
          strokeWidth="2.5"
        />
        <circle cx="368" cy="300" r="2.5" fill="#9333EA" />

        {/* Bottom: Upward pointer & connection dot */}
        <line
          x1="300"
          y1="418"
          x2="300"
          y2="390"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2"
        />
        <polygon points="294,392 306,392 300,382" fill="#7C3AED" />
        <circle
          cx="300"
          cy="368"
          r="6.5"
          fill="white"
          className="dark:fill-[#0D182E]"
          stroke="#7C3AED"
          strokeWidth="2.5"
        />
        <circle cx="300" cy="368" r="2.5" fill="#7C3AED" />

        {/* Left: Rightward connection dot */}
        <line
          x1="182"
          y1="300"
          x2="224"
          y2="300"
          className="stroke-slate-300 dark:stroke-slate-700"
          strokeWidth="2"
        />
        <circle
          cx="232"
          cy="300"
          r="6.5"
          fill="white"
          className="dark:fill-[#0D182E]"
          stroke="#059669"
          strokeWidth="2.5"
        />
        <circle cx="232" cy="300" r="2.5" fill="#059669" />
      </svg>

      {/* ─────────────────────────────────────────────────────────────
          3. CENTER LOGO BOX (Rounded Square)
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute w-[23.5%] h-[23.5%] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0D182E] border-2 border-blue-200/90 dark:border-blue-800/80 shadow-[0_8px_24px_rgba(37,99,235,0.08)] dark:shadow-none flex flex-col items-center justify-center p-1.5 xs:p-2 sm:p-3 text-center z-20 transition-all hover:scale-105"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg bg-[#1765F5] text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-[11px] xs:text-xs sm:text-base tracking-tight text-slate-900 dark:text-white leading-none">
            Testora<span className="text-[#1765F5]">Quiz</span>
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FOUR SURROUNDING CIRCULAR BENEFIT NODES
      ───────────────────────────────────────────────────────────── */}

      {/* ── TOP NODE: No Hidden Fees ── */}
      <div
        className="absolute w-[28.5%] h-[28.5%] rounded-full bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0D182E] dark:to-[#0A1224] border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col items-center justify-center p-1.5 xs:p-2 sm:p-3 text-center z-10 transition-all hover:scale-105 hover:shadow-blue-500/15"
        style={{ left: "50%", top: "16.667%", transform: "translate(-50%, -50%)" }}
      >
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shadow-2xs mb-0.5 sm:mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 fill-blue-500/10" />
        </div>
        <h4 className="text-[10px] xs:text-[11.5px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          No Hidden Fees
        </h4>
        <p className="text-[7.5px] xs:text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
          Pay only for attempts
        </p>
      </div>

      {/* ── RIGHT NODE: Transparent Pricing ── */}
      <div
        className="absolute w-[28.5%] h-[28.5%] rounded-full bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0D182E] dark:to-[#0A1224] border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col items-center justify-center p-1.5 xs:p-2 sm:p-3 text-center z-10 transition-all hover:scale-105 hover:shadow-purple-500/15"
        style={{ left: "83.333%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center shadow-2xs mb-0.5 sm:mb-1.5">
          <Coins className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
        </div>
        <h4 className="text-[10px] xs:text-[11.5px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          Transparent Pricing
        </h4>
        <p className="text-[7.5px] xs:text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-medium">
          1 Credit = ₹0.10
        </p>
      </div>

      {/* ── BOTTOM NODE: Credits Never Expire ── */}
      <div
        className="absolute w-[28.5%] h-[28.5%] rounded-full bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0D182E] dark:to-[#0A1224] border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col items-center justify-center p-1.5 xs:p-2 sm:p-3 text-center z-10 transition-all hover:scale-105 hover:shadow-violet-500/15"
        style={{ left: "50%", top: "83.333%", transform: "translate(-50%, -50%)" }}
      >
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/60 flex items-center justify-center shadow-2xs mb-0.5 sm:mb-1.5">
          <Infinity className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
        </div>
        <h4 className="text-[10px] xs:text-[11.5px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          Credits Never Expire
        </h4>
        <p className="text-[7.5px] xs:text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
          Use anytime, no lock-ins
        </p>
      </div>

      {/* ── LEFT NODE: Flexible for All ── */}
      <div
        className="absolute w-[28.5%] h-[28.5%] rounded-full bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0D182E] dark:to-[#0A1224] border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col items-center justify-center p-1.5 xs:p-2 sm:p-3 text-center z-10 transition-all hover:scale-105 hover:shadow-emerald-500/15"
        style={{ left: "16.667%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shadow-2xs mb-0.5 sm:mb-1.5">
          <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
        </div>
        <h4 className="text-[10px] xs:text-[11.5px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          Flexible for All
        </h4>
        <p className="text-[7px] xs:text-[8.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight max-w-[92%] mx-auto">
          Teachers, Colleges &amp; Institutions
        </p>
      </div>
    </div>
  );
}

