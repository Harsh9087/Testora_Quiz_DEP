"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Coins,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Gift,
  Zap,
  CreditCard,
  User,
  Sliders,
  Receipt
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CreditTxItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  transaction_type: string;
  amount_credits: number;
  balance_after: number;
  description: string;
  created_at?: string;
}

export default function AdminCreditsPage() {
  const [transactions, setTransactions] = useState<CreditTxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("page_size", pageSize.toString());
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter) params.set("transaction_type", typeFilter);

      const res = await apiFetch(`/admin/credits/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load credit transaction ledger");
      }
      const data = await res.json();
      setTransactions(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "VOUCHER_REDEMPTION":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Voucher Code
          </span>
        );
      case "INITIAL_SIGNUP_BONUS":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Signup Bonus
          </span>
        );
      case "ADMIN_ADJUSTMENT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Admin Grant / Debit
          </span>
        );
      case "EXAM_PUBLISH_ESCROW":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            Exam Escrow
          </span>
        );
      case "RECHARGE_PURCHASE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Razorpay Prepaid
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            Global Financial & Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable audit log of prepaid recharge purchases, voucher redemptions, exam reservations, and admin adjustments.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
            placeholder="Search by user email, full name, or note..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Transaction Types</option>
            <option value="VOUCHER_REDEMPTION">Voucher Redemption</option>
            <option value="INITIAL_SIGNUP_BONUS">Initial Signup Bonus</option>
            <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
            <option value="RECHARGE_PURCHASE">Prepaid Recharge</option>
            <option value="EXAM_PUBLISH_ESCROW">Exam Reservation / Escrow</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading ledger entries...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No ledger transactions found matching the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Transaction / Time</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Post-Balance</th>
                  <th className="py-3.5 px-4">Description / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                        #{tx.id.slice(0, 8)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{tx.user_name}</div>
                      <div className="text-[11px] text-slate-400">{tx.user_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {renderTypeBadge(tx.transaction_type)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {tx.amount_credits > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{tx.amount_credits.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 flex items-center justify-end gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {tx.amount_credits.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {tx.balance_after?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-600 dark:text-slate-300 max-w-sm truncate" title={tx.description}>
                        {tx.description}
                      </div>
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
            Showing {transactions.length} of {total} entries
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
    </div>
  );
}
