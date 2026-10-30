"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Coins,
  Building2,
  User,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  ArrowRight,
  RefreshCw,
  Download,
  ShieldCheck,
  ChevronRight,
  X,
  Send,
  ExternalLink,
  Check,
  Users
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CreditRequestItem {
  id: string;
  request_code: string;
  user_id: string | null;
  user_registered: boolean;
  user_current_balance: number;
  user_bonus_balance: number;
  name: string;
  email: string;
  phone: string | null;
  institution_name: string;
  department: string | null;
  designation: string | null;
  institution_email: string | null;
  requested_credits: number;
  approved_credits: number | null;
  purpose: string;
  estimated_students: number;
  status: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  admin_notes: string | null;
  decision_reason: string | null;
  decision_date: string | null;
  credits_issued: boolean;
  credits_issued_at: string | null;
  credit_transaction_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SummaryMetrics {
  total_requests: number;
  pending_requests: number;
  under_review_requests: number;
  approved_requests: number;
  issued_requests: number;
  rejected_requests: number;
  total_credits_granted: number;
}

export default function AdminCreditRequestsPage() {
  const [items, setItems] = useState<CreditRequestItem[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    total_requests: 0,
    pending_requests: 0,
    under_review_requests: 0,
    approved_requests: 0,
    issued_requests: 0,
    rejected_requests: 0,
    total_credits_granted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected item for Detail / Review Drawer
  const [selectedReq, setSelectedReq] = useState<CreditRequestItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Drawer Form State
  const [editStatus, setEditStatus] = useState<string>("Pending");
  const [editApprovedCredits, setEditApprovedCredits] = useState<number>(10000);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");

  // Issue Credits Confirmation Dialog
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCreditsAmount, setIssueCreditsAmount] = useState<number>(10000);

  const fetchCreditRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("page_size", "100");

      const res = await apiFetch(`/admin/credit-requests?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch credit requests.");
      }
      const data = await res.json();
      setItems(data.items || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading credit requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCreditRequests();
  };

  const openDrawer = (req: CreditRequestItem) => {
    setSelectedReq(req);
    setEditStatus(req.status);
    setEditApprovedCredits(req.approved_credits || req.requested_credits || 10000);
    setEditNotes(req.admin_notes || "");
    setEditReason(req.decision_reason || "");
    setIssueCreditsAmount(req.approved_credits || req.requested_credits || 10000);
    setActionMessage(null);
  };

  const handleSaveChanges = async () => {
    if (!selectedReq) return;
    try {
      setActionLoading(true);
      setActionMessage(null);

      const res = await apiFetch(`/admin/credit-requests/${selectedReq.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          approved_credits: Number(editApprovedCredits),
          admin_notes: editNotes,
          decision_reason: editReason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update credit request.");
      }

      setActionMessage({ type: "success", text: `Request status updated to '${editStatus}'.` });
      await fetchCreditRequests();

      // Refresh current drawer view
      setSelectedReq((prev) =>
        prev
          ? {
              ...prev,
              status: editStatus,
              approved_credits: Number(editApprovedCredits),
              admin_notes: editNotes,
              decision_reason: editReason,
            }
          : null
      );
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCreditsConfirm = async () => {
    if (!selectedReq) return;
    try {
      setActionLoading(true);
      setActionMessage(null);

      const res = await apiFetch(`/admin/credit-requests/${selectedReq.id}/issue-credits`, {
        method: "POST",
        body: JSON.stringify({
          credits: Number(issueCreditsAmount),
          note: `Institutional grant of ${issueCreditsAmount.toLocaleString()} credits issued by administrator.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to issue credits to user wallet.");
      }

      setShowIssueModal(false);
      setActionMessage({
        type: "success",
        text: `🎉 Successfully issued ${data.credits_issued.toLocaleString()} credits! New user balance: ${data.new_balance.toLocaleString()}.`,
      });

      await fetchCreditRequests();

      // Update current selected request
      setSelectedReq((prev) =>
        prev
          ? {
              ...prev,
              status: "Credits Issued",
              credits_issued: true,
              credits_issued_at: new Date().toISOString(),
              approved_credits: data.credits_issued,
              user_current_balance: data.new_balance,
            }
          : null
      );
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to issue credits." });
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "Request Code",
      "Teacher Name",
      "Email",
      "Phone",
      "Institution",
      "Department",
      "Designation",
      "Requested Credits",
      "Approved Credits",
      "Status",
      "Credits Issued",
      "Decision Date",
      "Created At",
    ];

    const rows = items.map((r) => [
      r.request_code,
      `"${r.name.replace(/"/g, '""')}"`,
      r.email,
      r.phone || "",
      `"${r.institution_name.replace(/"/g, '""')}"`,
      `"${(r.department || "").replace(/"/g, '""')}"`,
      `"${(r.designation || "").replace(/"/g, '""')}"`,
      r.requested_credits,
      r.approved_credits || "",
      r.status,
      r.credits_issued ? "Yes" : "No",
      r.decision_date || "",
      r.created_at || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `testora_credit_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Under Review
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved · Ready to Issue
          </span>
        );
      case "Credits Issued":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Coins className="w-3 h-3" />
            Credits Issued
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600/10 text-blue-500 border border-blue-500/20">
              Institutional Grants &amp; Vouchers
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Teacher Free Credit Requests</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Review faculty applications for the 10,000 Institutional Credits FDP grant. Approve, verify institution accreditation, and safely deposit credits directly into educator wallets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportCSV}
            disabled={items.length === 0}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={fetchCreditRequests}
            className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-blue-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.pending_requests}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 inline-block">
            Requires initial review
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Under Review</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.under_review_requests}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-block">
            Syllabus / accreditation check
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.approved_requests}
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-block">
            Awaiting credit issuance
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Credits Issued</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.issued_requests}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            Successfully deposited
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.rejected_requests}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1 inline-block">
            Ineligible / duplicate
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Issued</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {summary.total_credits_granted.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 inline-block">
            Credits granted to date
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {["All", "Pending", "Under Review", "Approved", "Credits Issued", "Rejected"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {status}
              {status === "All" && ` (${summary.total_requests})`}
              {status === "Pending" && summary.pending_requests > 0 && ` (${summary.pending_requests})`}
              {status === "Approved" && summary.approved_requests > 0 && ` (${summary.approved_requests})`}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, faculty, institution..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading institutional credit requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <button
              onClick={fetchCreditRequests}
              className="text-xs text-blue-600 underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No Credit Requests Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No applications matched "${searchQuery}". Try clearing search filters.`
                : "No applications currently submitted under this status category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-4">Faculty Applicant</th>
                  <th className="py-3 px-4">Institution &amp; Dept</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Request Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{r.request_code}</span>
                        {r.user_registered ? (
                          <span
                            title="Linked to registered Testora user account"
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 text-[9px]"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            title="Applicant has not registered account yet"
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/15 text-amber-500 text-[9px]"
                          >
                            !
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Faculty Applicant */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{r.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {r.institution_name}
                      </div>
                      {r.department && (
                        <div className="truncate text-[11px] text-slate-400 mt-0.5">
                          {r.department}
                        </div>
                      )}
                    </td>

                    {/* Credits */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {(r.approved_credits || r.requested_credits).toLocaleString()}
                        </span>
                      </div>
                      {r.credits_issued && (
                        <span className="text-[10px] text-emerald-500 font-bold">
                          Deposited
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(r)}
                        className="px-3 py-1.5 rounded-xl border border-blue-600/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          DETAIL & REVIEW DRAWER MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Top Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 sticky top-0 z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {selectedReq.request_code}
                  </span>
                  {getStatusBadge(selectedReq.status)}
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Application Review &amp; Grant
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Status Alert Banner if Any */}
              {actionMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    actionMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  {actionMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Applicant Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Educator Profile
                  </span>
                  {selectedReq.user_registered ? (
                    <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Registered Account
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Unregistered Email
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedReq.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedReq.email}</span>
                    </div>
                    {selectedReq.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedReq.phone}</span>
                      </div>
                    )}
                    {selectedReq.designation && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedReq.designation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* If registered, show live wallet balance */}
                {selectedReq.user_registered && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Wallet Balance:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {selectedReq.user_current_balance.toLocaleString()} regular · {selectedReq.user_bonus_balance.toLocaleString()} bonus
                    </span>
                  </div>
                )}
              </div>

              {/* Institution Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Institution &amp; Department
                </span>
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>{selectedReq.institution_name}</span>
                </div>
                {selectedReq.department && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                    Dept: {selectedReq.department}
                  </p>
                )}
                {selectedReq.institution_email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                    Official Domain Email: <span className="font-mono text-slate-300">{selectedReq.institution_email}</span>
                  </p>
                )}
                {selectedReq.estimated_students > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Estimated Cohort Size: <strong className="text-slate-700 dark:text-slate-200">{selectedReq.estimated_students} Students</strong></span>
                  </p>
                )}
              </div>

              {/* Application Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Purpose / Exam Justification
                </label>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedReq.purpose}
                </div>
              </div>

              {/* Credit Issuance Action Box */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-300">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Credit Issuance Control</span>
                  </div>
                  {selectedReq.credits_issued && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Credits Deposited
                    </span>
                  )}
                </div>

                {selectedReq.credits_issued ? (
                  <div className="text-xs text-slate-500 dark:text-slate-300 space-y-1">
                    <p>
                      Credits of <strong className="text-emerald-500">{selectedReq.approved_credits?.toLocaleString()}</strong> were safely credited to faculty wallet on{" "}
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(selectedReq.credits_issued_at!).toLocaleString()}
                      </span>.
                    </p>
                    {selectedReq.credit_transaction_id && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Transaction ID: {selectedReq.credit_transaction_id}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      This action increments the teacher's wallet balance by the approved amount and generates an immutable ledger transaction with in-app notification.
                    </p>

                    {!selectedReq.user_registered && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>The applicant must register an account with {selectedReq.email} before credits can be deposited.</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowIssueModal(true)}
                      disabled={actionLoading || !selectedReq.user_registered}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Issue 10,000 Institutional Credits</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status & Review Controls */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Administrative Decision &amp; Notes
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">
                      Application Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Credits Issued">Credits Issued</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">
                      Approved Credits
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={editApprovedCredits}
                      onChange={(e) => setEditApprovedCredits(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">
                    Decision Justification / Reason (Visible on Decision)
                  </label>
                  <textarea
                    rows={2}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g. Approved per National AI Assessment Pilot or Rejected due to incomplete credentials..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">
                    Internal Admin Notes (Private)
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Private staff verification notes, phone verification logs..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {actionLoading ? "Saving Changes..." : "Save Review Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL FOR CREDIT ISSUANCE
      ═════════════════════════════════════════════════════════════════════════ */}
      {showIssueModal && selectedReq && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <Coins className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Confirm Credit Deposit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are about to deposit <strong className="text-blue-500">{issueCreditsAmount.toLocaleString()} credits</strong> into the wallet of:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">{selectedReq.name}</div>
              <div className="text-slate-500">{selectedReq.email}</div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{selectedReq.institution_name}</div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueCreditsConfirm}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {actionLoading ? "Issuing..." : "Confirm & Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

