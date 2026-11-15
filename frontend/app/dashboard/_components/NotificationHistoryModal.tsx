"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  X, 
  Search, 
  CheckCheck, 
  ExternalLink, 
  Layers, 
  Award, 
  Coins, 
  ShieldCheck, 
  Sparkles,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  Globe
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_universal?: boolean;
  link?: string | null;
  created_at: string;
}

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  onNotificationRead?: () => void;
}

export default function NotificationHistoryModal({
  isOpen,
  onClose,
  token,
  onNotificationRead,
}: NotificationHistoryModalProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const typeParam = activeTab === "all" ? "" : `&filter_type=${activeTab}`;
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : "";
      const res = await apiFetch(`/notifications/history?page=${page}&limit=50${typeParam}${searchParam}`, { token });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.warn("Failed to fetch notification history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, activeTab, page]);

  // Handle Search Debounce
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await apiFetch(`/notifications/${id}/read`, { token, method: "POST" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (onNotificationRead) onNotificationRead();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await apiFetch("/notifications/read-all", { token, method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onNotificationRead) onNotificationRead();
    } catch {}
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: string, isUniversal?: boolean) => {
    switch (type.toLowerCase()) {
      case "mock_test":
        return <Layers className="w-4 h-4 text-amber-500" />;
      case "exam":
        return <Award className="w-4 h-4 text-blue-500" />;
      case "grade":
        return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
      case "payment":
        return <Coins className="w-4 h-4 text-emerald-500" />;
      default:
        return isUniversal ? <Globe className="w-4 h-4 text-sky-500" /> : <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string, isUniversal?: boolean) => {
    switch (type.toLowerCase()) {
      case "mock_test":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            ⚡ Mock Test
          </span>
        );
      case "exam":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            🏢 Placement Exam
          </span>
        );
      case "grade":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
            🎓 Result Published
          </span>
        );
      case "payment":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            💳 Plan &amp; Wallet
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            🔔 System
          </span>
        );
    }
  };

  const formatISTDate = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }) + " IST";
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#263449] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 transition-all">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-[#263449] flex items-center justify-between bg-slate-50/80 dark:bg-[#111C31] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Notification History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {total} records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chronological activity feed for test submissions, plans, and exams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 transition-colors cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mark All Read</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar & Search */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#263449] bg-white dark:bg-[#0F172A] space-y-3 shrink-0">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title or keyword..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#17243A] border border-slate-200 dark:border-[#263449] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: "all", label: "All Activity" },
              { id: "mock_test", label: "⚡ Mock Tests" },
              { id: "exam", label: "🏢 Placement Exams" },
              { id: "payment", label: "💳 Wallet & Plans" },
              { id: "grade", label: "🎓 Scorecards" },
              { id: "system", label: "🔔 System" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-[#17243A] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 sm:p-4 space-y-2 select-text" style={{ WebkitOverflowScrolling: "touch" }}>
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Loading notifications history...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No notifications found</p>
              <p className="text-xs text-slate-400">
                {searchQuery ? "Try a different search query." : "Activities and announcements will appear here."}
              </p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  !n.is_read
                    ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 shadow-2xs"
                    : "bg-white dark:bg-[#111C31]/60 border-slate-200/70 dark:border-slate-800/80"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700/60">
                    {getTypeIcon(n.type, n.is_universal)}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getTypeBadge(n.type, n.is_universal)}
                      {n.is_universal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                          <Globe className="w-2.5 h-2.5 text-sky-600" />
                          <span>Universal Activity</span>
                        </span>
                      )}
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {n.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {n.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatISTDate(n.created_at)}</span>
                      </span>

                      {n.link && (
                        <a
                          href={n.link}
                          onClick={() => {
                            handleMarkRead(n.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Open Assessment / Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-[#263449] bg-slate-50 dark:bg-[#111C31] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing {items.length} of {total} activities
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
