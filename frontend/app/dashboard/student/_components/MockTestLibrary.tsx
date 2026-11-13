"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  Clock,
  HelpCircle,
  CheckCircle2,
  Lock,
  Play,
  Search,
  Filter,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Tag,
  Coins,
  ChevronRight,
  X,
  FileText,
  Flame,
  Star,
  Compass,
  Layers,
  BookOpen,
  BarChart3,
  Info,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import MockTestTakingModal from "./MockTestTakingModal";

interface MockTestItem {
  id: string;
  category_id?: string;
  category: string;
  subcategory?: string;
  test_type_id?: string;
  test_type?: string;
  class_level?: string;
  subject?: string;
  exam_type?: string;
  engineering_branch?: string;
  chapter?: string;
  topic?: string;
  pyq_exam_name?: string;
  pyq_year?: number;
  pyq_shift?: string;
  pyq_source?: string;
  company_name: string;
  company_slug: string;
  title: string;
  description?: string;
  difficulty: string;
  language: string;
  visibility_target: string;
  target_class?: string;
  status: string;
  price_inr: number;
  price_paise: number;
  is_free: boolean;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  marks_per_question: number;
  negative_marking: number;
  passing_marks: number;
  pass_percentage: number;
  attempts_count: number;
  display_order: number;
  is_active: boolean;
  is_unlocked: boolean;
  has_attempted: boolean;
  last_score?: number | null;
  last_percentage?: number | null;
  last_passed?: boolean | null;
  creator_name?: string;
  share_token?: string;
  end_time?: string;
}

export default function MockTestLibrary() {
  const { token, fullName } = useAuthStore();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [assignedTests, setAssignedTests] = useState<MockTestItem[]>([]);
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryPill, setActiveCategoryPill] = useState("all");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [selectedMarksRange, setSelectedMarksRange] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");

  // Active Test Runner Modal
  const [activeTest, setActiveTest] = useState<MockTestItem | null>(null);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  // View Syllabus Modal
  const [syllabusTest, setSyllabusTest] = useState<MockTestItem | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const [res, typesRes, assignedRes] = await Promise.all([
        apiFetch("/mock-tests", { token }).catch(() => null),
        apiFetch("/mock-tests/types", { token }).catch(() => null),
        token ? apiFetch("/mock-tests/student/assigned", { token }).catch(() => null) : null,
      ]);
      if (res && res.ok) {
        const data = await res.json();
        setTests(data);
      }
      if (typesRes && typesRes.ok) {
        const tData = await typesRes.json();
        setTestTypes(tData);
      }
      if (assignedRes && assignedRes.ok) {
        const aData = await assignedRes.json();
        setAssignedTests(aData || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [token]);

  // Start Free Test Action
  const handleStartTest = async (test: MockTestItem) => {
    try {
      setStartingTestId(test.id);

      // Call start-free endpoint if not already unlocked
      if (!test.is_unlocked && (test.is_free || test.price_inr === 0)) {
        await apiFetch(`/mock-tests/${test.id}/start-free`, {
          method: "POST",
          token
        });
      }

      setActiveTest(test);
    } catch (e: any) {
      alert("Failed to start test: " + (e.message || "Network error"));
    } finally {
      setStartingTestId(null);
    }
  };

  // Extract distinct classes and subjects from actual data
  const availableClasses = useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      if (t.class_level) s.add(t.class_level);
    });
    return Array.from(s);
  }, [tests]);

  const availableSubjects = useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      if (t.subject) s.add(t.subject);
    });
    return Array.from(s);
  }, [tests]);

  // Dynamic Compact Statistics (Section 2)
  const stats = useMemo(() => {
    const available = tests.length;
    const attempted = tests.filter((t) => t.has_attempted).length;
    const completed = tests.filter((t) => t.last_passed).length;
    const scores = tests
      .filter((t) => t.has_attempted && typeof t.last_percentage === "number")
      .map((t) => t.last_percentage as number);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { available, attempted, completed, avgScore };
  }, [tests]);

  // Dynamic Category Navigation Pills (Section 2: Class 11, Class 12, JEE, Engineering, General Aptitude, Competitive)
  // Empty categories are automatically hidden
  const categoryPills = useMemo(() => {
    const list = [
      { id: "all", label: "All Tests", count: tests.length },
      {
        id: "class-11",
        label: "Class 11",
        count: tests.filter((t) => t.class_level?.includes("11") || t.title.toLowerCase().includes("class 11")).length,
      },
      {
        id: "class-12",
        label: "Class 12",
        count: tests.filter((t) => t.class_level?.includes("12") || t.title.toLowerCase().includes("class 12")).length,
      },
      {
        id: "jee",
        label: "JEE",
        count: tests.filter(
          (t) =>
            t.exam_type?.toLowerCase().includes("jee") ||
            t.title.toLowerCase().includes("jee") ||
            t.category?.toLowerCase().includes("jee") ||
            t.category?.toLowerCase().includes("entrance")
        ).length,
      },
      {
        id: "engineering",
        label: "Engineering",
        count: tests.filter(
          (t) =>
            t.category?.toLowerCase().includes("engineering") ||
            t.class_level?.toLowerCase().includes("engineering")
        ).length,
      },
      {
        id: "general-aptitude",
        label: "General Aptitude",
        count: tests.filter(
          (t) =>
            t.category?.toLowerCase().includes("aptitude") ||
            t.subject?.toLowerCase().includes("aptitude") ||
            t.title.toLowerCase().includes("aptitude")
        ).length,
      },
      {
        id: "competitive",
        label: "Other Competitive Exams",
        count: tests.filter(
          (t) =>
            t.category?.toLowerCase().includes("competitive") ||
            t.category?.toLowerCase().includes("corporate") ||
            ["tcs", "infosys", "hcl", "wipro", "accenture"].includes(t.company_slug?.toLowerCase())
        ).length,
      },
    ];
    return list.filter((c) => c.id === "all" || c.count > 0);
  }, [tests]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Category Navigation Shortcut Pills
      if (activeCategoryPill === "class-11") {
        if (!t.class_level?.includes("11") && !t.title.toLowerCase().includes("class 11")) return false;
      } else if (activeCategoryPill === "class-12") {
        if (!t.class_level?.includes("12") && !t.title.toLowerCase().includes("class 12")) return false;
      } else if (activeCategoryPill === "jee") {
        const inCat = t.category?.toLowerCase().includes("entrance") || t.category?.toLowerCase().includes("jee");
        const inExam = t.exam_type?.toLowerCase().includes("jee");
        const inTitle = t.title.toLowerCase().includes("jee");
        if (!inCat && !inExam && !inTitle) return false;
      } else if (activeCategoryPill === "engineering") {
        const inCat = t.category?.toLowerCase().includes("engineering");
        const inCls = t.class_level?.toLowerCase().includes("engineering");
        if (!inCat && !inCls) return false;
      } else if (activeCategoryPill === "general-aptitude") {
        const inCat = t.category?.toLowerCase().includes("aptitude");
        const inSubj = t.subject?.toLowerCase().includes("aptitude");
        const inTitle = t.title.toLowerCase().includes("aptitude");
        if (!inCat && !inSubj && !inTitle) return false;
      } else if (activeCategoryPill === "competitive") {
        const inCat = t.category?.toLowerCase().includes("competitive") || t.category?.toLowerCase().includes("corporate");
        const isCorp = ["tcs", "infosys", "hcl", "wipro", "accenture"].includes(t.company_slug?.toLowerCase());
        if (!inCat && !isCorp) return false;
      }

      // Dropdown Filters
      if (selectedTestType !== "all" && t.test_type !== selectedTestType && t.test_type_id !== selectedTestType) return false;
      if (selectedMarksRange !== "all") {
        const m = Number(t.total_marks) || 0;
        if (selectedMarksRange === "25" && m !== 25) return false;
        if (selectedMarksRange === "50" && m !== 50) return false;
        if (selectedMarksRange === "100" && m !== 100) return false;
        if (selectedMarksRange === "200" && m !== 200) return false;
        if (selectedMarksRange === "300" && m !== 300) return false;
        if (selectedMarksRange === "custom" && [25, 50, 100, 200, 300].includes(m)) return false;
      }
      if (selectedClass !== "all" && t.class_level !== selectedClass) return false;
      if (selectedSubject !== "all" && t.subject !== selectedSubject) return false;
      if (selectedDifficulty !== "all" && t.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;

      if (selectedDuration === "short" && t.duration_minutes > 30) return false;
      if (selectedDuration === "medium" && (t.duration_minutes <= 30 || t.duration_minutes > 60)) return false;
      if (selectedDuration === "long" && t.duration_minutes <= 60) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inSubj = (t.subject || "").toLowerCase().includes(q);
        const inCat = (t.category || "").toLowerCase().includes(q);
        const inCls = (t.class_level || "").toLowerCase().includes(q);
        const inExam = (t.exam_type || "").toLowerCase().includes(q);
        const inDesc = (t.description || "").toLowerCase().includes(q);
        if (!inTitle && !inSubj && !inCat && !inCls && !inExam && !inDesc) return false;
      }

      return true;
    });
  }, [tests, activeCategoryPill, selectedClass, selectedSubject, selectedDifficulty, selectedDuration, searchQuery]);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* ══════════════════════════════════════════════════════════════════════
          HERO BANNER: PREMIUM WHITE-THEME 300-320PX 16:5 BANNER
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-blue-900/40 bg-white dark:bg-[#071328] text-slate-900 dark:text-white shadow-xl min-h-[290px] lg:min-h-[300px] lg:max-h-[320px] flex items-center">
        {/* 16:5 Wide Landscape White-Themed Background Image with Responsive Positioning */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/mock_test_white_banner_bg.jpg"
            alt="Mock Test Examination Background"
            className="w-full h-full object-cover object-right opacity-95"
          />
          {/* Clean White / Ice-Blue Gradient Overlay on the Left for pure legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/85 md:via-white/70 to-transparent dark:from-[#071328] dark:via-[#071328]/95 dark:sm:via-[#071328]/85 dark:md:via-[#071328]/70 dark:to-transparent" />
          {/* Additional Mobile Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-[#050E1D]/95 dark:via-[#050E1D]/50 dark:to-transparent sm:hidden" />
        </div>

        <div className="relative z-10 w-full p-4 sm:p-5 lg:px-7 lg:py-4 flex flex-col justify-center">
          {/* Left Column: Sharp Pure HTML Typography & Bottom-Left CTAs */}
          <div className="space-y-2.5 max-w-xl">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-cyan-300 text-[10.5px] font-bold tracking-wide shadow-2xs backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-300 animate-pulse" />
              <span>FREE MOCK TEST LIBRARY</span>
            </div>

            {/* Main Heading & Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 sm:h-6 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-[0_0_8px_rgba(37,99,235,0.5)] shrink-0" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Practice Smarter. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-400 dark:to-blue-400">Perform Better.</span>
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl pl-3.5 font-medium">
                Explore mock tests, practice subject-wise questions, prepare with exam-oriented assessments and track your performance.
              </p>
            </div>

            {/* Feature Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10.5px]">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                <BookOpen className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                <span>Full-Length Mock Tests</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-amber-300" />
                <span>Subject-Wise Practice</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                <BarChart3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Performance Analytics</span>
              </span>
            </div>

            {/* Bottom Left Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("mock-tests-category-filters");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  else {
                    const searchEl = document.querySelector('input[placeholder*="Search mock tests"]');
                    if (searchEl) (searchEl as HTMLInputElement).focus();
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/35 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 stroke-[2.5]" />
                <span>Explore Mock Tests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const searchEl = document.querySelector('input[placeholder*="Search mock tests"]');
                  if (searchEl) {
                    (searchEl as HTMLInputElement).focus();
                    searchEl.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Subject-Wise Practice</span>
              </button>
              <button
                type="button"
                onClick={fetchTests}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Refresh Tests"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600 dark:text-cyan-400" : "text-slate-600 dark:text-slate-300"}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ ASSIGNED BY YOUR TEACHERS (ROSTERS & SHARED TESTS) ═══════ */}
      {assignedTests.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Assigned by Your Teachers ({assignedTests.length})
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              Class Rosters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assignedTests.map((at) => (
              <div
                key={at.id}
                className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200">
                      {at.subject || "General"}
                    </span>
                    {at.end_time && (
                      <span className="text-amber-300">
                        Due: {new Date(at.end_time).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white line-clamp-1">{at.title}</h3>
                  {at.creator_name && (
                    <p className="text-[11px] text-slate-300">Teacher: {at.creator_name}</p>
                  )}
                  <div className="text-[11px] text-slate-300">
                    {at.duration_minutes} Mins • {at.total_questions} Questions • {at.total_marks} Marks
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  {at.has_attempted ? (
                    <span className="text-xs font-bold text-emerald-400">
                      Score: {at.last_score}/{at.total_marks} ({at.last_percentage}%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Not Attempted</span>
                  )}
                  <Link
                    href={at.share_token ? `/mock-test/share/${at.share_token}` : "#"}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{at.has_attempted ? "Review / Retake" : "Start Test"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ 1. MODERN EDUCATIONAL SAAS HEADER ═══════ */}
      <div className="bg-white dark:bg-[#111C31] p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Mock Test Library
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70">
                100% Free Practice
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Standardized examination question papers curated centrally by Super Admin across Class 11, Class 12, JEE Main, Engineering branches, and placement aptitude. Practice under exam timers with verified answer rationales.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong>{filteredTests.length}</strong> of <strong>{tests.length}</strong> papers
            </span>
          </div>
        </div>

        {/* ═══════ COMPACT STATISTICS CARDS (SECTION 2) ═══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available Tests</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.available}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attempted Tests</span>
            <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {stats.attempted}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed / Passed</span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.completed}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Score</span>
            <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 2. DYNAMIC CATEGORY NAVIGATION (SECTION 2: HIDE EMPTY) ═══════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categoryPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveCategoryPill(pill.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategoryPill === pill.id
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-white dark:bg-[#111C31] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-400"
            }`}
          >
            <span>{pill.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeCategoryPill === pill.id
                  ? "bg-blue-400/30 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════ SEARCH & ADVANCED FILTER TOOLBAR ═══════ */}
      <div className="p-3.5 bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Field */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by test name, subject, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Test Type Filter */}
          <select
            value={selectedTestType}
            onChange={(e) => setSelectedTestType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Test Types</option>
            {testTypes.map((tt) => (
              <option key={tt.slug || tt.id} value={tt.name}>
                {tt.name}
              </option>
            ))}
          </select>

          {/* Marks Filter */}
          <select
            value={selectedMarksRange}
            onChange={(e) => setSelectedMarksRange(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Marks Schemes</option>
            <option value="25">25 Marks</option>
            <option value="50">50 Marks</option>
            <option value="100">100 Marks</option>
            <option value="200">200 Marks</option>
            <option value="300">300 Marks (JEE Main)</option>
            <option value="custom">Custom Marks</option>
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* ═══════ MOCK TESTS CARDS GRID ═══════ */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading published mock test library...
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto opacity-40 text-blue-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Mock Tests Match Your Filter</h3>
          <p className="text-xs max-w-sm mx-auto">
            Try adjusting your search terms or selecting "All Mock Tests" from the top navigation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => {
            const isCompleted = test.has_attempted;
            const isPassed = test.last_passed;

            return (
              <div
                key={test.id}
                className="group p-5 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {test.category}
                      </span>

                      {test.test_type && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                          {test.test_type}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        test.difficulty === "Easy"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : test.difficulty === "Medium"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      {test.difficulty}
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                      {test.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium flex-wrap">
                      <span>{test.subject || "General"}</span>
                      {test.class_level && (
                        <>
                          <span>•</span>
                          <span>{test.class_level}</span>
                        </>
                      )}
                      {test.chapter && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">Ch: {test.chapter}</span>
                        </>
                      )}
                    </div>

                    {/* PYQ Badge if applicable */}
                    {(test.pyq_exam_name || test.pyq_year) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Verified PYQ: {test.pyq_exam_name || 'Official'} {test.pyq_year || ''} {test.pyq_shift ? `(${test.pyq_shift})` : ''}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description / Syllabus */}
                  {test.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  )}

                  {/* Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#15233D] text-[11px] border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Questions</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {test.total_questions} Qs
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Marks</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {test.total_marks} Marks
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Duration</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {test.duration_minutes}m
                      </div>
                    </div>
                  </div>

                  {/* Marking Scheme Indicator */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span>
                      Scheme: <b>+{test.marks_per_question}</b> per correct
                    </span>
                    <span>
                      {test.negative_marking > 0 ? (
                        <b className="text-rose-600">-{test.negative_marking} Negative</b>
                      ) : (
                        <b className="text-emerald-600">No Negative Marking</b>
                      )}
                    </span>
                  </div>

                  {/* Last Attempt Score Display */}
                  {isCompleted && test.last_score !== null && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Your Last Score
                        </span>
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {test.last_score} / {test.total_marks} ({test.last_percentage}%)
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isPassed
                            ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {isPassed ? "PASSED" : "NEEDS PRACTICE"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSyllabusTest(test)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="View Test Details & Instructions"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyllabusTest(test)}
                    disabled={startingTestId === test.id}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCompleted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Free Mock</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Free Mock Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ PRE-TEST DETAILS & INSTRUCTIONS DIALOG (SECTION 3) ═══════ */}
      {syllabusTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {syllabusTest.category}
                  </span>
                  {syllabusTest.test_type && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                      {syllabusTest.test_type}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {syllabusTest.difficulty} Difficulty
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {syllabusTest.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {syllabusTest.subject || "General"} {syllabusTest.class_level ? `• ${syllabusTest.class_level}` : ""}
                  {syllabusTest.chapter ? ` • Chapter: ${syllabusTest.chapter}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSyllabusTest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {syllabusTest.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#15233D] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                {syllabusTest.description}
              </p>
            )}

            {/* Test Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                  {syllabusTest.total_questions} Questions
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                  {syllabusTest.total_marks} Marks
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                  {syllabusTest.duration_minutes} Minutes
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Negative Marking</span>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                  {syllabusTest.negative_marking > 0 ? `-${syllabusTest.negative_marking}m / incorrect` : "No Negative"}
                </div>
              </div>
            </div>

            {/* Standard Candidate Instructions (Section 3) */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-2 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Standard Examination Instructions</span>
              </span>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px] list-disc list-inside leading-relaxed">
                <li>All questions are objective or numerical. Each correct response awards <strong>+{syllabusTest.marks_per_question}</strong> marks.</li>
                <li>{syllabusTest.negative_marking > 0 ? `Incorrect responses deduct ${syllabusTest.negative_marking} marks. Unattempted questions carry zero penalty.` : "There is no negative marking for incorrect responses."}</li>
                <li>You can flag difficult questions using <strong>Mark for Review</strong> to revisit them anytime before submitting.</li>
                <li>The countdown timer runs continuously. The paper will automatically submit when the duration concludes.</li>
                <li>Full step-by-step solutions, explanations, and verified source citations will unlock immediately upon completion.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSyllabusTest(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = syllabusTest;
                  setSyllabusTest(null);
                  handleStartTest(t);
                }}
                disabled={startingTestId === syllabusTest.id}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Test Now ({syllabusTest.duration_minutes}m)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MOCK TEST TAKING MODAL RUNNER ═══════ */}
      {activeTest && (
        <MockTestTakingModal
          testId={activeTest.id}
          testTitle={activeTest.title}
          companyName={activeTest.company_name || "Testora National"}
          durationMinutes={activeTest.duration_minutes || 60}
          isOpen={true}
          onClose={() => {
            setActiveTest(null);
            fetchTests();
          }}
          onCompleted={() => {
            fetchTests();
          }}
        />
      )}
    </div>
  );
}

