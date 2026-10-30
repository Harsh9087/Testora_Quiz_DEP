"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sliders,
  User,
  Palette,
  Eye,
  Bell,
  Globe,
  Shield,
  Link2,
  Database,
  Search,
  Smartphone,
  HelpCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  RefreshCw,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Lock,
  Key,
  LogOut,
  Laptop,
  Share2,
  Upload,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Flame,
  ArrowRight
} from "lucide-react";

import { usePreferenceStore, FontFamily, InterfaceDensity, ThemePreference } from "@/store/preferenceStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { TRANSLATIONS, LanguageCode } from "@/lib/i18n";

type SettingsSectionId =
  | "profile"
  | "appearance"
  | "accessibility"
  | "notifications"
  | "language"
  | "privacy"
  | "accounts"
  | "data"
  | "search"
  | "pwa"
  | "help"
  | "account";

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { token, fullName, role, logout, updateFullName } = useAuthStore();
  const prefs = usePreferenceStore();

  const [activeSection, setActiveSection] = useState<SettingsSectionId>("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Modals & confirmation dialogs
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // PWA & Browser State
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pushStatus, setPushStatus] = useState<NotificationPermission | "unsupported">("default");

  // Translation helper
  const t = useMemo(() => {
    return TRANSLATIONS[prefs.language] || TRANSLATIONS.en;
  }, [prefs.language]);

  // Load User Profile Data
  const loadProfile = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) return;

    setLoadingProfile(true);
    try {
      const res = await apiFetch("/auth/me", { token: activeToken });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setEditingName(data.full_name || fullName || "");
        if (data?.avatar_url) {
          useAuthStore.getState().setAvatarUrl(data.avatar_url);
          if (typeof window !== "undefined") {
            localStorage.setItem("avatarUrl", data.avatar_url);
            window.dispatchEvent(new CustomEvent("avatar-updated", { detail: data.avatar_url }));
          }
        }
      }
    } catch {
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  // Network & Push Detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check PWA standalone mode
    const checkPwa = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isNavigatorStandalone = (window.navigator as any).standalone === true;
      setIsPwaInstalled(isStandaloneMedia || isNavigatorStandalone);
    };
    checkPwa();

    // Check Online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check Push status
    if ("Notification" in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus("unsupported");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle Save Name
  const handleUpdateName = async () => {
    if (!editingName.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) return;

    try {
      const res = await apiFetch("/auth/profile", {
        token: activeToken,
        method: "PUT",
        body: JSON.stringify({ full_name: editingName.trim() }),
      });
      if (res.ok) {
        updateFullName(editingName.trim());
        showToast("Profile name updated successfully", "success");
        prefs.playChime();
        loadProfile();
      } else {
        showToast("Failed to update name", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save profile", "error");
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, WEBP)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "error");
      return;
    }

    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingAvatar(true);
    try {
      const res = await apiFetch("/auth/avatar/upload", {
        token: activeToken,
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Profile avatar uploaded successfully", "success");
        prefs.playChime();
        if (data?.avatar_url) {
          useAuthStore.getState().setAvatarUrl(data.avatar_url);
          if (typeof window !== "undefined") {
            localStorage.setItem("avatarUrl", data.avatar_url);
            window.dispatchEvent(new CustomEvent("avatar-updated", { detail: data.avatar_url }));
          }
        }
        loadProfile();
      } else {
        showToast("Failed to upload image", "error");
      }
    } catch {
      showToast("Network error uploading photo", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast("Please enter both old and new password", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) return;

    setChangingPassword(true);
    try {
      const res = await apiFetch("/auth/change-password", {
        token: activeToken,
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      if (res.ok) {
        showToast("Password updated successfully!", "success");
        prefs.playChime();
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.detail || "Incorrect old password", "error");
      }
    } catch {
      showToast("Failed to update password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Push Permission Request
  const handleRequestPush = async () => {
    if (!("Notification" in window)) {
      showToast("Browser push notifications are not supported on this device", "warning");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === "granted") {
        await prefs.savePreferences({ channel_push: true }, token);
        showToast("Push notifications successfully enabled!", "success");
        prefs.playChime();
        try {
          new Notification("Testora Quiz Notifications", {
            body: "Push notification alert enabled for your assessments and cohorts.",
            icon: "/icon-192.png",
          });
        } catch {}
      } else {
        await prefs.savePreferences({ channel_push: false }, token);
        showToast("Push notifications permission was not granted", "warning");
      }
    } catch {
      showToast("Error requesting push permission", "error");
    }
  };

  // Handle Data Export
  const handleExportData = async () => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) {
      showToast("Please sign in to export your account data", "warning");
      return;
    }
    setIsExportingData(true);
    try {
      const res = await apiFetch("/preferences/export-data", { token: activeToken });
      if (res.ok) {
        const bundle = await res.json();
        const jsonBlob = new Blob([JSON.stringify(bundle, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `testora-quiz-user-archive-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Personal data archive downloaded successfully", "success");
        prefs.playChime();
      } else {
        showToast("Failed to compile export data", "error");
      }
    } catch {
      showToast("Network error generating export", "error");
    } finally {
      setIsExportingData(false);
    }
  };

  // Handle Clear Local Cache
  const handleClearCache = async () => {
    try {
      // Clear Service Worker Caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Clear non-auth local storage
      localStorage.removeItem("pwa_prompt_dismissed_at");
      localStorage.removeItem("testora_search_history");
      showToast("Local caches and temporary offline storage cleared", "success");
      prefs.playChime();
      setShowClearCacheModal(false);
    } catch {
      showToast("Failed to clear local cache", "error");
    }
  };

  // Navigation Items
  const SECTIONS = [
    { id: "profile" as SettingsSectionId, label: t.navProfile, icon: User, badge: null },
    { id: "appearance" as SettingsSectionId, label: t.navAppearance, icon: Palette, badge: "Live" },
    { id: "accessibility" as SettingsSectionId, label: t.navAccessibility, icon: Eye, badge: null },
    { id: "notifications" as SettingsSectionId, label: t.navNotifications, icon: Bell, badge: null },
    { id: "language" as SettingsSectionId, label: t.navLanguage, icon: Globe, badge: null },
    { id: "privacy" as SettingsSectionId, label: t.navPrivacy, icon: Shield, badge: null },
    { id: "accounts" as SettingsSectionId, label: t.navAccounts, icon: Link2, badge: null },
    { id: "data" as SettingsSectionId, label: t.navDataStorage, icon: Database, badge: null },
    { id: "search" as SettingsSectionId, label: t.navSearch, icon: Search, badge: null },
    { id: "pwa" as SettingsSectionId, label: t.navPwa, icon: Smartphone, badge: isPwaInstalled ? "PWA" : null },
    { id: "help" as SettingsSectionId, label: t.navHelp, icon: HelpCircle, badge: null },
    { id: "account" as SettingsSectionId, label: t.navAccountMgmt, icon: AlertTriangle, badge: "Danger" },
  ];

  const filteredSections = SECTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ══════════════════════════════════════════════════════
          TOP SETTINGS HEADER
         ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] dark:bg-[#172B4D] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#2563EB]/20 shadow-2xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#111827] dark:text-[#F1F5F9] tracking-tight">
                {t.settings}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Indicator & Reset Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {prefs.isSaving ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{t.saving}</span>
            </span>
          ) : prefs.lastSyncedAt ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Saved</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] transition-all cursor-pointer shadow-2xs"
            title="Reset all settings to default values"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.resetDefaults}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SETTINGS MAIN LAYOUT: SIDEBAR + CONTENT
         ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] dark:text-[#A3B1C6]" />
            <input
              type="text"
              placeholder={t.searchSettings}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#111827] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#A3B1C6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs transition-all"
            />
          </div>

          {/* Nav Items List (Responsive scroll on mobile, vertical stack on desktop) */}
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 p-1.5 bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl shadow-xs scrollbar-none">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    prefs.playChime();
                  }}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#64748B] dark:text-[#A3B1C6]"}`} />
                    <span>{sec.label}</span>
                  </div>

                  {sec.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        sec.badge === "Danger"
                          ? "bg-rose-500/20 text-rose-300"
                          : isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-[#1E3A8A] dark:bg-blue-950 dark:text-[#60A5FA]"
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* ══════════════════════════════════════════════════
              SECTION 1: PROFILE & PERSONAL INFORMATION
             ══════════════════════════════════════════════════ */}
          {activeSection === "profile" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navProfile}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Manage your institutional identity, full name, and avatar picture
                </p>
              </div>

              {/* Avatar Uploader */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-2xl bg-[#F8FAFC] dark:bg-[#17243A] border-2 border-[#E2E8F0] dark:border-[#263449] flex items-center justify-center overflow-hidden shadow-xs">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="User Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-[#64748B] dark:text-[#A3B1C6]" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    Recommended square PNG, JPG, or WEBP under 5MB.
                  </p>
                </div>
              </div>

              {/* Name & Role Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Verified Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userProfile?.email || "user@institution.edu"}
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.role ? userProfile.role.toUpperCase() : (role || "TEACHER").toUpperCase()}
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-gray-500 cursor-not-allowed capitalize font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Institution
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.institution_name || "Testora Quiz Academy"}
                    className="w-full bg-gray-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-gray-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdateName}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 2: APPEARANCE & PERSONALIZATION
             ══════════════════════════════════════════════════ */}
          {activeSection === "appearance" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-7">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Palette className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navAppearance}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Customize font styles, scaling, color themes, and interface density
                </p>
              </div>

              {/* 1. Font Family Options */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.fontFamily}
                  </label>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    {t.fontFamilyDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { id: "inter" as FontFamily, name: t.fontDefault, sample: "The quick brown fox" },
                    { id: "sans" as FontFamily, name: t.fontSans, sample: "Clean Modern Sans" },
                    { id: "serif" as FontFamily, name: t.fontSerif, sample: "Academic Classic Serif" },
                    { id: "arial" as FontFamily, name: t.fontArial, sample: "Standard Arial Face" },
                    { id: "dyslexic" as FontFamily, name: t.fontDyslexic, sample: "High Readability Font" },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => {
                        prefs.savePreferences({ font_family: font.id }, token);
                        prefs.playChime();
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        prefs.font_family === font.id
                          ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[#172B4D] ring-2 ring-[#2563EB]/30 shadow-2xs"
                          : "border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] hover:border-[#2563EB]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                          {font.name}
                        </span>
                        {prefs.font_family === font.id && (
                          <Check className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                        )}
                      </div>
                      <div
                        className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-2 italic"
                        style={{
                          fontFamily:
                            font.id === "inter"
                              ? "Inter, sans-serif"
                              : font.id === "sans"
                              ? "system-ui, sans-serif"
                              : font.id === "serif"
                              ? "Georgia, serif"
                              : font.id === "arial"
                              ? "Arial, sans-serif"
                              : "'Comic Sans MS', cursive, sans-serif",
                        }}
                      >
                        {font.sample}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Text Scaling */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      {t.textSize}
                    </label>
                    <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                      {t.textSizeDesc}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                    {prefs.text_scale}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { scale: 85, label: "Small (85%)" },
                    { scale: 100, label: "Default (100%)" },
                    { scale: 115, label: "Large (115%)" },
                    { scale: 130, label: "Extra Large (130%)" },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      type="button"
                      onClick={() => {
                        prefs.savePreferences({ text_scale: s.scale }, token);
                        prefs.playChime();
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        prefs.text_scale === s.scale
                          ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                          : "bg-[#F8FAFC] dark:bg-[#17243A] border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Interface Density */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.density}
                  </label>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    {t.densityDesc}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "compact" as InterfaceDensity, label: t.densityCompact },
                    { id: "standard" as InterfaceDensity, label: t.densityStandard },
                    { id: "comfortable" as InterfaceDensity, label: t.densityComfortable },
                    { id: "spacious" as InterfaceDensity, label: t.densitySpacious },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        prefs.savePreferences({ interface_density: d.id }, token);
                        prefs.playChime();
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        prefs.interface_density === d.id
                          ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                          : "bg-[#F8FAFC] dark:bg-[#17243A] border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Theme Selection */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.theme}
                  </label>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    {t.themeDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "light" as ThemePreference, label: t.themeLight, icon: Sun },
                    { id: "dark" as ThemePreference, label: t.themeDark, icon: Moon },
                    { id: "system" as ThemePreference, label: t.themeSystem, icon: Monitor },
                  ].map((thm) => {
                    const Icon = thm.icon;
                    return (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => {
                          prefs.savePreferences({ theme: thm.id }, token);
                          prefs.playChime();
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          prefs.theme === thm.id
                            ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[#172B4D] ring-2 ring-[#2563EB]/30 shadow-2xs"
                            : "border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] hover:border-[#2563EB]/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${prefs.theme === thm.id ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6]"}`} />
                          <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                            {thm.label}
                          </span>
                        </div>
                        {prefs.theme === thm.id && (
                          <Check className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Live Interactive Preview Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-[#2563EB]/40 bg-[#EFF6FF]/40 dark:bg-[#172B4D]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E3A8A] dark:text-[#60A5FA] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#2563EB]" />
                    <span>{t.livePreview}</span>
                  </span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">
                    Updates live as you change options
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-2">
                  <h4 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Examination Header & Cognitive Question Card
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
                    This sample preview text demonstrates how headings, labels, questions, and action buttons dynamically respond to your chosen font family, scale factor, and spacing density.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold"
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] text-xs font-semibold"
                    >
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 3: ACCESSIBILITY
             ══════════════════════════════════════════════════ */}
          {activeSection === "accessibility" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navAccessibility}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Adjust readability, focus navigation, motion reduction, and audio cues
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  {
                    key: "high_contrast",
                    title: t.highContrast,
                    desc: t.highContrastDesc,
                    checked: prefs.high_contrast,
                  },
                  {
                    key: "reduced_motion",
                    title: t.reducedMotion,
                    desc: t.reducedMotionDesc,
                    checked: prefs.reduced_motion,
                  },
                  {
                    key: "high_focus",
                    title: t.highFocus,
                    desc: t.highFocusDesc,
                    checked: prefs.high_focus,
                  },
                  {
                    key: "sound_enabled",
                    title: t.soundEnabled,
                    desc: t.soundEnabledDesc,
                    checked: prefs.sound_enabled,
                    extraAction: (
                      <button
                        type="button"
                        onClick={prefs.playChime}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{t.testSound}</span>
                      </button>
                    ),
                  },
                ].map((item: any) => (
                  <div
                    key={item.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                        {item.desc}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.extraAction}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => {
                            prefs.savePreferences({ [item.key]: e.target.checked } as any, token);
                            if (item.key === "sound_enabled" && e.target.checked) {
                              prefs.playChime();
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 4: NOTIFICATION PREFERENCES
             ══════════════════════════════════════════════════ */}
          {activeSection === "notifications" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navNotifications}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Manage communication channels, browser push alerts, and category filtering
                </p>
              </div>

              {/* Master Toggle */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1E3A8A] dark:text-[#60A5FA]">
                    {t.masterNotif}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    {t.masterNotifDesc}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.master_notifications}
                    onChange={(e) => {
                      prefs.savePreferences({ master_notifications: e.target.checked }, token);
                      prefs.playChime();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                  Delivery Channels
                </h3>

                <div className="space-y-2.5">
                  {/* In App Bell */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                      {t.channelInApp}
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs.channel_in_app}
                      onChange={(e) => prefs.savePreferences({ channel_in_app: e.target.checked }, token)}
                      className="h-4 w-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                      {t.channelEmail}
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs.channel_email}
                      onChange={(e) => prefs.savePreferences({ channel_email: e.target.checked }, token)}
                      className="h-4 w-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                  </div>

                  {/* Browser Push */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                    <div>
                      <div className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                        {t.channelPush}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">
                        Status: <span className="font-mono font-bold capitalize">{pushStatus}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pushStatus !== "granted" ? (
                        <button
                          type="button"
                          onClick={handleRequestPush}
                          className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          {t.pushEnable}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                          <Check className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                  Notification Categories
                </h3>

                <div className="space-y-2">
                  {[
                    { key: "cat_security", title: t.categorySecurity, checked: true, locked: true },
                    { key: "cat_reminders", title: t.categoryReminders, checked: prefs.cat_reminders },
                    { key: "cat_announcements", title: t.categoryAnnouncements, checked: prefs.cat_announcements },
                    { key: "cat_updates", title: t.categoryUpdates, checked: prefs.cat_updates },
                    { key: "cat_account", title: t.categoryAccount, checked: prefs.cat_account },
                    { key: "cat_messages", title: t.categoryMessages, checked: prefs.cat_messages },
                    { key: "cat_marketing", title: t.categoryMarketing, checked: prefs.cat_marketing },
                  ].map((c: any) => (
                    <div
                      key={c.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]"
                    >
                      <span className="text-xs text-[#111827] dark:text-[#F1F5F9]">
                        {c.title}
                      </span>
                      <input
                        type="checkbox"
                        checked={c.checked}
                        disabled={c.locked}
                        onChange={(e) => {
                          if (!c.locked) {
                            prefs.savePreferences({ [c.key]: e.target.checked } as any, token);
                          }
                        }}
                        className={`h-4 w-4 rounded ${c.locked ? "text-gray-400 cursor-not-allowed" : "text-[#2563EB] focus:ring-[#2563EB]"}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 5: LANGUAGE & REGION
             ══════════════════════════════════════════════════ */}
          {activeSection === "language" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navLanguage}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Configure localization, clock formatting, and timezone sync
                </p>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {t.languageSelect}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { code: "en" as LanguageCode, label: "English (US/UK)", native: "English" },
                    { code: "hi" as LanguageCode, label: "Hindi", native: "हिन्दी" },
                    { code: "mr" as LanguageCode, label: "Marathi", native: "मराठी" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        prefs.savePreferences({ language: lang.code }, token);
                        prefs.playChime();
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        prefs.language === lang.code
                          ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[#172B4D] ring-2 ring-[#2563EB]/30 shadow-2xs"
                          : "border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] hover:border-[#2563EB]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                          {lang.native}
                        </span>
                        {prefs.language === lang.code && (
                          <Check className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] mt-1">
                        {lang.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone & Clock formatting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.timezone}
                  </label>
                  <select
                    value={prefs.timezone}
                    onChange={(e) => prefs.savePreferences({ timezone: e.target.value }, token)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST -5:00)</option>
                    <option value="Europe/London">Europe/London (GMT +0:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.dateFormat}
                  </label>
                  <select
                    value={prefs.date_format}
                    onChange={(e) => prefs.savePreferences({ date_format: e.target.value }, token)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 29/10/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/29/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.timeFormat}
                  </label>
                  <select
                    value={prefs.time_format}
                    onChange={(e) => prefs.savePreferences({ time_format: e.target.value as any }, token)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="12h">12-Hour (e.g. 03:45 PM)</option>
                    <option value="24h">24-Hour (e.g. 15:45)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 6: PRIVACY & SECURITY
             ══════════════════════════════════════════════════ */}
          {activeSection === "privacy" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-7">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navPrivacy}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Password management, active session security, and profile confidentiality
                </p>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-1.5 uppercase tracking-wider">
                  <Key className="h-4 w-4 text-[#2563EB]" />
                  <span>{t.changePassword}</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    {t.currentPassword}
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    {t.newPassword}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3.5 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {changingPassword && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </form>

              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.twoFactor}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    {t.twoFactorDesc}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.two_factor_enabled}
                    onChange={(e) => {
                      prefs.savePreferences({ two_factor_enabled: e.target.checked }, token);
                      prefs.playChime();
                      showToast(
                        e.target.checked
                          ? "2FA security verification enabled for new logins"
                          : "2FA verification disabled",
                        "info"
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>

              {/* Active Sessions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                  {t.activeSessions}
                </h3>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                        {t.currentDevice}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] font-mono">
                        Windows / Chrome / Active Now
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    This Session
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 7: CONNECTED ACCOUNTS
             ══════════════════════════════════════════════════ */}
          {activeSection === "accounts" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navAccounts}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Manage third-party Single Sign-On (SSO) login connections
                </p>
              </div>

              {/* Google OAuth Provider */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#201D1A] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-center shadow-xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      Google Identity Services
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                      {userProfile?.auth_provider === "google"
                        ? `Connected via Google Account (${userProfile.email})`
                        : "Available for passwordless one-click authentication"}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    userProfile?.auth_provider === "google"
                      ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                      : "text-blue-700 bg-blue-50 dark:bg-blue-950/40"
                  }`}
                >
                  {userProfile?.auth_provider === "google" ? "Linked SSO" : "Ready"}
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 8: DATA & STORAGE
             ══════════════════════════════════════════════════ */}
          {activeSection === "data" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navDataStorage}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Export account archives and manage client-side cache quotas
                </p>
              </div>

              {/* Data Export Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.exportData}
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                    {t.exportDataDesc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExportingData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  {isExportingData ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{t.downloadJson}</span>
                </button>
              </div>

              {/* Local Storage & Cache Clear */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    {t.clearCache}
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                    {t.clearCacheDesc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClearCacheModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.clearCacheBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 9: SEARCH PREFERENCES
             ══════════════════════════════════════════════════ */}
          {activeSection === "search" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Search className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navSearch}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Default filtering and sort behavior for assessment search bars
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Default Assessment Sorting
                  </label>
                  <select
                    value={prefs.search_default_sort}
                    onChange={(e) => prefs.savePreferences({ search_default_sort: e.target.value }, token)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="newest">Newest Assessments First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">Title (A &rarr; Z)</option>
                    <option value="name_desc">Title (Z &rarr; A)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Default Status Filter
                  </label>
                  <select
                    value={prefs.search_default_filter}
                    onChange={(e) => prefs.savePreferences({ search_default_filter: e.target.value }, token)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="all">All Tests & Forms</option>
                    <option value="active">Active Window Only</option>
                    <option value="completed">Completed / Graded</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Remember Search Queries
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    Save recent search keywords to auto-suggest in the top search bar
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={prefs.search_history_enabled}
                  onChange={(e) => prefs.savePreferences({ search_history_enabled: e.target.checked }, token)}
                  className="h-4 w-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 10: APPLICATION & PWA SETTINGS
             ══════════════════════════════════════════════════ */}
          {activeSection === "pwa" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navPwa}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Progressive Web App installation, service worker lifecycle, and offline fallback
                </p>
              </div>

              {/* Install Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-bold">
                      {isPwaInstalled ? t.pwaInstalled : t.pwaInstall}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                    PWA v1.0.1
                  </span>
                </div>

                <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                  {t.pwaInstallDesc}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("open-install-pwa"));
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1E3A8A] text-xs font-bold hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>{isPwaInstalled ? "View Installation Info" : "Install App Now"}</span>
                  </button>
                </div>
              </div>

              {/* Service Worker Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      {t.swStatus}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      <Check className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    Production Service Worker caching static bundles and proctoring telemetry.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      {t.offlineStatus}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isOnline
                          ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                          : "text-rose-700 bg-rose-50 dark:bg-rose-950/40"
                      }`}
                    >
                      {isOnline ? "Connected" : "Offline"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    Offline fallback routes and answer checkpoints enabled on network drop.
                  </p>
                </div>
              </div>

              {/* Offline Test Link */}
              <div className="pt-2">
                <Link
                  href="/offline"
                  className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline font-semibold"
                >
                  <span>Preview Dedicated Offline Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 11: HELP & SUPPORT
             ══════════════════════════════════════════════════ */}
          {activeSection === "help" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#2563EB]" />
                  <span>{t.navHelp}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Frequently asked questions, official documentation guide, and contact channels
                </p>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/guide"
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB] transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] group-hover:text-[#2563EB] transition-colors">
                      Interactive Platform Guide
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                      Step-by-step walkthroughs on exams, AI form creation, and grading
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#64748B] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Institutional Support Desk
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                    Email: <span className="font-mono text-[#2563EB]">support@testoraquiz.com</span>
                  </div>
                </div>
              </div>

              {/* FAQ Accordions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
                  {t.faqTitle}
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      q: "How does the anti-cheat tab-switch telemetry work?",
                      a: "Candidates are permitted exactly 1 accidental tab blur or window switch with an explicit warning banner. A second violation automatically submits the attempt and timestamps proctor telemetry.",
                    },
                    {
                      q: "Can students submit Online Data Collection Forms without logging in?",
                      a: "Yes! Online Forms & Registrations are public shareable links. Students fill in their details directly on mobile or desktop without creating an account.",
                    },
                    {
                      q: "Will my personalization preferences persist across different computers?",
                      a: "Yes. When signed into your faculty or student account, preferences are synchronized with the cloud database. On guest devices, preferences are preserved in local storage.",
                    },
                    {
                      q: "Does the Progressive Web App work completely offline?",
                      a: "The PWA caches the core application shell, questions snapshot, and answers autosave locally. When an internet connection is re-established, telemetry and scores synchronize to the server.",
                    },
                  ].map((faq, i) => (
                    <details
                      key={i}
                      className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] group"
                    >
                      <summary className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] cursor-pointer list-none flex items-center justify-between">
                        <span>{faq.q}</span>
                        <ChevronRight className="h-4 w-4 text-[#64748B] group-open:rotate-90 transition-transform" />
                      </summary>
                      <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-2.5 leading-relaxed pl-1">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 12: ACCOUNT MANAGEMENT
             ══════════════════════════════════════════════════ */}
          {activeSection === "account" && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#111C31] border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#263449] pb-4">
                <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{t.navAccountMgmt}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1">
                  Session termination, security revocation, and account deactivation
                </p>
              </div>

              <div className="space-y-4">
                {/* Sign out */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      Sign Out of Current Session
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                      Safely log out of this browser and clear active authentication cookies
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] dark:bg-[#201D1A] hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t.signOut}</span>
                  </button>
                </div>

                {/* Danger zone delete */}
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                        {t.deleteAccount}
                      </div>
                      <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                        {t.deleteAccountWarning}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONFIRMATION MODALS
         ══════════════════════════════════════════════════════ */}

      {/* Reset Preferences Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <RefreshCw className="h-6 w-6" />
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                Reset All Preferences
              </h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
              {t.resetConfirm}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await prefs.resetToDefaults(token);
                  prefs.playChime();
                  showToast("All settings restored to system defaults", "success");
                  setShowResetModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                Clear Local Storage & Caches
              </h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
              This will purge offline Service Worker assets and temporary client preferences. Your server-side exams, submissions, and account credentials will not be deleted.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111C31] border border-rose-300 dark:border-rose-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                Deactivate Testora Quiz Account
              </h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
              For security compliance, student academic records and faculty assessment audits are retained in accordance with your institution’s policy. Deactivating your account revokes active sessions and prevents further logins.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Account deactivation request logged. Contact administrator to finalize deletion.", "info");
                  setShowDeleteAccountModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Request Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

