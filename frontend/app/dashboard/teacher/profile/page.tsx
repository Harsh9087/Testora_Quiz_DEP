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
import { apiFetch, API_V1, getApiBase } from "@/lib/api";
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
    const baseUrl = getApiBase();
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

      const baseUrl = getApiBase();
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-16 px-2.5 sm:px-4">
      {/* ══════════════════════════════════════════════════════
          TOP NAVIGATION BAR (Responsive Return to Dashboard)
         ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              window.dispatchEvent(new CustomEvent("open-sidebar-menu"));
            } else {
              router.push("/dashboard/teacher");
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs transition-all cursor-pointer group active:scale-95"
          title="Open Menu / Return to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden xs:inline text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
            Teacher Profile &amp; Billing
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#263449] bg-white dark:bg-[#111C31] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#15233D] transition-colors cursor-pointer shadow-2xs"
            title="Refresh Account Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 1: PERSONAL PROFILE (Essential Info)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            {/* Avatar with fallback Person icon */}
            <div className="relative shrink-0">
              {getAvatarUrl(profile?.avatar_url) && !imgError ? (
                <img
                  src={getAvatarUrl(profile?.avatar_url)!}
                  alt={profile?.full_name || "Profile"}
                  onError={() => setImgError(true)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs bg-slate-50 dark:bg-slate-900"
                />
              ) : (
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs"
                  title="Profile Avatar"
                >
                  <User className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              )}

              {/* Upload photo overlay button */}
              <label 
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {profile?.full_name || fullName || "Teacher"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                  {profile?.role || role || "Teacher"}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px] xs:max-w-none">{profile?.institution_name || "Testora Quiz Academy"}</span>
                <span>•</span>
                <span className="truncate">{profile?.department_name || "Academic Faculty"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Info</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-slate-200 dark:border-[#263449] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer active:scale-95 shadow-xs">
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
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer active:scale-95"
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs active:scale-95"
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
      <div className="bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-colors">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandWallet(!expandWallet)}
          className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#15233D]/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Credits &amp; Balance
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                1 Credit = 1 Student Attempt per Question
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 shrink-0 whitespace-nowrap shadow-xs">
              {profile?.credits_balance !== undefined ? profile.credits_balance.toLocaleString() : "0"} Credits
            </span>
            {expandWallet ? (
              <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandWallet && (
          <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#263449] space-y-3.5 sm:space-y-4 mt-1">
            {/* Balance Highlight Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/50">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Current Available Balance
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {profile?.credits_balance !== undefined ? profile.credits_balance.toLocaleString() : "0"} Credits
                </div>
                {profile?.bonus_credits !== undefined && profile.bonus_credits > 0 && (
                  <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold">
                      🎁 {profile.bonus_credits.toLocaleString()} Welcome Bonus
                    </span>
                    <span>• {profile.bonus_days_remaining} {profile.bonus_days_remaining === 1 ? "day" : "days"} validity remaining</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  Prepaid credits can be used for 1-click test publishing without entering card details.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Recharge Credits</span>
              </button>
            </div>

            {/* Quick Packages Preview - 3 Columns Responsive Grid */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Quick Top-Up Packages
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div 
                  onClick={() => setRechargeModalOpen(true)}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all shadow-2xs group text-center"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Starter</div>
                  <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">₹100</div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">1,000 Qs</div>
                </div>

                <div 
                  onClick={() => setRechargeModalOpen(true)}
                  className="p-2.5 sm:p-3 rounded-xl border-2 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-600 cursor-pointer transition-all shadow-xs relative text-center"
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase bg-amber-500 text-white shadow-2xs">
                    Popular
                  </span>
                  <div className="text-[11px] sm:text-xs font-bold text-amber-900 dark:text-amber-200 truncate">Growth</div>
                  <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">₹200</div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">2,200 (+10%)</div>
                </div>

                <div 
                  onClick={() => setRechargeModalOpen(true)}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all shadow-2xs text-center"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Pro</div>
                  <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">₹500</div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">6,000 (+20%)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 3: TAX INVOICES & ORDERS (Collapsible / Expandable)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-colors">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandInvoices(!expandInvoices)}
          className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#15233D]/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Payment Invoices &amp; Receipts
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Official tax receipts with GST and Razorpay references
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {payments.length} {payments.length === 1 ? "invoice" : "invoices"}
            </span>
            {expandInvoices ? (
              <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandInvoices && (
          <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#263449] mt-1">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No payment invoices found yet.
              </div>
            ) : (
              <>
                {/* Mobile Responsive Cards (sm:hidden) */}
                <div className="sm:hidden space-y-2.5 pt-2">
                  {payments.map((p) => {
                    const isPaid = p.status === "paid";
                    return (
                      <div 
                        key={p.id} 
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(p.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {p.exam_name || (p.order_type === "CREDIT_RECHARGE" ? "Credit Recharge" : "Exam Publishing")}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                            ₹{(p.amount / 100).toFixed(2)}
                          </span>
                        </div>
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p.id)}
                            className="w-full mt-1 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download Tax Receipt PDF</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tablet/Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payments.map((p) => {
                        const isPaid = p.status === "paid";
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-[#15233D]/50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(p.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {p.exam_name || (p.order_type === "CREDIT_RECHARGE" ? "Credit Recharge" : "Exam Publishing")}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              ₹{(p.amount / 100).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(p.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
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
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 4: CREDIT USAGE LEDGER (Collapsible / Expandable)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-colors">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandLedger(!expandLedger)}
          className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#15233D]/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Credit Usage Ledger
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Record of credit additions, test deductions, and remaining balance
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {creditTx.length} {creditTx.length === 1 ? "entry" : "entries"}
            </span>
            {expandLedger ? (
              <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandLedger && (
          <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#263449] mt-1">
            {creditTx.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No credit activity logged yet.
              </div>
            ) : (
              <>
                {/* Mobile Responsive Cards (sm:hidden) */}
                <div className="sm:hidden space-y-2.5 pt-2">
                  {creditTx.map((tx) => {
                    const isAddition = tx.amount_credits > 0;
                    return (
                      <div 
                        key={tx.id} 
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {tx.transaction_type.replace(/_/g, " ")}
                          </span>
                          <span className={`text-xs font-black ${isAddition ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {isAddition ? `+${tx.amount_credits}` : tx.amount_credits} Credits
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                          {tx.description}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                          <span>
                            {new Date(tx.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span>Balance: <strong className="text-slate-800 dark:text-slate-200 font-bold">{tx.balance_after}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet/Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Change</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {creditTx.map((tx) => {
                        const isAddition = tx.amount_credits > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-[#15233D]/50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                              {tx.transaction_type.replace(/_/g, " ")}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                              {tx.description}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                              isAddition ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                            }`}>
                              {isAddition ? `+${tx.amount_credits}` : tx.amount_credits}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {tx.balance_after}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 5: ACCOUNT SETTINGS & PREFERENCES (Collapsible)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-colors">
        {/* Clickable Header Block */}
        <div 
          onClick={() => setExpandSettings(!expandSettings)}
          className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#15233D]/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <Sliders className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Account Settings
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Theme appearance, platform settings, and sign out
              </div>
            </div>
          </div>

          <div>
            {expandSettings ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {expandSettings && (
          <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#263449] space-y-4 mt-1">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
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
