"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  StopCircle,
  X,
  RefreshCw,
  AlertCircle,
  Radio,
  Key,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  PlusCircle,
  Check,
  Mail,
  Share2,
  MoreVertical,
  Calendar,
  Layers,
  Award
} from "lucide-react";
import { apiFetch, getFrontendBaseUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import LiveProctoringModal from "@/app/dashboard/teacher/_components/LiveProctoringModal";

interface ExamItem {
  id: string;
  name: string;
  exam_code: string;
  status: "published" | "draft" | "completed";
  is_published?: boolean;
  is_expired?: boolean;
  creator_name: string;
  creator_email: string;
  institution_name: string;
  questions_count: number;
  duration_minutes: number;
  total_marks: number;
  passing_marks?: number;
  is_paid: boolean;
  access_mode?: string;
  submissions_count: number;
  start_time?: string;
  end_time?: string;
  created_at?: string;
}

export default function AdminExamsPage() {
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Copy code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Active Modals
  const [liveProctorExam, setLiveProctorExam] = useState<ExamItem | null>(null);
  
  // Credentials Modal State
  const [credsModalExam, setCredsModalExam] = useState<ExamItem | null>(null);
  const [credsList, setCredsList] = useState<any[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credsSearch, setCredsSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [resendingCandidateId, setResendingCandidateId] = useState<string | null>(null);
  const [isResendingAll, setIsResendingAll] = useState(false);

  // Extend Time Modal State
  const [extendExam, setExtendExam] = useState<ExamItem | null>(null);
  const [extendMinutes, setExtendMinutes] = useState<number>(15);
  const [extending, setExtending] = useState(false);

  // Edit Exam Modal State
  const [editExam, setEditExam] = useState<ExamItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    duration_minutes: 60,
    total_marks: 50,
    passing_marks: 20,
    is_published: true,
    access_mode: "ENROLLED_ONLY"
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Emergency Stop Modal State
  const [stopTargetExam, setStopTargetExam] = useState<ExamItem | null>(null);
  const [stopReason, setStopReason] = useState("");
  const [stopping, setStopping] = useState(false);

  // Delete Exam Modal State
  const [deleteTargetExam, setDeleteTargetExam] = useState<ExamItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", pageSize.toString());
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status_filter", statusFilter);

      const res = await apiFetch(`/admin/exams?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Failed to load assessments (${res.status})`);
      }
      const data = await res.json();
      setExams(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleCopyCode = (examId: string, code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(examId);
    showToast("Test code copied to clipboard", "success");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyLink = (examCode: string) => {
    const link = `${getFrontendBaseUrl()}/exam/${examCode}`;
    navigator.clipboard.writeText(link);
    showToast("Direct exam link copied to clipboard!", "success");
  };

  // Open Credentials Modal & fetch credentials
  const handleOpenCredentials = async (exam: ExamItem) => {
    setCredsModalExam(exam);
    setCredsSearch("");
    setLoadingCreds(true);
    try {
      const res = await apiFetch(`/exams/${exam.id}/credentials`, { token });
      if (res.ok) {
        const data = await res.json();
        setCredsList(data || []);
      } else {
        showToast("Unable to load candidate credentials", "error");
        setCredsList([]);
      }
    } catch {
      showToast("Network error fetching credentials", "error");
      setCredsList([]);
    } finally {
      setLoadingCreds(false);
    }
  };

  const handleResendSingleEmail = async (candidateId: string, username?: string, email?: string) => {
    if (!credsModalExam) return;
    setResendingCandidateId(candidateId || username || email || "unknown");
    try {
      const params = new URLSearchParams();
      if (candidateId) params.set("candidate_id", candidateId);
      if (username) params.set("username", username);
      if (email) params.set("email", email);

      const res = await apiFetch(`/exams/${credsModalExam.id}/resend-credentials-email?${params.toString()}`, {
        method: "POST",
        token
      });
      if (res.ok) {
        showToast(`Credentials dispatched to ${email || username || "candidate"}!`, "success");
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.detail || "Failed to dispatch email", "error");
      }
    } catch {
      showToast("Network error dispatching credentials email", "error");
    } finally {
      setResendingCandidateId(null);
    }
  };

  const handleResendAllEmails = async () => {
    if (!credsModalExam) return;
    setIsResendingAll(true);
    try {
      const res = await apiFetch(`/exams/${credsModalExam.id}/resend-credentials-email`, {
        method: "POST",
        token
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        showToast(`Credentials dispatched to all ${data?.dispatched_count || credsList.length} candidates!`, "success");
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.detail || "Failed to dispatch emails", "error");
      }
    } catch {
      showToast("Network error dispatching bulk credentials", "error");
    } finally {
      setIsResendingAll(false);
    }
  };

  const handleCopySingleCred = (text: string, rowKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(rowKey);
    showToast("Credentials copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Quick Extend Time
  const handleQuickExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendExam || extendMinutes <= 0) return;

    try {
      setExtending(true);
      const res = await apiFetch(`/admin/exams/${extendExam.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ extend_minutes: extendMinutes })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to extend assessment time");
      }
      showToast(`Extended ${extendExam.name} by +${extendMinutes} minutes!`, "success");
      setActionSuccess(`Successfully extended ${extendExam.name} by +${extendMinutes} minutes.`);
      setExtendExam(null);
      fetchExams();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      showToast(err.message || "Failed to extend assessment", "error");
    } finally {
      setExtending(false);
    }
  };

  // Open Edit Exam Modal
  const handleOpenEdit = (exam: ExamItem) => {
    setEditExam(exam);
    setEditFormData({
      name: exam.name || "",
      duration_minutes: exam.duration_minutes || 60,
      total_marks: exam.total_marks || 50,
      passing_marks: exam.passing_marks || 20,
      is_published: exam.is_published ?? true,
      access_mode: exam.access_mode || "ENROLLED_ONLY"
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExam) return;

    try {
      setSavingEdit(true);
      const res = await apiFetch(`/admin/exams/${editExam.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update assessment");
      }
      showToast(`Updated '${editExam.name}' successfully!`, "success");
      setActionSuccess(`Assessment '${editExam.name}' configurations updated.`);
      setEditExam(null);
      fetchExams();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      showToast(err.message || "Failed to update assessment", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Emergency Stop
  const handleEmergencyStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopTargetExam || !stopReason.trim()) return;

    try {
      setStopping(true);
      const res = await apiFetch(`/admin/exams/${stopTargetExam.id}/emergency-stop`, {
        method: "POST",
        token,
        body: JSON.stringify({ reason: stopReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to stop assessment");
      }
      showToast(`Assessment '${stopTargetExam.name}' emergency terminated.`, "success");
      setActionSuccess(`Assessment '${stopTargetExam.name}' has been emergency stopped.`);
      setStopTargetExam(null);
      setStopReason("");
      fetchExams();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      showToast(err.message || "Failed to stop assessment", "error");
    } finally {
      setStopping(false);
    }
  };

  // Soft Delete
  const handleDeleteExam = async () => {
    if (!deleteTargetExam) return;
    try {
      setDeleting(true);
      const res = await apiFetch(`/admin/exams/${deleteTargetExam.id}`, {
        method: "DELETE",
        token
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to delete assessment");
      }
      showToast(`Assessment '${deleteTargetExam.name}' deleted.`, "success");
      setDeleteTargetExam(null);
      fetchExams();
    } catch (err: any) {
      showToast(err.message || "Failed to delete assessment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const filteredCreds = credsList.filter((c) => {
    if (!credsSearch.trim()) return true;
    const q = credsSearch.toLowerCase();
    return (
      c.student_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.roll_number?.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Global Assessment Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervise teacher tests, live proctoring sessions, candidate credentials, and execute emergency containment or time extensions.
          </p>
        </div>

        <button
          onClick={fetchExams}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh assessments list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by assessment title, test code, faculty or institution..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published / Active</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft Blueprints</option>
          </select>
        </div>
      </div>

      {/* Assessments Content Area */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading assessments...</span>
          </div>
        ) : error ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="text-sm font-bold text-red-600 dark:text-red-400">{error}</div>
            <p className="text-xs text-slate-500 max-w-sm">
              An error occurred while fetching assessments. Please check your network connection or try refreshing.
            </p>
            <button
              onClick={fetchExams}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No assessments found matching the selected filters.
          </div>
        ) : (
          <>
            {/* ─── MOBILE VIEW: CLEAN STACKED CARDS (shown on mobile, hidden on md+) ─── */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {exams.map((exam) => (
                <div key={exam.id} className="p-4 space-y-3.5">
                  {/* Card Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                          ASSESSMENT
                        </span>
                        {exam.is_paid && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1 leading-snug break-words">
                        {exam.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        By <b className="text-slate-700 dark:text-slate-300">{exam.creator_name}</b> • {exam.institution_name}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {exam.status === "published" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live / Active
                        </span>
                      ) : exam.status === "completed" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Draft Blueprint
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Award className="w-3 h-3 text-blue-500" />
                      {exam.total_marks} marks
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {exam.duration_minutes} min
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-500" />
                      {exam.questions_count} Qs
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {exam.submissions_count} Submissions
                    </span>
                  </div>

                  {/* Test Code Box with 1-Click Copy */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">TEST CODE</div>
                      <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 tracking-wider">
                        {exam.exam_code}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(exam.id, exam.exam_code)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                      title="Copy Test Code"
                    >
                      {copiedCodeId === exam.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Primary & Governance Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenCredentials(exam)}
                      className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Credentials</span>
                    </button>

                    <button
                      onClick={() => setLiveProctorExam(exam)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      <span>Live Monitor</span>
                    </button>
                  </div>

                  {/* Secondary Management Row */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setExtendExam(exam)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 hover:bg-slate-200"
                      title="Extend exam duration for students facing issues"
                    >
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>+Extend Time</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 hover:bg-slate-200"
                      title="Edit assessment config"
                    >
                      <Edit className="w-3 h-3 text-blue-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(exam.exam_code)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 hover:bg-slate-200"
                      title="Copy shareable link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link</span>
                    </button>

                    {exam.status === "published" && (
                      <button
                        onClick={() => {
                          setStopTargetExam(exam);
                          setStopReason("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-[11px] flex items-center gap-1 shrink-0 hover:bg-red-100"
                        title="Emergency Stop Assessment"
                      >
                        <StopCircle className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteTargetExam(exam)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 shrink-0"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── DESKTOP VIEW: RICH TABLE (hidden on mobile, shown on md+) ─── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Exam & Code</th>
                    <th className="py-3.5 px-4">Faculty Creator</th>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4 text-center">Marks / Time</th>
                    <th className="py-3.5 px-4 text-center">Questions</th>
                    <th className="py-3.5 px-4 text-center">Submissions</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{exam.name}</span>
                          {exam.is_paid && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                            {exam.exam_code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(exam.id, exam.exam_code)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy code"
                          >
                            {copiedCodeId === exam.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{exam.creator_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{exam.creator_email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{exam.institution_name}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{exam.total_marks} marks</div>
                        <div className="text-[10px] text-slate-400">{exam.duration_minutes} min</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{exam.questions_count}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {exam.submissions_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {exam.status === "published" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active / Live
                          </span>
                        ) : exam.status === "completed" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Draft Blueprint
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setLiveProctorExam(exam)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                            title="Open Real-time Proctoring Monitor"
                          >
                            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                            <span>Monitor</span>
                          </button>

                          <button
                            onClick={() => handleOpenCredentials(exam)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                            title="Candidate Credentials & Passcodes"
                          >
                            <Key className="w-3 h-3" />
                            <span>Passcodes</span>
                          </button>

                          <button
                            onClick={() => setExtendExam(exam)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                            title="Quick Time Extension for Students Facing Issues"
                          >
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>+Time</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Assessment Configuration"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {exam.status === "published" && (
                            <button
                              onClick={() => {
                                setStopTargetExam(exam);
                                setStopReason("");
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Emergency Stop Assessment"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTargetExam(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Assessment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {exams.length} of {total} assessments
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ LIVE PROCTORING MODAL ═══════ */}
      {liveProctorExam && (
        <LiveProctoringModal
          examId={liveProctorExam.id}
          exam={liveProctorExam}
          onClose={() => setLiveProctorExam(null)}
        />
      )}

      {/* ═══════ CANDIDATE PASSCODES & CREDENTIALS MODAL ═══════ */}
      {credsModalExam && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
          onClick={() => setCredsModalExam(null)}
        >
          <div
            className="bg-white dark:bg-[#111C31] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full p-3.5 sm:p-5 shadow-2xl space-y-3 max-h-[88dvh] sm:max-h-[90vh] flex flex-col transition-colors overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle on mobile */}
            <div className="sm:hidden pt-0.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-900 shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
                    Candidate Passcodes & Credentials
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Assessment: <b className="text-blue-600 dark:text-blue-400">{credsModalExam.name}</b> ({credsModalExam.exam_code}) • {credsList.length} Candidates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredsModalExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="space-y-2 shrink-0">
              <div className="relative w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={credsSearch}
                  onChange={(e) => setCredsSearch(e.target.value)}
                  placeholder="Search candidate name, email, roll number, or username..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyLink(credsModalExam.exam_code)}
                  className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 transition-all whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  disabled={isResendingAll || credsList.length === 0}
                  onClick={handleResendAllEmails}
                  className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1 transition-all whitespace-nowrap shrink-0"
                >
                  {isResendingAll ? (
                    <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  <span>Send All Emails</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              {loadingCreds ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Loading passcodes...</span>
                </div>
              ) : filteredCreds.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {credsSearch ? "No credentials match your search." : "No candidate passcodes generated yet."}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCreds.map((c, idx) => {
                    const rowKey = `${c.username}_${idx}`;
                    const isCopied = copiedKey === rowKey;
                    const isSendingEmail = resendingCandidateId === (c.candidate_id || c.username || c.email);

                    return (
                      <div key={idx} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {c.student_name || "Enrolled Student"}
                            </div>
                            {c.email && (
                              <div className="text-[10px] text-slate-400 truncate font-mono">{c.email}</div>
                            )}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            Roll: {c.roll_number || "—"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Exam Username</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs break-all">
                              {c.username}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Timed Passcode</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5 text-xs inline-block mt-0.5">
                              {c.password}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopySingleCred(
                                `User: ${c.username}\nPIN: ${c.password}\nPortal: ${getFrontendBaseUrl()}/exam/${credsModalExam.exam_code}?user=${encodeURIComponent(c.username)}&pin=${encodeURIComponent(c.password)}`,
                                rowKey
                              )
                            }
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                          >
                            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            <span>{isCopied ? "Copied" : "Copy"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSendingEmail}
                            onClick={() => handleResendSingleEmail(c.candidate_id, c.username, c.email)}
                            className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isSendingEmail ? (
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                            <span>Email</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ QUICK EXTEND ASSESSMENT TIME MODAL ═══════ */}
      {extendExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Extend Assessment Duration</span>
              </div>
              <button
                onClick={() => setExtendExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold">Instant Emergency Extension</div>
              <div>
                Assessment: <strong>{extendExam.name}</strong> ({extendExam.exam_code})
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Instantly grants extra testing time for all candidates. Recommended when institution reports connectivity or proctor issues.
              </p>
            </div>

            <form onSubmit={handleQuickExtend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select or Enter Minutes to Add
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setExtendMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        extendMinutes === mins
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      +{mins} min
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min={1}
                  max={180}
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendExam(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending || extendMinutes <= 0}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {extending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Add +{extendMinutes} Minutes Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ EDIT ASSESSMENT CONFIGURATION MODAL ═══════ */}
      {editExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>Admin Edit Assessment Config</span>
              </div>
              <button
                onClick={() => setEditExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editFormData.duration_minutes}
                    onChange={(e) => setEditFormData({ ...editFormData, duration_minutes: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editFormData.total_marks}
                    onChange={(e) => setEditFormData({ ...editFormData, total_marks: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editFormData.passing_marks}
                    onChange={(e) => setEditFormData({ ...editFormData, passing_marks: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Access Mode
                  </label>
                  <select
                    value={editFormData.access_mode}
                    onChange={(e) => setEditFormData({ ...editFormData, access_mode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ENROLLED_ONLY">Enrolled Only (Passcode Protected)</option>
                    <option value="OPEN_REGISTRATION">Open Registration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Published State
                  </label>
                  <select
                    value={editFormData.is_published ? "true" : "false"}
                    onChange={(e) => setEditFormData({ ...editFormData, is_published: e.target.value === "true" })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Published / Active</option>
                    <option value="false">Unpublished / Draft Blueprint</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditExam(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editFormData.name.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {savingEdit && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ EMERGENCY STOP CONFIRMATION MODAL ═══════ */}
      {stopTargetExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Emergency Terminate Assessment</span>
              </div>
              <button
                onClick={() => setStopTargetExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 space-y-1">
              <div className="font-bold">Are you certain you want to stop this assessment?</div>
              <div>
                <strong>{stopTargetExam.name}</strong> ({stopTargetExam.exam_code})
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                This will instantly unpublish the exam and terminate testing access for all candidate sessions.
              </p>
            </div>

            <form onSubmit={handleEmergencyStop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Administrative Reason / Incident Note
                </label>
                <textarea
                  required
                  rows={3}
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="e.g. Integrity breach reported, duplicate passcode leaked, or faculty requested freeze"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStopTargetExam(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stopping || !stopReason.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {stopping && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Stop Assessment Immediately</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ DELETE ASSESSMENT MODAL ═══════ */}
      {deleteTargetExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Delete Assessment</span>
              </div>
              <button
                onClick={() => setDeleteTargetExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete assessment <strong>{deleteTargetExam.name}</strong> ({deleteTargetExam.exam_code})? This will archive the exam and candidates will no longer be able to access it.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetExam(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteExam}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {deleting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
