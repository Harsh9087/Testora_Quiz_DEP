"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  FileSpreadsheet,
  Coins,
  Ticket,
  DollarSign,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Building2,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Star,
  Search,
  Filter,
  Award,
  GraduationCap,
  Calendar,
  Receipt,
  Download,
  ExternalLink,
  ChevronRight,
  XCircle,
  BadgeCheck,
  Zap,
  CreditCard,
  Send,
  UserCheck
} from "lucide-react";
import { apiFetch, API_BASE, API_V1 } from "@/lib/api";
import { formatLocalizedDate } from "@/lib/dateUtils";

interface OverviewStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_admins: number;
  total_institutions: number;
  total_candidates_platform?: number;
  total_exams: number;
  published_exams: number;
  completed_submissions: number;
  circulating_regular_credits: number;
  circulating_bonus_credits: number;
  total_available_credits: number;
  total_paid_orders: number;
  total_revenue_inr: number;
  total_certificates_issued?: number;
  certificates_delivered_count?: number;
  certificates_failed_count?: number;
  total_coupon_campaigns: number;
  total_coupons_generated: number;
  total_coupons_redeemed: number;
  pending_credit_requests?: number;
  under_review_credit_requests?: number;
  approved_credit_requests?: number;
  issued_credit_requests?: number;
  total_credit_requests?: number;
  total_credits_granted?: number;
  new_support_tickets?: number;
  open_support_tickets?: number;
  urgent_support_tickets?: number;
  resolved_support_tickets?: number;
  total_support_tickets?: number;
  total_institutional_requests?: number;
  pending_institutional_requests?: number;
  under_review_institutional_requests?: number;
  proposal_sent_institutional_requests?: number;
  approved_institutional_requests?: number;
  rejected_institutional_requests?: number;
  total_vouchers_requested?: number;
}

interface PaymentItem {
  id: string;
  order_type: string;
  plan_id?: string;
  plan_name: string;
  amount_inr: number;
  credits_added: number;
  status: string;
  invoice_number?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  user_name: string;
  user_email: string;
  user_role: string;
  created_at?: string;
}

interface TeacherExamItem {
  id: string;
  title: string;
  exam_code: string;
  teacher_name: string;
  teacher_email: string;
  created_at?: string;
  is_published: boolean;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  candidate_count: number;
  submission_count: number;
  passing_rate: number;
}

interface CertificateItem {
  id: string;
  certificate_code: string;
  verification_token: string;
  recipient_name: string;
  recipient_email?: string;
  recipient_roll_number?: string;
  exam_name: string;
  institute_name: string;
  percentage?: number;
  grade?: string;
  issue_date?: string;
  email_status: string;
  is_revoked: boolean;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  tests_attempted: number;
}

interface TeacherCreditsItem {
  id: string;
  name: string;
  email: string;
  role: string;
  regular_credits: number;
  bonus_credits: number;
  total_credits: number;
  bonus_expires_at?: string;
  exams_created: number;
}

interface CreditTxItem {
  id: string;
  user_name: string;
  user_email: string;
  transaction_type: string;
  amount_credits: number;
  balance_after: number;
  description: string;
  created_at?: string;
}

interface AuditItem {
  id: string;
  action: string;
  actor_name: string;
  actor_email: string;
  details: string;
  timestamp: string;
}

type TabType = "cockpit" | "payments" | "teachers" | "students" | "certificates" | "credits";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<AuditItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [teacherExams, setTeacherExams] = useState<TeacherExamItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teacherCredits, setTeacherCredits] = useState<TeacherCreditsItem[]>([]);
  const [creditTx, setCreditTx] = useState<CreditTxItem[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>("cockpit");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters per Tab
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");
  const [creditsSearch, setCreditsSearch] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/admin/overview");
      if (!res.ok) {
        throw new Error(`Failed to load admin overview (Status ${res.status})`);
      }
      const data = await res.json();
      setStats(data.stats || null);
      setActivity(data.recent_activity || []);
      setPayments(data.recent_payments || []);
      setTeacherExams(data.teacher_exams || []);
      setCertificates(data.recent_certificates || []);
      setStudents(data.recent_students || []);
      setTeacherCredits(data.top_teachers_credits || []);
      setCreditTx(data.recent_credit_transactions || []);

      try {
        const fbRes = await apiFetch("/feedback/stats");
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          setFeedbackStats(fbData);
        }
      } catch (e) {
        // ignore background stats error
      }
    } catch (err: any) {
      setError(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        !paymentSearch ||
        p.user_name.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        p.user_email.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        p.plan_name.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        (p.invoice_number && p.invoice_number.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (p.razorpay_order_id && p.razorpay_order_id.toLowerCase().includes(paymentSearch.toLowerCase()));
      const matchStatus =
        paymentStatusFilter === "all" || p.status.toLowerCase() === paymentStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [payments, paymentSearch, paymentStatusFilter]);

  // Filtered Teacher Exams
  const filteredTeacherExams = useMemo(() => {
    return teacherExams.filter((ex) => {
      return (
        !teacherSearch ||
        ex.title.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        ex.teacher_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        ex.teacher_email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        ex.exam_code.toLowerCase().includes(teacherSearch.toLowerCase())
      );
    });
  }, [teacherExams, teacherSearch]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return (
        !studentSearch ||
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
      );
    });
  }, [students, studentSearch]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      return (
        !certSearch ||
        c.recipient_name.toLowerCase().includes(certSearch.toLowerCase()) ||
        c.certificate_code.toLowerCase().includes(certSearch.toLowerCase()) ||
        c.exam_name.toLowerCase().includes(certSearch.toLowerCase()) ||
        (c.recipient_email && c.recipient_email.toLowerCase().includes(certSearch.toLowerCase()))
      );
    });
  }, [certificates, certSearch]);

  // Filtered Teacher Credits
  const filteredTeacherCredits = useMemo(() => {
    return teacherCredits.filter((tc) => {
      return (
        !creditsSearch ||
        tc.name.toLowerCase().includes(creditsSearch.toLowerCase()) ||
        tc.email.toLowerCase().includes(creditsSearch.toLowerCase())
      );
    });
  }, [teacherCredits, creditsSearch]);

  return (
    <div className="space-y-6">
      {/* ─── TITLE & ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Company Executive Center
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Platform Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Testora Company Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Real-time revenue, plan subscriptions, faculty examination logs, student community metrics, and official digital credential delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchOverview}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            Refresh Telemetry
          </button>
          <Link
            href="/admin/coupons"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Generate Vouchers</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 7 EXECUTIVE KPI CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5">
        {/* KPI 1: Platform Revenue */}
        <div 
          onClick={() => setActiveTab("payments")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/50 shadow-2xs hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Revenue
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-purple-600 transition-colors">
            {loading ? "..." : `₹${(stats?.total_revenue_inr ?? 0).toLocaleString()}`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.total_paid_orders ?? 0} Paid Orders</span>
            <span className="font-bold text-purple-600">→</span>
          </div>
        </div>

        {/* KPI 2: Subscribed Plans & Recharges */}
        <div 
          onClick={() => setActiveTab("payments")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Subscriptions
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 transition-colors">
            {loading ? "..." : (stats?.total_paid_orders ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Plan Checkouts</span>
            <span className="font-bold text-indigo-600">→</span>
          </div>
        </div>

        {/* KPI 3: Faculty / Teachers */}
        <div 
          onClick={() => setActiveTab("teachers")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/50 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Faculty / Tutors
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
            {loading ? "..." : (stats?.total_teachers ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Active Creators</span>
            <span className="font-bold text-blue-600">→</span>
          </div>
        </div>

        {/* KPI 4: Students on Platform */}
        <div 
          onClick={() => setActiveTab("students")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Students
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-emerald-600 transition-colors">
            {loading ? "..." : ((stats?.total_students ?? 0) + (stats?.total_candidates_platform ?? 0)).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.total_students ?? 0} Reg + {stats?.total_candidates_platform ?? 0} Candidates</span>
            <span className="font-bold text-emerald-600">→</span>
          </div>
        </div>

        {/* KPI 5: Tests Conducted */}
        <div 
          onClick={() => setActiveTab("teachers")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900/50 shadow-2xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Tests Conducted
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-teal-600 transition-colors">
            {loading ? "..." : (stats?.total_exams ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.completed_submissions ?? 0} Submissions</span>
            <span className="font-bold text-teal-600">→</span>
          </div>
        </div>

        {/* KPI 6: Certificates Issued */}
        <div 
          onClick={() => setActiveTab("certificates")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Certificates
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-amber-600 transition-colors">
            {loading ? "..." : (stats?.total_certificates_issued ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats?.certificates_delivered_count ?? 0} Delivered</span>
            <span className="font-bold text-amber-600">→</span>
          </div>
        </div>

        {/* KPI 7: Circulating Credits */}
        <div 
          onClick={() => setActiveTab("credits")}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Credits Circulating
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
            {loading ? "..." : (stats?.total_available_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>User Wallets</span>
            <span className="font-bold text-slate-600">→</span>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE DASHBOARD VIEW TABS ─────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("cockpit")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "cockpit"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Executive Cockpit</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "payments"
              ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Payments &amp; Plans ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "teachers"
              ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Teacher Tests Conducted ({teacherExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "students"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Community ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "certificates"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certificates Conferred ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("credits")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === "credits"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-800"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>User Credits Ledger ({teacherCredits.length})</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: EXECUTIVE COCKPIT OVERVIEW */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "cockpit" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Module 1: Teacher Free Credit Requests */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Institutional 10,000 Credits
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                Teacher Free Credit Requests
              </h3>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-baseline gap-2">
                <span>{loading ? "..." : (stats?.pending_credit_requests ?? 0)}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Applications Pending</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.issued_credit_requests ?? 0} Issued</span>
                <span>•</span>
                <span>{(stats?.total_credits_granted ?? 0).toLocaleString()} Credits Granted</span>
              </div>
              <Link
                href="/admin/credit-requests"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                <span>Review &amp; Issue Free Credits</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 2: Help & Support Center */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-pink-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/30 border border-purple-200/80 dark:border-purple-900/60 shadow-xs relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Support Desk
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <LifeBuoy className="w-4 h-4 text-purple-200" />
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                Help &amp; Support Tickets
              </h3>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 flex items-baseline gap-2">
                <span>{loading ? "..." : ((stats?.open_support_tickets ?? 0) + (stats?.new_support_tickets ?? 0))}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Cases</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <span className="text-purple-600 font-bold">{stats?.new_support_tickets ?? 0} New</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">{stats?.urgent_support_tickets ?? 0} Urgent</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">{stats?.resolved_support_tickets ?? 0} Resolved</span>
              </div>
              <Link
                href="/admin/support"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
              >
                <span>Open Support Desk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Module 3: Institutional Plan Requests */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Institutional Plans
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-200" />
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                College &amp; FDP Proposals
              </h3>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
                <span>{loading ? "..." : (stats?.pending_institutional_requests ?? 0)}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <span className="text-blue-600 font-bold">{stats?.under_review_institutional_requests ?? 0} In Review</span>
                <span>•</span>
                <span className="text-purple-600 font-bold">{stats?.proposal_sent_institutional_requests ?? 0} Quoted</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">{(stats?.total_vouchers_requested ?? 0).toLocaleString()} Vouchers</span>
              </div>
              <Link
                href="/admin/institutional-requests"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
              >
                <span>Review Proposals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Dual Panels: Recent Payments & Recent Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel Left: Recent Subscribed Plans & Payments */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span>Recent Subscribed Plans &amp; Payments</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Live Razorpay recharge transactions</p>
                </div>
                <button
                  onClick={() => setActiveTab("payments")}
                  className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({payments.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {pay.user_name}
                        </span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shrink-0">
                          {pay.plan_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {pay.user_email} • {pay.invoice_number || "Direct Payment"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{pay.amount_inr.toLocaleString()}
                      </div>
                      <span className={`text-[9.5px] font-bold uppercase ${
                        pay.status === "paid" ? "text-emerald-600" : "text-amber-500"
                      }`}>
                        {pay.status}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">No recent payment orders recorded.</div>
                )}
              </div>
            </div>

            {/* Panel Right: Teacher Examination Activity */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    <span>Recent Tests Conducted by Faculty</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Teacher examination activity log</p>
                </div>
                <button
                  onClick={() => setActiveTab("teachers")}
                  className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({teacherExams.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
                {teacherExams.slice(0, 5).map((ex) => (
                  <div key={ex.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {ex.title}
                        </span>
                        {ex.is_published ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 shrink-0">
                            Live
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Conducted by <strong className="text-slate-700 dark:text-slate-300 font-semibold">{ex.teacher_name}</strong> • {ex.created_at ? formatLocalizedDate(ex.created_at) : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {ex.submission_count} Submissions
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ex.candidate_count} Enrolled • {ex.passing_rate}% Pass
                      </div>
                    </div>
                  </div>
                ))}
                {teacherExams.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">No assessments recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: COMPLETE PAYMENTS & SUBSCRIBED PLANS */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "payments" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls: Search & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, invoice or plan..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Status:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid (Success)</option>
                <option value="created">Pending / Created</option>
                <option value="failed">Failed</option>
              </select>

              <span className="text-xs text-slate-400 pl-2">
                Showing {filteredPayments.length} of {payments.length} orders
              </span>
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice / ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Plan / Package</th>
                    <th className="py-3 px-4">Credits Added</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {p.invoice_number || "Direct"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {p.razorpay_order_id || p.id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.user_name}</div>
                        <div className="text-[11px] text-slate-400">{p.user_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{p.plan_name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {p.credits_added > 0 ? `+${p.credits_added.toLocaleString()} Credits` : "—"}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        ₹{p.amount_inr.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                              : p.status === "failed"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          {p.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {p.created_at ? formatLocalizedDate(p.created_at) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.razorpay_order_id ? (
                          <a
                            href={`${API_V1}/payments/receipt/${p.razorpay_order_id}/html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Tax Invoice</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        No payment records matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: TEACHER TESTS CONDUCTED TIMELINE */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "teachers" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls: Search */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by faculty name, test title or code..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredTeacherExams.length} tests conducted across platform
            </div>
          </div>

          {/* Teacher Tests Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Test Title &amp; Code</th>
                    <th className="py-3 px-4">Conducting Faculty</th>
                    <th className="py-3 px-4">Enrolled Candidates</th>
                    <th className="py-3 px-4">Submissions</th>
                    <th className="py-3 px-4">Passing Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Conducted</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredTeacherExams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ex.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Code: {ex.exam_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>{ex.teacher_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{ex.teacher_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ex.candidate_count.toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-[11px]"> students</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-600 dark:text-teal-400">
                        {ex.submission_count.toLocaleString()} completed
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(ex.passing_rate, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            {ex.passing_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {ex.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Published Live</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {ex.created_at ? formatLocalizedDate(ex.created_at) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/exam/${ex.exam_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredTeacherExams.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        No assessments matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: STUDENTS PLATFORM COMMUNITY */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "students" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Platform Ecosystem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total student population taking assessments, mock tests, and receiving accredited certifications.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center sm:text-right">
              <div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {(stats?.total_students ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Registered Accounts</div>
              </div>
              <div>
                <div className="text-lg font-black text-teal-600 dark:text-teal-400">
                  {(stats?.total_candidates_platform ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Candidate Directories</div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {(stats?.completed_submissions ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Tests Attempted</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Recent registered students ({filteredStudents.length})
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role / Type</th>
                    <th className="py-3 px-4">Tests Attempted</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{s.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {s.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                          Student
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {s.tests_attempted} exams
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {s.created_at ? formatLocalizedDate(s.created_at) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No registered students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: CERTIFICATES CONFERRED & SENT */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "certificates" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls: Search */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search certificate by student, code or exam..."
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{stats?.certificates_delivered_count ?? 0} Email Delivered</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <XCircle className="w-4 h-4" />
                <span>{stats?.certificates_failed_count ?? 0} Delivery Issues</span>
              </span>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Recipient Student</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Academic Score</th>
                    <th className="py-3 px-4">Email Status</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredCertificates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {c.certificate_code}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {c.verification_token}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{c.recipient_email || "No email on record"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {c.exam_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{c.institute_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        {c.percentage !== undefined && c.percentage !== null ? (
                          <span className="px-2 py-0.5 rounded font-extrabold text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {c.percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {c.grade && (
                          <span className="ml-1 text-[10px] font-bold text-amber-600">
                            (Grade {c.grade})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.email_status === "SENT"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                              : c.email_status === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {c.email_status === "SENT" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Send className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{c.email_status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {c.issue_date ? formatLocalizedDate(c.issue_date) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/verify-certificate/${c.certificate_code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold text-[11px] border border-amber-200/80 dark:border-amber-800/60"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredCertificates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No certificates matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: USER CREDITS & WALLETS */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "credits" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Coins className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Circulating Prepaid Credit Wallets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total credits loaded by faculty across regular purchased quota and promotional bonus buckets.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center sm:text-right">
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {(stats?.total_available_credits ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total In Circulation</div>
              </div>
              <div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {(stats?.circulating_regular_credits ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Paid Credits</div>
              </div>
              <div>
                <div className="text-lg font-black text-orange-600 dark:text-orange-400">
                  {(stats?.circulating_bonus_credits ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Bonus Credits</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search faculty by name or email..."
                value={creditsSearch}
                onChange={(e) => setCreditsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Manage User Credits</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Teacher Credits Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Paid Credits</th>
                    <th className="py-3 px-4">Bonus Credits</th>
                    <th className="py-3 px-4">Total Balance</th>
                    <th className="py-3 px-4">Tests Created</th>
                    <th className="py-3 px-4 text-right">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredTeacherCredits.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {tc.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{tc.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{tc.email}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {tc.regular_credits.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {tc.bonus_credits > 0 ? `+${tc.bonus_credits.toLocaleString()}` : "0"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200">
                          {tc.total_credits.toLocaleString()} Credits
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {tc.exams_created} exams
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(tc.email)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          <span>Adjust</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
