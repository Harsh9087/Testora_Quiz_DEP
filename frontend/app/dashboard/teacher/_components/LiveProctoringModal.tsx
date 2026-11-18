"use client";

import { useState, useEffect } from "react";
import { 
  X, Radio, Users, Clock, ShieldAlert, CheckCircle2, 
  AlertTriangle, RefreshCw, Plus, Play, Pause, Search, UserCheck,
  AlertOctagon, Flame, UserPlus, RotateCcw, Award, History
} from "lucide-react";
import { API_V1, apiFetch, getWebSocketUrl } from "../../../../lib/api";
import { useAuthStore } from "../../../../store/authStore";
import { useToast } from "../../../../components/Toast";
import { formatISTTime } from "../../../../lib/dateUtils";
import AddStudentToExamModal from "./AddStudentToExamModal";
import ReattemptConfirmModal from "./ReattemptConfirmModal";
import CandidateAttemptsModal from "./CandidateAttemptsModal";

interface LiveProctoringModalProps {
  examId?: string;
  exam?: any;
  alerts?: any[];
  onClose: () => void;
  onEndExamEarly?: (examId: string, examName: string) => Promise<void> | void;
}

export default function LiveProctoringModal({
  examId,
  exam,
  alerts,
  onClose,
  onEndExamEarly,
}: LiveProctoringModalProps) {
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const targetExamId = examId || exam?.id || exam?.exam_id;
  const [telemetry, setTelemetry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExtending, setIsExtending] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<any[]>(alerts || []);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  // Post-deployment enrollment & reattempt modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedCandidateForReattempt, setSelectedCandidateForReattempt] = useState<any | null>(null);
  const [selectedCandidateForAttempts, setSelectedCandidateForAttempts] = useState<any | null>(null);

  const fetchLiveTelemetry = async () => {
    if (!targetExamId) return;
    try {
      const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("token") || "") : "");
      const res = await apiFetch(`/exams/${targetExamId}/live-monitor`, { token: activeToken });
      if (res.ok) {
        setTelemetry(await res.json());
        setFetchError(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.detail || "Unable to load live telemetry");
      }
    } catch (err: any) {
      setFetchError(err?.message || "Connection error to telemetry monitor");
    } finally {
      setLoading(false);
    }
  };

  // Real-time WebSocket connection to proctoring telemetry channel
  useEffect(() => {
    if (!targetExamId) return;
    let ws: WebSocket | null = null;
    try {
      const wsUrl = getWebSocketUrl(`/api/v1/attempts/ws/teacher/${targetExamId}`);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const alertData = JSON.parse(event.data);
          setLiveAlerts((prev) => [alertData, ...prev.slice(0, 49)]);
          showToast(`⚠️ Proctor Violation: ${alertData.student_name} (${alertData.event_type.replace("_", " ")})`, "error");
          fetchLiveTelemetry();
        } catch {}
      };

      ws.onerror = (e) => {
        console.warn("Proctoring WebSocket notice:", e);
      };
    } catch (err) {
      console.warn("WebSocket init exception:", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [targetExamId]);

  useEffect(() => {
    if (!targetExamId) return;
    fetchLiveTelemetry();

    if (!autoRefresh) return;
    const interval = setInterval(fetchLiveTelemetry, 4000); // 4s live polling heartbeat
    return () => clearInterval(interval);
  }, [token, targetExamId, autoRefresh]);

  const handleExtendTime = async (minutes: number = 10) => {
    if (!targetExamId) return;
    setIsExtending(true);
    try {
      const res = await apiFetch(`/exams/${targetExamId}/extend-time`, {
        method: "POST",
        token,
        body: JSON.stringify({ extra_minutes: minutes }),
      });
      if (res.ok) {
        showToast(`Granted +${minutes} minutes to all active candidates!`, "success");
        fetchLiveTelemetry();
      } else {
        showToast("Failed to extend exam time", "error");
      }
    } catch {
      showToast("Network error extending time", "error");
    } finally {
      setIsExtending(false);
    }
  };

  const filteredCandidates = (telemetry?.candidates || []).filter((c: any) => {
    if (!c.name || c.name.toLowerCase().includes("anonymous")) {
      return false;
    }
    const s = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.roll_number && c.roll_number.toLowerCase().includes(s)) ||
      (c.username && c.username.toLowerCase().includes(s))
    );
  });

  const renderStatusBadge = (c: any) => {
    const attemptBadge = (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
        Attempt #{c.attempt_number || 1}
      </span>
    );

    if (c.status === "auto_submitted" || c.raw_status === "auto_submitted") {
      const reasonDisplay = c.auto_submit_reason ? c.auto_submit_reason.replace("_", " ").toUpperCase() : "TAB SWITCH";
      const timeStr = c.submitted_at_ist
        ? (c.submitted_at_ist.includes("IST") ? c.submitted_at_ist : `${c.submitted_at_ist} IST`)
        : null;
      return (
        <div className="flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] flex items-center gap-1 shrink-0 uppercase tracking-wide">
              <AlertOctagon className="h-3 w-3" />
              <span>AUTO-SUBMITTED</span>
            </span>
            {attemptBadge}
          </div>
          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
            Reason: {reasonDisplay}
          </span>
          {timeStr && (
            <span className="text-[9px] text-[#716D67] dark:text-[#A8A29E] font-mono">
              {timeStr}
            </span>
          )}
        </div>
      );
    }
    if (c.status === "submitted" || c.raw_status === "submitted") {
      const timeStr = c.submitted_at_ist
        ? (c.submitted_at_ist.includes("IST") ? c.submitted_at_ist : `${c.submitted_at_ist} IST`)
        : null;
      return (
        <div className="flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              <span>Submitted</span>
            </span>
            {attemptBadge}
          </div>
          {timeStr && (
            <span className="text-[9px] text-[#716D67] dark:text-[#A8A29E] font-mono">
              {timeStr}
            </span>
          )}
        </div>
      );
    }
    if (c.status === "in_progress") {
      if (c.connection_status === "online") {
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Answering Now</span>
            </span>
            {attemptBadge}
          </div>
        );
      }
      if (c.connection_status === "disconnected") {
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-amber-600" />
              <span>Disconnected</span>
            </span>
            {attemptBadge}
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[10px] flex items-center gap-1 shrink-0">
            <span>Offline</span>
          </span>
          {attemptBadge}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-[10px] shrink-0">
          Not Started
        </span>
        {attemptBadge}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C31] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-6xl w-full p-3 sm:p-5 shadow-2xl space-y-2.5 sm:space-y-4 max-h-[90dvh] sm:max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-1 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 sm:pb-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="relative p-1.5 sm:p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 shrink-0">
                <Radio className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate">
                    Live Monitor: {telemetry?.exam?.name || exam?.name || "Assessment"}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{telemetry?.exam?.exam_code || exam?.exam_code || exam?.code || "—"}</span> • Real-time focus tracking
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Action buttons row - horizontal scrollable on mobile so it never overflows or wraps awkwardly */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-xs">
            {/* Auto-Refresh Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {autoRefresh ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
              <span>{autoRefresh ? "Live Sync (4s)" : "Paused"}</span>
            </button>

            {/* Live Violations Stream Button */}
            <button
              type="button"
              onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                liveAlerts.length > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <ShieldAlert className="h-3 w-3 text-rose-600" />
              <span>Violations ({liveAlerts.length})</span>
            </button>

            {/* Post-Deployment Add Student Button */}
            <button
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Add a student to this deployed exam"
            >
              <UserPlus className="h-3 w-3" />
              <span>+ Add Student</span>
            </button>

            {/* Grant +10 Mins Button */}
            <button
              type="button"
              disabled={isExtending}
              onClick={() => handleExtendTime(10)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              title="Add 10 extra minutes for all candidates"
            >
              <Clock className="h-3 w-3" />
              <span>+10 Mins</span>
            </button>

            {/* End Assessment Early Button */}
            {onEndExamEarly && (
              <button
                type="button"
                onClick={() => onEndExamEarly(targetExamId, telemetry?.exam?.name || "Assessment")}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Immediately terminate this assessment window for all candidates"
              >
                <AlertOctagon className="h-3 w-3" />
                <span>End Early</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Bar - compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 text-center">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {telemetry?.summary?.total_assigned || 0}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Total
            </div>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-2 sm:p-2.5 text-center">
            <div className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400">
              {telemetry?.summary?.active_in_room ?? telemetry?.summary?.logged_in ?? 0}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Active In Room
            </div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-2 sm:p-2.5 text-center">
            <div className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400">
              {telemetry?.summary?.answering_now ?? telemetry?.summary?.in_progress ?? 0}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Answering Now
            </div>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-2 sm:p-2.5 text-center">
            <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {telemetry?.summary?.submitted || 0}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Finished & Submitted
            </div>
          </div>
        </div>

        {/* Live Proctoring Violations Stream (Collapsible or visible if infractions occurred) */}
        {showAlertsDrawer && (
          <div className="border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-600" />
                Live Anti-Cheat Interceptions Stream ({liveAlerts.length})
              </span>
              <button
                type="button"
                onClick={() => setLiveAlerts([])}
                className="text-[11px] underline hover:text-rose-900 dark:hover:text-white"
              >
                Clear Feed
              </button>
            </div>
            {liveAlerts.length === 0 ? (
              <p className="text-[11px] text-[#716D67]">No proctoring violations recorded yet for this session.</p>
            ) : (
              <div className="space-y-1.5">
                {liveAlerts.map((alt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-[#1C1A18] px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#242321] dark:text-[#F5F5F4]">{alt.student_name}</span>
                      {alt.roll_number && <span className="text-[#716D67] font-mono text-[10px]">({alt.roll_number})</span>}
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[9px] uppercase tracking-wider">
                        {alt.event_type}
                      </span>
                      <span className="text-[#716D67] truncate max-w-[120px] sm:max-w-[240px]">{alt.event_details}</span>
                    </div>
                    <span className="text-[10px] text-[#716D67] font-mono shrink-0">
                      {formatISTTime(alt.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#716D67]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search active candidate by name, email or roll number..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs text-[#242321] dark:text-[#F5F5F4] focus:outline-none"
            />
          </div>
        </div>

        {/* Live Candidates Table */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-contain border border-slate-200 dark:border-slate-800 rounded-xl touch-pan-y">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#C84B18] mx-auto" />
              <p className="text-xs text-[#716D67]">Connecting to proctoring websocket stream...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#716D67] space-y-2">
              {fetchError ? (
                <>
                  <p className="text-rose-600 dark:text-rose-400 font-semibold">{fetchError}</p>
                  <button
                    type="button"
                    onClick={fetchLiveTelemetry}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Retry Live Sync
                  </button>
                </>
              ) : searchTerm ? (
                <p>No active candidates match your filter.</p>
              ) : (
                <p>No candidates enrolled or active in this assessment session yet.</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Stacked Cards (< 768px): All specifications visible at a single glance without horizontal scrolling */}
              <div className="block md:hidden divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                {filteredCandidates.map((c: any) => {
                  const progressPct = c.total_questions > 0 ? (c.answered_count / c.total_questions) * 100 : 0;
                  return (
                    <div key={c.candidate_id || c.credential_id} className="p-3.5 space-y-2.5">
                      {/* Candidate Name, Testing Dot & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 truncate">
                            <span className="truncate">{c.name}</span>
                            {c.status === "in_progress" && c.connection_status === "online" && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online" />
                            )}
                            {c.status === "in_progress" && c.connection_status === "disconnected" && (
                              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Disconnected" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#716D67] truncate">{c.email}</div>
                        </div>

                        {renderStatusBadge(c)}
                      </div>

                      {/* Metadata specs: Username, Roll, Proctor Flags, Score */}
                      <div className="grid grid-cols-2 gap-2 bg-[#F7F4EF]/70 dark:bg-[#141312] p-2.5 rounded-xl border border-[#E5E0D8]/70 dark:border-[#292524] text-[11px]">
                        <div>
                          <span className="text-[10px] text-[#716D67] block">Exam Username</span>
                          <span className="font-mono text-[#242321] dark:text-[#F5F5F4] font-bold break-all">
                            {c.username}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#716D67] block">Roll Number</span>
                          <span className="font-mono text-[#716D67] dark:text-[#A8A29E] break-all">
                            {c.roll_number || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between col-span-2 pt-1.5 border-t border-[#E5E0D8]/50 dark:border-[#292524]">
                          <div>
                            <span className="text-[10px] text-[#716D67] block">Proctor Telemetry</span>
                            {c.proctor_flags_count > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-900">
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                <span>{c.proctor_flags_count} {c.proctor_flags_count === 1 ? "flag" : "flags"}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Clean</span>
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#716D67] block">Current Score</span>
                            <span className="font-bold text-xs text-[#242321] dark:text-[#F5F5F4]">
                              {c.score !== null ? `${c.score} pts` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#716D67]">
                          <span>Progress: {c.answered_count} / {c.total_questions} Questions</span>
                          <span className="font-bold text-[#C84B18]">{Math.round(progressPct)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E5E0D8] dark:bg-[#292524] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C84B18] transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Controlled Reattempt Action if Eligible */}
                      {c.can_grant_reattempt && (
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForReattempt(c)}
                          className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Authorize Reattempt</span>
                        </button>
                      )}

                      {/* View Attempts History if Multiple */}
                      {c.attempts_history && c.attempts_history.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForAttempts(c)}
                          className="w-full py-1 px-2 border border-[#E5E0D8] dark:border-[#292524] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-[#716D67] hover:text-[#242321] dark:hover:text-white"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>View All Attempts ({c.attempts_history.length})</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block min-w-full">
                <table className="w-full min-w-[880px] text-left text-xs border-collapse">
                  <thead className="bg-[#F7F4EF] dark:bg-[#141312] border-b border-[#E5E0D8] dark:border-[#292524] sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[180px] text-left">Candidate</th>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[160px] text-left">Username / Roll</th>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[160px] text-left">Status</th>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[110px] text-left">Proctoring</th>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[150px] text-left">Progress</th>
                      <th className="py-2.5 px-4 font-bold text-[#716D67] min-w-[140px] text-right whitespace-nowrap">Score &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                    {filteredCandidates.map((c: any) => {
                      const progressPct = c.total_questions > 0 ? (c.answered_count / c.total_questions) * 100 : 0;
                      return (
                        <tr key={c.candidate_id || c.credential_id} className="hover:bg-[#F7F4EF]/60 dark:hover:bg-[#1D1B19]/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.status === "in_progress" && c.connection_status === "online" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online" />
                              )}
                              {c.status === "in_progress" && c.connection_status === "disconnected" && (
                                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Disconnected" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#716D67]">{c.email}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono text-[#242321] dark:text-[#F5F5F4] text-[11px] font-bold">{c.username}</div>
                            <div className="text-[11px] text-[#716D67]">Roll: {c.roll_number}</div>
                          </td>

                          <td className="py-3 px-4">
                            {renderStatusBadge(c)}
                          </td>

                          <td className="py-3 px-4">
                            {c.proctor_flags_count > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-900">
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                <span>{c.proctor_flags_count} {c.proctor_flags_count === 1 ? "flag" : "flags"}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Clean</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] text-[#716D67]">
                                <span>{c.answered_count} / {c.total_questions} Questions</span>
                                <span>{Math.round(progressPct)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#E5E0D8] dark:bg-[#292524] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#C84B18] transition-all"
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-bold text-[#242321] dark:text-[#F5F5F4]">
                              {c.score !== null ? `${c.score} pts` : "—"}
                            </div>
                            {c.can_grant_reattempt && (
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateForReattempt(c)}
                                className="mt-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer ml-auto whitespace-nowrap"
                                title="Authorize a controlled reattempt for tab-switch infraction"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reattempt</span>
                              </button>
                            )}
                            {c.attempts_history && c.attempts_history.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateForAttempts(c)}
                                className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 ml-auto cursor-pointer whitespace-nowrap"
                              >
                                <History className="h-3 w-3" />
                                <span>{c.attempts_history.length} attempts</span>
                              </button>
                            )}
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

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
          <div className="text-[11px] text-[#716D67] text-center sm:text-left">
            Showing <b>{filteredCandidates.length}</b> candidates • Telemetry updates live
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#716D67] hover:text-[#242321] hover:bg-[#F7F4EF] dark:hover:bg-[#1D1B19] transition-colors cursor-pointer text-center"
          >
            Close Room
          </button>
        </div>

        {/* Sub-modals */}
        {showAddStudentModal && (
          <AddStudentToExamModal
            examId={targetExamId}
            examName={telemetry?.exam?.name || "Assessment"}
            onClose={() => setShowAddStudentModal(false)}
            onSuccess={() => fetchLiveTelemetry()}
          />
        )}
        {selectedCandidateForReattempt && (
          <ReattemptConfirmModal
            examId={targetExamId}
            candidate={selectedCandidateForReattempt}
            onClose={() => setSelectedCandidateForReattempt(null)}
            onSuccess={() => fetchLiveTelemetry()}
          />
        )}
        {selectedCandidateForAttempts && (
          <CandidateAttemptsModal
            examId={targetExamId}
            candidate={selectedCandidateForAttempts}
            onClose={() => setSelectedCandidateForAttempts(null)}
            onSuccess={() => fetchLiveTelemetry()}
          />
        )}
      </div>
    </div>
  );
}
