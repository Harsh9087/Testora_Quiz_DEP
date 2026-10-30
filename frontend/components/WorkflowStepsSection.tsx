'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  FilePieChart,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export interface WorkflowStep {
  step: string;
  title: string;
  mobileTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  lightTint: string;
  darkTint: string;
  position: 'above' | 'below';
  badgePosition: 'bottom' | 'top';
  x: number; // Coordinate in 1400px SVG space
}

const stepsData: WorkflowStep[] = [
  {
    step: '01',
    title: 'Teacher Studio',
    mobileTitle: 'Teacher Studio',
    description: 'Create and manage questions, tests and study materials easily',
    icon: BookOpen,
    color: '#2478FF',
    lightTint: 'rgba(36, 120, 255, 0.08)',
    darkTint: 'rgba(36, 120, 255, 0.16)',
    position: 'above',
    badgePosition: 'bottom',
    x: 220,
  },
  {
    step: '02',
    title: 'Student Experience',
    mobileTitle: 'Student Experience',
    description: 'Simple and smooth learning experience for students',
    icon: GraduationCap,
    color: '#FFB400',
    lightTint: 'rgba(255, 180, 0, 0.08)',
    darkTint: 'rgba(255, 180, 0, 0.16)',
    position: 'below',
    badgePosition: 'top',
    x: 460,
  },
  {
    step: '03',
    title: 'Exam Monitoring',
    mobileTitle: 'Exam Monitoring',
    description: 'Conduct secure and reliable online exams',
    icon: ShieldCheck,
    color: '#FF4057',
    lightTint: 'rgba(255, 64, 87, 0.08)',
    darkTint: 'rgba(255, 64, 87, 0.16)',
    position: 'above',
    badgePosition: 'bottom',
    x: 700,
  },
  {
    step: '04',
    title: 'Evaluation & Gradebook',
    mobileTitle: 'Evaluation & Gradebook',
    description: 'Auto evaluation and detailed performance reports',
    icon: BarChart3,
    color: '#10B981',
    lightTint: 'rgba(16, 185, 129, 0.08)',
    darkTint: 'rgba(16, 185, 129, 0.16)',
    position: 'below',
    badgePosition: 'top',
    x: 940,
  },
  {
    step: '05',
    title: 'Insights & Reports',
    mobileTitle: 'Insights & Reports',
    description: 'Track progress and get valuable insights',
    icon: FilePieChart,
    color: '#9333EA',
    lightTint: 'rgba(147, 51, 234, 0.08)',
    darkTint: 'rgba(147, 51, 234, 0.16)',
    position: 'above',
    badgePosition: 'bottom',
    x: 1180,
  },
];

interface WorkflowStepsSectionProps {
  onSelectCapabilityTab?: (tab: 'studio' | 'student' | 'proctor' | 'gradebook') => void;
  onOpenExamCodeModal?: () => void;
}

export default function WorkflowStepsSection({
  onSelectCapabilityTab,
  onOpenExamCodeModal,
}: WorkflowStepsSectionProps) {
  const router = useRouter();
  const { token, role } = useAuthStore();

  // Direct Page Navigation / Section Scroll on Click (No Popup Modal)
  const handleStepClick = (step: WorkflowStep) => {
    if (step.step === '01') {
      // Step 01: Teacher Studio -> Directly opens Teacher Dashboard or Teacher Login
      if (token && role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/login?role=teacher');
      }
      return;
    }

    if (step.step === '02') {
      // Step 02: Student Experience -> Directly opens Exam Code Modal or Student Portal
      if (onOpenExamCodeModal) {
        onOpenExamCodeModal();
      } else {
        const modalBtn = document.querySelector('[data-exam-code-trigger]') as HTMLElement;
        if (modalBtn) modalBtn.click();
      }
      return;
    }

    if (step.step === '03') {
      // Step 03: Exam Monitoring -> Directly scrolls to Exam Monitoring in Capabilities
      if (onSelectCapabilityTab) {
        onSelectCapabilityTab('proctor');
      }
      const el = document.getElementById('capabilities');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (step.step === '04') {
      // Step 04: Evaluation & Gradebook -> Directly scrolls to Gradebook in Capabilities
      if (onSelectCapabilityTab) {
        onSelectCapabilityTab('gradebook');
      }
      const el = document.getElementById('capabilities');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (step.step === '05') {
      // Step 05: Insights & Reports -> Directly scrolls to Live Platform Activity / Telemetry
      const el = document.getElementById('activity');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  };

  return (
    <section
      id="how-it-works"
      className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-[#F8FAFF] via-[#F1F6FF] to-[#F8FAFF] dark:from-[#080E1E] dark:via-[#0D182E] dark:to-[#080E1E] border-y border-slate-200/80 dark:border-slate-800/80 scroll-mt-20 select-none"
    >
      {/* ───────────────────────────────────────────────────────────
          1. SUBTLE LIGHT-BLUE DOTTED BACKGROUND PATTERN
      ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.3px,transparent_1.3px)] dark:bg-[radial-gradient(#1E3A8A_1.3px,transparent_1.3px)] [background-size:26px_26px] opacity-40 dark:opacity-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient Radial Glows */}
      <div
        className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* ───────────────────────────────────────────────────────────
            2. SECTION HEADER
        ─────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-800 text-[#2478FF] dark:text-blue-400 text-[11px] sm:text-xs font-bold tracking-wider shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-[#2478FF] dark:text-blue-400 fill-[#2478FF] dark:fill-blue-400" />
            <span>STREAMLINED WORKFLOW</span>
          </div>

          <h2 className="text-xl xs:text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight text-[#0B1B3D] dark:text-white">
            Create and Deliver Tests in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2478FF] via-[#FF4057] to-[#9333EA]">
              5 Simple Steps
            </span>
          </h2>

          <p className="text-[11px] sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-md sm:max-w-xl mx-auto font-normal leading-relaxed">
            From classroom setup to automated grading and analytics in a unified, connected process.
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────
            3. FULL 5-STEP CONNECTED TIMELINE (ALL 5 STEPS VISIBLE ON MOBILE & DESKTOP)
            - Responsive SVG wave and matching circular milestone buttons
            - Seamlessly scales across mobile (100% visible, no horizontal scroll) and desktop
            - Direct one-click page navigation (no popups)
        ─────────────────────────────────────────────────────────── */}
        <div className="relative w-full aspect-[1400/680] xs:aspect-[1400/620] sm:aspect-[1400/580] lg:aspect-[1400/560] max-h-[580px] my-2 sm:my-6">
          {/* SVG Semicircular Connector Wave and Stems */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1400 560"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            {/* 1. Terminal start dot (Blue) at (100, 280) */}
            <circle cx="100" cy="280" r="5" fill="#2478FF" />

            {/* 2. Step 01 Arc (Blue) - Curves under Circle 01 (100 -> 340) */}
            <path
              d="M 100 280 A 120 120 0 0 0 340 280"
              stroke="#2478FF"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* 3. Step 02 Arc (Amber) - Curves over Circle 02 (340 -> 580) */}
            <path
              d="M 340 280 A 120 120 0 0 1 580 280"
              stroke="#FFB400"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* 4. Step 03 Arc (Coral Red) - Curves under Circle 03 (580 -> 820) */}
            <path
              d="M 580 280 A 120 120 0 0 0 820 280"
              stroke="#FF4057"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* 5. Step 04 Arc (Emerald Green) - Curves over Circle 04 (820 -> 1060) */}
            <path
              d="M 820 280 A 120 120 0 0 1 1060 280"
              stroke="#10B981"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* 6. Step 05 Arc (Purple) - Curves under Circle 05 (1060 -> 1300) */}
            <path
              d="M 1060 280 A 120 120 0 0 0 1300 280"
              stroke="#9333EA"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* 7. Terminal end dot (Purple) at (1300, 280) */}
            <circle cx="1300" cy="280" r="5" fill="#9333EA" />

            {/* Meeting joint indicators at inflection points */}
            <circle cx="340" cy="280" r="4.5" fill="#FFB400" />
            <circle cx="580" cy="280" r="4.5" fill="#FF4057" />
            <circle cx="820" cy="280" r="4.5" fill="#10B981" />
            <circle cx="1060" cy="280" r="4.5" fill="#9333EA" />

            {/* Vertical connector stems with small colored dots */}
            {/* Step 01 Stem (Above circle): Dot at 130, line down to circle at 188 */}
            <line
              x1="220"
              y1="130"
              x2="220"
              y2="188"
              stroke="#2478FF"
              strokeWidth="1.8"
            />
            <circle cx="220" cy="130" r="3.5" fill="#2478FF" />

            {/* Step 02 Stem (Below circle): Line from circle at 372 down to dot at 430 */}
            <line
              x1="460"
              y1="372"
              x2="460"
              y2="430"
              stroke="#FFB400"
              strokeWidth="1.8"
            />
            <circle cx="460" cy="430" r="3.5" fill="#FFB400" />

            {/* Step 03 Stem (Above circle): Dot at 130, line down to circle at 188 */}
            <line
              x1="700"
              y1="130"
              x2="700"
              y2="188"
              stroke="#FF4057"
              strokeWidth="1.8"
            />
            <circle cx="700" cy="130" r="3.5" fill="#FF4057" />

            {/* Step 04 Stem (Below circle): Line from circle at 372 down to dot at 430 */}
            <line
              x1="940"
              y1="372"
              x2="940"
              y2="430"
              stroke="#10B981"
              strokeWidth="1.8"
            />
            <circle cx="940" cy="430" r="3.5" fill="#10B981" />

            {/* Step 05 Stem (Above circle): Dot at 130, line down to circle at 188 */}
            <line
              x1="1180"
              y1="130"
              x2="1180"
              y2="188"
              stroke="#9333EA"
              strokeWidth="1.8"
            />
            <circle cx="1180" cy="130" r="3.5" fill="#9333EA" />
          </svg>

          {/* 5 Milestone HTML Nodes Layered Above the SVG Arcs */}
          {stepsData.map((item) => {
            const IconComponent = item.icon;
            const xPercent = (item.x / 1400) * 100;

            return (
              <div
                key={item.step}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10 group"
                style={{ left: `${xPercent}%` }}
              >
                {/* ──── Text Block (Positioned Above if step is 01, 03, 05) ──── */}
                {item.position === 'above' && (
                  <button
                    type="button"
                    onClick={() => handleStepClick(item)}
                    aria-label={`Open ${item.title}`}
                    className="absolute bottom-[calc(100%+6px)] xs:bottom-[calc(100%+10px)] sm:bottom-[calc(100%+18px)] lg:bottom-[calc(100%+32px)] left-1/2 -translate-x-1/2 w-[68px] xs:w-[80px] sm:w-[130px] md:w-[170px] lg:w-[210px] xl:w-[240px] text-center cursor-pointer pointer-events-auto transition-transform duration-200 group-hover:scale-105 focus:outline-none"
                  >
                    <h3
                      className="font-bold text-[9px] xs:text-[10.5px] sm:text-xs md:text-sm lg:text-[15px] xl:text-[18px] tracking-tight leading-tight"
                      style={{ color: item.color }}
                    >
                      <span className="sm:hidden">{item.mobileTitle}</span>
                      <span className="hidden sm:inline">{item.title}</span>
                    </h3>
                    <p className="hidden sm:block text-[10px] md:text-xs xl:text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-snug font-normal line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                )}

                {/* ──── Main Circular Container: FULLY CLICKABLE BUTTON (DIRECT PAGE NAVIGATION) ──── */}
                <button
                  type="button"
                  onClick={() => handleStepClick(item)}
                  aria-label={`Go to ${item.title}`}
                  className="relative w-[48px] h-[48px] xs:w-[56px] xs:h-[56px] sm:w-[94px] sm:h-[94px] md:w-[128px] md:h-[128px] lg:w-[164px] lg:h-[164px] xl:w-[184px] xl:h-[184px] rounded-full bg-white dark:bg-[#111D35] border border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:shadow-[0_12px_36px_rgba(36,120,255,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300 group-hover:scale-108 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/30"
                  style={{
                    boxShadow: `0 8px 24px ${item.darkTint}`,
                  }}
                >
                  {/* Inner Tinted Circle */}
                  <div
                    className="w-[32px] h-[32px] xs:w-[38px] xs:h-[38px] sm:w-[62px] sm:h-[62px] md:w-[84px] md:h-[84px] lg:w-[108px] lg:h-[108px] xl:w-[122px] xl:h-[122px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: item.lightTint }}
                  >
                    {/* Outlined Lucide Icon */}
                    <IconComponent
                      className="w-3.5 h-3.5 xs:w-4.5 xs:h-4.5 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13 stroke-[2] transition-transform duration-300 group-hover:rotate-3"
                      style={{ color: item.color }}
                    />
                  </div>

                  {/* Circular Number Badge */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-6.5 sm:h-6.5 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center font-extrabold text-[7.5px] xs:text-[8.5px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm text-white shadow-md border-[1.5px] xs:border-2 sm:border-[2.5px] lg:border-[3.5px] border-white dark:border-[#080E1E] z-20 transition-transform duration-300 group-hover:scale-110 ${
                      item.badgePosition === 'bottom'
                        ? '-bottom-1.5 xs:-bottom-2 sm:-bottom-2.5 lg:-bottom-3.5'
                        : '-top-1.5 xs:-top-2 sm:-top-2.5 lg:-top-3.5'
                    }`}
                    style={{ backgroundColor: item.color }}
                  >
                    <span>{item.step}</span>
                  </div>

                  {/* Subtle hover ring */}
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 pointer-events-none"
                    style={{ borderColor: item.color }}
                  />
                </button>

                {/* ──── Text Block (Positioned Below if step is 02, 04) ──── */}
                {item.position === 'below' && (
                  <button
                    type="button"
                    onClick={() => handleStepClick(item)}
                    aria-label={`Open ${item.title}`}
                    className="absolute top-[calc(100%+6px)] xs:top-[calc(100%+10px)] sm:top-[calc(100%+18px)] lg:top-[calc(100%+32px)] left-1/2 -translate-x-1/2 w-[68px] xs:w-[80px] sm:w-[130px] md:w-[170px] lg:w-[210px] xl:w-[240px] text-center cursor-pointer pointer-events-auto transition-transform duration-200 group-hover:scale-105 focus:outline-none"
                  >
                    <h3
                      className="font-bold text-[9px] xs:text-[10.5px] sm:text-xs md:text-sm lg:text-[15px] xl:text-[18px] tracking-tight leading-tight"
                      style={{ color: item.color }}
                    >
                      <span className="sm:hidden">{item.mobileTitle}</span>
                      <span className="hidden sm:inline">{item.title}</span>
                    </h3>
                    <p className="hidden sm:block text-[10px] md:text-xs xl:text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-snug font-normal line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
