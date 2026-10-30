"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch, API_V1 } from "../../../lib/api";
import { parseUtcDate, formatLocalizedTime, formatLocalizedDate } from "../../../lib/dateUtils";
import { useAuthStore } from "../../../store/authStore";
import { 
  Award, Calendar, FileText, CheckCircle, TrendingUp, BookOpen, Download,
  Trophy, Target, BarChart3, XCircle, ChevronDown, ChevronUp, Medal,
  RefreshCw, CheckCircle2, AlertCircle, Clock, Sparkles, User, ArrowRight, ArrowLeft,
  BookMarked, HelpCircle, ShieldCheck, GraduationCap, Play, Key, Lock, Check,
  Timer, ChevronRight, ExternalLink, FileCode2
} from "lucide-react";
import MathText from "../../../components/MathText";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const { token, fullName, role } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  // Data States
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [directCodeInput, setDirectCodeInput] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedSubDetail, setSelectedSubDetail] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // UI States
  const [activePortalTab, setActivePortalTab] = useState<"assigned" | "submissions" | "progress">("assigned");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<"questions" | "topics" | "leaderboard">("questions");
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("");
  const [progressData, setProgressData] = useState<any | null>(null);
  const [mobileViewingDetail, setMobileViewingDetail] = useState(false);

  const fetchProgressData = async () => {
    try {
      const res = await apiFetch("/reports/my-progress", { token });
      if (res.ok) {
        setProgressData(await res.json());
      }
    } catch {}
  };

  const isTeacher = role === "teacher" || role === "inst_admin" || role === "super_admin";

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      // 1. If teacher previewing, fetch student directory
      if (isTeacher) {
        try {
          const sRes = await apiFetch("/students/", { token });
          const sData = await sRes.json();
          if (sRes.ok && Array.isArray(sData)) {
            setStudentsList(sData);
          }
        } catch {}
      }

      // 2. Fetch Assigned / Active Exams
      try {
        const aRes = await apiFetch("/students/assigned-exams", { token });
        const aData = await aRes.json();
        if (aRes.ok && Array.isArray(aData)) {
          setAssignedExams(aData);
        }
      } catch {}

      // 3. Fetch Submissions
      const url = selectedStudentFilter ? `/reports/my-submissions?student_id=${selectedStudentFilter}` : "/reports/my-submissions";
      const res = await apiFetch(url, { token });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSubmissions(data);
        if (data.length > 0) {
          const firstId = selectedSubId || data[0].id;
          setSelectedSubId(firstId);
          loadSubDetail(firstId);
        } else {
          setSelectedSubId(null);
          setSelectedSubDetail(null);
        }
      }

      // 4. Fetch Student Progress Analytics
      fetchProgressData();
    } catch {
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token || storedToken) {
      fetchData();
    }
  }, [token, selectedStudentFilter]);

  const loadSubDetail = async (subId: string) => {
    setSelectedSubId(subId);
    setMobileViewingDetail(true);
    setLoadingDetail(true);
    try {
      const res = await apiFetch(`/reports/submission-detail/${subId}`, { token });
      const data = await res.json();
      if (res.ok) {
        setSelectedSubDetail(data);
        if (data.exam_id) {
          const lbRes = await apiFetch(`/reports/leaderboard/${data.exam_id}`, { token });
          const lbData = await lbRes.json();
          if (lbRes.ok && Array.isArray(lbData)) {
            setLeaderboard(lbData);
          }
        }
      }
    } catch {
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Overall KPIs ──
  const stats = useMemo(() => {
    if (submissions.length === 0) return { best: 0, avg: 0, count: 0, passRate: 0 };
    const percs = submissions.map(s => Number(s.percentage) || 0);
    const best = Math.max(...percs);
    const avg = percs.reduce((a, b) => a + b, 0) / percs.length;
    const passed = submissions.filter(s => (s.percentage || 0) >= 50).length;
    return {
      best: Math.round(best),
      avg: Math.round(avg),
      count: submissions.length,
      passRate: Math.round((passed / submissions.length) * 100)
    };
  }, [submissions]);

  const liveExamsCount = useMemo(() => {
    return assignedExams.filter(e => e.status === "active" && !e.has_submitted).length;
  }, [assignedExams]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* ═══════ TOP HEADER & SUMMARY BANNER ═══════ */}
      <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] flex items-center justify-center font-bold text-lg border border-[#2563EB]/20 shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F1F5F9] break-all sm:break-words">
                  {mounted && fullName ? fullName : (isTeacher ? "Instructor Portal" : "Student Candidate")}
                </h1>
                {isTeacher ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 shrink-0">
                    <User className="h-3 w-3" />
                    <span>Teacher / Staff View</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Student</span>
                  </span>
                )}
                {liveExamsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] border border-[#2563EB]/30 animate-pulse shrink-0">
                    {liveExamsCount} Live Test{liveExamsCount > 1 ? "s" : ""} Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1 break-words">
                {isTeacher 
                  ? "Instructor Preview: Inspect student assessments, passcodes & performance records."
                  : "Access active assessment rooms, view security credentials, and review grading analytics."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {isTeacher && studentsList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-[#17243A] px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#263449] text-xs">
                <span className="text-[#64748B] dark:text-[#A3B1C6] font-semibold">Filter:</span>
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="">All Students Submissions</option>
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.roll_number})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#2563EB]" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Portal"}</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/student/profile")}
              className="px-3.5 py-1.5 rounded-lg border border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[#172B4D] hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50 text-[#1E3A8A] dark:text-[#60A5FA] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* Portal View Switcher Tabs */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          <button
            onClick={() => setActivePortalTab("assigned")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activePortalTab === "assigned"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-[#F1F5F9] dark:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span className="sm:hidden">Assigned ({assignedExams.length})</span>
            <span className="hidden sm:inline">Assigned & Live Tests ({assignedExams.length})</span>
          </button>

          <button
            onClick={() => setActivePortalTab("submissions")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activePortalTab === "submissions"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-[#F1F5F9] dark:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span className="sm:hidden">Submissions ({submissions.length})</span>
            <span className="hidden sm:inline">Past Submissions & Analytics ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActivePortalTab("progress")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
              activePortalTab === "progress"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-[#F1F5F9] dark:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="sm:hidden">Mastery</span>
            <span className="hidden sm:inline">Learning Trends & Mastery</span>
          </button>
        </div>

        {/* Overall KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-2 pt-4 border-t border-[#E2E8F0]/60 dark:border-[#263449]/60">
          <div className="bg-[#F8FAFC] dark:bg-[#17243A]/60 rounded-lg p-3.5 border border-[#E2E8F0] dark:border-[#263449]">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">Quizzes Completed</div>
            <div className="text-2xl font-bold text-[#111827] dark:text-[#F1F5F9] mt-1">{stats.count}</div>
            <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">Attempted assessments</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#17243A]/60 rounded-lg p-3.5 border border-[#E2E8F0] dark:border-[#263449]">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">Overall Average</div>
            <div className="text-2xl font-bold text-[#2563EB] dark:text-[#60A5FA] mt-1">{stats.avg}%</div>
            <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">Cohort grade average</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#17243A]/60 rounded-lg p-3.5 border border-[#E2E8F0] dark:border-[#263449]">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">Best Quiz Score</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.best}%</div>
            <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">Highest recorded score</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#17243A]/60 rounded-lg p-3.5 border border-[#E2E8F0] dark:border-[#263449]">
            <div className="text-[11px] font-medium text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">Pass Rate</div>
            <div className="text-2xl font-bold text-[#1E3A8A] dark:text-[#3B82F6] mt-1">{stats.passRate}%</div>
            <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">Quizzes cleared successfully</div>
          </div>
        </div>
      </div>

      {/* ═══════ SECTION 1: ASSIGNED & LIVE EXAMS VIEW ═══════ */}
      {activePortalTab === "assigned" && (
        <div className="space-y-4">
          
          {/* Fast Direct Exam Jump Box */}
          <div className="p-4 bg-white dark:bg-[#111C31] rounded-xl border border-[#E2E8F0] dark:border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA]">
                <FileCode2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">Have a Direct Assessment Code?</div>
                <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">Enter the test code to jump straight into the candidate assessment room</div>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!directCodeInput.trim()) return;
                const clean = directCodeInput.trim().replace(/^.*\/exam\//, "");
                router.push(isTeacher ? `/exam/${clean}?mode=teacher_preview` : `/exam/${clean}`);
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={directCodeInput}
                onChange={(e) => setDirectCodeInput(e.target.value)}
                placeholder="e.g. ex-com-1234"
                className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#263449] rounded-lg text-xs font-mono text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] w-full sm:w-44"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Join Room
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
              Available & Scheduled Examinations
            </h2>
            <span className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
              {assignedExams.length} Total Assessments Found
            </span>
          </div>

          {assignedExams.length === 0 ? (
            <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-12 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-[#64748B] mx-auto opacity-50" />
              <h3 className="font-bold text-base text-[#111827] dark:text-[#F1F5F9]">No Active Assessments Available</h3>
              <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] max-w-sm mx-auto">
                Your instructors have not published any new tests right now. When an assessment is published live, it will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedExams.map((exam) => {
                const isLive = exam.status === "active";
                const isEnded = exam.status === "ended";
                const hasCompleted = exam.has_submitted;

                return (
                  <div
                    key={exam.exam_id}
                    className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#2563EB]/50 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-[#60A5FA]">
                            Code: {exam.exam_code}
                          </span>
                          <h3 className="font-bold text-sm text-[#111827] dark:text-[#F1F5F9] line-clamp-1">
                            {exam.name}
                          </h3>
                          {exam.teacher_name && (
                            <div className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-0.5 flex-wrap">
                              <span className="font-medium text-[#1E293B] dark:text-[#E2E8F0]">{exam.teacher_name}</span>
                              {(exam.teacher_institution || exam.institution_name) && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[130px]">{exam.teacher_institution || exam.institution_name}</span>
                                </>
                              )}
                              {exam.class_name && (
                                <>
                                  <span>•</span>
                                  <span>{exam.class_name}{exam.section ? ` (${exam.section})` : ""}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {hasCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                            Completed
                          </span>
                        ) : isLive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Live Now</span>
                          </span>
                        ) : isEnded ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200">
                            Ended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                            Scheduled
                          </span>
                        )}
                      </div>

                      {/* Exam Specs */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E2E8F0]/60 dark:border-[#263449] text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                        <div>
                          <div className="text-[9px] uppercase font-bold">Duration</div>
                          <div className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{exam.duration_minutes}m</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold">Questions</div>
                          <div className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{exam.questions_count} Qs</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold">Total Marks</div>
                          <div className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{exam.total_marks}</div>
                        </div>
                      </div>

                      {/* Credentials Display Card if Assigned */}
                      {exam.credentials && !hasCompleted && (
                        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#263449] space-y-1.5 text-xs font-mono">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] dark:text-[#A3B1C6] uppercase">
                            <Key className="h-3 w-3 text-[#2563EB]" />
                            <span>Your Passcode Credentials</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#64748B]">User:</span>
                            <b className="text-[#111827] dark:text-[#F1F5F9]">{exam.credentials.username}</b>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#64748B]">Pass:</span>
                            <b className="text-[#2563EB] dark:text-[#60A5FA]">{exam.credentials.password}</b>
                          </div>
                        </div>
                      )}

                      {/* Completed Score Badge */}
                      {hasCompleted && exam.submission_score !== null && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                          <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Your Score:</span>
                          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                            {exam.submission_score} / {exam.total_marks} ({exam.submission_percentage}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {hasCompleted ? (
                        <button
                          onClick={() => {
                            setActivePortalTab("submissions");
                            if (exam.submission_id) loadSubDetail(exam.submission_id);
                          }}
                          className="w-full py-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
                          <span>View Detailed Evaluation</span>
                        </button>
                      ) : isLive ? (
                        <a
                          href={isTeacher ? `/exam/${exam.exam_code}?mode=teacher_preview` : `/exam/${exam.exam_code}`}
                          className="w-full py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isTeacher ? "Launch Simulator Preview" : "Enter Exam Room"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      ) : isEnded ? (
                        <div className="w-full py-2 rounded-lg bg-[#F1F5F9] dark:bg-[#17243A] text-center text-xs font-medium text-[#64748B] dark:text-[#A3B1C6]">
                          Assessment Window Closed
                        </div>
                      ) : (
                        <div className="w-full py-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 text-center text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Starts {formatLocalizedTime(exam.start_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ SECTION 2: SUBMISSIONS & PERFORMANCE BREAKDOWN ═══════ */}
      {activePortalTab === "submissions" && (
        submissions.length === 0 ? (
          <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-12 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-[#64748B] mx-auto opacity-50" />
            <h3 className="font-bold text-base text-[#111827] dark:text-[#F1F5F9]">No Quiz Attempts Recorded Yet</h3>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] max-w-sm mx-auto">
              When you complete an assessment or exam, your quiz-by-quiz performance summary, grade breakdown, and learning recommendations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ═══════ LEFT: QUIZ-WISE ATTEMPTS LIST ═══════ */}
            <div className={`lg:col-span-4 space-y-3 ${mobileViewingDetail ? "hidden lg:block" : "block"}`}>
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-[#64748B] dark:text-[#A3B1C6] uppercase tracking-wider">
                  Completed Quizzes ({submissions.length})
                </h2>
                <span className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">Select to inspect</span>
              </div>

              <div className="space-y-2.5">
                {submissions.map((sub) => {
                  const isSelected = sub.id === selectedSubId;
                  const isPassed = (sub.percentage || 0) >= 50;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => loadSubDetail(sub.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all text-xs space-y-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#EFF6FF] border-[#2563EB] shadow-xs dark:bg-[#172B4D] dark:border-[#3B82F6]"
                          : "bg-white dark:bg-[#111C31] border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#111827] dark:text-[#F1F5F9] text-xs line-clamp-1">
                            {sub.exam_name || "Assessment"}
                          </div>
                          {sub.student_name && isTeacher && (
                            <div className="text-[11px] font-semibold text-[#1E3A8A] dark:text-[#60A5FA] mt-0.5 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{sub.student_name} {sub.roll_number ? `(${sub.roll_number})` : ""}</span>
                            </div>
                          )}
                          {sub.teacher_name && !isTeacher && (
                            <div className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">Teacher: {sub.teacher_name}</span>
                              {sub.institution_name && (
                                <span>• {sub.institution_name}</span>
                              )}
                              {sub.class_name && (
                                <span>• {sub.class_name}{sub.section ? ` (${sub.section})` : ""}</span>
                              )}
                            </div>
                          )}
                          <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5 flex items-center gap-1.5 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>{sub.submitted_at ? formatLocalizedDate(sub.submitted_at, { month: "short", day: "numeric", year: "numeric" }) : "Recent"}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          isPassed 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}>
                          {isPassed ? "PASSED" : "FAILED"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/60 dark:border-[#263449]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#64748B]">Score:</span>
                          <span className="font-bold text-[#111827] dark:text-[#F1F5F9]">
                            {sub.score} / {sub.max_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${API_V1}/reports/submission-detail/${sub.id}/printable`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-md text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-all"
                            title="Print / View Official Student Response Sheet"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </a>
                          <div className="font-extrabold text-sm text-[#2563EB] dark:text-[#60A5FA]">
                            {sub.percentage}%
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══════ RIGHT: DEDICATED QUIZ PERFORMANCE SUMMARY ═══════ */}
            <div className={`lg:col-span-8 ${mobileViewingDetail ? "block" : "hidden lg:block"}`}>
              {loadingDetail ? (
                <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#64748B] font-medium">Loading Quiz Evaluation & Breakdown...</p>
                </div>
              ) : selectedSubDetail ? (
                <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
                  
                  {/* Mobile Back to List Button */}
                  <div className="lg:hidden pb-3 border-b border-[#E2E8F0] dark:border-[#263449]">
                    <button
                      type="button"
                      onClick={() => setMobileViewingDetail(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1120] text-xs font-semibold text-[#64748B] hover:text-[#111827] cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Completed Quizzes List</span>
                    </button>
                  </div>

                  {/* Quiz Header & Score Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#263449]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#A3B1C6]">
                          Code: {selectedSubDetail.exam_code || "EXAM"}
                        </span>
                        
                        {/* Certificate Button */}
                        <a
                          href={`${API_V1}/reports/submissions/${selectedSubDetail.submission_id}/certificate-html`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-2xs"
                          title="Generate & Download Official Certificate of Completion (PDF)"
                        >
                          <Trophy className="h-3 w-3 text-amber-600" />
                          <span>Official Certificate</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>

                        {/* Report Card Button */}
                        <a
                          href={`${API_V1}/reports/submissions/${selectedSubDetail.submission_id}/report-card-html`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all shadow-2xs"
                          title="Print Itemized Candidate Scorecard (PDF)"
                        >
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span>Diagnostic Scorecard</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9] mt-0.5">
                        {selectedSubDetail.exam_name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-[#F1F5F9] dark:bg-[#17243A] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] self-start sm:self-auto">
                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase font-bold">Earned Score</div>
                        <div className="text-xl font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
                          {selectedSubDetail.score} <span className="text-xs font-normal text-[#64748B]">/ {selectedSubDetail.max_score}</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-[#E2E8F0] dark:bg-[#263449] hidden xs:block" />
                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase font-bold">Accuracy</div>
                        <div className="text-xl font-extrabold text-[#111827] dark:text-[#F1F5F9]">
                          {selectedSubDetail.percentage}%
                        </div>
                      </div>
                      {selectedSubDetail.rank && (
                        <>
                          <div className="h-8 w-px bg-[#E2E8F0] dark:bg-[#263449] hidden xs:block" />
                          <div>
                            <div className="text-[10px] text-[#64748B] uppercase font-bold">Class Rank</div>
                            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                              #{selectedSubDetail.rank}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI Learning Critique & Roadmap */}
                  {selectedSubDetail.ai_feedback && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Sparkles className="h-4 w-4 text-[#2563EB] shrink-0" />
                        <span>AI Learning Diagnosis & Recommendations</span>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed pl-2 sm:pl-6">
                        {selectedSubDetail.ai_feedback}
                      </p>
                    </div>
                  )}

                  {/* Navigation Tabs (Questions / Topics / Leaderboard) */}
                  <div className="flex gap-2 border-b border-[#E2E8F0] dark:border-[#263449] pb-2 overflow-x-auto scrollbar-none touch-pan-x flex-nowrap">
                    <button
                      onClick={() => setActiveViewTab("questions")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                        activeViewTab === "questions"
                          ? "bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA]"
                          : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="sm:hidden">Questions</span>
                      <span className="hidden sm:inline">Question-by-Question Review</span>
                    </button>

                    <button
                      onClick={() => setActiveViewTab("topics")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                        activeViewTab === "topics"
                          ? "bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA]"
                          : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="sm:hidden">Topics</span>
                      <span className="hidden sm:inline">Topic Mastery Breakdown</span>
                    </button>

                    <button
                      onClick={() => setActiveViewTab("leaderboard")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                        activeViewTab === "leaderboard"
                          ? "bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA]"
                          : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      <span className="sm:hidden">Leaderboard</span>
                      <span className="hidden sm:inline">Cohort Leaderboard</span>
                    </button>
                  </div>

                  {/* ══════ TAB 1: QUESTION-BY-QUESTION REVIEW ══════ */}
                  {activeViewTab === "questions" && (
                    <div className="space-y-4">
                      {selectedSubDetail.questions && selectedSubDetail.questions.length > 0 ? (
                        selectedSubDetail.questions.map((q: any, idx: number) => {
                          const isCorrect = q.is_correct;
                          return (
                            <div
                              key={idx}
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all text-xs space-y-3 ${
                                isCorrect
                                  ? "bg-emerald-50/20 border-emerald-200 dark:border-emerald-800/40"
                                  : "bg-rose-50/20 border-rose-200 dark:border-rose-800/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#64748B] dark:text-[#A3B1C6]">Q{idx + 1}.</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6]">
                                      {q.question_type || "MCQ"}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-xs sm:text-sm text-[#111827] dark:text-[#F1F5F9] leading-relaxed">
                                    <MathText text={q.question_text || q.text || ""} />
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                }`}>
                                  {isCorrect ? `+${q.awarded_marks ?? q.marks ?? 1} Marks` : `0 / ${q.marks ?? 1} Marks`}
                                </span>
                              </div>

                              {/* Options Breakdown with KaTeX */}
                              {q.options && typeof q.options === "object" && Object.keys(q.options).length > 0 && (
                                <div className="space-y-1.5 pl-2 sm:pl-6">
                                  {Object.entries(q.options).map(([optKey, optVal]: [string, any]) => {
                                    const isUserChoice = String(q.user_answer) === optKey;
                                    const isActualCorrect = String(q.correct_answer) === optKey;
                                    
                                    return (
                                      <div
                                        key={optKey}
                                        className={`p-2 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 ${
                                          isActualCorrect
                                            ? "bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold"
                                            : isUserChoice
                                            ? "bg-rose-100/60 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200"
                                            : "bg-white/60 dark:bg-[#111C31]/60 border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6]"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold uppercase">{optKey}.</span>
                                          <span><MathText text={String(optVal)} /></span>
                                        </div>
                                        <div className="text-[10px] font-bold self-end sm:self-auto shrink-0">
                                          {isActualCorrect && <span className="text-emerald-700 dark:text-emerald-300">✓ Correct Answer</span>}
                                          {isUserChoice && !isActualCorrect && <span className="text-rose-700 dark:text-rose-300">✗ Your Choice</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Subjective / Written Response Display */}
                              {(!q.options || (typeof q.options === "object" && Object.keys(q.options).length === 0)) && (
                                <div className="space-y-2 pl-2 sm:pl-6">
                                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                                    <div className="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#A3B1C6]">Your Written Response:</div>
                                    <div className="text-xs text-[#111827] dark:text-[#F1F5F9] whitespace-pre-wrap">
                                      <MathText text={String(q.user_answer_text || q.user_answer || "No response provided.")} />
                                    </div>
                                  </div>
                                  {q.ai_feedback && (
                                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs">
                                      <b className="text-[10px] uppercase block mb-0.5">AI Evaluator Feedback:</b>
                                      {q.ai_feedback}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Explanation / Critique with KaTeX */}
                              {q.explanation && (
                                <div className="pl-2 sm:pl-6 pt-1 text-[11px] text-[#64748B] dark:text-[#A3B1C6] leading-relaxed border-t border-[#E2E8F0]/40 dark:border-[#263449]/60">
                                  <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">Explanation: </span>
                                  <MathText text={q.explanation} />
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-[#64748B] text-xs">
                          Question breakdown is not available for this record.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════ TAB 2: TOPIC MASTERY BREAKDOWN ══════ */}
                  {activeViewTab === "topics" && (
                    <div className="space-y-4">
                      {selectedSubDetail.topic_analysis && Object.keys(selectedSubDetail.topic_analysis).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(selectedSubDetail.topic_analysis).map(([topicName, tdata]: [string, any]) => {
                            const acc = tdata.accuracy ?? 0;
                            return (
                              <div key={topicName} className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A]/60 border border-[#E2E8F0] dark:border-[#263449] space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{topicName}</span>
                                  <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">{acc}% Accuracy</span>
                                </div>
                                <div className="w-full bg-[#E2E8F0] dark:bg-[#263449] h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      acc >= 75 ? "bg-emerald-500" : acc >= 50 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, acc))}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-[#64748B] dark:text-[#A3B1C6]">
                                  <span>{tdata.correct || 0} of {tdata.total || 0} questions correct</span>
                                  <span>{acc >= 75 ? "Mastered" : acc >= 50 ? "Developing" : "Needs Review"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-[#64748B] text-xs">
                          Topic analysis is not available for this exam.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════ TAB 3: LEADERBOARD ══════ */}
                  {activeViewTab === "leaderboard" && (
                    <div className="space-y-3">
                      <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] border border-[#E2E8F0] dark:border-[#263449] rounded-xl overflow-hidden">
                        {leaderboard.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#64748B]">No leaderboard data available.</div>
                        ) : (
                          leaderboard.map((lb: any, idx: number) => {
                            const isMe = lb.student_name === fullName || lb.name === fullName;
                            return (
                              <div
                                key={idx}
                                className={`p-3 flex items-center justify-between text-xs transition-colors ${
                                  isMe 
                                    ? "bg-[#EFF6FF] dark:bg-[#172B4D] font-semibold" 
                                    : "bg-white dark:bg-[#111C31] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    idx === 0 ? "bg-amber-100 text-amber-800" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-amber-700/20 text-amber-900" : "text-[#64748B]"
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="text-[#111827] dark:text-[#F1F5F9]">
                                    {lb.student_name || lb.name || "Candidate"} {isMe && "(You)"}
                                  </span>
                                </div>
                                <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
                                  {lb.percentage || lb.score}%
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>

          </div>
        )
      )}

      {/* ═══════ PORTAL TAB 3: LEARNING TRENDS & MASTERY ═══════ */}
      {activePortalTab === "progress" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Banner */}
          <div className="bg-[#FFFFFF] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#2563EB]" />
                  <span>Performance & Topic Mastery Diagnosis</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                  AI-driven analytics analyzing score trajectories and subject area proficiency.
                </p>
              </div>

              {progressData?.average_percentage && (
                <div className="bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] px-4 py-2 rounded-xl text-center shrink-0 border border-[#2563EB]/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider">Overall Mastery</div>
                  <div className="text-xl font-extrabold">{progressData.average_percentage}%</div>
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Topic Strengths</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {progressData?.strength_topics?.length > 0 ? (
                    progressData.strength_topics.map((st: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-md text-xs font-medium">
                        {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Complete more quizzes to identify strengths.</span>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Recommended Focus Areas</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {progressData?.weak_topics?.length > 0 ? (
                    progressData.weak_topics.map((wt: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-md text-xs font-medium">
                        {wt}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-400">No weak topics detected. Great job!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score History Line Chart */}
            <div className="bg-[#FFFFFF] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#2563EB]" />
                <span>Score Trajectory Over Time</span>
              </h3>
              <div className="h-64 w-full pt-2">
                {progressData?.score_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData.score_trend}>
                      <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C31', borderRadius: '8px', color: '#F1F5F9', border: '1px solid #263449', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="percentage" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                    No submission trend history recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Topic Mastery Radar Chart */}
            <div className="bg-[#FFFFFF] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#2563EB]" />
                <span>Topic Mastery Breakdown (%)</span>
              </h3>
              <div className="h-64 w-full pt-2">
                {progressData?.topic_mastery?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={progressData.topic_mastery}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="topic" stroke="#64748B" fontSize={10} />
                      <Radar name="Accuracy" dataKey="accuracy" stroke="#2563EB" fill="#2563EB" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ backgroundColor: '#111C31', borderRadius: '8px', color: '#F1F5F9', border: '1px solid #263449', fontSize: '12px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                    Complete assessments to generate topic mastery breakdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
