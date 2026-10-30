"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
  Lock,
  Eye,
  RefreshCw,
  Download,
  ChevronRight,
  X,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Flame,
  Check
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TicketReply {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  message: string;
  is_internal_note: boolean;
  created_at: string | null;
}

interface SupportTicketItem {
  id: string;
  ticket_code: string;
  user_id: string | null;
  user_role: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  reference_code: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  reply_count: number;
  last_reply_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TicketDetail extends SupportTicketItem {
  admin_notes: string | null;
  resolution_notes: string | null;
  replies: TicketReply[];
}

interface SummaryMetrics {
  total_tickets: number;
  new_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  waiting_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  urgent_tickets: number;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    total_tickets: 0,
    new_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    waiting_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    urgent_tickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drawer / Workspace State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reply Form State
  const [replyTab, setReplyTab] = useState<"reply" | "note">("reply");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatusUpdate, setReplyStatusUpdate] = useState<string>("Waiting for User");
  const [replySending, setReplySending] = useState(false);

  // Ticket Management State inside Drawer
  const [editStatus, setEditStatus] = useState<string>("Open");
  const [editPriority, setEditPriority] = useState<string>("Normal");
  const [editResolutionNotes, setEditResolutionNotes] = useState<string>("");
  const [manageSaving, setManageSaving] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (priorityFilter !== "All") params.append("priority", priorityFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("page_size", "100");

      const res = await apiFetch(`/admin/support/tickets?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load support tickets.");
      }
      const data = await res.json();
      setTickets(data.items || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const openTicketWorkspace = async (ticketId: string) => {
    try {
      setSelectedTicketId(ticketId);
      setDetailLoading(true);
      setReplyMessage("");
      const res = await apiFetch(`/admin/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Could not load ticket details.");
      const data: TicketDetail = await res.json();
      setTicketDetail(data);
      setEditStatus(data.status);
      setEditPriority(data.priority);
      setEditResolutionNotes(data.resolution_notes || "");
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDetail || !replyMessage.trim()) return;

    try {
      setReplySending(true);
      const isInternal = replyTab === "note";

      const res = await apiFetch(`/admin/support/tickets/${ticketDetail.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          message: replyMessage.trim(),
          is_internal_note: isInternal,
          update_status: isInternal ? undefined : replyStatusUpdate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to post reply.");
      }

      setReplyMessage("");
      await openTicketWorkspace(ticketDetail.id);
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || "Error posting reply.");
    } finally {
      setReplySending(false);
    }
  };

  const handleUpdateTicketProperties = async () => {
    if (!ticketDetail) return;
    try {
      setManageSaving(true);
      const res = await apiFetch(`/admin/support/tickets/${ticketDetail.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          resolution_notes: editResolutionNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update ticket.");
      await openTicketWorkspace(ticketDetail.id);
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to update ticket properties.");
    } finally {
      setManageSaving(false);
    }
  };

  const exportCSV = () => {
    if (tickets.length === 0) return;
    const headers = [
      "Ticket Code",
      "User Role",
      "Name",
      "Email",
      "Subject",
      "Category",
      "Priority",
      "Status",
      "Reference Code",
      "Created At",
    ];

    const rows = tickets.map((t) => [
      t.ticket_code,
      t.user_role,
      `"${t.name.replace(/"/g, '""')}"`,
      t.email,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.reference_code || "",
      t.created_at || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `testora_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
            <Flame className="w-3 h-3" /> Urgent
          </span>
        );
      case "High":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> High
          </span>
        );
      case "Normal":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            {priority}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            New
          </span>
        );
      case "Open":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Open
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            In Progress
          </span>
        );
      case "Waiting for User":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Waiting for User
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Closed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-600/10 text-purple-500 border border-purple-500/20">
              Customer Success &amp; Support Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Help &amp; Support Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Centralized management for tickets submitted via candidate portals, paper studios, and live proctoring desks. Reply directly or post internal private admin notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportCSV}
            disabled={tickets.length === 0}
            className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={fetchTickets}
            className="h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-purple-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>New Tickets</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.new_tickets}
          </p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1 inline-block">
            Unassigned / Fresh
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Open &amp; Active</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.open_tickets + summary.in_progress_tickets}
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-block">
            Currently in progress
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Urgent Attention</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-500 mt-2">
            {summary.urgent_tickets}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1 inline-block">
            Live exams &amp; disruptions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Waiting on User</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.waiting_tickets}
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-block">
            Awaiting requester feedback
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.resolved_tickets}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            Case closed satisfactorily
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Tickets</span>
            <LifeBuoy className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summary.total_tickets}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
            All-time inquiry log
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {["All", "New", "Open", "In Progress", "Waiting for User", "Resolved", "Closed"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? "bg-purple-600 text-white shadow-xs shadow-purple-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
              placeholder="Search code, subject, user, email..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Priority & Category Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Exam Proctoring">Exam Proctoring</option>
              <option value="Question Paper Studio">Question Paper Studio</option>
              <option value="Billing &amp; Credits">Billing &amp; Credits</option>
              <option value="Candidate Portal">Candidate Portal</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading support tickets...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <button onClick={fetchTickets} className="text-xs text-purple-600 underline font-semibold">
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No Support Tickets Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No support tickets matched "${searchQuery}".`
                : "No active support cases recorded under selected filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Subject &amp; Category</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Ticket Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span>{t.ticket_code}</span>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{t.category}</span>
                        {t.reference_code && (
                          <span className="font-mono text-[10px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {t.reference_code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Requester */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {t.user_role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.email}</div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Activity */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {t.reply_count > 0 ? (
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
                        </span>
                      ) : (
                        <span>Initial inquiry</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openTicketWorkspace(t.id)}
                        className="px-3 py-1.5 rounded-xl border border-purple-600/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Workspace</span>
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
          TICKET WORKSPACE DRAWER (Conversation Thread & Internal Notes)
      ═════════════════════════════════════════════════════════════════════════ */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Top Workspace Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {ticketDetail?.ticket_code || "Loading..."}
                  </span>
                  {ticketDetail && getStatusBadge(ticketDetail.status)}
                  {ticketDetail && getPriorityBadge(ticketDetail.priority)}
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white truncate max-w-md">
                  {ticketDetail?.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicketId(null);
                  setTicketDetail(null);
                }}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Conversation Workspace */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
              {detailLoading || !ticketDetail ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading conversation thread...</p>
                </div>
              ) : (
                <>
                  {/* Requester Profile Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{ticketDetail.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {ticketDetail.user_role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{ticketDetail.email}</div>
                    </div>
                    {ticketDetail.phone && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ticketDetail.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Original Inquiry Message */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider">
                        Original Customer Inquiry
                      </span>
                      <span>
                        {ticketDetail.created_at ? new Date(ticketDetail.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-xs">
                      {ticketDetail.message}
                    </div>
                  </div>

                  {/* Threaded Replies */}
                  {ticketDetail.replies && ticketDetail.replies.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Conversation History ({ticketDetail.replies.length})
                      </div>

                      {ticketDetail.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-2xl text-xs space-y-2 transition-all ${
                            reply.is_internal_note
                              ? "bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              {reply.is_internal_note ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-500 text-[10px]">
                                  <Lock className="w-3 h-3" /> PRIVATE ADMIN NOTE
                                </span>
                              ) : (
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {reply.sender_name}
                                </span>
                              )}
                              <span className="text-slate-400 font-mono text-[10px]">
                                ({reply.sender_email})
                              </span>
                            </div>
                            <span className="text-slate-400 text-[10px]">
                              {reply.created_at ? new Date(reply.created_at).toLocaleString() : ""}
                            </span>
                          </div>

                          <div className="whitespace-pre-wrap leading-relaxed text-[12px]">
                            {reply.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Ticket Property Controls */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Status &amp; Priority Management
                      </span>
                      <button
                        type="button"
                        onClick={handleUpdateTicketProperties}
                        disabled={manageSaving}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {manageSaving ? "Updating..." : "Update Status"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">Current Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="New">New</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Waiting for User">Waiting for User</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">Priority Level</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Response Composer */}
            {ticketDetail && (
              <form
                onSubmit={handleSendReply}
                className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3"
              >
                {/* Tabs: Public Reply vs Internal Note */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setReplyTab("reply")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        replyTab === "reply"
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      Reply to Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTab("note")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        replyTab === "note"
                          ? "bg-amber-500/20 text-amber-500 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Admin Note</span>
                    </button>
                  </div>

                  {replyTab === "reply" && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-400">Set status to:</span>
                      <select
                        value={replyStatusUpdate}
                        onChange={(e) => setReplyStatusUpdate(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                      >
                        <option value="Waiting for User">Waiting for User</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    replyTab === "reply"
                      ? "Type official response to customer (user will receive in-app and email notifications)..."
                      : "Type private internal staff note (visible only to administrators)..."
                  }
                  className={`w-full border rounded-2xl p-3 text-xs focus:outline-none transition-colors ${
                    replyTab === "note"
                      ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-500/40 text-amber-900 dark:text-amber-200 placeholder-amber-400/60 focus:border-amber-500"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500"
                  }`}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {replyTab === "note"
                      ? "🔒 Never visible to candidate or educator"
                      : "✉️ Dispatched to customer inbox and notifications"}
                  </span>
                  <button
                    type="submit"
                    disabled={replySending || !replyMessage.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      replyTab === "note"
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{replySending ? "Submitting..." : replyTab === "note" ? "Save Private Note" : "Send Response"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

