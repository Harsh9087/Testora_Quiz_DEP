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
  AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ExamItem {
  id: string;
  name: string;
  exam_code: string;
  status: "published" | "draft" | "completed";
  creator_name: string;
  creator_email: string;
  institution_name: string;
  questions_count: number;
  duration_minutes: number;
  total_marks: number;
  is_paid: boolean;
  submissions_count: number;
  created_at?: string;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Emergency Stop Modal
  const [stopTargetExam, setStopTargetExam] = useState<ExamItem | null>(null);
  const [stopReason, setStopReason] = useState("");
  const [stopping, setStopping] = useState(false);
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
        throw new Error("Failed to load assessments");
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

  const handleEmergencyStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopTargetExam || !stopReason.trim()) return;

    try {
      setStopping(true);
      const res = await apiFetch(`/admin/exams/${stopTargetExam.id}/emergency-stop`, {
        method: "POST",
        body: JSON.stringify({ reason: stopReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to stop assessment");
      }
      setActionSuccess(`Assessment '${stopTargetExam.name}' has been emergency stopped.`);
      setStopTargetExam(null);
      setStopReason("");
      fetchExams();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to stop assessment");
    } finally {
      setStopping(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Global Assessment Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervise active test sessions, question blueprints, submissions, and execute emergency containment if needed.
          </p>
        </div>

        <button
          onClick={fetchExams}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
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
            placeholder="Search by assessment title or exam code..."
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
            <option value="draft">Draft Blueprints</option>
          </select>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading assessments...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No assessments found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Exam & Code</th>
                  <th className="py-3.5 px-4">Faculty Creator</th>
                  <th className="py-3.5 px-4">Institution</th>
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
                      <div className="font-bold text-slate-900 dark:text-white">{exam.name}</div>
                      <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                          {exam.exam_code}
                        </span>
                        <span className="text-slate-400 text-[10px]">({exam.duration_minutes} min)</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{exam.creator_name}</div>
                      <div className="text-[11px] text-slate-400">{exam.creator_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{exam.institution_name}</span>
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
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Active / Published
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
                      {exam.status === "published" && (
                        <button
                          onClick={() => {
                            setStopTargetExam(exam);
                            setStopReason("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold text-[11px] flex items-center gap-1.5 ml-auto transition-colors"
                          title="Emergency Stop Assessment"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          <span>Emergency Stop</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* EMERGENCY STOP CONFIRMATION MODAL */}
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
    </div>
  );
}
