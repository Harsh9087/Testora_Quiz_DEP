"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Building,
  School,
  Coins,
  Receipt,
  FileText,
  Clock,
  Printer,
  Edit2,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  CreditCard,
  Zap,
  Sliders
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import PlatformSettingsAndGuide from "@/components/PlatformSettingsAndGuide";

interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  institution_name?: string | null;
  department_name?: string | null;
  credits_balance: number;
}

interface PaymentHistoryRecord {
  id: string;
  order_type: string;
  exam_id?: string;
  exam_name?: string;
  exam_code?: string;
  student_count: number;
  question_count: number;
  billable_units: number;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  invoice_number?: string;
  receipt?: string;
  created_at: string;
}

interface CreditLedgerRecord {
  id: string;
  transaction_type: string;
  amount_credits: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge?: () => void;
  onLogout?: () => void;
  themeMode?: "light" | "dark";
  onToggleTheme?: () => void;
}

type TabType = "OVERVIEW" | "TRANSACTIONS" | "CREDITS_LEDGER" | "SETTINGS_GUIDE";

export default function TeacherProfileModal({
  isOpen,
  onClose,
  onOpenRecharge,
  onLogout,
  themeMode = "light",
  onToggleTheme,
}: TeacherProfileModalProps) {
  const { token, fullName, updateFullName } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [creditTx, setCreditTx] = useState<CreditLedgerRecord[]>([]);
  const [examCounts, setExamCounts] = useState<{ total: number; published: number; drafts: number }>({
    total: 0,
    published: 0,
    drafts: 0,
  });

  // Edit profile state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editAvatar, setEditAvatar] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchProfileAndData = async () => {
    if (!token) return;
    try {
      setLoading(true);

      // 1. Fetch user profile
      const profRes = await apiFetch("/auth/me", { token });
      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData);
        setEditName(pData.full_name || "");
        setEditAvatar(pData.avatar_url || "");
      }

      // 2. Fetch payment transactions
      const payRes = await apiFetch("/payments/history", { token });
      if (payRes.ok) {
        const pHistory = await payRes.json();
        setPayments(Array.isArray(pHistory) ? pHistory : []);
      }

      // 3. Fetch credit transactions ledger
      const txRes = await apiFetch("/payments/credits/transactions", { token });
      if (txRes.ok) {
        const txHistory = await txRes.json();
        setCreditTx(Array.isArray(txHistory) ? txHistory : []);
      }

      // 4. Fetch exams stats
      const exRes = await apiFetch("/exams/?limit=100", { token });
      if (exRes.ok) {
        const exams = await exRes.json();
        if (Array.isArray(exams)) {
          const published = exams.filter((e: any) => e.is_published).length;
          setExamCounts({
            total: exams.length,
            published,
            drafts: exams.length - published,
          });
        }
      }
    } catch {
      showToast("Unable to load profile data. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setActiveTab("OVERVIEW");
      fetchProfileAndData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editName.trim()) return;

    try {
      setIsSaving(true);
      const res = await apiFetch("/auth/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          full_name: editName.trim(),
          avatar_url: editAvatar.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update profile.");
      }

      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, full_name: updated.full_name, avatar_url: updated.avatar_url } : updated));
      setIsEditing(false);
      if (updateFullName) updateFullName(updated.full_name);
      showToast("Profile details updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadReceipt = (orderId: string) => {
    window.open(`${API_V1}/payments/receipt/${orderId}/html`, "_blank", "noopener,noreferrer");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#181614] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1C1A18]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-[#E5E0D8] dark:border-[#292524]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/20 dark:text-[#EA580C] font-bold flex items-center justify-center text-sm border border-[#C84B18]/20">
                  {profile?.full_name?.charAt(0) || fullName?.charAt(0) || "T"}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181614]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">
                  {profile?.full_name || fullName || "Teacher Profile"}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C]">
                  {profile?.role || "TEACHER"}
                </span>
              </div>
              <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3" />
                <span>{profile?.email || "..."}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A] transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#F7F5F0] dark:bg-[#151413] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "OVERVIEW"
                ? "bg-white dark:bg-[#201D1A] text-[#C84B18] dark:text-[#EA580C] shadow-xs"
                : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "TRANSACTIONS"
                ? "bg-white dark:bg-[#201D1A] text-[#C84B18] dark:text-[#EA580C] shadow-xs"
                : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321]"
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Tax Invoices & Orders ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CREDITS_LEDGER")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "CREDITS_LEDGER"
                ? "bg-white dark:bg-[#201D1A] text-[#C84B18] dark:text-[#EA580C] shadow-xs"
                : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321]"
            }`}
          >
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span>Credits Ledger ({creditTx.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SETTINGS_GUIDE")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "SETTINGS_GUIDE"
                ? "bg-white dark:bg-[#201D1A] text-[#C84B18] dark:text-[#EA580C] shadow-xs"
                : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-[#C84B18]" />
            <span>Settings & Platform Guide</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-7 w-7 text-[#C84B18] animate-spin" />
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">Loading teacher account profile...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & WALLET OVERVIEW */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-4">
                  {/* Inline Profile Editing Form */}
                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="p-4 rounded-xl border border-[#C84B18]/40 bg-white dark:bg-[#201D1A] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8] dark:border-[#292524]">
                        <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">Edit Teacher Profile</span>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="text-[11px] text-[#716D67] hover:text-[#242321]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#716D67] dark:text-[#A8A29E]">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg px-3 py-2 text-xs text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                          placeholder="e.g. Dr. Jane Doe"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#716D67] dark:text-[#A8A29E]">Avatar Image URL</label>
                        <input
                          type="url"
                          value={editAvatar}
                          onChange={(e) => setEditAvatar(e.target.value)}
                          className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg px-3 py-2 text-xs text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 rounded-lg bg-[#C84B18] dark:bg-[#EA580C] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 transition-opacity"
                        >
                          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* Wallet Balance Card */}
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/30 dark:via-orange-950/15 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        <Coins className="h-3.5 w-3.5" />
                        <span>Prepaid Credit Balance</span>
                      </div>
                      <div className="text-3xl font-black text-[#242321] dark:text-[#F5F5F4] mt-1 flex items-baseline gap-2">
                        <span>{(profile?.credits_balance || 0).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E]">Credits Available</span>
                      </div>
                      <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                        1 Credit = 1 Candidate Question Attempt
                      </p>
                    </div>

                    {onOpenRecharge && (
                      <button
                        type="button"
                        onClick={onOpenRecharge}
                        className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Recharge Wallet</span>
                      </button>
                    )}
                  </div>

                  {/* Academic Profile Details */}
                  <div className="p-4 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C84B18] dark:text-[#EA580C]">
                      Institution & Department Affiliation
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8]/60 dark:border-[#292524]">
                        <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E] flex items-center gap-1">
                          <Building className="h-3 w-3" /> Institution
                        </div>
                        <div className="font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                          {profile?.institution_name || "Testora Quiz Academy"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8]/60 dark:border-[#292524]">
                        <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E] flex items-center gap-1">
                          <School className="h-3 w-3" /> Department
                        </div>
                        <div className="font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                          {profile?.department_name || "Academic Faculty"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assessment Statistics Card */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A]">
                      <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">Total Tests</div>
                      <div className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] mt-0.5">
                        {examCounts.total}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      <div className="text-[10px] opacity-80">Published & Live</div>
                      <div className="text-xl font-bold mt-0.5">
                        {examCounts.published}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200">
                      <div className="text-[10px] opacity-80">Saved Drafts</div>
                      <div className="text-xl font-bold mt-0.5">
                        {examCounts.drafts}
                      </div>
                    </div>
                  </div>

                  {/* System Preferences (Theme toggle & Sign Out) */}
                  <div className="p-4 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] block">Appearance Theme</span>
                      <span className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                        Switch between light and dark modes
                      </span>
                    </div>

                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="w-11 h-6 rounded-full bg-[#E5E0D8] dark:bg-[#292524] border border-[#E5E0D8] dark:border-[#292524] p-0.5 flex items-center cursor-pointer transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white dark:bg-[#EA580C] shadow-xs flex items-center justify-center transform transition-transform ${
                            themeMode === "dark" ? "translate-x-5 text-white" : "translate-x-0 text-[#C84B18]"
                          }`}
                        >
                          {themeMode === "light" ? <Sun className="h-2.5 w-2.5" /> : <Moon className="h-2.5 w-2.5" />}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TAX INVOICES & PAYMENT ORDERS */}
              {activeTab === "TRANSACTIONS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Payment & Billing Records
                    </span>
                    <span className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                      Official GST tax invoices
                    </span>
                  </div>

                  {payments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#716D67] dark:text-[#A8A29E]">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <span>No payment transactions found.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E0D8] dark:divide-[#292524] border border-[#E5E0D8] dark:border-[#292524] rounded-xl overflow-hidden bg-white dark:bg-[#1E1C1A]">
                      {payments.map((p) => (
                        <div key={p.id} className="p-3.5 hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] transition-colors flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {p.exam_name || (p.order_type === "CREDIT_RECHARGE" ? "Credit Wallet Recharge" : "Assessment License")}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                p.status === "paid" 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}>
                                {p.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E] flex items-center gap-2">
                              <span>{new Date(p.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                              <span>•</span>
                              <span>{p.invoice_number || p.razorpay_order_id}</span>
                              {p.billable_units > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{p.billable_units} units</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4]">
                              ₹{(p.amount / 100).toFixed(2)}
                            </div>

                            {p.status === "paid" && (
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(p.id)}
                                className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-stone-100 dark:hover:bg-[#282522] text-[#C84B18] dark:text-[#EA580C] transition-colors"
                                title="Download Tax Invoice"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CREDITS LEDGER */}
              {activeTab === "CREDITS_LEDGER" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Credit Balance Audit Ledger
                    </span>
                    <span className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                      Immutable chronological credits history
                    </span>
                  </div>

                  {creditTx.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#716D67] dark:text-[#A8A29E]">
                      <Coins className="h-8 w-8 mx-auto mb-2 opacity-30 text-amber-500" />
                      <span>No credit wallet transactions recorded yet.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E0D8] dark:divide-[#292524] border border-[#E5E0D8] dark:border-[#292524] rounded-xl overflow-hidden bg-white dark:bg-[#1E1C1A]">
                      {creditTx.map((tx) => {
                        const isCredit = tx.amount_credits > 0;
                        return (
                          <div key={tx.id} className="p-3.5 hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] transition-colors flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  tx.transaction_type === "RECHARGE"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                }`}>
                                  {tx.transaction_type}
                                </span>
                                <span>{tx.description}</span>
                              </div>
                              <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                                {new Date(tx.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`font-black text-sm ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-stone-800 dark:text-stone-200"}`}>
                                {isCredit ? `+${tx.amount_credits.toLocaleString()}` : `${tx.amount_credits.toLocaleString()}`}
                              </div>
                              <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">
                                Bal: {tx.balance_after.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SETTINGS, ROUTE INFO & PLATFORM FEATURE GUIDES */}
              {activeTab === "SETTINGS_GUIDE" && (
                <div className="space-y-4">
                  <PlatformSettingsAndGuide
                    currentRole="teacher"
                    themeMode={themeMode}
                    onToggleTheme={onToggleTheme}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-[#292524] bg-white/50 dark:bg-[#181614]/50 flex items-center justify-between">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C84B18] dark:bg-[#EA580C] hover:opacity-90 text-white text-xs font-bold transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
