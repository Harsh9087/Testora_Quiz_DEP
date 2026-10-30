"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Coins,
  User,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  X,
  Send,
  ExternalLink,
  Check,
  Users,
  Copy,
  Layers,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Loader2,
  History,
  FileCheck2,
  DollarSign
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InstitutionalRequestItem {
  id: string;
  reference_id: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  institution_name: string;
  institution_type: string;
  website_url?: string;
  state: string;
  city: string;
  department_count: number;
  faculty_count: number;
  student_count: number;
  vouchers_requested: number;
  credits_per_voucher: number;
  expected_implementation_date?: string;
  selected_features: string[];
  additional_notes?: string;
  status: "Pending Review" | "Under Review" | "Proposal Sent" | "Approved" | "Rejected" | "Closed" | string;
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  admin_notes?: string;
  proposed_pricing?: string;
  approved_vouchers?: number;
  negotiated_terms?: string;
  proposal_sent_at?: string;
  decision_reason?: string;
  decided_at?: string;
  decided_by_name?: string;
  applicant_email_sent: boolean;
  admin_email_sent: boolean;
  email_delivery_error?: string;
  status_history?: {
    timestamp: string;
    action: string;
    actor: string;
    status: string;
    notes?: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface InstitutionalStats {
  total_requests: number;
  pending_review: number;
  under_review: number;
  proposal_sent: number;
  approved: number;
  rejected: number;
  closed: number;
  total_vouchers_requested: number;
}

function InstitutionalRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "All";

  const [items, setItems] = useState<InstitutionalRequestItem[]>([]);
  const [stats, setStats] = useState<InstitutionalStats>({
    total_requests: 0,
    pending_review: 0,
    under_review: 0,
    proposal_sent: 0,
    approved: 0,
    rejected: 0,
    closed: 0,
    total_vouchers_requested: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<InstitutionalRequestItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Action form state inside Detail Modal
  const [editStatus, setEditStatus] = useState("");
  const [editAssignedAdmin, setEditAssignedAdmin] = useState("");
  const [editProposedPricing, setEditProposedPricing] = useState("");
  const [editApprovedVouchers, setEditApprovedVouchers] = useState<number | string>("");
  const [editNegotiatedTerms, setEditNegotiatedTerms] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editDecisionReason, setEditDecisionReason] = useState("");
  const [editSendEmail, setEditSendEmail] = useState(false);
  const [editEmailMessage, setEditEmailMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Requests and Stats
  const fetchData = async () => {
    try {
      setErrorMsg(null);
      const [listRes, statsRes] = await Promise.all([
        apiFetch("/institutional-requests?limit=100"),
        apiFetch("/institutional-requests/stats")
      ]);

      if (!listRes.ok) throw new Error(`Failed to load requests (Status ${listRes.status})`);
      if (!statsRes.ok) throw new Error(`Failed to load stats (Status ${statsRes.status})`);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      setItems(listData.items || []);
      setStats(statsData);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load institutional requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenDetail = (item: InstitutionalRequestItem) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditAssignedAdmin(item.assigned_admin_name || "");
    setEditProposedPricing(item.proposed_pricing || "");
    setEditApprovedVouchers(item.approved_vouchers || item.vouchers_requested);
    setEditNegotiatedTerms(item.negotiated_terms || "");
    setEditAdminNotes(item.admin_notes || "");
    setEditDecisionReason(item.decision_reason || "");
    setEditSendEmail(false);
    setEditEmailMessage("");
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Update
  const handleSaveActions = async (forcedStatus?: string) => {
    if (!selectedItem) return;
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    const targetStatus = forcedStatus || editStatus;

    try {
      setSavingAction(true);
      const payload: any = {
        status: targetStatus,
        assigned_admin_name: editAssignedAdmin || null,
        proposed_pricing: editProposedPricing || null,
        approved_vouchers: editApprovedVouchers ? Number(editApprovedVouchers) : null,
        negotiated_terms: editNegotiatedTerms || null,
        admin_notes: editAdminNotes || null,
        decision_reason: editDecisionReason || null,
        send_email_update: editSendEmail,
        custom_email_message: editEmailMessage || null
      };

      const res = await apiFetch(`/institutional-requests/${selectedItem.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.detail || updated.message || "Failed to update request");
      }

      setActionSuccessMsg(`Request updated successfully (Status: ${targetStatus})`);
      const reqObj = updated.request || updated;
      setSelectedItem(reqObj);
      setEditStatus(reqObj.status);

      // Refresh list & stats
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to save updates");
    } finally {
      setSavingAction(false);
    }
  };

  // Retry Email
  const handleRetryEmail = async () => {
    if (!selectedItem) return;
    try {
      setRetryingEmail(true);
      setActionErrorMsg(null);
      const res = await apiFetch(`/institutional-requests/${selectedItem.id}/retry-emails`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to re-dispatch email");

      setActionSuccessMsg("Email notifications successfully re-dispatched!");
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to retry emails");
    } finally {
      setRetryingEmail(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.reference_id.toLowerCase().includes(q);
        const matchesInst = item.institution_name.toLowerCase().includes(q);
        const matchesName = item.full_name.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesCity = item.city.toLowerCase().includes(q);
        const matchesState = item.state.toLowerCase().includes(q);
        return matchesRef || matchesInst || matchesName || matchesEmail || matchesCity || matchesState;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending Review
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Under Review
          </span>
        );
      case "Proposal Sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Send className="w-3 h-3 text-purple-500" />
            Proposal Sent
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-500" />
            Rejected
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileCheck2 className="w-3 h-3 text-slate-500" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Institutional &amp; FDP Requests
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review college &amp; university plan proposals, issue customized faculty vouchers (10,000 credits each), and manage negotiated institutional pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total */}
        <button
          onClick={() => setStatusFilter("All")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "All"
              ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Requests
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total_requests}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
            {stats.total_vouchers_requested.toLocaleString()} Vouchers
          </div>
        </button>

        {/* Pending Review */}
        <button
          onClick={() => setStatusFilter("Pending Review")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "Pending Review"
              ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Review
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending_review}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting triage</div>
        </button>

        {/* Under Review */}
        <button
          onClick={() => setStatusFilter("Under Review")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "Under Review"
              ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Under Review
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.under_review}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In negotiation</div>
        </button>

        {/* Proposal Sent */}
        <button
          onClick={() => setStatusFilter("Proposal Sent")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "Proposal Sent"
              ? "bg-purple-50/80 dark:bg-purple-950/50 border-purple-400 dark:border-purple-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Send className="w-3 h-3" />
            Proposal Sent
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {stats.proposal_sent}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Quote delivered</div>
        </button>

        {/* Approved */}
        <button
          onClick={() => setStatusFilter("Approved")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "Approved"
              ? "bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.approved}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for grant</div>
        </button>

        {/* Rejected */}
        <button
          onClick={() => setStatusFilter("Rejected")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === "Rejected"
              ? "bg-rose-50/80 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.rejected}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Declined</div>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ref ID, college name, contact, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["All", "Pending Review", "Under Review", "Proposal Sent", "Approved", "Rejected", "Closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading institutional proposals...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Institutional Requests Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "All"
                ? "Try adjusting your search terms or status filters."
                : "No applications have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Vouchers Requested</th>
                  <th className="py-3 px-4">Scale (Faculty / Students)</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {item.reference_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {item.institution_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.institution_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.full_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {item.designation} · {item.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.city}, {item.state}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-white">
                        {item.vouchers_requested} Vouchers
                      </span>
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {(item.vouchers_requested * item.credits_per_voucher).toLocaleString()} credits
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <span>{item.faculty_count} faculty</span>
                      <span className="mx-1">/</span>
                      <span>{item.student_count.toLocaleString()} students</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {detailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {selectedItem.reference_id}
                    </span>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate max-w-md">
                    {selectedItem.institution_name}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
              {/* Alert Feedback */}
              {actionSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}
              {actionErrorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              {/* Grid 1: Applicant & Institution Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Contact Person</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Name:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedItem.full_name}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Designation:</span>
                      <span>{selectedItem.designation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <a href={`mailto:${selectedItem.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {selectedItem.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mobile:</span>
                      <a href={`tel:${selectedItem.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {selectedItem.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Institution Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Institution Profile</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="font-semibold">{selectedItem.institution_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span>{selectedItem.city}, {selectedItem.state}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Scale:</span>
                      <span>{selectedItem.department_count} depts · {selectedItem.faculty_count} faculty · {selectedItem.student_count.toLocaleString()} students</span>
                    </div>
                    {selectedItem.website_url && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Website:</span>
                        <a
                          href={selectedItem.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Visit site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirement Summary Box */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Requested Faculty Grants &amp; Credits</span>
                  </div>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    {selectedItem.vouchers_requested} Vouchers × 10,000 = {(selectedItem.vouchers_requested * selectedItem.credits_per_voucher).toLocaleString()} Credits
                  </span>
                </div>

                {/* Features chips */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Requested Features
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.selected_features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedItem.expected_implementation_date && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>Implementation Timeline:</strong> {selectedItem.expected_implementation_date}
                  </div>
                )}

                {selectedItem.additional_notes && (
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-900/50 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="block text-slate-800 dark:text-white mb-0.5">Applicant Notes:</strong>
                    <p className="whitespace-pre-line italic bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                      "{selectedItem.additional_notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Email Delivery Audit & Retry */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Notification Delivery Status
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      Applicant Email:{" "}
                      {selectedItem.applicant_email_sent ? (
                        <strong className="text-emerald-600 dark:text-emerald-400">Dispatched</strong>
                      ) : (
                        <strong className="text-amber-600 dark:text-amber-400">Pending / Failed</strong>
                      )}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      Admin Email:{" "}
                      {selectedItem.admin_email_sent ? (
                        <strong className="text-emerald-600 dark:text-emerald-400">Dispatched</strong>
                      ) : (
                        <strong className="text-amber-600 dark:text-amber-400">Not Dispatched</strong>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetryEmail}
                  disabled={retryingEmail}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${retryingEmail ? "animate-spin" : ""}`} />
                  <span>Retry Email Dispatch</span>
                </button>
              </div>

              {/* SUPER ADMIN WORKFLOW & ACTION CONTROLS */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/30 border border-indigo-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-700 pb-2">
                  <div className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Super Admin Workflow Controls</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Authorized Super Admin Only
                  </span>
                </div>

                {/* Workflow Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveActions("Under Review")}
                    disabled={savingAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 transition-all"
                  >
                    Mark Under Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveActions("Proposal Sent")}
                    disabled={savingAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200 transition-all"
                  >
                    Mark Proposal Sent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveActions("Approved")}
                    disabled={savingAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition-all"
                  >
                    Approve Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveActions("Rejected")}
                    disabled={savingAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 transition-all"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveActions("Closed")}
                    disabled={savingAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-all"
                  >
                    Close Application
                  </button>
                </div>

                {/* Action Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Transition
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Admin
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aegeus Admin"
                      value={editAssignedAdmin}
                      onChange={(e) => setEditAssignedAdmin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Proposed Institutional Pricing (Super Admin Quotation)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹49,999 / year for 25 faculty vouchers"
                      value={editProposedPricing}
                      onChange={(e) => setEditProposedPricing(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Custom pricing evaluated for this college.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Approved Faculty Vouchers Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editApprovedVouchers}
                      onChange={(e) => setEditApprovedVouchers(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      10,000 credits allocated per approved voucher.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Negotiated Terms &amp; Scope
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Includes custom watermark, 2 on-campus FDP faculty training sessions..."
                      value={editNegotiatedTerms}
                      onChange={(e) => setEditNegotiatedTerms(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Internal Admin Notes &amp; Audit Log Reason
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Internal evaluation notes visible to administrators only..."
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Applicant Notification Checkbox */}
                  <div className="sm:col-span-2 pt-1 border-t border-indigo-100 dark:border-slate-700/60">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editSendEmail}
                        onChange={(e) => setEditSendEmail(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Dispatch email notification update to applicant ({selectedItem.email})
                      </span>
                    </label>

                    {editSendEmail && (
                      <div className="mt-2 pl-6">
                        <textarea
                          rows={2}
                          placeholder="Optional custom message included in the applicant update email..."
                          value={editEmailMessage}
                          onChange={(e) => setEditEmailMessage(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveActions()}
                    disabled={savingAction}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingAction ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Save &amp; Update Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STATUS HISTORY TIMELINE */}
              {selectedItem.status_history && selectedItem.status_history.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Status History &amp; Audit Trail</span>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {selectedItem.status_history.map((hist, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white">{hist.action}</strong>
                          <span className="text-[10px] text-slate-400">by {hist.actor}</span>
                          <span className="text-[10px] text-slate-400">· {new Date(hist.timestamp).toLocaleString()}</span>
                        </div>
                        {hist.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {hist.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInstitutionalRequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading requests...</div>}>
      <InstitutionalRequestsContent />
    </Suspense>
  );
}
