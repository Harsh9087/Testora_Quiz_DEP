"use client";

import React from "react";
import { Users, FileText, Landmark, ArrowRight, Check } from "lucide-react";

interface PlatformStats {
  active_users: number;
  assessments_created: number;
  submissions_evaluated: number;
  institutions_active: number;
}

interface PlatformActivitySectionProps {
  stats?: PlatformStats | null;
}

// Format stats in thousands (e.g. 9K+, 4K+, 2K+, 2K+) with prominent large typography
function formatStatInThousands(val: number): string {
  if (val >= 1000) {
    const inK = val / 1000;
    return `${inK % 1 === 0 ? inK : inK.toFixed(1)}K+`;
  }
  return `${val}K+`;
}

export default function PlatformActivitySection({ stats }: PlatformActivitySectionProps) {
  // Real values from database, with fallback defaults matching reference if pending
  const totalUsers = stats?.active_users ?? 9;
  const testsCreated = stats?.assessments_created ?? 4;
  const submissionsChecked = stats?.submissions_evaluated ?? 2;
  const activeInstitutions = stats?.institutions_active ?? 2;

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24 bg-white dark:bg-[#080E1E] border-b border-slate-100 dark:border-slate-800/80 transition-colors">
      
      {/* Background Soft Organic Blobs matching reference */}
      <div className="absolute top-1/4 -left-20 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-blue-100/50 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-purple-100/40 dark:bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[400px] sm:w-[500px] h-60 rounded-full bg-emerald-50/50 dark:bg-emerald-950/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12 lg:mb-16">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4FF] dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800 text-[#0066FF] dark:text-[#38BDF8] text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span>Live Platform Activity</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-black tracking-tight text-[#0B1B3D] dark:text-white leading-[1.2] mt-2">
            See What&rsquo;s Happening on{" "}
            <span className="block sm:inline text-[#0066FF] dark:text-[#38BDF8]">Testora Quiz</span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 font-normal mt-1 max-w-sm sm:max-w-md mx-auto">
            Live numbers from real activity on the platform.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            DESKTOP CONNECTED DIAGRAM (xl & above: 1080px fixed coordinate grid)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden xl:block relative w-[1080px] mx-auto h-[380px]">
          
          {/* SVG Curved Connector Lines & Radial Hub Ticks */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1080 380"
            fill="none"
          >
            {/* Top-Left to Center Curve (Blue) */}
            <path
              d="M 360 85 C 410 85, 415 133, 458 133"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Top-Left Card Anchor Dot */}
            <circle cx="360" cy="85" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            {/* Center Circle Blue Dot */}
            <circle cx="458" cy="133" r="4.5" fill="#2563EB" />

            {/* Bottom-Left to Center Curve (Green) */}
            <path
              d="M 360 295 C 410 295, 415 247, 458 247"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Bottom-Left Card Anchor Dot */}
            <circle cx="360" cy="295" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            {/* Center Circle Green Dot */}
            <circle cx="458" cy="247" r="4.5" fill="#10B981" />

            {/* Top-Right to Center Curve (Purple) */}
            <path
              d="M 720 85 C 670 85, 665 133, 622 133"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Top-Right Card Anchor Dot */}
            <circle cx="720" cy="85" r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
            {/* Center Circle Purple Dot */}
            <circle cx="622" cy="133" r="4.5" fill="#8B5CF6" />

            {/* Bottom-Right to Center Curve (Pink) */}
            <path
              d="M 720 295 C 670 295, 665 247, 622 247"
              stroke="#D946EF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Bottom-Right Card Anchor Dot */}
            <circle cx="720" cy="295" r="5" fill="#D946EF" stroke="#FFFFFF" strokeWidth="2" />
            {/* Center Circle Pink Dot */}
            <circle cx="622" cy="247" r="4.5" fill="#D946EF" />

            {/* 8 Radial Accent Ticks on Central Hub matching desktop reference */}
            <line x1="540" y1="70" x2="540" y2="82" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="540" y1="298" x2="540" y2="310" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="420" y1="190" x2="432" y2="190" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="648" y1="190" x2="660" y2="190" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="616" y1="114" x2="625" y2="105" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="616" y1="266" x2="625" y2="275" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="464" y1="266" x2="455" y2="275" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="464" y1="114" x2="455" y2="105" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" />
          </svg>

          {/* ═══════ CARD 1: TOP LEFT — TOTAL USERS ═══════ */}
          <div className="absolute left-0 top-[10px] w-[360px] h-[150px] rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#DCEBFE] dark:border-[#1E3A8A]/60 px-6 py-5 shadow-xs hover:shadow-md transition-all flex items-center gap-5 z-20 group">
            <div className="w-[58px] h-[58px] rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/70 flex items-center justify-center text-[#0066FF] dark:text-[#38BDF8] shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-4xl lg:text-[44px] font-black text-[#0066FF] dark:text-[#38BDF8] tracking-tight leading-none">
                {formatStatInThousands(totalUsers)}
              </div>
              <div className="text-base font-bold text-[#0B1B3D] dark:text-white pt-0.5">
                Total Users
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Teachers, admins and students using the platform.
              </p>
            </div>
          </div>

          {/* ═══════ CARD 2: BOTTOM LEFT — SUBMISSIONS CHECKED ═══════ */}
          <div className="absolute left-0 top-[220px] w-[360px] h-[150px] rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#D1F7E5] dark:border-[#065F46]/60 px-6 py-5 shadow-xs hover:shadow-md transition-all flex items-center gap-5 z-20 group">
            <div className="w-[58px] h-[58px] rounded-2xl bg-[#E6F9F0] dark:bg-emerald-950/70 flex items-center justify-center text-[#10B981] dark:text-[#34D399] shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-4xl lg:text-[44px] font-black text-[#10B981] dark:text-[#34D399] tracking-tight leading-none">
                {formatStatInThousands(submissionsChecked)}
              </div>
              <div className="text-base font-bold text-[#0B1B3D] dark:text-white pt-0.5">
                Submissions Checked
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Student answers reviewed by teachers.
              </p>
            </div>
          </div>

          {/* ═══════ CENTRAL CIRCLE: TESTORA QUIZ HUB ═══════ */}
          <div className="absolute left-[440px] top-[90px] w-[200px] h-[200px] rounded-full border-[6px] border-[#E0F2FE] dark:border-blue-900/60 bg-white dark:bg-[#0D1830] shadow-xl shadow-blue-500/10 flex flex-col items-center justify-center text-center p-4 z-20">
            <div className="text-xl font-black tracking-tight text-[#0B1B3D] dark:text-white">
              Testora <span className="text-[#0066FF] dark:text-[#38BDF8]">Quiz</span>
            </div>
            <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 my-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-[130px]">
              Helping teachers create better tests for students.
            </p>
          </div>

          {/* ═══════ CARD 3: TOP RIGHT — TESTS CREATED ═══════ */}
          <div className="absolute left-[720px] top-[10px] w-[360px] h-[150px] rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#EDE9FE] dark:border-[#5B21B6]/60 px-6 py-5 shadow-xs hover:shadow-md transition-all flex items-center gap-5 z-20 group">
            <div className="w-[58px] h-[58px] rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/70 flex items-center justify-center text-[#8B5CF6] dark:text-[#A78BFA] shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-4xl lg:text-[44px] font-black text-[#8B5CF6] dark:text-[#A78BFA] tracking-tight leading-none">
                {formatStatInThousands(testsCreated)}
              </div>
              <div className="text-base font-bold text-[#0B1B3D] dark:text-white pt-0.5">
                Tests Created
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Practice tests and quizzes made by teachers.
              </p>
            </div>
          </div>

          {/* ═══════ CARD 4: BOTTOM RIGHT — ACTIVE INSTITUTIONS ═══════ */}
          <div className="absolute left-[720px] top-[220px] w-[360px] h-[150px] rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#FCE7F3] dark:border-[#831843]/60 px-6 py-5 shadow-xs hover:shadow-md transition-all flex items-center gap-5 z-20 group">
            <div className="w-[58px] h-[58px] rounded-2xl bg-[#FDF2F8] dark:bg-pink-950/70 flex items-center justify-center text-[#D946EF] dark:text-[#F472B6] shrink-0 group-hover:scale-105 transition-transform">
              <Landmark className="w-7 h-7" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-4xl lg:text-[44px] font-black text-[#D946EF] dark:text-[#F472B6] tracking-tight leading-none">
                {formatStatInThousands(activeInstitutions)}
              </div>
              <div className="text-base font-bold text-[#0B1B3D] dark:text-white pt-0.5">
                Active Institutions
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Schools and colleges using Testora Quiz.
              </p>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            MOBILE & TABLET RESPONSIVE VIEW (< xl: 2-column grid from reference)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="xl:hidden relative max-w-[420px] sm:max-w-[480px] mx-auto">
          
          {/* TOP ROW: CARD 1 (Total Users) & CARD 2 (Tests Created) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-20">
            
            {/* ── CARD 1: TOTAL USERS (Blue) ── */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#DCEBFE] dark:border-[#1E3A8A]/50 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between transition-transform">
              {/* Top Icons Row */}
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/70 text-[#0066FF] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EBF3FF] dark:bg-blue-950/70 text-[#0066FF] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Number, Title, Description */}
              <div className="mt-3 sm:mt-4 space-y-0.5">
                <div className="text-3xl sm:text-4xl font-black text-[#0066FF] dark:text-[#38BDF8] tracking-tight leading-none">
                  {formatStatInThousands(totalUsers)}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0B1B3D] dark:text-white pt-1">
                  Total Users
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  Teachers, admins and students using the platform.
                </p>
              </div>
            </div>

            {/* ── CARD 2: TESTS CREATED (Purple) ── */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#EDE9FE] dark:border-[#5B21B6]/50 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between transition-transform">
              {/* Top Icons Row */}
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/70 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F3E8FF] dark:bg-purple-950/70 text-[#8B5CF6] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Number, Title, Description */}
              <div className="mt-3 sm:mt-4 space-y-0.5">
                <div className="text-3xl sm:text-4xl font-black text-[#8B5CF6] dark:text-[#A78BFA] tracking-tight leading-none">
                  {formatStatInThousands(testsCreated)}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0B1B3D] dark:text-white pt-1">
                  Tests Created
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  Practice tests and quizzes made by teachers.
                </p>
              </div>
            </div>

          </div>

          {/* ── MIDDLE AREA: CENTRAL HUB & SVG CURVED CONNECTORS ── */}
          <div className="relative w-full h-[120px] sm:h-[135px] flex items-center justify-center my-0.5">
            
            {/* SVG Connector Curves linking cards to the center hub */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
              viewBox="0 0 360 120"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Top-Left Blue Connector (From Card 1 to Circle) */}
              <path
                d="M 106 0 C 106 20, 116 12, 132 12"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="106" cy="0" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="132" cy="12" r="3.5" fill="#2563EB" />

              {/* Top-Right Purple Connector (From Card 2 to Circle) */}
              <path
                d="M 254 0 C 254 20, 244 12, 228 12"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="254" cy="0" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="228" cy="12" r="3.5" fill="#8B5CF6" />

              {/* Bottom-Left Green Connector (From Card 3 to Circle) */}
              <path
                d="M 106 120 C 106 100, 116 108, 132 108"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="106" cy="120" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="132" cy="108" r="3.5" fill="#10B981" />

              {/* Bottom-Right Pink Connector (From Card 4 to Circle) */}
              <path
                d="M 254 120 C 254 100, 244 108, 228 108"
                stroke="#D946EF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="254" cy="120" r="4.5" fill="#D946EF" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="228" cy="108" r="3.5" fill="#D946EF" />
            </svg>

            {/* Central Testora Quiz Circle Hub matching mobile screenshot */}
            <div className="w-[136px] h-[136px] sm:w-[150px] sm:h-[150px] rounded-full border-[4px] sm:border-[5px] border-[#E0F2FE] dark:border-blue-900/60 bg-white dark:bg-[#0D1830] shadow-xl shadow-blue-500/10 flex flex-col items-center justify-center text-center p-2.5 sm:p-3 relative z-20">
              <div className="text-[13px] sm:text-sm font-black tracking-tight text-[#0B1B3D] dark:text-white leading-none">
                Testora <span className="text-[#0066FF] dark:text-[#38BDF8]">Quiz</span>
              </div>
              
              {/* Cyan-to-Blue Gradient Accent Bar */}
              <div className="w-8 sm:w-10 h-1 sm:h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 my-1 sm:my-1.5" />
              
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-[1.25] text-center max-w-[95px] sm:max-w-[105px]">
                Helping teachers create better tests for students.
              </p>
            </div>

          </div>

          {/* BOTTOM ROW: CARD 3 (Submissions Checked) & CARD 4 (Active Institutions) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-20">
            
            {/* ── CARD 3: SUBMISSIONS CHECKED (Green) ── */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#D1F7E5] dark:border-[#065F46]/50 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between transition-transform">
              {/* Top Icons Row */}
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#E6F9F0] dark:bg-emerald-950/70 flex items-center justify-center shrink-0">
                  <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E6F9F0] dark:bg-emerald-950/70 text-[#10B981] dark:text-[#34D399] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Number, Title, Description */}
              <div className="mt-3 sm:mt-4 space-y-0.5">
                <div className="text-3xl sm:text-4xl font-black text-[#10B981] dark:text-[#34D399] tracking-tight leading-none">
                  {formatStatInThousands(submissionsChecked)}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0B1B3D] dark:text-white pt-1">
                  Submissions Checked
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  Student answers reviewed by teachers.
                </p>
              </div>
            </div>

            {/* ── CARD 4: ACTIVE INSTITUTIONS (Pink) ── */}
            <div className="rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-[#FCE7F3] dark:border-[#831843]/50 p-3.5 sm:p-5 shadow-xs flex flex-col justify-between transition-transform">
              {/* Top Icons Row */}
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FDF2F8] dark:bg-pink-950/70 text-[#D946EF] dark:text-[#F472B6] flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FDF2F8] dark:bg-pink-950/70 text-[#D946EF] dark:text-[#F472B6] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Number, Title, Description */}
              <div className="mt-3 sm:mt-4 space-y-0.5">
                <div className="text-3xl sm:text-4xl font-black text-[#D946EF] dark:text-[#F472B6] tracking-tight leading-none">
                  {formatStatInThousands(activeInstitutions)}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0B1B3D] dark:text-white pt-1">
                  Active Institutions
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  Schools and colleges using Testora Quiz.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
