"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Building,
  School,
  Coins,
  Receipt,
  Edit2,
  Check,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Camera,
  Trash2,
  Upload,
  Download,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  LayoutDashboard
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import CreditRechargeModal from "../_components/CreditRechargeModal";
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
  bonus_credits?: number;
  bonus_days_remaining?: number;
  bonus_credits_expires_at?: string;
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

export default function TeacherProfilePage() {
  const router = useRouter();
  const { token, fullName, role, logout, updateFullName } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [creditTx, setCreditTx] = useState<CreditLedgerRecord[]>([]);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editAvatar, setEditAvatar] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Section Expand/Hide State (Block Format)
  const [expandWallet, setExpandWallet] = useState<boolean>(true);
  const [expandInvoices, setExpandInvoices] = useState<boolean>(false);
  const [expandLedger, setExpandLedger] = useState<boolean>(false);
  const [expandSettings, setExpandSettings] = useState<boolean>(true);

  // Modals
  const [rechargeModalOpen, setRechargeModalOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  const getAvatarUrl = (url?: string | null) => {
    if (!url || url.trim() === "" || url.toLowerCase() === "none") return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose a valid image file (JPG, PNG, WEBP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image file size must be less than 5MB", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/v1/auth/avatar/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : null));
        setEditAvatar(data.avatar_url || "");
        setImgError(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("avatarUrl", data.avatar_url);
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: data.avatar_url }));
        }
        useAuthStore.getState().setAvatarUrl(data.avatar_url);
        showToast("Profile photo uploaded successfully!", "success");
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to upload image", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to upload photo", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/auth/profile", {
        token,
        method: "PUT",
        body: JSON.stringify({
          avatar_url: "",
        }),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
        setEditAvatar("");
        setImgError(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("avatarUrl");
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: null }));
        }
        useAuthStore.getState().setAvatarUrl(null);
        showToast("Profile photo removed. Person icon restored.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to remove photo", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = (localStorage.getItem("theme_mode") || localStorage.getItem("theme")) as "light" | "dark" | null;
      setThemeMode(saved === "dark" ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextMode);
    if (nextMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("theme_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      localStorage.setItem("theme_mode", "light");
    }
  };

  const loadData = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Profile
      const meRes = await apiFetch("/auth/me", { token: activeToken });
      if (meRes.ok) {
        const uData: UserProfileData = await meRes.json();
        setProfile(uData);
        setEditName(uData.full_name || fullName || "");
        setEditAvatar(uData.avatar_url || "");
        setImgError(false);
        if (uData.avatar_url) {
          useAuthStore.getState().setAvatarUrl(uData.avatar_url);
          if (typeof window !== "undefined") {
            localStorage.setItem("avatarUrl", uData.avatar_url);
            window.dispatchEvent(new CustomEvent("avatar-updated", { detail: uData.avatar_url }));
          }
        }
      }

      // 2. Fetch Payments
      const payRes = await apiFetch("/payments/history", { token: activeToken });
      if (payRes.ok) {
        const pData = await payRes.json();
        setPayments(Array.isArray(pData) ? pData : []);
      }

      // 3. Fetch Credit Ledger
      const credRes = await apiFetch("/payments/credits/transactions", { token: activeToken });
      if (credRes.ok) {
        const cData = await credRes.json();
        setCreditTx(Array.isArray(cData) ? cData : []);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load account data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/auth/profile", {
        token,
        method: "PUT",
        body: JSON.stringify({
          full_name: editName.trim(),
          avatar_url: editAvatar.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: updated.full_name,
                avatar_url: updated.avatar_url,
              }
            : null
        );
        updateFullName(updated.full_name);
        setIsEditing(false);
        showToast("Profile updated successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to update profile", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReceipt = (orderId: string) => {
    const url = `${API_V1}/payments/receipt/${orderId}/html?token=${token}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* ══════════════════════════════════════════════════════
          TOP SIMPLE HEADER (MAIN DASHBOARD SHORTCUT)
         ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#292524]">
        <Link 
          href="/dashboard/teacher" 
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <LayoutDashboard className="h-4 w-4" />
          <span>Go to Main Dashboard</span>
        </Link>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#716D67] hover:text-[#242321] dark:hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 1: PERSONAL PROFILE (Essential Info)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with fallback Person icon */}
            <div className="relative shrink-0">
              {getAvatarUrl(profile?.avatar_url) && !imgError ? (
                <img
                  src={getAvatarUrl(profile?.avatar_url)!}
                  alt={profile?.full_name || "Profile"}
                  onError={() => setImgError(true)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E5E0D8] dark:border-[#292524] shadow-xs bg-[#FAF8F5] dark:bg-[#141312]"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-2xl bg-[#F5F2EB] dark:bg-[#201D1A] border-2 border-[#E5E0D8] dark:border-[#292524] flex items-center justify-center text-[#716D67] dark:text-[#A8A29E] shadow-xs"
                  title="Person Icon"
                >
                  <User className="w-8 h-8 text-[#8C827A] dark:text-[#A8A29E]" />
                </div>
              )}

              {/* Upload photo overlay button */}
              <label 
                className="absolute -bottom-1 -right-1 bg-[#C84B18] hover:bg-[#b04013] text-white p-1 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Change Photo"
              >
                {uploadingPhoto ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            {/* Profile Identity Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#242321] dark:text-[#F5F5F4]">
                  {profile?.full_name || fullName || "Teacher"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#C84B18]/10 text-[#C84B18]">
                  {profile?.role || role || "Teacher"}
                </span>
              </div>
              <div className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile?.email}</span>
              </div>
              <div className="text-[11px] text-[#8C827A] mt-1 flex items-center gap-2">
                <span>{profile?.institution_name || "Testora Quiz Academy"}</span>
                <span>•</span>
                <span>{profile?.department_name || "Academic Faculty"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F4EF] dark:bg-[#201D1A] hover:bg-[#E5E0D8] dark:hover:bg-[#2A2624] text-xs font-bold text-[#242321] dark:text-[#F5F5F4] transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Info</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-[#E5E0D8] dark:border-[#292524] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#716D67] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#716D67] uppercase mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => {
                    setEditAvatar(e.target.value);
                    setImgError(false);
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C84B18] text-white text-xs font-bold hover:bg-[#b04013] transition-all cursor-pointer">
                  <Upload className="h-3 w-3" />
                  <span>{uploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>

                {(profile?.avatar_url || editAvatar) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#716D67]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#C84B18] text-white text-xs font-bold hover:bg-[#b04013] cursor-pointer"
                >
                  {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 2: CREDIT WALLET (Collapsible / Expandable)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl overflow-hidden shadow-xs">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandWallet(!expandWallet)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                Credits & Balance
              </div>
              <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                1 Credit = 1 Student Attempt per Question
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
              {profile?.credits_balance !== undefined ? profile.credits_balance.toLocaleString() : "0"} Credits
            </span>
            {expandWallet ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandWallet && (
          <div className="p-4 pt-0 border-t border-[#E5E0D8] dark:border-[#292524] space-y-4 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524]">
              <div>
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Current Available Balance
                </div>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {profile?.credits_balance !== undefined ? profile.credits_balance.toLocaleString() : "0"} Credits
                </div>
                {profile?.bonus_credits !== undefined && profile.bonus_credits > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold">
                      🎁 {profile.bonus_credits.toLocaleString()} Welcome Bonus
                    </span>
                    <span>• {profile.bonus_days_remaining} {profile.bonus_days_remaining === 1 ? "day" : "days"} validity remaining</span>
                  </div>
                )}
                <div className="text-[10px] text-[#8C827A] mt-1">
                  Prepaid credits can be used for 1-click test publishing without entering card details.
                </div>
              </div>

              <button
                onClick={() => setRechargeModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C84B18] hover:bg-[#b04013] text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Recharge Credits</span>
              </button>
            </div>

            {/* Quick Packages Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div 
                onClick={() => setRechargeModalOpen(true)}
                className="p-3 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#171615] hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">Starter</div>
                <div className="text-lg font-black text-[#242321] dark:text-[#F5F5F4] mt-1">₹100</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">1,000 Credits</div>
              </div>

              <div 
                onClick={() => setRechargeModalOpen(true)}
                className="p-3 rounded-xl border-2 border-amber-500/60 bg-white dark:bg-[#171615] hover:border-amber-500 cursor-pointer transition-all relative overflow-hidden"
              >
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">Growth (+10%)</div>
                <div className="text-lg font-black text-[#242321] dark:text-[#F5F5F4] mt-1">₹200</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">2,200 Credits</div>
              </div>

              <div 
                onClick={() => setRechargeModalOpen(true)}
                className="p-3 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#171615] hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">Institutional (+20%)</div>
                <div className="text-lg font-black text-[#242321] dark:text-[#F5F5F4] mt-1">₹500</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">6,000 Credits</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 3: TAX INVOICES & ORDERS (Collapsible / Expandable)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl overflow-hidden shadow-xs">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandInvoices(!expandInvoices)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                Payment Invoices & Receipts
              </div>
              <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Official tax receipts with GST and Razorpay references
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#716D67] font-semibold">
              {payments.length} {payments.length === 1 ? "invoice" : "invoices"}
            </span>
            {expandInvoices ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandInvoices && (
          <div className="p-4 pt-0 border-t border-[#E5E0D8] dark:border-[#292524] mt-2">
            {payments.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#716D67]">
                No payment invoices found yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E0D8] dark:border-[#292524] text-[10px] font-bold text-[#716D67] uppercase">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                    {payments.map((p) => {
                      const isPaid = p.status === "paid";
                      return (
                        <tr key={p.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50">
                          <td className="py-2.5 px-3 text-[#716D67] whitespace-nowrap">
                            {new Date(p.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#242321] dark:text-[#F5F5F4]">
                            {p.exam_name || (p.order_type === "CREDIT_RECHARGE" ? "Credit Recharge" : "Exam Publishing")}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#242321] dark:text-[#F5F5F4] whitespace-nowrap">
                            ₹{(p.amount / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {isPaid && (
                              <button
                                onClick={() => handleDownloadReceipt(p.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E0D8] dark:border-[#292524] text-[11px] font-bold text-[#C84B18] hover:bg-[#C84B18] hover:text-white transition-all cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                                <span>PDF</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 4: CREDIT USAGE LEDGER (Collapsible / Expandable)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl overflow-hidden shadow-xs">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandLedger(!expandLedger)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                Credit Usage Ledger
              </div>
              <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Record of all credit additions, test deductions, and remaining balances
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#716D67] font-semibold">
              {creditTx.length} {creditTx.length === 1 ? "entry" : "entries"}
            </span>
            {expandLedger ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandLedger && (
          <div className="p-4 pt-0 border-t border-[#E5E0D8] dark:border-[#292524] mt-2">
            {creditTx.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#716D67]">
                No credit activity logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E0D8] dark:border-[#292524] text-[10px] font-bold text-[#716D67] uppercase">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Change</th>
                      <th className="py-2 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                    {creditTx.map((tx) => {
                      const isAddition = tx.amount_credits > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50">
                          <td className="py-2.5 px-3 text-[#716D67] whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                            {tx.transaction_type.replace(/_/g, " ")}
                          </td>
                          <td className="py-2.5 px-3 text-[#716D67] max-w-xs truncate">
                            {tx.description}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                            isAddition ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {isAddition ? `+${tx.amount_credits}` : tx.amount_credits}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#242321] dark:text-[#F5F5F4] whitespace-nowrap">
                            {tx.balance_after}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 5: ACCOUNT SETTINGS & PREFERENCES (Collapsible)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl overflow-hidden shadow-xs">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandSettings(!expandSettings)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gray-500/10 text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                Account Settings
              </div>
              <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Theme appearance, platform settings, and sign out
              </div>
            </div>
          </div>

          <div>
            {expandSettings ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandSettings && (
          <div className="p-4 pt-0 border-t border-[#E5E0D8] dark:border-[#292524] space-y-4 mt-2">
            {/* Embedded Platform Feature Guides, Route Diagnostics & Preferences */}
            <PlatformSettingsAndGuide
              currentRole="teacher"
              themeMode={themeMode}
              onToggleTheme={toggleTheme}
            />

            {/* Sign Out Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Recharge Modal */}
      <CreditRechargeModal
        isOpen={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        onRechargeSuccess={(newBalance) => {
          setProfile((prev) => (prev ? { ...prev, credits_balance: newBalance } : null));
          loadData();
        }}
      />
    </div>
  );
}
