import { useState, useEffect } from "react";
import { 
  Eye, Radio, StopCircle, Sparkles, Printer, Key, QrCode, Trash2, 
  Download, X, Play, Search, Copy, Check, ExternalLink, ShieldCheck, Mail, CopyPlus,
  CreditCard, Share2, Receipt, MoreHorizontal, Plus, ArrowRight, ClipboardList, Calendar, Clock, Layers, Award, BarChart3,
  FileText, Link2, MessageCircle
} from "lucide-react";
import { API_V1, apiFetch, getFrontendBaseUrl } from "../../../../lib/api";
import { parseUtcDate, formatLocalizedDate, formatISTDate, formatExamScheduleRange } from "../../../../lib/dateUtils";
import { useAuthStore } from "../../../../store/authStore";
import { useToast } from "../../../../components/Toast";
import LiveProctoringModal from "./LiveProctoringModal";

interface LiveAssessmentsTableProps {
  exams: any[];
  onOpenCreate?: () => void;
  showCreateButton?: boolean;
  title?: string;
  description?: string;
  onPreviewExam: (exam: any) => void;
  onOpenLiveProctor: (exam: any) => void;
  onEndExamEarly: (examId: string, examName: string) => void;
  onPublishExam: (examId: string) => void;
  onDeleteExam: (examId: string) => void;
  onGenerateCredentials: (examId: string, examName: string) => void;
  onDownloadCredentialsCSV: (examId: string, examName: string) => void;
  onOpenCertificates?: (exam: any) => void;
  onOpenGradebook?: (exam: any) => void;
  onRefreshExams?: () => void;
  onOpenPaymentModal?: (exam: any) => void;
  onViewAll?: () => void;
  activeDraft?: {
    examName: string;
    examSubject: string;
    createStep: number;
    totalSteps: number;
    stepTitle: string;
    questionsCount: number;
    duration: string;
    marks: string;
    savedAt: string;
    daysLeft: number;
  } | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
}

export default function LiveAssessmentsTable({
  exams,
  onOpenCreate,
  showCreateButton = false,
  title = "Live Class Assessments & Proctoring",
  description = "Manage active examination sessions, live anti-cheat monitoring, and candidate credentials.",
  onPreviewExam,
  onOpenLiveProctor,
  onEndExamEarly,
  onPublishExam,
  onDeleteExam,
  onGenerateCredentials,
  onDownloadCredentialsCSV,
  onOpenCertificates,
  onOpenGradebook,
  onRefreshExams,
  onOpenPaymentModal,
  onViewAll,
  activeDraft,
  onResumeDraft,
  onDiscardDraft,
}: LiveAssessmentsTableProps) {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [qrModalExam, setQrModalExam] = useState<any | null>(null);
  const [credsModalData, setCredsModalData] = useState<{ examName: string; examId: string; examCode: string; creds: any[] } | null>(null);
  const [loadingCredsExamId, setLoadingCredsExamId] = useState<string | null>(null);
  const [credsSearch, setCredsSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [resendingStudentId, setResendingStudentId] = useState<string | null>(null);
  const [isResendingAll, setIsResendingAll] = useState(false);
  const [liveProctorExamId, setLiveProctorExamId] = useState<string | null>(null);
  const [cloningExamId, setCloningExamId] = useState<string | null>(null);
  const [activeDropdownExamId, setActiveDropdownExamId] = useState<string | null>(null);
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

  const handleCopyCode = (examId: string, code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedExamId(examId);
    showToast("Exam code copied!", "success");
    setTimeout(() => setCopiedExamId(null), 2000);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownExamId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCloneExam = async (exam: any) => {
    setCloningExamId(exam.id);
    try {
      const res = await apiFetch(`/exams/${exam.id}/clone`, {
        method: "POST",
        token,
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Exam cloned as new draft: '${data.name}'!`, "success");
        if (onRefreshExams) onRefreshExams();
      } else {
        showToast("Failed to clone exam", "error");
      }
    } catch {
      showToast("Network error cloning exam", "error");
    } finally {
      setCloningExamId(null);
    }
  };

  const getExamScheduleInfo = (exam: any) => {
    if (!exam.is_published) {
      return { status: "draft", label: "Draft", dot: "bg-amber-500" };
    }
    const now = new Date();
    const start = parseUtcDate(exam.start_time);
    const end = parseUtcDate(exam.end_time);

    if (start && now < start) {
      return { status: "scheduled", label: "Scheduled", dot: "bg-blue-500" };
    }
    if (end && now > end) {
      return { status: "completed", label: "Completed", dot: "bg-stone-400" };
    }
    return { status: "live", label: "Live Active", dot: "bg-emerald-500 animate-pulse" };
  };

  const handleShareWhatsApp = (exam: any) => {
    if (!exam.is_paid) {
      showToast("Payment required before distributing exam link via WhatsApp.", "error");
      if (onOpenPaymentModal) onOpenPaymentModal(exam);
      return;
    }
    const frontendUrl = getFrontendBaseUrl();
    const portalUrl = `${frontendUrl}/exam/${exam.exam_code || exam.code}`;
    const scheduleStr = formatExamScheduleRange(exam.start_time, exam.end_time);
    const text = 
      `🎓 *Testora Assessment Invitation*\n\n` +
      `Assessment: *${exam.name}*\n` +
      `Exam Code: *${exam.exam_code || exam.code}*\n` +
      `Schedule Window: ${scheduleStr}\n\n` +
      `Portal Link: ${portalUrl}\n\n` +
      `Please use your assigned credentials to log in.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenCredentialsPreview = async (exam: any) => {
    if (!exam.is_paid) {
      showToast("Mandatory per-test payment required before generating student passcodes.", "error");
      if (onOpenPaymentModal) onOpenPaymentModal(exam);
      return;
    }
    setLoadingCredsExamId(exam.id);
    setCredsSearch("");
    try {
      const res = await apiFetch(`/exams/${exam.id}/credentials`, { token, method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const credsList = Array.isArray(data) ? data : [];
        setCredsModalData({
          examId: exam.id,
          examName: exam.name,
          examCode: exam.exam_code || exam.code,
          creds: credsList,
        });
        showToast(`Loaded ${credsList.length} candidate credentials. Emails dispatched automatically.`, "success");
      } else {
        if (res.status === 402 && onOpenPaymentModal) {
          onOpenPaymentModal(exam);
        }
        showToast("Failed to retrieve candidate credentials", "error");
      }
    } catch {
      showToast("Network error loading candidate passcodes", "error");
    } finally {
      setLoadingCredsExamId(null);
    }
  };

  const handleResendSingleCredEmail = async (studentId: string | undefined, studentName: string, email?: string) => {
    if (!credsModalData) return;
    setResendingStudentId(studentId || studentName);
    try {
      const url = studentId 
        ? `/exams/${credsModalData.examId}/resend-credentials-email?student_id=${studentId}`
        : `/exams/${credsModalData.examId}/resend-credentials-email`;
      const res = await apiFetch(url, { token, method: "POST" });
      if (res.ok) {
        showToast(`Email with credentials sent to ${email || studentName}!`, "success");
      } else {
        showToast(`Failed to send email to ${studentName}`, "error");
      }
    } catch {
      showToast("Network error sending email", "error");
    } finally {
      setResendingStudentId(null);
    }
  };

  const handleResendAllEmails = async () => {
    if (!credsModalData) return;
    setIsResendingAll(true);
    try {
      const res = await apiFetch(`/exams/${credsModalData.examId}/resend-credentials-email`, { token, method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showToast(`Dispatched credentials emails to all ${data.dispatched_count || credsModalData.creds.length} candidates!`, "success");
      } else {
        showToast("Failed to resend credentials emails", "error");
      }
    } catch {
      showToast("Network error resending emails", "error");
    } finally {
      setIsResendingAll(false);
    }
  };

  const handleCopySingleCred = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllCredentials = () => {
    if (!credsModalData || credsModalData.creds.length === 0) return;
    const portalUrl = `${getFrontendBaseUrl()}/exam/${credsModalData.examCode}`;
    let text = `📝 Assessment: ${credsModalData.examName} (Code: ${credsModalData.examCode})\n`;
    text += `🔗 Candidate Portal: ${portalUrl}\n\n`;
    text += `Candidate Credentials Roster:\n`;
    credsModalData.creds.forEach((c, idx) => {
      text += `${idx + 1}. ${c.student_name || "Student"} | Roll: ${c.roll_number || "N/A"} | User: ${c.username} | Passcode: ${c.password}\n`;
    });
    navigator.clipboard.writeText(text);
    showToast("All candidate credentials formatted and copied to clipboard!", "success");
  };

  const handleShareStudentWhatsApp = (c: any) => {
    if (!credsModalData) return;
    const portalUrl = `${getFrontendBaseUrl()}/exam/${credsModalData.examCode}?user=${encodeURIComponent(c.username)}&pin=${encodeURIComponent(c.password)}`;
    const message = 
      `🎓 *Testora Assessment Access Details*\n\n` +
      `Dear *${c.student_name || "Student"}*,\n` +
      `You are invited to attempt *${credsModalData.examName}*.\n\n` +
      `🔗 *Direct Access Link:* ${portalUrl}\n` +
      `🔑 *Exam Code:* ${credsModalData.examCode}\n` +
      `👤 *Username:* ${c.username}\n` +
      `🔒 *Passcode / PIN:* ${c.password}\n\n` +
      `_Tap the link above to directly access the exam portal._`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareAllWhatsApp = () => {
    if (!credsModalData) return;
    const portalUrl = `${getFrontendBaseUrl()}/exam/${credsModalData.examCode}`;
    const message = 
      `🎓 *Testora Assessment Invitation*\n\n` +
      `Assessment: *${credsModalData.examName}*\n` +
      `Exam Code: *${credsModalData.examCode}*\n` +
      `Portal Link: ${portalUrl}\n\n` +
      `Please use your assigned credentials sent via email/SMS to log in and attempt the exam.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyDirectExamLink = (code: string) => {
    const url = `${getFrontendBaseUrl()}/exam/${code}`;
    navigator.clipboard.writeText(url);
    showToast("Direct exam link copied to clipboard!", "success");
  };

  const filteredCreds = credsModalData?.creds.filter((c) => {
    const q = credsSearch.toLowerCase();
    return (
      (c.student_name && c.student_name.toLowerCase().includes(q)) ||
      (c.roll_number && c.roll_number.toLowerCase().includes(q)) ||
      (c.username && c.username.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }) || [];

  const liveCount = exams.filter((e) => getExamScheduleInfo(e).status === "live").length;
  const completedCount = exams.filter((e) => getExamScheduleInfo(e).status === "completed").length;
  const totalCount = exams.length;

  return (
    <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl overflow-hidden space-y-0 shadow-xs transition-colors">
      {/* Sleek, Cohesive Header (Mobile & Desktop Aligned) */}
      <div className="p-3.5 sm:p-5 border-b border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between gap-2.5 bg-white dark:bg-[#111C31]">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-1.5 h-6 rounded-full bg-blue-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F1F5F9] truncate leading-tight">
              {title || "Live Assessments"}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#A3B1C6] truncate sm:whitespace-normal mt-0.5">
              {description || "Manage and monitor your test sessions"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(showCreateButton || onOpenCreate) && onOpenCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Create Test</span>
            </button>
          )}

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
            >
              <span className="hidden xs:inline">View all</span>
              <span className="xs:hidden">All</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="p-3 sm:p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-[#E2E8F0] dark:border-[#263449]">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Active */}
          <div className="bg-white dark:bg-[#152238] border border-blue-100 dark:border-blue-900/40 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 fill-blue-600/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-[#F1F5F9] leading-none">
                {String(liveCount).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B] dark:text-[#A3B1C6] truncate mt-0.5">
                Active
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white dark:bg-[#152238] border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-[#F1F5F9] leading-none">
                {String(completedCount).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B] dark:text-[#A3B1C6] truncate mt-0.5">
                Completed
              </div>
            </div>
          </div>

          {/* Total Tests */}
          <div className="bg-white dark:bg-[#152238] border border-purple-100 dark:border-purple-900/40 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-[#F1F5F9] leading-none">
                {String(totalCount).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B] dark:text-[#A3B1C6] truncate mt-0.5">
                Total Tests
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Card List (< md) ─── */}
      <div className="block md:hidden p-3 sm:p-4 bg-slate-50/70 dark:bg-[#0B132B]/50 space-y-3.5">
        {activeDraft && (
          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border-l-4 border-l-amber-500 border border-amber-200/80 dark:border-amber-800/60 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Incomplete Draft (Step {activeDraft.createStep}/4)</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Expires in {activeDraft.daysLeft}d
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#111827] dark:text-[#F1F5F9]">{activeDraft.examName}</h4>
              <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                {activeDraft.examSubject} • {activeDraft.questionsCount} Qs • {activeDraft.duration} mins
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onDiscardDraft && (
                <button
                  type="button"
                  onClick={onDiscardDraft}
                  className="flex-1 h-9 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Expire Draft</span>
                </button>
              )}
              {onResumeDraft && (
                <button
                  type="button"
                  onClick={onResumeDraft}
                  className="flex-1 h-9 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Resume Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
        {exams.length === 0 ? (
          <div className="py-10 px-4 text-center text-xs text-[#64748B] dark:text-[#A3B1C6] bg-white dark:bg-[#111C31] rounded-2xl border border-slate-200 dark:border-slate-800">
            No assessments yet. Tap "Create Assessment" to generate your first exam.
          </div>
        ) : (
          exams.map((exam) => {
            const sched   = getExamScheduleInfo(exam);
            const isLoadingCreds = loadingCredsExamId === exam.id;
            const qCount  = exam.questions_count ?? 0;
            const examCode = exam.exam_code || exam.code || "";

            /* ── derive a single clean status label ── */
            type StatusKey = "draft_unpaid" | "draft_paid" | "scheduled" | "live" | "completed";
            let statusKey: StatusKey = "draft_unpaid";
            if (sched.status === "completed")  statusKey = "completed";
            else if (sched.status === "live")   statusKey = "live";
            else if (sched.status === "scheduled") statusKey = "scheduled";
            else if (exam.is_paid)              statusKey = "draft_paid";
            else                                statusKey = "draft_unpaid";

            const STATUS_UI: Record<StatusKey, { label: string; dot: string; pill: string }> = {
              draft_unpaid: { label: "Draft",     dot: "bg-amber-400",                        pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60" },
              draft_paid:   { label: "Draft",     dot: "bg-amber-400",                        pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60" },
              scheduled:    { label: "Scheduled", dot: "bg-blue-500",                         pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60" },
              live:         { label: "Live Active", dot: "bg-emerald-500 animate-pulse",     pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60" },
              completed:    { label: "Completed", dot: "bg-slate-400",                        pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
            };
            const ui = STATUS_UI[statusKey];

            return (
              <div
                key={exam.id}
                className="p-4 space-y-3 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/60 transition-all"
              >
                {/* ── Top row: File Icon + Title & Tag + QR Code Button ── */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[14px] sm:text-[15px] text-[#111827] dark:text-[#F1F5F9] leading-tight truncate">
                        {exam.name}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5 block">
                        ASSESSMENT
                      </span>
                    </div>
                  </div>

                  {/* QR icon */}
                  <button
                    type="button"
                    onClick={() => setQrModalExam(exam)}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-2xs"
                    aria-label="QR Code"
                    title="View QR Code Flyer"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>

                {/* ── Status & Payment Badges ── */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ui.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ui.dot}`} />
                    {ui.label}
                  </span>

                  {exam.is_paid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
                      <Check className="h-2.5 w-2.5 stroke-[2.5]" /> Paid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal && onOpenPaymentModal(exam)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 cursor-pointer hover:opacity-85"
                    >
                      <CreditCard className="h-2.5 w-2.5" /> Unpaid
                    </button>
                  )}
                </div>

                {/* ── Metadata Specs (Marks, Duration, Date) with Bordered Pills ── */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 text-[11px] font-semibold">
                    <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                    <span>{exam.total_marks ?? 50} marks</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 text-[11px] font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{exam.duration_minutes} min</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 text-[11px] font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{exam.start_time ? formatISTDate(exam.start_time) : "Flexible"}</span>
                  </span>
                </div>

                {/* ── Prominent Test Code Highlight Box ── */}
                <div className="rounded-xl bg-[#F0F5FF] dark:bg-[#15223E] border border-blue-200/80 dark:border-blue-900/70 p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1 h-3 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
                      TEST CODE
                    </div>
                    <div className="text-base sm:text-lg font-mono font-extrabold text-blue-950 dark:text-blue-100 tracking-wider mt-0.5 truncate">
                      {examCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(exam.id, examCode)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors shadow-2xs cursor-pointer shrink-0"
                    title="Copy Test Code"
                  >
                    {copiedExamId === exam.id ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* ── Quick Sharing Buttons Row ── */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyDirectExamLink(examCode)}
                    className="flex-1 h-8.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100/50 text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Link2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(exam)}
                    className="flex-1 h-8.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrModalExam(exam)}
                    className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-2xs"
                    title="QR Code & Flyer"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* ── Action Buttons Row ── */}
                <div className="flex items-center gap-2 pt-0.5">
                  {/* PRIMARY action — depends on state */}
                  {sched.status === "live" ? (
                    <button
                      type="button"
                      onClick={() => setLiveProctorExamId(exam.id)}
                      className="flex-1 h-9.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Radio className="h-3.5 w-3.5 animate-pulse shrink-0" />
                      <span>Live Monitor</span>
                    </button>
                  ) : !exam.is_published ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!exam.is_paid && onOpenPaymentModal) onOpenPaymentModal(exam);
                        else onPublishExam(exam.id);
                      }}
                      className="flex-1 h-9.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      {exam.is_paid
                        ? <><Sparkles className="h-3.5 w-3.5 shrink-0" /> <span>Publish</span></>
                        : <><CreditCard className="h-3.5 w-3.5 shrink-0" /> <span>Pay &amp; Publish</span></>
                      }
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoadingCreds}
                      onClick={() => handleOpenCredentialsPreview(exam)}
                      className="flex-1 h-9.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Key className="h-3.5 w-3.5 shrink-0" />
                      <span>{isLoadingCreds ? "Loading…" : "Credentials"}</span>
                    </button>
                  )}

                  {/* SECONDARY — Test Run */}
                  <a
                    href={`/exam/${examCode}?mode=teacher_preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-9.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 fill-emerald-600/20" />
                    <span>Test Run</span>
                  </a>

                  {/* MORE ··· */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownExamId(activeDropdownExamId === exam.id ? null : exam.id);
                      }}
                      className="w-9.5 h-9.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {activeDropdownExamId === exam.id && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownExamId(null);
                        }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-150"
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-full max-w-lg bg-white dark:bg-[#111C31] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[82dvh] animate-in slide-in-from-bottom duration-200 overflow-hidden"
                        >
                          {/* Sheet Drag Handle & Header */}
                          <div className="pt-3 pb-2.5 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5" />
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 pr-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Assessment Options
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {exam.name}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveDropdownExamId(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                                aria-label="Close menu"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Scrollable Actions Container */}
                          <div className="overflow-y-auto p-2.5 space-y-2 divide-y divide-slate-100 dark:divide-slate-800 overscroll-contain">
                            {/* Section 1: Performance & Results */}
                            <div className="space-y-1">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Analytics &amp; Results
                              </div>
                              {onOpenGradebook && (
                                <button
                                  type="button"
                                  onClick={() => { setActiveDropdownExamId(null); onOpenGradebook(exam); }}
                                  className="w-full px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                    <BarChart3 className="h-4 w-4" />
                                  </div>
                                  <span className="font-bold text-[13px]">Gradebook &amp; Results</span>
                                </button>
                              )}
                              {exam.is_published && (
                                <button
                                  type="button"
                                  onClick={() => { setActiveDropdownExamId(null); setLiveProctorExamId(exam.id); }}
                                  className="w-full px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                                    <Radio className="h-4 w-4 animate-pulse" />
                                  </div>
                                  <span className="font-semibold text-[13px]">Live Proctor Room</span>
                                </button>
                              )}
                            </div>

                            {/* Section 2: Manage & Studio */}
                            <div className="pt-2 space-y-1">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Manage &amp; Studio
                              </div>
                              <button
                                type="button"
                                onClick={() => { setActiveDropdownExamId(null); onPreviewExam(exam); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-[13px]">Question Studio</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setActiveDropdownExamId(null); handleOpenCredentialsPreview(exam); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Key className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="text-[13px]">Candidate Credentials</span>
                              </button>
                              <button
                                type="button"
                                disabled={cloningExamId === exam.id}
                                onClick={() => { setActiveDropdownExamId(null); handleCloneExam(exam); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <CopyPlus className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span className="text-[13px]">Reuse / Clone Test</span>
                              </button>
                            </div>

                            {/* Section 3: Share & Invite */}
                            <div className="pt-2 space-y-1">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Share &amp; Invite
                              </div>
                              <button
                                type="button"
                                onClick={() => { setActiveDropdownExamId(null); handleCopyDirectExamLink(exam.exam_code || exam.code); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-[13px]">Copy Direct Exam Link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setActiveDropdownExamId(null); handleShareWhatsApp(exam); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-[13px]">WhatsApp Invitation</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setActiveDropdownExamId(null); setQrModalExam(exam); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <QrCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="text-[13px]">QR Code Flyer</span>
                              </button>
                            </div>

                            {/* Section 4: Documents & Print */}
                            <div className="pt-2 space-y-1">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Documents &amp; Print
                              </div>
                              {onOpenCertificates && (
                                <button
                                  type="button"
                                  onClick={() => { setActiveDropdownExamId(null); onOpenCertificates(exam); }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span className="text-[13px]">Certificates &amp; Delivery</span>
                                </button>
                              )}
                              <a
                                href={`${API_V1}/exams/${exam.id}/pdf/question-paper${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActiveDropdownExamId(null)}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors"
                              >
                                <Printer className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-[13px]">Print Paper PDF</span>
                              </a>
                              {exam.is_paid && (
                                <a
                                  href={`${API_V1}/payments/receipt/${exam.id}/html${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveDropdownExamId(null)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                  <Receipt className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span className="text-[13px]">Official Tax Invoice</span>
                                </a>
                              )}
                            </div>

                            {/* Section 5: Lifecycle / Danger */}
                            <div className="pt-2 pb-4 space-y-1">
                              {exam.is_published && (!sched || sched.status === "live" || sched.status === "scheduled") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    onEndExamEarly(exam.id, exam.name);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                  <StopCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span className="text-[13px]">End Assessment Early</span>
                                </button>
                              )}
                              {deleteConfirmId === exam.id ? (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-200 dark:border-rose-900/60 my-1">
                                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-2">
                                    Are you sure you want to delete this assessment permanently?
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteExam(exam.id);
                                        setDeleteConfirmId(null);
                                        setActiveDropdownExamId(null);
                                      }}
                                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(exam.id)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-3 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
                                  <span className="text-[13px]">Delete Assessment</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-x-auto min-h-[380px] pb-28">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold tracking-wider uppercase">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assessment &amp; Code</th>
              <th className="py-3 px-4">Questions</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Schedule Window</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
            {activeDraft && (
              <tr className="bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-l-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Incomplete Draft</span>
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                    <span className="truncate max-w-[240px]">{activeDraft.examName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                      Step {activeDraft.createStep}/4
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] flex items-center gap-1.5 mt-0.5">
                    <span>{activeDraft.examSubject}</span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">Auto-expires in {activeDraft.daysLeft} days</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-[#111827] dark:text-[#F1F5F9] font-medium">
                  {activeDraft.questionsCount} Qs ({activeDraft.marks} pts)
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-[#111827] dark:text-[#F1F5F9] font-medium">
                  {activeDraft.duration} mins
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-[#64748B] dark:text-[#A3B1C6]">
                  <span className="text-xs">Setup in progress</span>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {onDiscardDraft && (
                      <button
                        type="button"
                        onClick={onDiscardDraft}
                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Expire / Discard this draft"
                      >
                        Expire Draft
                      </button>
                    )}
                    {onResumeDraft && (
                      <button
                        type="button"
                        onClick={onResumeDraft}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Resume Setup</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {exams.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#64748B] dark:text-[#A3B1C6]">
                  No assessments created yet. Click "Create Assessment" to synthesize a new examination.
                </td>
              </tr>
            ) : (
              exams.map((exam, idx) => {
                const sched = getExamScheduleInfo(exam);
                const isLoadingCreds = loadingCredsExamId === exam.id;
                const isNearBottom = idx >= Math.max(0, exams.length - 2);

                return (
                  <tr
                    key={exam.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors group"
                  >
                    {/* Status & Payment Tag */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-shadow ${
                            sched.status === "live"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700 shadow-xs shadow-emerald-500/10"
                              : sched.status === "scheduled"
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-700"
                              : sched.status === "draft"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700"
                              : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span className="relative flex h-2 w-2">
                            {sched.status === "live" && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${sched.dot}`} />
                          </span>
                          <span className="tracking-wide">{sched.label}</span>
                        </div>
                        {exam.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenPaymentModal && onOpenPaymentModal(exam)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer transition-all"
                            title="Activation Required"
                          >
                            <CreditCard className="h-2.5 w-2.5 text-rose-600" />
                            <span>Unpaid</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Title & Exam Code */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onPreviewExam(exam)}
                        className="font-bold text-[13.5px] text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                        title="Open Question Studio"
                      >
                        {exam.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(exam.exam_code || exam.code);
                            showToast("Exam code copied!", "success");
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-slate-700 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                          title="Click to copy exam code"
                        >
                          <span>{exam.exam_code || exam.code}</span>
                          <Copy className="h-2.5 w-2.5 opacity-50" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyDirectExamLink(exam.exam_code || exam.code)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                          title="Copy Direct Exam Link"
                        >
                          <ExternalLink className="h-2.5 w-2.5 text-blue-500" />
                          <span>Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(exam)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800 transition-colors cursor-pointer shadow-2xs"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </td>

                    {/* Questions & Points */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100">
                        {exam.questions_count || (exam.questions_json ? JSON.parse(exam.questions_json).length : 0)} Qs
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {exam.total_marks ?? 0} pts total
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{exam.duration_minutes}m</span>
                      </span>
                    </td>

                    {/* Schedule Window */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-400 font-medium max-w-[220px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{formatExamScheduleRange(exam.start_time, exam.end_time)}</span>
                      </div>
                    </td>

                    {/* Actions Column: Clean Contextual Buttons + More Actions Dropdown */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Primary Contextual Action Button */}
                        {exam.is_published && sched.status === "live" ? (
                          <button
                            type="button"
                            onClick={() => setLiveProctorExamId(exam.id)}
                            className="h-8 px-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                            title="Open Real-time Live Proctoring Room"
                          >
                            <Radio className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
                            <span>Live Monitor</span>
                          </button>
                        ) : !exam.is_published ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!exam.is_paid && onOpenPaymentModal) {
                                onOpenPaymentModal(exam);
                              } else {
                                onPublishExam(exam.id);
                              }
                            }}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title={exam.is_paid ? "Publish Assessment Live to Students" : "Pay & Publish Assessment Live"}
                          >
                            {exam.is_paid ? <Sparkles className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                            <span>{exam.is_paid ? "Publish" : "Pay & Publish"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoadingCreds}
                            onClick={() => handleOpenCredentialsPreview(exam)}
                            className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Preview & Generate Candidate Passcodes & Credentials"
                          >
                            {isLoadingCreds ? (
                              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Key className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span>Credentials</span>
                          </button>
                        )}

                        {/* 2. Secondary Quick Action: Test Run */}
                        <a
                          href={`/exam/${exam.exam_code || exam.code}?mode=teacher_preview`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                          title="Simulate Assessment as Student (Sandbox)"
                        >
                          <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Test Run</span>
                        </a>

                        {/* 3. Dropdown Menu Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownExamId(activeDropdownExamId === exam.id ? null : exam.id);
                              setDeleteConfirmId(null);
                            }}
                            className={`h-8 w-8 rounded-lg border transition-colors flex items-center justify-center cursor-pointer shadow-2xs ${
                              activeDropdownExamId === exam.id
                                ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                            title="More Actions"
                            aria-label="More Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {activeDropdownExamId === exam.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              onWheel={(e) => e.stopPropagation()}
                              style={{ maxHeight: "280px", overflowY: "auto", scrollbarGutter: "stable" }}
                              className={`absolute right-0 ${
                                isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                              } w-64 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-slate-700/80 shadow-2xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[280px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] hover:[scrollbar-color:#64748b_transparent]`}
                            >
                              {/* Section 1: Performance & Results */}
                              <div className="p-1 space-y-0.5">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Analytics &amp; Results
                                </div>
                                {onOpenGradebook && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownExamId(null);
                                      onOpenGradebook(exam);
                                    }}
                                    className="w-full px-2.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                      <BarChart3 className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-bold">Gradebook &amp; Results</span>
                                  </button>
                                )}

                                {exam.is_published && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownExamId(null);
                                      setLiveProctorExamId(exam.id);
                                    }}
                                    className="w-full px-2.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                                    </div>
                                    <span className="font-semibold">Live Proctor Room</span>
                                  </button>
                                )}
                              </div>

                              {/* Section 2: Core Assessment Tools */}
                              <div className="p-1 space-y-0.5">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Manage &amp; Studio
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    onPreviewExam(exam);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Question Studio &amp; Preview</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isLoadingCreds}
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    handleOpenCredentialsPreview(exam);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Key className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>Candidate Passcodes</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={cloningExamId === exam.id}
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    handleCloneExam(exam);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <CopyPlus className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                  <span>Reuse / Clone Test</span>
                                </button>
                              </div>

                              {/* Section 3: Share & Distribute */}
                              <div className="p-1 space-y-0.5">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Share &amp; Invite
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    handleCopyDirectExamLink(exam.exam_code || exam.code);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Copy Direct Exam Link</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    handleShareWhatsApp(exam);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Share via WhatsApp</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownExamId(null);
                                    setQrModalExam(exam);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span>QR Code Flyer</span>
                                </button>
                              </div>

                              {/* Section 4: Print & Certificates */}
                              <div className="p-1 space-y-0.5">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Documents &amp; Print
                                </div>
                                {onOpenCertificates && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownExamId(null);
                                      onOpenCertificates(exam);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span>Certificates &amp; Delivery</span>
                                  </button>
                                )}

                                <a
                                  href={`${API_V1}/exams/${exam.id}/pdf/question-paper${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setActiveDropdownExamId(null)}
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors"
                                >
                                  <Printer className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span>Print Paper PDF</span>
                                </a>

                                {exam.is_paid && (
                                  <a
                                    href={`${API_V1}/payments/receipt/${exam.id}/html${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setActiveDropdownExamId(null)}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2.5 transition-colors"
                                  >
                                    <Receipt className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <span>Official Tax Invoice</span>
                                  </a>
                                )}
                              </div>

                              {/* Section 5: Lifecycle / Danger */}
                              <div className="p-1 space-y-0.5">
                                {exam.is_published && (!sched || sched.status === "live" || sched.status === "scheduled") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownExamId(null);
                                      onEndExamEarly(exam.id, exam.name);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <StopCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span>End Assessment Early</span>
                                  </button>
                                )}

                                {deleteConfirmId === exam.id ? (
                                  <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900/60">
                                    <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mb-1.5">
                                      Delete permanently?
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteExam(exam.id);
                                          setDeleteConfirmId(null);
                                          setActiveDropdownExamId(null);
                                        }}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(exam.id)}
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                    <span>Delete Assessment</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════ QR CODE FLYER MODAL ═══════ */}
      {qrModalExam && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setQrModalExam(null)}
        >
          <div 
            className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalExam(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#64748B] hover:bg-[#E2E8F0]/40 dark:hover:bg-[#263449] transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172B4D] dark:text-[#60A5FA] border border-[#2563EB]/20 mb-1">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">{qrModalExam.name}</h3>
              <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">Scan with mobile camera to launch exam portal</p>
            </div>

            {/* High-Resolution QR Code */}
            <div className="bg-white p-4 inline-block mx-auto rounded-xl border border-[#E2E8F0] shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${getFrontendBaseUrl()}/exam/${qrModalExam.exam_code}`
                )}`}
                alt={`QR Code for ${qrModalExam.name}`}
                className="w-44 h-44 mx-auto rounded"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] truncate text-[11px]">
                  {getFrontendBaseUrl()}/exam/{qrModalExam.exam_code}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${getFrontendBaseUrl()}/exam/${qrModalExam.exam_code}`);
                    showToast("Exam portal URL copied to clipboard!", "success");
                  }}
                  className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] px-2 py-1 rounded text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
                >
                  Copy
                </button>
              </div>

              <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                Exam Code: <b className="font-mono text-[#2563EB] dark:text-[#60A5FA]">{qrModalExam.exam_code}</b>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print QR Code Flyer</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════ GENERATED CREDENTIALS PREVIEW MODAL ═══════ */}
      {credsModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn"
          onClick={() => setCredsModalData(null)}
        >
          <div 
            className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#263449] pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172B4D] dark:text-[#60A5FA] rounded-xl border border-[#2563EB]/20">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111827] dark:text-[#F1F5F9]">
                    Candidate Access Credentials Preview
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
                    Assessment: <b className="text-[#2563EB] dark:text-[#60A5FA]">{credsModalData.examName}</b> ({credsModalData.examCode}) • {credsModalData.creds.length} Candidates Enrolled
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredsModalData(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#E2E8F0]/40 dark:hover:bg-[#263449] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Bulk Copy / Resend Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={credsSearch}
                  onChange={(e) => setCredsSearch(e.target.value)}
                  placeholder="Search candidate name, email, roll number, or username..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopyDirectExamLink(credsModalData.examCode)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[#172B4D] text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Copy direct shareable exam URL"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareAllWhatsApp}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Share assessment invitation on WhatsApp"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp Invite</span>
                </button>

                <button
                  type="button"
                  disabled={isResendingAll}
                  onClick={handleResendAllEmails}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[#172B4D] text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Resend access passcodes email to all enrolled candidates"
                >
                  {isResendingAll ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  <span>Resend All Emails</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] text-xs font-semibold text-[#64748B] hover:text-[#111827] dark:hover:text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Copy formatted list of all candidate credentials"
                >
                  <Copy className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span>Copy All</span>
                </button>
              </div>
            </div>

            {/* Credentials Preview (Mobile Cards + Desktop Table) */}
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC]/50 dark:bg-[#17243A]/50">
              {filteredCreds.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B] dark:text-[#A3B1C6]">
                  {credsSearch ? "No credentials match your search." : "No credentials generated yet."}
                </div>
              ) : (
                <>
                  {/* Mobile Stacked Card View (< 768px) */}
                  <div className="block md:hidden divide-y divide-[#E2E8F0] dark:divide-[#263449]">
                    {filteredCreds.map((c, idx) => {
                      const rowKey = `${c.username}_${idx}`;
                      const isCopied = copiedKey === rowKey;
                      const isSendingEmail = resendingStudentId === (c.student_id || c.student_name);

                      return (
                        <div key={idx} className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#242321] dark:text-[#F5F5F4] truncate">
                                {c.student_name || "Enrolled Student"}
                              </div>
                              {c.email && (
                                <div className="text-[10px] text-[#716D67] truncate font-mono">{c.email}</div>
                              )}
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524] text-[#716D67] shrink-0">
                              Roll: {c.roll_number || "—"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-white dark:bg-[#171615] p-2.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-[11px]">
                            <div>
                              <span className="text-[10px] text-[#716D67] block">Exam Username</span>
                              <span className="font-mono font-bold text-[#C84B18] text-xs break-all">
                                {c.username}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#716D67] block">Timed Passcode</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5 text-xs inline-block mt-0.5">
                                {c.password}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleShareStudentWhatsApp(c)}
                              className="flex-1 py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                              title="Share personalized exam link & credentials on WhatsApp"
                            >
                              <Share2 className="h-3 w-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSendingEmail}
                              onClick={() => handleResendSingleCredEmail(c.student_id, c.student_name, c.email)}
                              className="flex-1 py-1.5 px-2 rounded-lg border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#716D67] hover:text-[#C84B18] bg-white dark:bg-[#171615] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            >
                              {isSendingEmail ? (
                                <div className="w-3 h-3 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Mail className="h-3.5 w-3.5" />
                              )}
                              <span>Email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopySingleCred(`User: ${c.username}\nPIN: ${c.password}\nPortal: ${getFrontendBaseUrl()}/exam/${credsModalData.examCode}?user=${encodeURIComponent(c.username)}&pin=${encodeURIComponent(c.password)}`, rowKey)}
                              className="flex-1 py-1.5 px-2 rounded-lg border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#716D67] hover:text-[#C84B18] bg-white dark:bg-[#171615] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (>= 768px) */}
                  <div className="hidden md:block">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#F8FAFC] dark:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6] uppercase font-bold sticky top-0 z-10 border-b border-[#E2E8F0] dark:border-[#263449]">
                        <tr>
                          <th className="py-2.5 px-3">Candidate</th>
                          <th className="py-2.5 px-3">Roll No.</th>
                          <th className="py-2.5 px-3">Exam Username</th>
                          <th className="py-2.5 px-3">Timed PIN</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
                        {filteredCreds.map((c, idx) => {
                          const rowKey = `${c.username}_${idx}`;
                          const isCopied = copiedKey === rowKey;
                          const isSendingEmail = resendingStudentId === (c.student_id || c.student_name);

                          return (
                            <tr key={idx} className="hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] transition-all">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-[#111827] dark:text-[#F1F5F9]">
                                  {c.student_name || "Enrolled Student"}
                                </div>
                                {c.email && (
                                  <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] font-mono">{c.email}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#64748B] dark:text-[#A3B1C6] text-[11px]">
                                {c.roll_number || "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] text-[11px]">
                                {c.username}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5 text-xs">
                                  {c.password}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleShareStudentWhatsApp(c)}
                                    className="px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all inline-flex items-center gap-1 cursor-pointer"
                                    title={`Share personalized credentials & link to ${c.student_name} on WhatsApp`}
                                  >
                                    <Share2 className="h-3 w-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isSendingEmail}
                                    onClick={() => handleResendSingleCredEmail(c.student_id, c.student_name, c.email)}
                                    className="px-2 py-1 rounded border border-[#E2E8F0] dark:border-[#263449] text-[11px] font-semibold text-[#64748B] hover:text-[#2563EB] hover:bg-white dark:hover:bg-[#111C31] transition-all inline-flex items-center gap-1 cursor-pointer"
                                    title={`Resend passcode email to ${c.email || c.student_name}`}
                                  >
                                    {isSendingEmail ? (
                                      <div className="w-3 h-3 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Mail className="h-3 w-3" />
                                    )}
                                    <span className="hidden sm:inline">Send Email</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopySingleCred(`User: ${c.username}\nPIN: ${c.password}\nPortal: ${getFrontendBaseUrl()}/exam/${credsModalData.examCode}?user=${encodeURIComponent(c.username)}&pin=${encodeURIComponent(c.password)}`, rowKey)}
                                    className="px-2 py-1 rounded border border-[#E2E8F0] dark:border-[#263449] text-[11px] font-semibold text-[#64748B] hover:text-[#2563EB] hover:bg-white dark:hover:bg-[#111C31] transition-all inline-flex items-center gap-1 cursor-pointer"
                                    title="Copy candidate login credentials"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span className="text-emerald-600">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
              <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Passcodes are sent automatically to students' authorized emails.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onDownloadCredentialsCSV(credsModalData.examId, credsModalData.examName)}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Passcodes CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCredsModalData(null)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold text-[#64748B] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Proctoring & Telemetry Modal */}
      {liveProctorExamId && (
        <LiveProctoringModal
          examId={liveProctorExamId}
          exam={exams.find((e) => e.id === liveProctorExamId || e.exam_id === liveProctorExamId)}
          onClose={() => setLiveProctorExamId(null)}
        />
      )}
    </div>
  );
}
