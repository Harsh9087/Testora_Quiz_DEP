"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Lightbulb,
  Bug,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  User,
  Mail,
  RefreshCw,
  Download,
  ShieldCheck,
  ChevronRight,
  X,
  Send,
  ExternalLink,
  Check,
  ThumbsUp,
  Sparkles,
  Flame,
  Layers,
  Trash2,
  Award,
  Archive,
  UserCheck,
  Paperclip,
  Eye
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FeedbackItem {
  id: string;
  feedback_code: string;
  submission_type: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string | null;
  user_type: string | null;
  subject: string | null;
  title: string | null;
  category: string;
  rating: number | null;
  severity: string | null;
  message: string;
  secondary_text: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  resolution_details: string | null;
  reviewed_by_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  is_public_testimonial: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface FeedbackStats {
  total_submissions: number;
  new_count: number;
  in_progress_count: number;
  resolved_count: number;
  average_rating: number;
  bug_count: number;
  feature_count: number;
  experience_count: number;
  rating_count: number;
}

const STATUS_FILTERS = [
  "ALL",
  "New",
  "Under Review",
  "In Progress",
  "Resolved",
  "Rejected",
  "Archived"
];

const CATEGORY_OPTIONS = [
  "ALL",
  "General Feedback",
  "Feature Request",
  "Bug Report",
  "UI/UX Suggestion",
  "Payment Issue",
  "Other"
];

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total_submissions: 0,
    new_count: 0,
    in_progress_count: 0,
    resolved_count: 0,
    average_rating: 0.0,
    bug_count: 0,
    feature_count: 0,
    experience_count: 0,
    rating_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Drawer / Modal
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>("New");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editAssignedName, setEditAssignedName] = useState<string>("");
  const [editResolution, setEditResolution] = useState<string>("");
  const [editIsTestimonial, setEditIsTestimonial] = useState<boolean>(false);
  const [savingAction, setSavingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/feedback/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // background fetch
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (userTypeFilter !== "ALL") params.append("user_type", userTypeFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      params.append("limit", "100");

      const res = await apiFetch(`/feedback?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load feedback records.");
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, categoryFilter, userTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const openReviewDrawer = (item: FeedbackItem) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditNotes(item.admin_notes || "");
    setEditAssignedName(item.assigned_to_name || "");
    setEditResolution(item.resolution_details || "");
    setEditIsTestimonial(item.is_public_testimonial);
    setActionSuccess(null);
    setActionError(null);
  };

  const handleSaveReview = async () => {
    if (!selectedItem) return;
    try {
      setSavingAction(true);
      setActionSuccess(null);
      setActionError(null);

      const res = await apiFetch(`/feedback/${selectedItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          admin_notes: editNotes,
          assigned_to_name: editAssignedName.trim() || null,
          resolution_details: editResolution.trim() || null,
          is_public_testimonial: editIsTestimonial
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update record.");
      }

      const resData = await res.json();
      const updated = resData.submission as FeedbackItem;

      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it))
      );
      setSelectedItem(updated);
      setActionSuccess("Feedback status and resolution details saved successfully!");
      fetchStats();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleArchive = async (item: FeedbackItem) => {
    try {
      const res = await apiFetch(`/feedback/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Archived" })
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: "Archived" } : it))
        );
        if (selectedItem?.id === item.id) {
          setSelectedItem((prev) => prev ? { ...prev, status: "Archived" } : null);
        }
        fetchStats();
      }
    } catch {
      alert("Failed to archive feedback.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this feedback record?")) return;
    try {
      const res = await apiFetch(`/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
        fetchStats();
      }
    } catch {
      alert("Failed to delete feedback.");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "Feedback ID",
      "Name",
      "Email",
      "User Type",
      "Category",
      "Rating",
      "Subject",
      "Status",
      "Assigned Admin",
      "Message",
      "Resolution Details",
      "Created At"
    ];
    const rows = items.map((it) => [
      `"${it.feedback_code}"`,
      `"${it.name}"`,
      `"${it.email}"`,
      `"${it.user_type || it.role || "Teacher"}"`,
      `"${it.category}"`,
      `"${it.rating || ""}"`,
      `"${(it.subject || it.title || "").replace(/"/g, '""')}"`,
      `"${it.status}"`,
      `"${(it.assigned_to_name || "").replace(/"/g, '""')}"`,
      `"${(it.message || "").replace(/"/g, '""')}"`,
      `"${(it.resolution_details || "").replace(/"/g, '""')}"`,
      `"${it.created_at || ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `testora_feedback_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3 h-3 text-blue-500" />
            New
          </span>
        );
      case "Under Review":
      case "Reviewed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Clock className="w-3 h-3 text-purple-500" />
            Under Review
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-500" />
            In Progress
          </span>
        );
      case "Resolved":
      case "Implemented":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Resolved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 text-red-500" />
            Rejected
          </span>
        );
      case "Archived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3 h-3 text-slate-500" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Customer Voice & Experience Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Feedback Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Monitor, assign, and resolve user feedback, bug reports, feature suggestions, and quality ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchItems();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. DASHBOARD KPI CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Feedback */}
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setCategoryFilter("ALL");
          }}
          className="bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="text-slate-400 text-xs font-semibold mb-1">Total Feedback</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total_submissions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All time</div>
        </div>

        {/* New Feedback */}
        <div
          onClick={() => setStatusFilter("New")}
          className="bg-white dark:bg-[#0E1726] border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">New</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.new_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting review</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter("In Progress")}
          className="bg-white dark:bg-[#0E1726] border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">In Progress</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.in_progress_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under investigation</div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setStatusFilter("Resolved")}
          className="bg-white dark:bg-[#0E1726] border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.resolved_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Closed successfully</div>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-slate-400 text-xs font-semibold mb-1">Avg Rating</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "5.0"}
            </span>
            <span className="text-xs text-amber-500 font-bold">★ / 5</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.rating_count} ratings</div>
        </div>

        {/* Bug Reports */}
        <div
          onClick={() => setCategoryFilter("Bug Report")}
          className="bg-white dark:bg-[#0E1726] border border-red-100 dark:border-red-900/40 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-red-400 transition-colors"
        >
          <div className="text-red-600 dark:text-red-400 text-xs font-semibold mb-1">Bug Reports</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.bug_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Technical issues</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. FILTERS & SEARCH
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Statuses" : st}
            </button>
          ))}
        </div>

        {/* Search & Category/UserType Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-6 lg:col-span-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, email, subject..."
                className="w-full pl-9 pr-20 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* User Type Filter */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All User Types</option>
              <option value="Teacher">Teacher / Faculty</option>
              <option value="Student">Student</option>
              <option value="College or Institution">College / Institution</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FEEDBACK TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading feedback records...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchItems}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto stroke-[1.5] text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No feedback records found
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Submissions from the homepage will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Feedback ID</th>
                  <th className="py-3.5 px-4">Name & Email</th>
                  <th className="py-3.5 px-4">User Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Admin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Feedback ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {item.feedback_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.feedback_code)}
                          title="Copy ID"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {copiedCode === item.feedback_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <span className="text-[10px]">📋</span>
                          )}
                        </button>
                      </div>
                      {item.screenshot_url && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-1 font-semibold">
                          <Paperclip className="w-3 h-3" />
                          <span>Attachment</span>
                        </span>
                      )}
                    </td>

                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{item.email}</span>
                      </div>
                    </td>

                    {/* User Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                        {item.user_type || item.role || "Teacher"}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-xs">
                      {item.category}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.rating ? (
                        <div className="flex items-center gap-1 text-amber-500">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.rating}★
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.subject || item.title || "—"}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.message}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Assigned Admin */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                      {item.assigned_to_name ? (
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.assigned_to_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReviewDrawer(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          View / Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(item)}
                          title="Archive"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
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
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. FEEDBACK DETAIL & RESOLUTION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Feedback Record</span>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{selectedItem.feedback_code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submitted on {new Date(selectedItem.created_at || "").toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* User Details Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Submitter</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedItem.name}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Email</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                    {selectedItem.email}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">User Type</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedItem.user_type || selectedItem.role || "Teacher"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Category</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedItem.category}
                  </div>
                </div>
              </div>

              {/* Subject & Rating */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Subject / Topic
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedItem.subject || selectedItem.title || "—"}
                </div>
              </div>

              {selectedItem.rating && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                    User Rating
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= selectedItem.rating!
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    ))}
                    <span className="text-sm font-bold text-slate-900 dark:text-white ml-2">
                      {selectedItem.rating} out of 5 stars
                    </span>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Detailed Feedback Message
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.message}
                </div>
              </div>

              {/* Screenshot Attachment if available */}
              {selectedItem.screenshot_url && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attached Screenshot</span>
                  </div>
                  <div className="relative inline-block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedItem.screenshot_url}
                      alt="Feedback Screenshot"
                      className="max-h-48 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewImage(selectedItem.screenshot_url)}
                    />
                    <a
                      href={selectedItem.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open image in new tab</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Resolution & Management Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Feedback Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_FILTERS.filter((s) => s !== "ALL").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assign to Administrator */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Assigned Administrator
                    </label>
                    <input
                      type="text"
                      value={editAssignedName}
                      onChange={(e) => setEditAssignedName(e.target.value)}
                      placeholder="e.g. Lead QA / Product Ops"
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Resolution Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Resolution Details / Action Taken
                  </label>
                  <textarea
                    rows={2}
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value)}
                    placeholder="Document resolution, bug fix commit, or response provided to user..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Internal Admin Notes (Private)
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Internal team discussion notes..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteItem(selectedItem.id)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={savingAction}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
