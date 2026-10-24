"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Camera,
  Edit2,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  Coins,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  LogOut,
  GraduationCap,
  ArrowLeft
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";

interface StudentProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  credits_balance?: number;
  institution_name?: string | null;
  department_name?: string | null;
  roll_number?: string | null;
  division?: string | null;
  batch?: string | null;
}

interface CreditLedgerRecord {
  id: string;
  transaction_type: string;
  amount_credits: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { token, fullName, role, logout, updateFullName } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [creditTx, setCreditTx] = useState<CreditLedgerRecord[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [avgScore, setAvgScore] = useState<number>(0);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editAvatar, setEditAvatar] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Section Expand/Hide State (Block Format)
  const [expandWallet, setExpandWallet] = useState<boolean>(true);
  const [expandActivity, setExpandActivity] = useState<boolean>(true);
  const [expandLedger, setExpandLedger] = useState<boolean>(false);
  const [expandSettings, setExpandSettings] = useState<boolean>(false);

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  const getAvatarUrl = (url?: string | null) => {
    if (!url || url.trim() === "" || url.toLowerCase() === "none") return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
        showToast("Profile photo uploaded successfully!", "success");
      } else {
        const err = await res.json().catch(() => ({}));
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
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const meRes = await apiFetch("/auth/me", { token });
      if (meRes.ok) {
        const uData: StudentProfileData = await meRes.json();
        setProfile(uData);
        setEditName(uData.full_name || fullName || "");
        setEditAvatar(uData.avatar_url || "");
        setImgError(false);
      }

      // 2. Fetch Credit Ledger (Safe fetch)
      try {
        const credRes = await apiFetch("/payments/credits/transactions", { token });
        if (credRes.ok) {
          const cData = await credRes.json();
          setCreditTx(Array.isArray(cData) ? cData : []);
        }
      } catch {}

      // 3. Fetch Submissions stats
      try {
        const subRes = await apiFetch("/reports/my-submissions", { token });
        if (subRes.ok) {
          const sData = await subRes.json();
          if (Array.isArray(sData)) {
            setSubmissionsCount(sData.length);
            if (sData.length > 0) {
              const total = sData.reduce((acc, cur) => acc + (Number(cur.percentage) || 0), 0);
              setAvgScore(Math.round(total / sData.length));
            }
          }
        }
      } catch {}

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
        setProfile(updated);
        updateFullName(updated.full_name);
        setIsEditing(false);
        showToast("Profile updated successfully!", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to update profile", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16 px-2 sm:px-4">
      {/* ══════════════════════════════════════════════════════
          TOP NAVIGATION BAR
         ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/dashboard/student"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Student Portal</span>
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
                  {profile?.full_name || fullName || "Student Candidate"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {profile?.role || role || "STUDENT"}
                </span>
              </div>
              <div className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile?.email}</span>
              </div>
              <div className="text-[11px] text-[#8C827A] mt-1 flex flex-wrap items-center gap-2">
                <span>{profile?.institution_name || "Testora Quiz Academy"}</span>
                {profile?.roll_number && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Roll: {profile.roll_number}</span>
                  </>
                )}
                {profile?.division && (
                  <>
                    <span>•</span>
                    <span>Div: {profile.division}</span>
                  </>
                )}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Reset to Person Icon</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-[#716D67] hover:text-[#242321] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C84B18] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 2: PREPAID CREDITS WALLET (Expand / Hide)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-xs overflow-hidden">
        <div 
          onClick={() => setExpandWallet(!expandWallet)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1D1B19]/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                Available Credits Balance
              </h2>
              <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Credits for student assessments and practice exams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {(profile?.credits_balance || 0).toLocaleString()} Credits
            </span>
            {expandWallet ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {expandWallet && (
          <div className="p-5 pt-0 border-t border-[#E5E0D8]/60 dark:border-[#292524] space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div>
                <div className="text-[11px] font-bold text-[#716D67] uppercase tracking-wider">
                  Current Wallet Balance
                </div>
                <div className="text-2xl font-black text-[#242321] dark:text-[#F5F5F4] mt-0.5 flex items-center gap-2">
                  <span>{(profile?.credits_balance || 0).toLocaleString()}</span>
                  <span className="text-xs font-bold text-[#716D67]">credits</span>
                </div>
                <p className="text-xs text-[#716D67] mt-1">
                  1 credit = 1 candidate attempt unlocked
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpandLedger(!expandLedger)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white bg-white dark:bg-[#171615] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-amber-500" />
                  <span>{expandLedger ? "Hide Ledger" : "View Credit Activity"}</span>
                </button>
              </div>
            </div>

            {/* Credit Transaction Ledger */}
            {expandLedger && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Credit Ledger History</span>
                </div>

                {creditTx.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1D1B19] text-center text-xs text-[#716D67]">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E5E0D8] dark:border-[#292524]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] dark:bg-[#1D1B19] text-[#716D67] border-b border-[#E5E0D8] dark:border-[#292524]">
                        <tr>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Credits</th>
                          <th className="py-2.5 px-3">Balance After</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D8]/60 dark:divide-[#292524]">
                        {creditTx.map((tx) => (
                          <tr key={tx.id} className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#1D1B19]/50">
                            <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                              {tx.transaction_type}
                            </td>
                            <td className="py-2 px-3 text-[#57534E] dark:text-[#A8A29E] max-w-xs truncate">
                              {tx.description}
                            </td>
                            <td className="py-2 px-3 font-bold text-[#242321] dark:text-[#F5F5F4]">
                              +{tx.amount_credits.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-[#716D67]">
                              {tx.balance_after.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-[#8C827A] whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 3: ACADEMIC ACTIVITY & EXAM SUMMARY (Expand / Hide)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-xs overflow-hidden">
        <div 
          onClick={() => setExpandActivity(!expandActivity)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1D1B19]/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                Academic Summary & Attempts
              </h2>
              <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Test performance records and submissions history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#716D67] px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1D1B19]">
              {submissionsCount} Attempts
            </span>
            {expandActivity ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {expandActivity && (
          <div className="p-5 pt-0 border-t border-[#E5E0D8]/60 dark:border-[#292524] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524]">
                <div className="text-[11px] font-bold text-[#716D67] uppercase tracking-wider">
                  Total Completed Submissions
                </div>
                <div className="text-2xl font-black text-[#242321] dark:text-[#F5F5F4] mt-0.5">
                  {submissionsCount}
                </div>
                <p className="text-xs text-[#716D67] mt-1">
                  Exams attended & graded
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524]">
                <div className="text-[11px] font-bold text-[#716D67] uppercase tracking-wider">
                  Average Assessment Score
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {avgScore}%
                </div>
                <p className="text-xs text-[#716D67] mt-1">
                  Cumulative percentage average
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#716D67]">
                Ready to take a new test?
              </span>
              <Link
                href="/dashboard/student"
                className="px-4 py-2 rounded-xl bg-[#C84B18] text-white text-xs font-bold hover:bg-[#b04013] transition-colors shadow-xs"
              >
                Go to Active Assessments
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK 4: PREFERENCES & SECURITY (Expand / Hide)
         ══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-xs overflow-hidden">
        <div 
          onClick={() => setExpandSettings(!expandSettings)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1D1B19]/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Moon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                Appearance & Account Security
              </h2>
              <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Theme preferences and logout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#716D67] capitalize">
              {themeMode} mode
            </span>
            {expandSettings ? (
              <ChevronUp className="h-4 w-4 text-[#716D67]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#716D67]" />
            )}
          </div>
        </div>

        {expandSettings && (
          <div className="p-5 pt-0 border-t border-[#E5E0D8]/60 dark:border-[#292524] space-y-4">
            <div className="divide-y divide-[#E5E0D8]/60 dark:divide-[#292524] mt-3">
              {/* Theme Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                    Interface Theme
                  </div>
                  <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                    Switch between Dark Mode and Warm Ivory Light theme
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-xs font-bold text-[#242321] dark:text-[#F5F5F4] hover:bg-[#FAF8F5] dark:hover:bg-[#1D1B19] transition-all cursor-pointer"
                >
                  {themeMode === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Logout Option */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-600">
                    Sign Out Account
                  </div>
                  <div className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                    Safely log out from this device
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
