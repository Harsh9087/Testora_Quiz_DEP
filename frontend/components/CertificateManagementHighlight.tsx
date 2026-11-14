"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  QrCode,
  Download,
  Mail,
  Building2,
  FileCheck2,
  ArrowRight,
  Palette
} from "lucide-react";
import AppLogo from "./AppLogo";

interface CertificateManagementHighlightProps {
  isLoggedIn?: boolean;
  userRole?: string | null;
  onLearnMore?: () => void;
}

export default function CertificateManagementHighlight({
  isLoggedIn = false,
  userRole = null,
  onLearnMore,
}: CertificateManagementHighlightProps) {
  // Target destination based on auth state
  const exploreHref = isLoggedIn
    ? userRole === "teacher"
      ? "/dashboard/teacher"
      : "/dashboard/student"
    : "/login?role=teacher";

  // Template Theme Preview Switcher
  const [activeTemplate, setActiveTemplate] = useState<"modern_navy" | "classic_gold" | "minimal_azure">("modern_navy");

  const themes = {
    modern_navy: {
      name: "Modern Professional",
      borderColor: "#0F172A",
      accentColor: "#D97706",
      primaryColor: "#0F172A",
      ribbonPrimary: "#0F172A",
      ribbonSecondary: "#1E3A8A",
      ribbonGold: "#F59E0B",
      tagline: "Testora Navy & Restrained Gold",
    },
    classic_gold: {
      name: "Classic Academic",
      borderColor: "#4A0404",
      accentColor: "#B8860B",
      primaryColor: "#4A0404",
      ribbonPrimary: "#4A0404",
      ribbonSecondary: "#7F1D1D",
      ribbonGold: "#D97706",
      tagline: "Ivory, Academic Maroon & Gold",
    },
    minimal_azure: {
      name: "Minimal Blue",
      borderColor: "#0B192C",
      accentColor: "#0284C7",
      primaryColor: "#0B192C",
      ribbonPrimary: "#0B192C",
      ribbonSecondary: "#0369A1",
      ribbonGold: "#38BDF8",
      tagline: "Sapphire Azure & Cobalt",
    },
  };

  const currentTheme = themes[activeTemplate];

  return (
    <section
      id="certificates"
      className="relative py-10 sm:py-14 lg:py-20 bg-[#F8FAFC] dark:bg-[#070D1B] border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden scroll-mt-16 transition-colors duration-200"
    >
      {/* Subtle Background Lighting & Geometric Accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/*
          RESPONSIVE GRID ARCHITECTURE:
          - Mobile (< lg): Single vertical stack where Header is 1st, Certificate Preview is 2nd, Features & CTAs are 3rd.
          - Desktop (lg+): Two equal columns (cols 1-6 = Preview, cols 7-12 = Header in Row 1 + Features & CTAs in Row 2).
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-x-12 lg:gap-y-6 items-center">
          
          {/* ══════════════════════════════════════════════════════════
              BLOCK 1: SECTION HEADER (Heading & Description)
              Mobile: 1st (order-1) | Desktop: Top-Right (lg:col-start-7 lg:row-start-1 lg:order-2)
             ══════════════════════════════════════════════════════════ */}
          <div className="w-full lg:col-span-6 lg:col-start-7 lg:row-start-1 order-1 lg:order-2 space-y-2.5 sm:space-y-3">
            
            {/* Category / Kicker Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Automated Recognition &amp; Verifiable Credentials</span>
            </div>

            {/* Main Section Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Recognize Achievement. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
                Celebrate Success.
              </span>
            </h2>

            {/* Description Paragraph */}
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              Give students recognition for their achievements with professionally designed, verifiable certificates generated through Testora Quiz&apos;s certificate management system.
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════
              BLOCK 2: CERTIFICATE PREVIEW & TEMPLATE SELECTOR
              Mobile: 2nd (order-2) | Desktop: Left Column (lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:order-1)
             ══════════════════════════════════════════════════════════ */}
          <div className="w-full lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:row-span-2 order-2 lg:order-1 flex flex-col items-center lg:self-center">
            
            {/* Interactive Template Selector Pill Bar */}
            <div className="w-full max-w-[580px] flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-2 sm:mb-2.5 px-0.5 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[10.5px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>Template Preview</span>
              </span>

              <div className="grid grid-cols-3 xs:flex items-center gap-1 p-0.5 sm:p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300/60 dark:border-slate-700/60 w-full xs:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTemplate("modern_navy")}
                  className={`px-2 py-1.5 xs:py-1 rounded-lg text-[10px] xs:text-[10.5px] sm:text-xs font-bold text-center transition-all cursor-pointer whitespace-nowrap ${
                    activeTemplate === "modern_navy"
                      ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Modern Navy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate("classic_gold")}
                  className={`px-2 py-1.5 xs:py-1 rounded-lg text-[10px] xs:text-[10.5px] sm:text-xs font-bold text-center transition-all cursor-pointer whitespace-nowrap ${
                    activeTemplate === "classic_gold"
                      ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Classic Gold
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate("minimal_azure")}
                  className={`px-2 py-1.5 xs:py-1 rounded-lg text-[10px] xs:text-[10.5px] sm:text-xs font-bold text-center transition-all cursor-pointer whitespace-nowrap ${
                    activeTemplate === "minimal_azure"
                      ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Minimal Azure
                </button>
              </div>
            </div>

            {/* A4 Landscape Realistic Certificate Card Container */}
            <div className="w-full max-w-[580px] aspect-[1.414/1] bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/90 relative p-3 xs:p-4 sm:p-5 md:p-6 flex flex-col justify-between select-none overflow-hidden text-slate-900 transition-all group hover:shadow-2xl">
              
              {/* Top-Left Diagonal Corner Ribbon */}
              <svg
                viewBox="0 0 100 100"
                className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 absolute top-0 left-0 pointer-events-none z-20 transition-all duration-300"
                fill="none"
              >
                <defs>
                  <linearGradient id={`ribbon-main-${activeTemplate}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTheme.ribbonPrimary} />
                    <stop offset="50%" stopColor={currentTheme.ribbonSecondary} />
                    <stop offset="100%" stopColor={currentTheme.ribbonPrimary} />
                  </linearGradient>
                  <linearGradient id={`ribbon-gold-${activeTemplate}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                {/* Triangular corner base */}
                <path d="M0 0 L75 0 L0 75 Z" fill={`url(#ribbon-main-${activeTemplate})`} />
                {/* Diagonal gold accent stripes */}
                <path d="M0 50 L50 0 L58 0 L0 58 Z" fill={`url(#ribbon-gold-${activeTemplate})`} />
                <path d="M0 68 L68 0 L75 0 L0 75 Z" fill={`url(#ribbon-gold-${activeTemplate})`} opacity="0.95" />
              </svg>

              {/* Bottom-Right Diagonal Corner Ribbon */}
              <svg
                viewBox="0 0 100 100"
                className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 absolute bottom-0 right-0 pointer-events-none z-20 rotate-180 transition-all duration-300"
                fill="none"
              >
                {/* Triangular corner base */}
                <path d="M0 0 L75 0 L0 75 Z" fill={`url(#ribbon-main-${activeTemplate})`} />
                {/* Diagonal gold accent stripes */}
                <path d="M0 50 L50 0 L58 0 L0 58 Z" fill={`url(#ribbon-gold-${activeTemplate})`} />
                <path d="M0 68 L68 0 L75 0 L0 75 Z" fill={`url(#ribbon-gold-${activeTemplate})`} opacity="0.95" />
              </svg>

              {/* Inner Decorative Frames */}
              <div
                className="absolute inset-1.5 xs:inset-2 sm:inset-3 border-2 rounded-lg sm:rounded-xl pointer-events-none transition-colors duration-300"
                style={{ borderColor: currentTheme.accentColor }}
              />
              <div className="absolute inset-2.5 xs:inset-3 sm:inset-4 border border-slate-300/80 rounded-md sm:rounded-lg pointer-events-none" />

              {/* Top Header Row: Testora Quiz Official Logo & Institute Name */}
              <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-amber-500/25 relative z-10 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <AppLogo variant="row" height={22} forceTheme="light" showBadge={false} />
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 font-extrabold text-[7.5px] sm:text-[8px] uppercase tracking-wider">
                    Official
                  </span>
                </div>

                <div className="text-right truncate max-w-[160px] xs:max-w-[200px] sm:max-w-[240px]">
                  <div className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                    Apex Academy of Science
                  </div>
                  <div className="text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] text-slate-500 font-medium">Affiliated Examination Center</div>
                </div>
              </div>

              {/* Certificate Body Content */}
              <div className="text-center my-auto py-1 sm:py-2 relative z-10 space-y-0.5 sm:space-y-1">
                
                <h3
                  className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-serif font-black uppercase tracking-wider transition-colors duration-300"
                  style={{ color: currentTheme.primaryColor }}
                >
                  Certificate of Excellence
                </h3>

                <div
                  className="w-14 sm:w-20 h-0.5 mx-auto rounded-full transition-colors duration-300"
                  style={{ backgroundColor: currentTheme.accentColor }}
                />

                <p className="text-[7.5px] xs:text-[8.5px] sm:text-[10.5px] italic text-slate-500 font-serif pt-0.5">
                  This credential is proudly presented to
                </p>

                {/* Recipient Student Name */}
                <div className="py-0.5 sm:py-1">
                  <div
                    className="text-sm xs:text-base sm:text-xl md:text-2xl font-serif font-black tracking-tight"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    Aarav Sharma
                  </div>
                  <div className="w-28 xs:w-36 sm:w-52 h-0.5 mx-auto bg-amber-500/40 mt-0.5" />
                  <div className="text-[6.5px] xs:text-[7.5px] sm:text-[9px] text-slate-500 font-mono mt-0.5">
                    Candidate Roll No: TQ-2026-89214
                  </div>
                </div>

                {/* Achievement Description */}
                <p className="text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] text-slate-600 max-w-[260px] xs:max-w-xs sm:max-w-md mx-auto leading-tight">
                  for meritorious performance &amp; successfully passing the standardized examination in
                </p>

                <p
                  className="text-[7.5px] xs:text-[8.5px] sm:text-xs md:text-sm font-bold truncate max-w-[260px] xs:max-w-xs sm:max-w-md mx-auto"
                  style={{ color: currentTheme.primaryColor }}
                >
                  &ldquo;All India JEE Mathematics &amp; Physics Benchmark&rdquo;
                </p>

                {/* Performance Grade Score Capsule */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-50 border border-slate-200/90 text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] font-bold text-slate-800 shadow-2xs">
                  <span>Score: 168 / 180</span>
                  <span className="text-slate-300">•</span>
                  <span>93.3%</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-extrabold">Grade: A+ Distinction</span>
                </div>

              </div>

              {/* Bottom Footer: Signatures, Seal & Cryptographic QR */}
              <div className="relative z-10 pt-1 sm:pt-2 border-t border-amber-500/25 flex items-end justify-between gap-1 sm:gap-2 shrink-0 text-left">
                
                {/* Signatory 1 */}
                <div className="text-center w-20 xs:w-26 sm:w-36">
                  {/* Handwritten signature flourish vector */}
                  <div className="h-4 xs:h-5 sm:h-6 flex items-center justify-center">
                    <svg viewBox="0 0 120 30" className="w-16 xs:w-20 sm:w-24 h-full" fill="none">
                      <path
                        d="M5 22 C12 8 18 6 22 18 C25 26 30 14 36 10 C42 6 48 20 54 16 C60 12 70 8 78 12 C86 16 95 10 105 14"
                        stroke="#0F172A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 14 L28 14"
                        stroke="#0F172A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="w-full border-t border-slate-400/60 mt-0.5 pt-0.5">
                    <div className="text-[7px] xs:text-[8px] sm:text-[9.5px] font-bold text-slate-900 truncate">Dr. S. Mehta</div>
                    <div className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] text-slate-500 font-medium">Academic Director</div>
                  </div>
                </div>

                {/* Center Official Gold Seal (Laurel Wreath with Star) */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none">
                      <defs>
                        <linearGradient id="seal-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="40%" stopColor="#FDE047" />
                          <stop offset="70%" stopColor="#D97706" />
                          <stop offset="100%" stopColor="#B45309" />
                        </linearGradient>
                      </defs>
                      {/* Laurel Left */}
                      <path
                        d="M28 76 C18 60 18 36 40 22 C35 28 34 38 37 45 C30 43 27 50 29 55 C23 54 22 60 25 65 C20 66 20 72 25 76 Z"
                        fill="url(#seal-gold-grad)"
                      />
                      {/* Laurel Right */}
                      <path
                        d="M72 76 C82 60 82 36 60 22 C65 28 66 38 63 45 C70 43 73 50 71 55 C77 54 78 60 75 65 C80 66 80 72 75 76 Z"
                        fill="url(#seal-gold-grad)"
                      />
                      {/* Star Center */}
                      <polygon
                        points="50,34 53,44 64,44 55,51 58,62 50,55 42,62 45,51 36,44 47,44"
                        fill="url(#seal-gold-grad)"
                        stroke="#B45309"
                        strokeWidth="0.7"
                      />
                      {/* Knot Bottom */}
                      <path
                        d="M44 80 Q50 83 56 80 L58 87 L50 84 L42 87 Z"
                        fill="url(#seal-gold-grad)"
                      />
                    </svg>
                  </div>
                </div>

                {/* QR Verification & Unique Identifier */}
                <div className="text-right w-20 xs:w-26 sm:w-36 flex flex-col items-end">
                  <div className="p-0.5 sm:p-1 rounded bg-white border border-slate-200 shadow-2xs mb-0.5">
                    <QrCode className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 text-slate-900" />
                  </div>
                  <div className="text-[6px] xs:text-[7px] sm:text-[8px] text-slate-500 font-medium">Scan to Verify</div>
                  <div className="text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] font-mono font-bold text-slate-800 truncate">
                    TQ-CERT-2026-89214
                  </div>
                </div>

              </div>

            </div>

            {/* Cryptographic Assurance Pill */}
            <div className="mt-3 sm:mt-3.5 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-[10px] xs:text-[10.5px] sm:text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Cryptographic anti-tamper verification embedded on every certificate</span>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════
              BLOCK 3: FEATURES & ACTIONS
              Mobile: 3rd (order-3) | Desktop: Bottom-Right (lg:col-start-7 lg:row-start-2 lg:order-3)
             ══════════════════════════════════════════════════════════ */}
          <div className="w-full lg:col-span-6 lg:col-start-7 lg:row-start-2 order-3 lg:order-3 space-y-4 sm:space-y-5">
            
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-0.5">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Ready-Made Templates</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Classic Academic, Modern Navy &amp; Award styles</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Institute Co-Branding</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Custom school logo &amp; authorized signature seal</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Automatic Student Injection</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Dynamic score, grade, roll number &amp; exam metadata</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Public QR Verification</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Instant tamper-proof check via unique URL &amp; ID</p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Print-Ready PDF Download</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Vector 300-DPI A4 landscape publication files</p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#0D182E] border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-amber-300 dark:hover:border-amber-600/70 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Automated Email Dispatch</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Delivered directly to students upon result publish</p>
                </div>
              </div>

            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <Link
                href={exploreHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer text-center"
              >
                <span>Explore Certificate Features</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/verify-certificate/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-300/80 dark:border-slate-700 transition-colors cursor-pointer text-center"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verify a Certificate</span>
              </Link>
            </div>

            {/* Security Assurance Notice */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>Full control for teachers &amp; institutes • Tamper-proof public validation for employers</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
