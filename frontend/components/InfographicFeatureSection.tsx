"use client";

import React from "react";
import { Zap, FileText, Database, ShieldCheck } from "lucide-react";

interface InfographicFeatureSectionProps {
  className?: string;
  withBackgroundDots?: boolean;
  withContainerBorder?: boolean;
  showHeader?: boolean;
}

export default function InfographicFeatureSection({
  className = "",
  withBackgroundDots = true,
  withContainerBorder = false,
  showHeader = false,
}: InfographicFeatureSectionProps) {
  return (
    <section
      aria-label="Testora Quiz Core Platform Features"
      className={`relative w-full overflow-hidden select-none transition-colors duration-200 ${
        withContainerBorder
          ? "rounded-3xl border border-slate-200/90 dark:border-[#263957] p-4 sm:p-6 md:p-7 bg-white/85 dark:bg-[#080E1E] backdrop-blur-md shadow-xl"
          : ""
      } ${className}`}
    >
      {/* ───────────────────────────────────────────────────────────
          1. SUBTLE PALE-BLUE DOT PATTERN (Adapts in Light and Dark Mode)
          Light: Pale-blue dots on light canvas.
          Dark: Muted navy dots on #080E1E, never white or jarring.
      ─────────────────────────────────────────────────────────── */}
      {withBackgroundDots && (
        <div
          className="absolute inset-0 pointer-events-none -z-10 opacity-40 dark:opacity-15 transition-opacity"
          style={{
            backgroundImage:
              "radial-gradient(#60A5FA 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
      )}

      {/* Optional Header */}
      {showHeader && (
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-[#278BFF] border border-blue-200/60 dark:border-blue-900/50 shadow-2xs mb-2">
            <span>Core Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Built for Modern Assessments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A9B9D3] mt-1.5 leading-relaxed">
            Connected workflows from question drafting to proctored evaluation.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          A. DESKTOP & TABLET LAYOUT (Strict 2 Columns × 2 Rows Grid with Connected Curved Arrows)
          Visible on screens ≥ 768px (Tablet: 768px–1199px & Desktop: 1200px+)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-full max-w-[1140px] mx-auto px-2 sm:px-4 py-2">
        {/* Row 1: Card 01 & Card 02 with horizontal arrow between them */}
        <div className="relative grid grid-cols-2 gap-x-10 lg:gap-x-14 xl:gap-x-16 items-center">
          {/* ──── FEATURE 01: AI Powered (Top-Left) ──── */}
          <div className="relative w-full h-[82px] lg:h-[86px] xl:h-[90px] flex items-center group">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-blue-200/90 dark:border-[#263957] shadow-sm hover:shadow-md dark:shadow-none hover:border-blue-400 dark:hover:border-blue-500/80 transition-all duration-300 flex items-center justify-between px-2.5 sm:px-3 md:px-3.5">
              {/* Left Number Circle */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 xl:w-16 xl:h-16 rounded-full bg-[#278BFF] text-white flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl tracking-tighter shrink-0 shadow-md ring-4 ring-white dark:ring-[#111D35]">
                01
              </div>

              {/* Center Text */}
              <div className="flex flex-col justify-center px-3 sm:px-3.5 min-w-0 flex-1">
                <h3 className="font-black text-sm sm:text-base md:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                  AI Powered
                </h3>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                  Create questions in minutes.
                </p>
              </div>

              {/* Right Icon Circle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-[#278BFF] shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <div className="relative flex items-center justify-center">
                  <Zap
                    className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#278BFF]"
                    strokeWidth={2.3}
                    fill="#278BFF"
                    fillOpacity={0.2}
                  />
                  <span className="absolute -top-1 -right-1 text-[#278BFF] text-[8px] font-bold leading-none select-none pointer-events-none">
                    ✦
                  </span>
                  <span className="absolute -bottom-1 -left-1 text-[#278BFF] text-[7px] font-bold leading-none select-none pointer-events-none">
                    ✦
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ──── SVG Curved Arrow: Card 01 -> Card 02 (In horizontal gap) ──── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-8 lg:w-12 xl:w-14">
            <svg
              width="56"
              height="26"
              viewBox="0 0 56 26"
              fill="none"
              className="text-[#278BFF] overflow-visible drop-shadow-xs"
            >
              <path
                d="M 4 13 C 18 5, 34 21, 48 13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 40 7 L 50 13 L 41 19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ──── FEATURE 02: Print Ready (Top-Right) ──── */}
          <div className="relative w-full h-[82px] lg:h-[86px] xl:h-[90px] flex items-center group">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-purple-200/90 dark:border-[#263957] shadow-sm hover:shadow-md dark:shadow-none hover:border-purple-400 dark:hover:border-purple-500/80 transition-all duration-300 flex items-center justify-between px-2.5 sm:px-3 md:px-3.5">
              {/* Left Icon Circle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-[#8B4DFF] shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <FileText
                  className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#8B4DFF]"
                  strokeWidth={2.2}
                />
              </div>

              {/* Center Text */}
              <div className="flex flex-col justify-center px-3 sm:px-3.5 min-w-0 flex-1">
                <h3 className="font-black text-sm sm:text-base md:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                  Print Ready
                </h3>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                  Professional exam papers.
                </p>
              </div>

              {/* Right Number Circle */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 xl:w-16 xl:h-16 rounded-full bg-[#8B4DFF] text-white flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl tracking-tighter shrink-0 shadow-md ring-4 ring-white dark:ring-[#111D35]">
                02
              </div>
            </div>
          </div>
        </div>

        {/* ──── SVG Curved Diagonal Flow: Card 02 (Top-Right) -> Card 03 (Bottom-Left) ──── */}
        <div className="relative w-full h-10 lg:h-12 flex items-center justify-center pointer-events-none select-none my-1">
          <svg
            width="380"
            height="44"
            viewBox="0 0 380 44"
            fill="none"
            className="text-[#8B4DFF] max-w-full drop-shadow-xs"
          >
            <path
              d="M 330 4 C 290 40, 100 42, 38 16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 50 10 L 32 16 L 44 26"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Row 2: Card 03 & Card 04 with horizontal arrow between them */}
        <div className="relative grid grid-cols-2 gap-x-10 lg:gap-x-14 xl:gap-x-16 items-center">
          {/* ──── FEATURE 03: Organized (Bottom-Left) ──── */}
          <div className="relative w-full h-[82px] lg:h-[86px] xl:h-[90px] flex items-center group">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-emerald-200/90 dark:border-[#263957] shadow-sm hover:shadow-md dark:shadow-none hover:border-emerald-400 dark:hover:border-emerald-500/80 transition-all duration-300 flex items-center justify-between px-2.5 sm:px-3 md:px-3.5">
              {/* Left Number Circle */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 xl:w-16 xl:h-16 rounded-full bg-[#10B981] text-white flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl tracking-tighter shrink-0 shadow-md ring-4 ring-white dark:ring-[#111D35]">
                03
              </div>

              {/* Center Text */}
              <div className="flex flex-col justify-center px-3 sm:px-3.5 min-w-0 flex-1">
                <h3 className="font-black text-sm sm:text-base md:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                  Organized
                </h3>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                  Build and reuse your question bank.
                </p>
              </div>

              {/* Right Icon Circle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#10B981] shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <Database
                  className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#10B981]"
                  strokeWidth={2.2}
                />
              </div>
            </div>
          </div>

          {/* ──── SVG Curved Arrow: Card 03 -> Card 04 (In horizontal gap) ──── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-8 lg:w-12 xl:w-14">
            <svg
              width="56"
              height="26"
              viewBox="0 0 56 26"
              fill="none"
              className="text-[#10B981] overflow-visible drop-shadow-xs"
            >
              <path
                d="M 4 13 C 18 5, 34 21, 48 13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 40 7 L 50 13 L 41 19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ──── FEATURE 04: Secure (Bottom-Right) ──── */}
          <div className="relative w-full h-[82px] lg:h-[86px] xl:h-[90px] flex items-center group">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-rose-200/90 dark:border-[#263957] shadow-sm hover:shadow-md dark:shadow-none hover:border-rose-400 dark:hover:border-rose-500/80 transition-all duration-300 flex items-center justify-between px-2.5 sm:px-3 md:px-3.5">
              {/* Left Icon Circle */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center text-[#FF4D5A] shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck
                  className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#FF4D5A]"
                  strokeWidth={2.2}
                />
              </div>

              {/* Center Text */}
              <div className="flex flex-col justify-center px-3 sm:px-3.5 min-w-0 flex-1">
                <h3 className="font-black text-sm sm:text-base md:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                  Secure
                </h3>
                <p className="text-[11px] sm:text-xs md:text-[13px] font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                  Maintain fair and reliable exams.
                </p>
              </div>

              {/* Right Number Circle */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 xl:w-16 xl:h-16 rounded-full bg-[#FF4D5A] text-white flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl tracking-tighter shrink-0 shadow-md ring-4 ring-white dark:ring-[#111D35]">
                04
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          B. MOBILE LAYOUT (Single Vertical Column with Alternating Curved Flow)
          Visible on screens < 768px.
      ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-[500px] mx-auto px-1 sm:px-2 space-y-0">
        {/* ──── FEATURE 01: AI Powered (Mobile) ──── */}
        <div className="relative w-full h-[72px] sm:h-[76px] flex items-center select-none group">
          <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-blue-200/90 dark:border-[#263957] shadow-sm flex items-center justify-between px-2 sm:px-2.5">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#278BFF] text-white flex items-center justify-center font-black text-base sm:text-lg tracking-tighter shrink-0 shadow-sm ring-3 ring-white dark:ring-[#111D35]">
              01
            </div>

            <div className="flex flex-col justify-center px-2.5 sm:px-3 min-w-0 flex-1">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                AI Powered
              </h3>
              <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                Create questions in minutes.
              </p>
            </div>

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-[#278BFF] shrink-0">
              <Zap className="w-4.5 h-4.5 text-[#278BFF]" strokeWidth={2.3} fill="#278BFF" fillOpacity={0.2} />
            </div>
          </div>
        </div>

        {/* Mobile Directional Curved Arrow 1 -> 2 (Right to Left) */}
        <div className="w-full flex justify-end pr-8 sm:pr-10 py-1 select-none pointer-events-none">
          <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="w-8 sm:w-9 h-5 sm:h-6 text-[#278BFF]">
            <path
              d="M 34 2 C 34 14, 18 16, 8 22"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 16 19 L 6 23 L 9 13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ──── FEATURE 02: Print Ready (Mobile) ──── */}
        <div className="relative w-full h-[72px] sm:h-[76px] flex items-center select-none group">
          <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-purple-200/90 dark:border-[#263957] shadow-sm flex items-center justify-between px-2 sm:px-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-[#8B4DFF] shrink-0">
              <FileText className="w-4.5 h-4.5 text-[#8B4DFF]" strokeWidth={2.2} />
            </div>

            <div className="flex flex-col justify-center px-2.5 sm:px-3 min-w-0 flex-1">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                Print Ready
              </h3>
              <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                Professional exam papers.
              </p>
            </div>

            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#8B4DFF] text-white flex items-center justify-center font-black text-base sm:text-lg tracking-tighter shrink-0 shadow-sm ring-3 ring-white dark:ring-[#111D35]">
              02
            </div>
          </div>
        </div>

        {/* Mobile Directional Curved Arrow 2 -> 3 (Left to Right) */}
        <div className="w-full flex justify-start pl-8 sm:pl-10 py-1 select-none pointer-events-none">
          <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="w-8 sm:w-9 h-5 sm:h-6 text-[#8B4DFF]">
            <path
              d="M 8 2 C 8 14, 24 16, 34 22"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 26 19 L 36 23 L 33 13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ──── FEATURE 03: Organized (Mobile) ──── */}
        <div className="relative w-full h-[72px] sm:h-[76px] flex items-center select-none group">
          <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-emerald-200/90 dark:border-[#263957] shadow-sm flex items-center justify-between px-2 sm:px-2.5">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#10B981] text-white flex items-center justify-center font-black text-base sm:text-lg tracking-tighter shrink-0 shadow-sm ring-3 ring-white dark:ring-[#111D35]">
              03
            </div>

            <div className="flex flex-col justify-center px-2.5 sm:px-3 min-w-0 flex-1">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                Organized
              </h3>
              <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                Build and reuse your question bank.
              </p>
            </div>

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#10B981] shrink-0">
              <Database className="w-4.5 h-4.5 text-[#10B981]" strokeWidth={2.2} />
            </div>
          </div>
        </div>

        {/* Mobile Directional Curved Arrow 3 -> 4 (Right to Left) */}
        <div className="w-full flex justify-end pr-8 sm:pr-10 py-1 select-none pointer-events-none">
          <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="w-8 sm:w-9 h-5 sm:h-6 text-[#10B981]">
            <path
              d="M 34 2 C 34 14, 18 16, 8 22"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 16 19 L 6 23 L 9 13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ──── FEATURE 04: Secure (Mobile) ──── */}
        <div className="relative w-full h-[72px] sm:h-[76px] flex items-center select-none group">
          <div className="w-full h-full rounded-full bg-white dark:bg-[#111D35] border border-rose-200/90 dark:border-[#263957] shadow-sm flex items-center justify-between px-2 sm:px-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center text-[#FF4D5A] shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-[#FF4D5A]" strokeWidth={2.2} />
            </div>

            <div className="flex flex-col justify-center px-2.5 sm:px-3 min-w-0 flex-1">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug truncate">
                Secure
              </h3>
              <p className="text-[10.5px] sm:text-xs font-medium text-slate-500 dark:text-[#A9B9D3] leading-tight mt-0.5 truncate">
                Maintain fair and reliable exams.
              </p>
            </div>

            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#FF4D5A] text-white flex items-center justify-center font-black text-base sm:text-lg tracking-tighter shrink-0 shadow-sm ring-3 ring-white dark:ring-[#111D35]">
              04
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
