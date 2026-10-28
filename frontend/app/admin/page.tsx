"use client";

import React, { useEffect, useState } from "react";
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
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface OverviewStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_admins: number;
  total_institutions: number;
  total_exams: number;
  published_exams: number;
  completed_submissions: number;
  circulating_regular_credits: number;
  circulating_bonus_credits: number;
  total_available_credits: number;
  total_paid_orders: number;
  total_revenue_inr: number;
  total_coupon_campaigns: number;
  total_coupons_generated: number;
  total_coupons_redeemed: number;
}

interface AuditItem {
  id: string;
  action: string;
  actor_name: string;
  actor_email: string;
  details: string;
  timestamp: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/admin/overview");
      if (!res.ok) {
        throw new Error(`Failed to load admin overview (Status ${res.status})`);
      }
      const data = await res.json();
      setStats(data.stats);
      setActivity(data.recent_activity || []);
    } catch (err: any) {
      setError(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-8">
      {/* ─── TITLE & ACTIONS ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Administrator Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time platform metrics, user directory counts, credit circulation, and financial analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Refresh Metrics
          </button>
          <Link
            href="/admin/coupons"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
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

      {/* ─── 6 PRIMARY METRIC CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : (stats?.total_users ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{stats?.total_teachers ?? 0} Teachers</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.total_students ?? 0} Students</span>
          </div>
          <Link
            href="/admin/users"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-bold"
          >
            Manage <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Exams */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assessments Created
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : (stats?.total_exams ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.published_exams ?? 0} Published Live</span>
            <span>•</span>
            <span>{stats?.completed_submissions ?? 0} Submissions</span>
          </div>
          <Link
            href="/admin/exams"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold"
          >
            View <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Circulating Credits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Circulating Credits
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : (stats?.total_available_credits ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold">{(stats?.circulating_regular_credits ?? 0).toLocaleString()} Regular</span>
            <span>•</span>
            <span>{(stats?.circulating_bonus_credits ?? 0).toLocaleString()} Bonus</span>
          </div>
          <Link
            href="/admin/credits"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-bold"
          >
            Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: Platform Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Platform Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : `₹${(stats?.total_revenue_inr ?? 0).toLocaleString()}`}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Across <span className="font-bold text-slate-900 dark:text-slate-200">{stats?.total_paid_orders ?? 0}</span> paid Razorpay checkouts
          </div>
          <Link
            href="/admin/credits"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-purple-600 dark:text-purple-400 flex items-center gap-0.5 font-bold"
          >
            Orders <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 5: Vouchers & Coupons */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vouchers & FDPs
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : (stats?.total_coupons_generated ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats?.total_coupon_campaigns ?? 0} Campaigns</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats?.total_coupons_redeemed ?? 0} Redeemed</span>
          </div>
          <Link
            href="/admin/coupons"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 font-bold"
          >
            Campaigns <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 6: Institutions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Institutions
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {loading ? "..." : (stats?.total_institutions ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Colleges & universities enrolled in platform
          </div>
          <Link
            href="/admin/institutions"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 font-bold"
          >
            Manage <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── QUICK SHORTCUTS & RECENT ACTIVITY ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Audit Trail */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Administrative Events</h2>
              <p className="text-[11px] text-slate-500">Immutable audit actions performed across the platform</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Full Trail <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {activity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No recent administrative events recorded.</div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.action}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{item.actor_name}</span>
                    </div>
                    {item.details && (
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-md">{item.details}</div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Control Hub */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Admin Quick Actions</span>
            </div>

            <div className="space-y-2">
              <Link
                href="/admin/coupons"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition-all border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-blue-300" />
                  <span>Issue 25 FDP Vouchers</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                href="/admin/users"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition-all border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-300" />
                  <span>Grant / Deduct Credits</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                href="/admin/settings"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition-all border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Signup Bonus Config</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                href="/admin/system"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition-all border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-cyan-300" />
                  <span>System Diagnostics</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
