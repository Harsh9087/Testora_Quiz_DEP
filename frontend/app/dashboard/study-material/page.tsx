"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Building2,
  Code2,
  Monitor,
  Cloud,
  FolderOpen,
  FileText,
  Coins,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { apiFetch, API_BASE } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";

interface StudyMaterialItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  category_display: string;
  file_type: string;
  file_size_mb?: number;
  pages_count?: number;
  is_paid: boolean;
  credit_cost: number;
  badge_text?: string;
  badge_color?: string;
  downloads_count: number;
  views_count: number;
  is_unlocked: boolean;
  file_url?: string | null;
  created_at?: string;
}

const CATEGORY_TABS = [
  { slug: "all", name: "All Study Materials", icon: FolderOpen },
  { slug: "company_notes", name: "Company Notes (TCS, Wipro & More)", icon: Building2 },
  { slug: "dsa", name: "DSA & Problem Solving", icon: Code2 },
  { slug: "web_development", name: "Web Development", icon: Monitor },
  { slug: "cloud_computing", name: "Cloud Computing", icon: Cloud },
];

function StudyMaterialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const { token, role } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [paidFilter, setPaidFilter] = useState<"all" | "free" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Unlock Modal State
  const [unlockTarget, setUnlockTarget] = useState<StudyMaterialItem | null>(null);
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // PDF Preview Modal State
  const [previewTarget, setPreviewTarget] = useState<StudyMaterialItem | null>(null);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (paidFilter === "free") {
        params.append("is_paid", "false");
      } else if (paidFilter === "paid") {
        params.append("is_paid", "true");
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const res = await apiFetch(`/study-materials/?${params.toString()}`, {
        token: activeToken || undefined
      });

      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch study materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) return;
    try {
      const res = await apiFetch("/payments/credits/balance", { token: activeToken });
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.credits_balance ?? 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMaterials();
    fetchBalance();
  }, [selectedCategory, paidFilter, searchQuery]);

  // Handle Tab Switch
  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(window.location.search);
    if (slug === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", slug);
    }
    router.replace(`/dashboard/study-material${newParams.toString() ? `?${newParams.toString()}` : ""}`);
  };

  // Handle Unlocking
  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) {
      router.push("/login");
      return;
    }

    try {
      setUnlocking(true);
      setUnlockError(null);
      const res = await apiFetch(`/study-materials/${unlockTarget.id}/unlock`, {
        method: "POST",
        token: activeToken
      });

      if (res.ok) {
        const data = await res.json();
        if (data.new_balance !== undefined) {
          setUserBalance(data.new_balance);
          window.dispatchEvent(new CustomEvent("credits-updated", { detail: data.new_balance }));
          window.dispatchEvent(new CustomEvent("refresh-sidebar-stats"));
        }
        // Update local state to show unlocked
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === unlockTarget.id
              ? { ...m, is_unlocked: true, file_url: data.download_url || m.file_url }
              : m
          )
        );
        const unlockedItem = { ...unlockTarget, is_unlocked: true, file_url: data.download_url };
        setUnlockTarget(null);
        // Automatically open the preview
        setPreviewTarget(unlockedItem);
      } else {
        const err = await res.json().catch(() => ({}));
        setUnlockError(err.detail || "Failed to unlock notes. Please verify your credits.");
      }
    } catch (err: any) {
      setUnlockError(err.message || "Network error while unlocking notes.");
    } finally {
      setUnlocking(false);
    }
  };

  const getFullDownloadUrl = (url?: string | null) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleDownload = (material: StudyMaterialItem) => {
    apiFetch(`/study-materials/${material.id}/download`, { method: "POST" }).catch(() => {});
    if (material.file_url) {
      const fullUrl = getFullDownloadUrl(material.file_url);
      window.open(fullUrl, "_blank");
    }
  };

  const openRechargeModal = () => {
    setUnlockTarget(null);
    window.dispatchEvent(new CustomEvent("open-credit-recharge"));
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ═══════ HEADER BANNER ═══════ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#0F172A] border border-purple-500/25 p-5 sm:p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Sparkles className="w-3 h-3 fill-purple-300" /> Premium Study Resources
              </span>
              <span className="text-[11px] text-purple-300/80 font-medium">
                Verified Placement Kits
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Study Material &amp; Company Notes
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              Curated interview kits, DSA cheat sheets, full-stack handbooks, and cloud architecture guides. Download free notes or unlock premium placement materials using wallet credits.
            </p>
          </div>

          {/* User Credits Card */}
          <div className="shrink-0 p-3 sm:p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Coins className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider block">
                Your Wallet Balance
              </span>
              <div className="text-base sm:text-lg font-black text-amber-300 leading-tight">
                {userBalance !== null ? `${userBalance.toLocaleString()} Credits` : "Loading..."}
              </div>
            </div>
            <button
              type="button"
              onClick={openRechargeModal}
              className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              + Recharge
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ SEARCH & CATEGORY FILTER BAR ═══════ */}
      <div className="space-y-3">
        {/* Category Pills (Matching user's requested sidebar list) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => handleCategorySelect(tab.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-purple-500"}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Free/Paid Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, topic, or title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPaidFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paidFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Notes
            </button>
            <button
              type="button"
              onClick={() => setPaidFilter("free")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paidFilter === "free"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              100% Free
            </button>
            <button
              type="button"
              onClick={() => setPaidFilter("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paidFilter === "paid"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              💎 Credit Unlock
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ STUDY MATERIALS GRID ═══════ */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
          <p className="text-xs">Loading verified study materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No study materials found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or switching to another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setPaidFilter("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs hover:bg-purple-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {materials.map((mat) => {
            const isAccessible = mat.is_unlocked || !mat.is_paid;

            return (
              <div
                key={mat.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-800/80 transition-all duration-200 overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div
                  className={`h-1.5 w-full ${
                    mat.is_paid ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                />

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  {/* Category & Badge Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md truncate">
                        {mat.category_display}
                      </span>
                      {mat.is_paid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 shrink-0 flex items-center gap-1">
                          <Coins className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {mat.credit_cost} Credits
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 shrink-0">
                          100% Free
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug line-clamp-2">
                      {mat.title}
                    </h3>

                    {mat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {mat.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {mat.file_type.toUpperCase()} • {mat.file_size_mb || 2.5} MB
                    </span>
                    <span>
                      {mat.downloads_count.toLocaleString()} downloads
                    </span>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-3 sm:px-4 sm:pb-4 pt-0">
                  {isAccessible ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTarget(mat)}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Online</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(mat)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockTarget(mat);
                        setUnlockError(null);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock with {mat.credit_cost} Credits</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ UNLOCK CONFIRMATION MODAL ═══════ */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Unlock Premium Notes</span>
              </div>
              <button
                type="button"
                onClick={() => setUnlockTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {unlockTarget.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This study material will be permanently unlocked in your account.
              </p>
            </div>

            {/* Cost Breakdown Box */}
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Unlock Fee:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {unlockTarget.credit_cost} Credits
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Your Available Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {userBalance ?? 0} Credits
                </span>
              </div>
            </div>

            {unlockError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{unlockError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="space-y-2 pt-1">
              {userBalance !== null && userBalance >= unlockTarget.credit_cost ? (
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={handleConfirmUnlock}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {unlocking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Unlocking Notes...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Unlock ({unlockTarget.credit_cost} Credits)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={openRechargeModal}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Recharge Wallet (+15k Plan)</span>
                  </button>
                  <p className="text-[10.5px] text-center text-slate-400">
                    You need {unlockTarget.credit_cost - (userBalance || 0)} more credits.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setUnlockTarget(null)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PDF PREVIEW MODAL ═══════ */}
      {previewTarget && previewTarget.file_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {previewTarget.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(previewTarget)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Preview */}
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950">
              <iframe
                src={`${getFullDownloadUrl(previewTarget.file_url)}#toolbar=0`}
                className="w-full h-full border-0"
                title={previewTarget.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudyMaterialPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
          <p className="text-xs">Loading study materials...</p>
        </div>
      }
    >
      <StudyMaterialContent />
    </Suspense>
  );
}
