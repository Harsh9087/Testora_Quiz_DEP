'use client';

import React from 'react';
import { Zap, FileText, Sparkles, Users, BarChart3 } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Create Blueprint',
    description: 'Set exam details, timing and marks.',
    icon: FileText,
    color: '#2563EB',
    borderClass: 'border-blue-200/80 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/80 text-[#2563EB] dark:text-[#38BDF8] border-blue-100 dark:border-blue-900/80',
    iconShadow: 'shadow-[0_4px_16px_rgba(37,99,235,0.30)]',
    cardShadow: 'shadow-[0_8px_30px_rgba(37,99,235,0.06)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.12)]',
    barBg: 'bg-[#2563EB]',
  },
  {
    step: '02',
    title: 'Synthesize Questions',
    description: 'Generate with AI or use your question bank.',
    icon: Sparkles,
    color: '#9333EA',
    borderClass: 'border-purple-200/80 dark:border-purple-900/60 hover:border-purple-300 dark:hover:border-purple-700',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/80 text-[#9333EA] dark:text-[#C084FC] border-purple-100 dark:border-purple-900/80',
    iconShadow: 'shadow-[0_4px_16px_rgba(147,51,234,0.30)]',
    cardShadow: 'shadow-[0_8px_30px_rgba(147,51,234,0.06)] hover:shadow-[0_12px_36px_rgba(147,51,234,0.12)]',
    barBg: 'bg-[#9333EA]',
  },
  {
    step: '03',
    title: 'Share Passcode',
    description: 'Invite students with a secure exam code.',
    icon: Users,
    color: '#10B981',
    borderClass: 'border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-[#10B981] dark:text-[#34D399] border-emerald-100 dark:border-emerald-900/80',
    iconShadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.30)]',
    cardShadow: 'shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:shadow-[0_12px_36px_rgba(16,185,129,0.12)]',
    barBg: 'bg-[#10B981]',
  },
  {
    step: '04',
    title: 'Automated Grading',
    description: 'Review results and class scorecards.',
    icon: BarChart3,
    color: '#F59E0B',
    borderClass: 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-[#F59E0B] dark:text-[#FBBF24] border-amber-100 dark:border-amber-900/80',
    iconShadow: 'shadow-[0_4px_16px_rgba(245,158,11,0.30)]',
    cardShadow: 'shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.12)]',
    barBg: 'bg-[#F59E0B]',
  },
];

export default function WorkflowStepsSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden bg-[#F4F8FF] dark:bg-[#070D1B] border-y border-slate-200/70 dark:border-slate-800/70 scroll-mt-20"
    >
      {/* Subtle Dot Grid Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-45 dark:opacity-20 pointer-events-none" />

      {/* Ambient Lighting & Glass Floating Spheres */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-blue-300/25 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute top-1/3 left-8 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400/40 to-indigo-300/30 border border-white/60 shadow-sm pointer-events-none" />
      <div className="hidden sm:block absolute top-2/3 left-24 w-4 h-4 rounded-full bg-blue-400/30 pointer-events-none" />

      <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-300/20 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute top-1/3 right-10 w-9 h-9 rounded-full bg-gradient-to-tr from-purple-400/30 to-blue-300/30 border border-white/60 shadow-sm pointer-events-none" />
      <div className="hidden sm:block absolute top-1/2 right-28 w-3 h-3 rounded-full bg-purple-400/30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold tracking-wider shadow-xs">
            <Zap className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 fill-[#2563EB] dark:fill-blue-400" />
            <span>STREAMLINED WORKFLOW</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight">
            <span className="text-[#0B1B3D] dark:text-white">Create and Deliver Tests in </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#9333EA] dark:from-[#38BDF8] dark:via-[#818CF8] dark:to-[#C084FC]">
              4 Simple Steps
            </span>
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-xl mx-auto font-normal leading-relaxed">
            From blueprint setup to student scorecards in minutes.
          </p>
        </div>

        {/* Workflow Cards Container */}
        <div className="relative pt-8 sm:pt-10">

          {/* Desktop Horizontal Connecting Spline Wave (lg+ screens) */}
          <div className="hidden lg:block absolute top-8 sm:top-10 left-0 right-0 h-32 -translate-y-1/2 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="workflowCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                  <stop offset="12.5%" stopColor="#2563EB" stopOpacity="0.9" />
                  <stop offset="37.5%" stopColor="#9333EA" stopOpacity="0.9" />
                  <stop offset="62.5%" stopColor="#10B981" stopOpacity="0.9" />
                  <stop offset="87.5%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path
                d="M 0 75 C 45 75, 80 60, 125 60 C 185 24, 315 24, 375 60 C 435 24, 565 24, 625 60 C 685 24, 815 24, 875 60 C 920 60, 955 75, 1000 75"
                stroke="url(#workflowCurveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Mobile Vertical S-Curve Connector Line (< sm screens) */}
          <div className="sm:hidden absolute top-6 bottom-6 left-0 right-0 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 200 1000" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="workflowMobileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="2%" stopColor="#2563EB" stopOpacity="0.9" />
                  <stop offset="33%" stopColor="#9333EA" stopOpacity="0.9" />
                  <stop offset="66%" stopColor="#10B981" stopOpacity="0.9" />
                  <stop offset="98%" stopColor="#F59E0B" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                d="M 70 0 C 80 15, 90 25, 100 35 C 170 120, 170 250, 100 345 C 30 435, 30 565, 100 655 C 170 745, 170 875, 100 965 C 90 978, 80 988, 70 1000"
                stroke="url(#workflowMobileGrad)"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Cards Grid: Vertical on Mobile, 2-Col on Tablet, 4-Col on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-6 relative z-10">
            {steps.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.step}
                  className={`relative rounded-[26px] bg-white dark:bg-slate-900 border ${item.borderClass} ${item.cardShadow} p-5 sm:p-6 pt-9 sm:pt-11 transition-all duration-300 hover:-translate-y-1 group`}
                >
                  {/* Circular Step Icon: Centered Overlapping Top Edge */}
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 z-20">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-white dark:bg-slate-900 ${item.iconShadow} border-4 border-white dark:border-slate-800 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Inside-Card Row: Left Pill + Right Text */}
                  <div className="sm:hidden flex items-center gap-3.5">
                    <div
                      className={`w-11 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${item.badgeBg}`}
                    >
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#0B1B3D] dark:text-white truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Tablet & Desktop Inside-Card Content: Centered Stack */}
                  <div className="hidden sm:flex flex-col items-center text-center space-y-2">
                    <div
                      className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${item.badgeBg}`}
                    >
                      {item.step}
                    </div>
                    <h3 className="text-base lg:text-[18px] font-bold text-[#0B1B3D] dark:text-white pt-1 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[210px]">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Colored Accent Line */}
                  <div
                    className="w-14 h-1.5 rounded-full mx-auto mt-4 sm:mt-6"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

