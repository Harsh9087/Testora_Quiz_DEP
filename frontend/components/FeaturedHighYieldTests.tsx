"use client";

import { useState, useRef, useEffect } from "react";
import {
  Trophy, Clock, HelpCircle, ChevronLeft, ChevronRight,
  Zap, Play, BarChart2, BookOpen, Star, Lock, CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedExam {
  exam_id: string;
  exam_code: string;
  name: string;
  subject: string;
  description?: string;
  duration_minutes: number;
  questions_count: number;
  total_marks: number;
  status: "active" | "scheduled" | "ended";
  difficulty?: "easy" | "medium" | "hard";
  access_type?: "free" | "enrolled" | "premium";
  has_submitted?: boolean;
  submission_percentage?: number;
  is_paid?: boolean;
}

interface FeaturedHighYieldTestsProps {
  exams: FeaturedExam[];
  onStartTest: (examCode: string) => void;
  isTeacher?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  easy:   { label: "Easy",   color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50",  darkBg: "dark:bg-emerald-950/40" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-300",    bg: "bg-amber-50",    darkBg: "dark:bg-amber-950/40"   },
  hard:   { label: "Hard",   color: "text-red-700 dark:text-red-300",        bg: "bg-red-50",      darkBg: "dark:bg-red-950/40"     },
};

const ACCESS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  free:     { label: "Free Access",     color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle className="h-3 w-3" /> },
  enrolled: { label: "Enrolled",        color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",             icon: <BookOpen className="h-3 w-3" /> },
  premium:  { label: "Premium",         color: "text-purple-700 dark:text-purple-300",   bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",     icon: <Lock className="h-3 w-3" /> },
};

/** Derives a short hex colour from the exam code string for the tag badge */
function codeToAccentColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

// ─── Single Test Card ─────────────────────────────────────────────────────────

function TestCard({
  exam,
  onStartTest,
  isTeacher,
}: {
  exam: FeaturedExam;
  onStartTest: (code: string) => void;
  isTeacher?: boolean;
}) {
  const router = useRouter();
  const accentColor = codeToAccentColor(exam.exam_code);
  const diff = DIFFICULTY_CONFIG[exam.difficulty ?? "medium"] ?? DIFFICULTY_CONFIG.medium;
  const access = ACCESS_CONFIG[exam.access_type ?? "enrolled"];
  const isLive    = exam.status === "active";
  const isEnded   = exam.status === "ended";
  const isDone    = exam.has_submitted;

  return (
    <div className="relative flex flex-col bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#2563EB]/40 dark:hover:border-[#2563EB]/40 transition-all duration-200 select-none h-full">

      {/* ── Coloured top accent bar ── */}
      <div className="h-1.5 w-full" style={{ background: accentColor }} />

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Row 1: code tag + access badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border"
            style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
          >
            #{exam.exam_code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6)}
          </span>

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${access.bg} ${access.color}`}>
            {access.icon}
            {access.label}
          </span>
        </div>

        {/* Row 2: title + subtitle */}
        <div>
          <h3 className="text-sm font-extrabold text-[#111827] dark:text-[#F1F5F9] leading-snug line-clamp-2">
            {exam.name}
          </h3>
          {exam.description && (
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
              {exam.description}
            </p>
          )}
        </div>

        {/* Row 3: subject tag */}
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] border border-[#2563EB]/20">
            <BookOpen className="h-2.5 w-2.5" />
            {exam.subject}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E2E8F0]/70 dark:border-[#263449]" />

        {/* Row 4: Stats row — Time · Questions · Level */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5 text-[#64748B] dark:text-[#94A3B8]">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Time</span>
            </div>
            <span className="font-bold text-[11px] text-[#111827] dark:text-[#F1F5F9]">
              {exam.duration_minutes}m
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5 text-[#64748B] dark:text-[#94A3B8]">
              <HelpCircle className="h-3 w-3" />
              <span className="font-medium">Questions</span>
            </div>
            <span className="font-bold text-[11px] text-[#111827] dark:text-[#F1F5F9]">
              {exam.questions_count} Qs
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5 text-[#64748B] dark:text-[#94A3B8]">
              <BarChart2 className="h-3 w-3" />
              <span className="font-medium">Level</span>
            </div>
            <span className={`font-bold text-[11px] capitalize ${diff.color}`}>
              {diff.label}
            </span>
          </div>
        </div>

        {/* Completed score ribbon */}
        {isDone && exam.submission_percentage != null && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              Your Score
            </span>
            <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
              {Math.round(exam.submission_percentage)}%
            </span>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="flex gap-2 mt-auto pt-1">
          {isDone ? (
            <button
              onClick={() => onStartTest(exam.exam_code)}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
              View Report
            </button>
          ) : isEnded ? (
            <div className="flex-1 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#17243A] text-center text-[11px] font-medium text-[#94A3B8]">
              Assessment Closed
            </div>
          ) : isLive ? (
            <>
              {/* START TEST */}
              <button
                onClick={() => onStartTest(exam.exam_code)}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Start Test
              </button>

              {/* LEADERBOARD */}
              <button
                onClick={() => router.push(`/exam/${exam.exam_code}?tab=leaderboard`)}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] text-[11px] font-semibold text-[#64748B] dark:text-[#A3B1C6] transition-all cursor-pointer shrink-0"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Leaderboard</span>
              </button>
            </>
          ) : (
            <div className="flex-1 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Upcoming
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Carousel Component ──────────────────────────────────────────────────

export default function FeaturedHighYieldTests({
  exams,
  onStartTest,
  isTeacher = false,
}: FeaturedHighYieldTestsProps) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Responsive cards per slide: 1 on mobile, 2 on sm, 3 on lg
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640)       setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else                               setVisibleCount(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, exams.length - visibleCount);
  const canPrev  = index > 0;
  const canNext  = index < maxIndex;

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(maxIndex, i + 1));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [maxIndex]); // eslint-disable-line

  if (!exams || exams.length === 0) return null;

  const cardWidthPct = 100 / visibleCount;

  return (
    <section className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl shadow-xs overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-[#263449]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#111827] dark:text-[#F1F5F9] tracking-tight">
              Featured High-Yield Tests
            </h2>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              {exams.length} assessment{exams.length !== 1 ? "s" : ""} available for you
            </p>
          </div>
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prev}
            disabled={!canPrev}
            aria-label="Previous tests"
            className="p-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] text-[#64748B] dark:text-[#94A3B8] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-semibold text-[#94A3B8] tabular-nums min-w-[3rem] text-center">
            {index + 1} / {maxIndex + 1}
          </span>
          <button
            onClick={next}
            disabled={!canNext}
            aria-label="Next tests"
            className="p-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] text-[#64748B] dark:text-[#94A3B8] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Slider track ── */}
      <div className="overflow-hidden px-4 py-4">
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{ transform: `translateX(calc(-${index * (cardWidthPct + (16 / (visibleCount * 2)))}%))` }}
        >
          {exams.map((exam) => (
            <div
              key={exam.exam_id}
              className="shrink-0"
              style={{ width: `calc(${cardWidthPct}% - ${(visibleCount - 1) * 16 / visibleCount}px)` }}
            >
              <TestCard
                exam={exam}
                onStartTest={onStartTest}
                isTeacher={isTeacher}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Dot indicators ── */}
      {maxIndex > 0 && (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all cursor-pointer ${
                i === index
                  ? "w-5 h-2 bg-[#2563EB]"
                  : "w-2 h-2 bg-[#E2E8F0] dark:bg-[#263449] hover:bg-[#93C5FD]"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
