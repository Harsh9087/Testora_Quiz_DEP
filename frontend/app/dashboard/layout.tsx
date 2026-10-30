"use client";

import { useAuthStore } from "../../store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "../../lib/api";
import { 
  GraduationCap, 
  BookOpen, 
  School, 
  Menu, 
  Home,
  FilePlus,
  Database,
  Monitor,
  Clock,
  X, 
  LogOut, 
  Settings, 
  Bell, 
  ExternalLink,
  UserCheck,
  Search,
  HelpCircle,
  Sun,
  Moon,
  Layers,
  FileText,
  User,
  Users,
  BarChart2,
  Sliders,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Coins,
  ClipboardList,
  Wand2,
  LayoutDashboard
} from "lucide-react";
import CreditRechargeModal from "./teacher/_components/CreditRechargeModal";
import ThemeToggle from "../../components/ThemeToggle";
import AppLogo from "../../components/AppLogo";
import { fetchStudentDirectories } from "../../lib/api/studentDirectories";
import { parseUtcDate } from "../../lib/dateUtils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, fullName, role, logout, avatarUrl, setAvatarUrl } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const getDisplayAvatarUrl = (url?: string | null) => {
    if (!url || typeof url !== "string" || url.trim() === "" || url.toLowerCase() === "none") return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [creditRechargeModalOpen, setCreditRechargeModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("overview");
  
  // Notification Center State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  // Real Database Counts for Sidebar Badges (No fake numbers)
  const [sidebarStats, setSidebarStats] = useState<{
    assessments: number | null;
    questionBank: number | null;
    knowledgeBase: number | null;
    studentDirectory: number | null;
    registrationForms: number | null;
    liveProctoring: number | null;
  }>({
    assessments: null,
    questionBank: null,
    knowledgeBase: null,
    studentDirectory: null,
    registrationForms: null,
    liveProctoring: null,
  });

  const fetchSidebarStats = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) return;
    try {
      const [examsRes, docsRes, bankRes, dirsRes, formsRes] = await Promise.all([
        apiFetch("/exams/", { token: activeToken }).catch(() => null),
        apiFetch("/kb/documents", { token: activeToken }).catch(() => null),
        apiFetch("/kb/questions/bank", { token: activeToken }).catch(() => null),
        fetchStudentDirectories(activeToken).catch(() => []),
        apiFetch("/registration-forms", { token: activeToken }).catch(() => null),
      ]);

      let examsCount = 0;
      let liveCount = 0;
      if (examsRes && examsRes.ok) {
        const examsData = await examsRes.json().catch(() => []);
        if (Array.isArray(examsData)) {
          examsCount = examsData.length;
          const now = new Date();
          liveCount = examsData.filter((e: any) => {
            if (!e.is_published) return false;
            const start = e.start_time ? parseUtcDate(e.start_time) : null;
            const end = e.end_time ? parseUtcDate(e.end_time) : null;
            if (start && now < start) return false;
            if (end && now > end) return false;
            return true;
          }).length;
        }
      }

      let docsCount = 0;
      if (docsRes && docsRes.ok) {
        const docsData = await docsRes.json().catch(() => []);
        if (Array.isArray(docsData)) docsCount = docsData.length;
      }

      let bankCount = 0;
      if (bankRes && bankRes.ok) {
        const bankData = await bankRes.json().catch(() => []);
        if (Array.isArray(bankData)) bankCount = bankData.length;
      }

      let studentsCount = 0;
      if (Array.isArray(dirsRes)) {
        studentsCount = dirsRes.reduce((acc: number, d: any) => acc + (d.student_count || 0), 0);
        if (studentsCount === 0 && dirsRes.length > 0) {
          studentsCount = dirsRes.length;
        }
      }

      let formsCount = 0;
      if (formsRes && formsRes.ok) {
        const formsData = await formsRes.json().catch(() => []);
        if (Array.isArray(formsData)) formsCount = formsData.length;
      }

      setSidebarStats({
        assessments: examsCount,
        knowledgeBase: docsCount,
        questionBank: bankCount,
        studentDirectory: studentsCount,
        registrationForms: formsCount,
        liveProctoring: liveCount,
      });
    } catch (err) {
      console.warn("Sidebar stats fetch notice:", err);
    }
  };

  const fetchUserCredits = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/payments/credits/balance", { token });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.credits_balance ?? 0);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/notifications/?limit=10", { token });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
      const countRes = await apiFetch("/notifications/unread-count", { token });
      if (countRes.ok) {
        const cData = await countRes.json();
        setUnreadCount(cData.count || 0);
      }
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { token, method: "POST" });
      fetchNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { token, method: "POST" });
      fetchNotifications();
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      useAuthStore.getState().syncFromStorage();
      const savedCollapsed = localStorage.getItem("sidebar_collapsed");
      if (savedCollapsed !== null) {
        setSidebarCollapsed(savedCollapsed === "true");
      }
    }
    setMounted(true);
    const saved = (localStorage.getItem("theme_mode") || localStorage.getItem("theme")) as "light" | "dark" | null;
    const mode = saved === "dark" ? "dark" : "light";
    setThemeMode(mode);
    applyTheme(mode);
    
    fetchNotifications();
    fetchUserCredits();
    fetchSidebarStats();

    // Fetch and sync user profile to ensure avatar and name are fresh
    if (token) {
      apiFetch("/auth/me", { token })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data) {
              if (data.avatar_url) {
                setAvatarUrl(data.avatar_url);
                setAvatarError(false);
              }
              if (data.full_name) {
                useAuthStore.getState().updateFullName(data.full_name);
              }
            }
          }
        })
        .catch(() => {});
    }

    const handleRefreshStats = () => {
      fetchSidebarStats();
      fetchUserCredits();
    };
    window.addEventListener("refresh-sidebar-stats", handleRefreshStats);

    const handleAvatarUpdated = (e: any) => {
      const newUrl = e?.detail ?? (typeof window !== "undefined" ? localStorage.getItem("avatarUrl") : null);
      setAvatarUrl(newUrl);
      setAvatarError(false);
    };
    window.addEventListener("avatar-updated", handleAvatarUpdated);

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUserCredits();
      fetchSidebarStats();
    }, 20000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-sidebar-stats", handleRefreshStats);
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, [token]);

  const applyTheme = (mode: "light" | "dark") => {
    if (mode === "dark") {
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

  const toggleTheme = () => {
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextMode);
    applyTheme(nextMode);
  };

  const toggleSidebarCollapsed = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", String(nextState));
    }
  };



  useEffect(() => {
    if (mounted) {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      if (!activeToken) {
        router.replace("/login");
      }
    }
  }, [mounted, token, router]);

  useEffect(() => {
    const activeRole = role || (typeof window !== "undefined" ? localStorage.getItem("role") : null);
    if (mounted && activeRole === "student" && pathname?.startsWith("/dashboard/teacher")) {
      router.replace("/dashboard/student");
    }
  }, [mounted, role, pathname, router]);

  useEffect(() => {
    const handlePop = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setCurrentTab(hash);
      } else {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab) {
          setCurrentTab(tab);
        } else if (pathname === "/dashboard/teacher") {
          setCurrentTab("overview");
        }
      }
    };
    handlePop();
    const handleSwitch = (e: any) => {
      if (e.detail) {
        setCurrentTab(e.detail === "all" ? "overview" : e.detail);
      }
    };
    window.addEventListener("hashchange", handlePop);
    window.addEventListener("popstate", handlePop);
    window.addEventListener("switch-tab", handleSwitch);
    return () => {
      window.removeEventListener("hashchange", handlePop);
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("switch-tab", handleSwitch);
    };
  }, [pathname]);

  const navToTab = (tab: string) => {
    closeSidebarMobile();
    const normalized = (tab === "all" || tab === "overview" || !tab) ? "overview" : tab;
    setCurrentTab(normalized);
    if (pathname === "/dashboard/teacher") {
      if (normalized === "overview") {
        if (window.location.hash) {
          window.history.pushState(null, "", window.location.pathname);
        }
        window.scrollTo(0, 0);
        window.dispatchEvent(new CustomEvent("switch-tab", { detail: "overview" }));
      } else {
        window.location.hash = normalized;
        window.scrollTo(0, 0);
        window.dispatchEvent(new CustomEvent("switch-tab", { detail: normalized }));
      }
    } else {
      router.push(normalized === "overview" ? "/dashboard/teacher" : `/dashboard/teacher#${normalized}`);
    }
  };

  const isTabActive = (tab: string) => {
    if (!pathname?.startsWith("/dashboard/teacher")) return false;
    if (tab === "overview" || tab === "all") {
      return currentTab === "overview" || currentTab === "all" || !currentTab;
    }
    return currentTab === tab;
  };

  const isTeacher = pathname?.startsWith("/dashboard/teacher") || (mounted && (role === "teacher" || role === "inst_admin" || role === "super_admin"));
  const profileUrl = (role === "student" || (!isTeacher && role !== "teacher"))
    ? "/dashboard/student/profile"
    : "/dashboard/teacher/profile";

  const closeSidebarMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sidebarOpen && window.innerWidth < 768) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof window !== "undefined") document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Subview title listener for nested modules (e.g. "Edit Assessment", "Candidate Results")
  const [subviewTitle, setSubviewTitle] = useState<string | null>(null);

  useEffect(() => {
    const handleSubview = (e: any) => {
      setSubviewTitle(e.detail || null);
    };
    window.addEventListener("breadcrumb-subview", handleSubview);
    return () => window.removeEventListener("breadcrumb-subview", handleSubview);
  }, []);

  useEffect(() => {
    setSubviewTitle(null);
  }, [pathname, currentTab]);

  interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
    isCurrent?: boolean;
  }

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Testora Quiz", href: "/" }
    ];

    if (pathname === "/dashboard/settings") {
      items.push({ label: "Preferences", href: "/dashboard/settings" });
      items.push({ label: "Settings", isCurrent: true });
      return items;
    }

    if (pathname === "/dashboard/teacher/profile") {
      items.push({ label: "Preferences", href: "/dashboard/settings" });
      items.push({ label: "Profile & Billing Summary", isCurrent: true });
      return items;
    }

    if (pathname === "/dashboard/student/profile") {
      items.push({ label: "Preferences", href: "/dashboard/settings" });
      items.push({ label: "Student Profile & Account", isCurrent: true });
      return items;
    }

    if (pathname === "/dashboard/profile") {
      items.push({ label: "Preferences", href: "/dashboard/settings" });
      items.push({ label: "User Profile", isCurrent: true });
      return items;
    }

    if (pathname === "/dashboard/support") {
      items.push({ label: "Preferences", href: "/dashboard/settings" });
      items.push({ label: "Help & Support", isCurrent: true });
      return items;
    }

    if (pathname === "/dashboard/student") {
      items.push({ label: "Student Portal", href: "/dashboard/student" });
      items.push({ label: "Assessments", isCurrent: true });
      return items;
    }

    // Teacher Workspace / Creator Studio
    if (pathname?.startsWith("/dashboard/teacher")) {
      if (currentTab === "reports") {
        items.push({
          label: "Analytics & Reports",
          onClick: () => navToTab("reports"),
        });
        if (subviewTitle) {
          items.push({
            label: "Results & Gradebook",
            onClick: () => setSubviewTitle(null),
          });
          items.push({
            label: subviewTitle,
            isCurrent: true,
          });
        } else {
          items.push({
            label: "Results & Gradebook",
            isCurrent: true,
          });
        }
        return items;
      }

      if (currentTab === "proctoring") {
        items.push({
          label: "Live & Monitoring",
          onClick: () => navToTab("proctoring"),
        });
        items.push({
          label: "Live Proctoring",
          isCurrent: true,
        });
        return items;
      }

      if (currentTab === "logs") {
        items.push({
          label: "Live & Monitoring",
          onClick: () => navToTab("logs"),
        });
        items.push({
          label: "Activity Logs",
          isCurrent: true,
        });
        return items;
      }

      if (currentTab === "credits") {
        items.push({
          label: "Preferences",
          href: "/dashboard/settings",
        });
        items.push({
          label: "Recharge Credits",
          isCurrent: true,
        });
        return items;
      }

      // Creator Studio
      const isOverview = !currentTab || currentTab === "overview" || currentTab === "all";
      items.push({
        label: "Creator Studio",
        onClick: () => navToTab("overview"),
      });

      let leafLabel = "Main Dashboard";
      if (currentTab === "exams") leafLabel = "Assessments";
      else if (currentTab === "create") leafLabel = "Create Quiz";
      else if (currentTab === "bank") leafLabel = "Question Bank";
      else if (currentTab === "kb") leafLabel = "Knowledge Base";
      else if (currentTab === "students") leafLabel = "Student Directory";
      else if (currentTab === "forms") leafLabel = "Forms & Registrations";
      else if (currentTab === "custom-forms") leafLabel = "AI Form Builder";

      if (subviewTitle && !isOverview) {
        items.push({
          label: leafLabel,
          onClick: () => setSubviewTitle(null),
        });
        items.push({
          label: subviewTitle,
          isCurrent: true,
        });
      } else {
        items.push({
          label: leafLabel,
          isCurrent: true,
        });
      }
      return items;
    }

    // Fallback for any other dashboard path
    const cleanPath = pathname?.replace(/^\/dashboard\/?/, "") || "";
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments.length === 0) {
      items.push({ label: "Dashboard", isCurrent: true });
    } else {
      segments.forEach((seg, i) => {
        const isLast = i === segments.length - 1;
        const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
        items.push({
          label: formatted,
          href: isLast ? undefined : `/dashboard/${segments.slice(0, i + 1).join("/")}`,
          isCurrent: isLast,
        });
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbs();
  const leafItem = breadcrumbItems[breadcrumbItems.length - 1];
  const parentItem = breadcrumbItems.length >= 2 ? breadcrumbItems[breadcrumbItems.length - 2] : null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B1120] overflow-hidden text-[#111827] dark:text-[#F1F5F9]">
      
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          SIDEBAR NAVIGATION (Expanded: 260px | Collapsed: 72px)
         ══════════════════════════════════════════════════════ */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#263449] flex flex-col shrink-0 transition-all duration-300 ease-in-out shadow-lg md:shadow-none w-72 max-w-[85vw] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "md:!w-[72px]" : "md:w-64"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200 dark:border-[#263449] flex items-center justify-between shrink-0 bg-white dark:bg-[#0F172A]">
          <div className={`flex items-center gap-2 overflow-hidden ${sidebarCollapsed ? "md:justify-center md:w-full" : ""}`}>
            {sidebarCollapsed ? (
              <a href="/" title="Testora Quiz" className="p-1 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center">
                <AppLogo variant="stacked" height={36} />
              </a>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden py-1">
                <a href="/" title="Testora Quiz" className="hover:opacity-95 transition-opacity shrink-0">
                  <AppLogo variant="row" height={38} />
                </a>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleSidebarCollapsed}
            className={`hidden md:flex p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${sidebarCollapsed ? "md:hidden" : ""}`}
            title="Collapse Sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapsed Mode Expand Button */}
        {sidebarCollapsed && (
          <div className="hidden md:flex justify-center pt-2.5 pb-2 border-b border-slate-200 dark:border-[#263449]">
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
          {/* SECTION: CREATOR STUDIO OR STUDENT PORTAL */}
          <div className="space-y-1">
            <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 uppercase tracking-wider ${sidebarCollapsed ? "md:hidden" : ""}`}>
              {isTeacher ? "Creator Studio" : "Student Portal"}
            </div>
            {sidebarCollapsed && (
              <div className="hidden md:block w-6 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto mb-2 rounded" />
            )}

            <div className="space-y-1">
              {isTeacher ? (
                <>
                  {/* Main Dashboard */}
                  <button 
                    onClick={() => navToTab("overview")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("overview")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <Home className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Main Dashboard
                    </span>
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Main Dashboard
                      </span>
                    )}
                  </button>

                  {/* Assessments */}
                  <button 
                    onClick={() => navToTab("exams")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("exams")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Assessments
                    </span>
                    {!sidebarCollapsed && sidebarStats.assessments !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300 shrink-0">
                        {sidebarStats.assessments}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Assessments {sidebarStats.assessments !== null ? `(${sidebarStats.assessments})` : ""}
                      </span>
                    )}
                  </button>

                  {/* Create Quiz */}
                  <button 
                    onClick={() => navToTab("create")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("create")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <FilePlus className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Create Quiz
                    </span>
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Create Quiz Wizard
                      </span>
                    )}
                  </button>

                  {/* Question Bank */}
                  <button 
                    onClick={() => navToTab("bank")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("bank")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <Database className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Question Bank
                    </span>
                    {!sidebarCollapsed && sidebarStats.questionBank !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300 shrink-0">
                        {sidebarStats.questionBank}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Question Bank {sidebarStats.questionBank !== null ? `(${sidebarStats.questionBank})` : ""}
                      </span>
                    )}
                  </button>

                  {/* Knowledge Base */}
                  <button 
                    onClick={() => navToTab("kb")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("kb")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Knowledge Base
                    </span>
                    {!sidebarCollapsed && sidebarStats.knowledgeBase !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300 shrink-0">
                        {sidebarStats.knowledgeBase}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Knowledge Base {sidebarStats.knowledgeBase !== null ? `(${sidebarStats.knowledgeBase})` : ""}
                      </span>
                    )}
                  </button>

                  {/* Student Directory */}
                  <button 
                    onClick={() => navToTab("students")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("students")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Student Directory
                    </span>
                    {!sidebarCollapsed && sidebarStats.studentDirectory !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 shrink-0">
                        {sidebarStats.studentDirectory}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Student Directory {sidebarStats.studentDirectory !== null ? `(${sidebarStats.studentDirectory})` : ""}
                      </span>
                    )}
                  </button>

                  {/* Forms & Registrations */}
                  <button 
                    onClick={() => navToTab("forms")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("forms")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      Forms & Registrations
                    </span>
                    {!sidebarCollapsed && sidebarStats.registrationForms !== null && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 shrink-0">
                        {sidebarStats.registrationForms}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Forms & Registrations {sidebarStats.registrationForms !== null ? `(${sidebarStats.registrationForms})` : ""}
                      </span>
                    )}
                  </button>

                  {/* AI Form Builder */}
                  <button 
                    onClick={() => navToTab("custom-forms")}
                    className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      isTabActive("custom-forms")
                        ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <Wand2 className="h-4 w-4" />
                    </div>
                    <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                      AI Form Builder
                    </span>
                    {!sidebarCollapsed && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    )}
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        AI Form Builder
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <a
                  href="/dashboard/student"
                  onClick={closeSidebarMobile}
                  className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 transition-all ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    Student Portal
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* SECTION: ANALYTICS & REPORTS */}
          {isTeacher && (
            <div className="space-y-1">
              <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 uppercase tracking-wider ${sidebarCollapsed ? "md:hidden" : ""}`}>
                Analytics & Reports
              </div>
              {sidebarCollapsed && (
                <div className="hidden md:block w-6 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto mb-2 rounded" />
              )}
              
              <div className="space-y-1">
                <button 
                  onClick={() => navToTab("reports")}
                  className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  } ${
                    isTabActive("reports")
                      ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    Results & Gradebook
                  </span>
                  {!sidebarCollapsed && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Results & Gradebook
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECTION: LIVE & MONITORING */}
          {isTeacher && (
            <div className="space-y-1">
              <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 uppercase tracking-wider ${sidebarCollapsed ? "md:hidden" : ""}`}>
                Live & Monitoring
              </div>
              {sidebarCollapsed && (
                <div className="hidden md:block w-6 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto mb-2 rounded" />
              )}
              
              <div className="space-y-1">
                {/* Live Proctoring */}
                <button 
                  onClick={() => { navToTab("exams"); window.dispatchEvent(new CustomEvent("open-live-monitor")); }}
                  className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  } ${
                    isTabActive("proctoring")
                      ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    Live Proctoring
                  </span>
                  {!sidebarCollapsed && sidebarStats.liveProctoring !== null && sidebarStats.liveProctoring > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {sidebarStats.liveProctoring}
                    </span>
                  )}
                  {!sidebarCollapsed && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Live Proctoring {sidebarStats.liveProctoring !== null && sidebarStats.liveProctoring > 0 ? `(${sidebarStats.liveProctoring})` : ""}
                    </span>
                  )}
                </button>

                {/* Activity Logs */}
                <button 
                  onClick={() => navToTab("reports")}
                  className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  } ${
                    isTabActive("logs")
                      ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    Activity Logs
                  </span>
                  {!sidebarCollapsed && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Activity Logs
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECTION: PREFERENCES */}
          <div className="space-y-1">
            <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 uppercase tracking-wider ${sidebarCollapsed ? "md:hidden" : ""}`}>
              Preferences
            </div>
            {sidebarCollapsed && (
              <div className="hidden md:block w-6 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto mb-2 rounded" />
            )}

            <div className="space-y-1">
              {/* Recharge Credits */}
              {isTeacher && (
                <button 
                  onClick={() => { closeSidebarMobile(); setCreditRechargeModalOpen(true); }}
                  className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Coins className="h-4 w-4" />
                  </div>
                  <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    Recharge Credits
                  </span>
                  {!sidebarCollapsed && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 shrink-0">
                      {mounted && userCredits !== null ? userCredits.toLocaleString() : "0"}
                    </span>
                  )}
                  {!sidebarCollapsed && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Recharge Credits ({mounted && userCredits !== null ? userCredits.toLocaleString() : "0"})
                    </span>
                  )}
                </button>
              )}

              {/* Profile & Billing Summary */}
              <button 
                onClick={() => { closeSidebarMobile(); router.push(profileUrl); }}
                className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sidebarCollapsed ? "md:justify-center md:px-0" : ""
                } ${
                  pathname === "/dashboard/teacher/profile" || pathname === "/dashboard/student/profile"
                    ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Sliders className="h-4 w-4" />
                </div>
                <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  Profile & Billing Summary
                </span>
                {!sidebarCollapsed && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                )}
                {sidebarCollapsed && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                    Profile & Billing Summary
                  </span>
                )}
              </button>

              {/* Settings */}
              <button 
                onClick={() => { closeSidebarMobile(); router.push("/dashboard/settings"); }}
                className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sidebarCollapsed ? "md:justify-center md:px-0" : ""
                } ${
                  pathname === "/dashboard/settings"
                    ? "bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Settings className="h-4 w-4" />
                </div>
                <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  Settings
                </span>
                {!sidebarCollapsed && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                )}
                {sidebarCollapsed && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                    Settings & Personalization
                  </span>
                )}
              </button>

              {/* Help & Support */}
              <button 
                onClick={() => { closeSidebarMobile(); router.push("/dashboard/support"); }}
                className={`group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  pathname === "/dashboard/support"
                    ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                } ${sidebarCollapsed ? "md:justify-center md:px-0" : ""}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  pathname === "/dashboard/support"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                }`}>
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span className={`truncate text-left flex-1 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  Help & Support
                </span>
                {!sidebarCollapsed && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                )}
                {sidebarCollapsed && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                    Help & Support Desk
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════
            BOTTOM PROFILE & LOGOUT CARD
           ══════════════════════════════════════════════════════ */}
        <div className="p-3 border-t border-slate-200 dark:border-[#263449] bg-white dark:bg-[#0F172A] shrink-0">
          {/* User Profile Card */}
          <div 
            onClick={() => { closeSidebarMobile(); router.push(profileUrl); }}
            className={`p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex items-center gap-2.5 ${sidebarCollapsed ? "md:justify-center md:p-1.5" : "justify-between"}`}
            title="View Profile & Settings"
          >
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="relative shrink-0">
                {mounted && getDisplayAvatarUrl(avatarUrl) && !avatarError ? (
                  <img
                    src={getDisplayAvatarUrl(avatarUrl)!}
                    alt={fullName || "User Avatar"}
                    onError={() => setAvatarError(true)}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {mounted && fullName ? fullName.trim().charAt(0).toUpperCase() : "R"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className={`text-left min-w-0 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {mounted && fullName ? fullName : "Rohit Shahare"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {mounted && role ? (role === "teacher" ? "Teacher • Testora Quiz" : `${role} • Testora Quiz`) : "Teacher • Testora Quiz"}
                </div>
              </div>
            </div>

            {!sidebarCollapsed && (
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            )}
          </div>

          {/* Sign Out Button */}
          {!sidebarCollapsed ? (
            <button
              onClick={() => {
                closeSidebarMobile();
                logout();
                router.replace("/login");
              }}
              className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                closeSidebarMobile();
                logout();
                router.replace("/login");
              }}
              className="w-full mt-2 py-2 flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA & TOPBAR
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top App Navigation Header */}
        <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-[#263449] bg-white dark:bg-[#0F172A] px-2.5 xs:px-3 sm:px-4 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-30 transition-colors w-full gap-2">
          
          {/* Left Breadcrumb & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Expand Sidebar button when sidebar is collapsed */}
            {sidebarCollapsed && (
              <button 
                onClick={toggleSidebarCollapsed}
                className="hidden md:flex p-1.5 rounded-lg border border-slate-200 dark:border-[#263449] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Expand Sidebar"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}

            {/* Mobile Page Title: Clean, single-line, bold label (no overlapping parent crumbs) */}
            <div className="flex sm:hidden items-center min-w-0 truncate">
              <span 
                className="font-bold text-xs xs:text-sm text-slate-900 dark:text-white truncate max-w-[110px] xs:max-w-[140px]"
                aria-current="page"
              >
                {leafItem?.label === "Overview" || leafItem?.label === "Main Dashboard"
                  ? (isTeacher ? "Creator Studio" : "Student Portal")
                  : (leafItem?.label || "Dashboard")}
              </span>
            </div>

            {/* Desktop & Tablet Full Breadcrumb Hierarchy */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center min-w-0">
              <ol className="flex items-center gap-1.5 md:gap-2 text-xs md:text-[13px] text-slate-500 dark:text-slate-400 min-w-0 flex-nowrap">
                {breadcrumbItems.map((item, idx) => {
                  const isLast = idx === breadcrumbItems.length - 1;
                  return (
                    <li key={idx} className="flex items-center gap-1.5 md:gap-2 shrink-0 max-w-[190px] md:max-w-none truncate">
                      {idx > 0 && (
                        <span className="text-slate-300 dark:text-slate-600 text-xs shrink-0 select-none" aria-hidden="true">
                          /
                        </span>
                      )}
                      {item.isCurrent || isLast ? (
                        <span 
                          className="font-bold text-slate-900 dark:text-slate-100 truncate select-none"
                          aria-current="page"
                        >
                          {item.label}
                        </span>
                      ) : item.onClick ? (
                        <button
                          type="button"
                          onClick={item.onClick}
                          className="font-medium text-slate-500 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded px-1 -mx-1 truncate"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          href={item.href || "/"}
                          className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded px-1 -mx-1 truncate"
                        >
                          {idx === 0 && (
                            <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          )}
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Center Search Input with Ctrl+K shortcut matching reference image */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-md mx-3 xl:mx-6 min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] dark:text-[#A3B1C6]" />
              <input 
                type="text" 
                placeholder="Search assessments, candidates, cohorts, questions..." 
                className="w-full bg-[#F8FAFC] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl pl-9 pr-16 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#A3B1C6] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 pointer-events-none select-none">
                Ctrl + K
              </span>
            </div>
          </div>

          {/* Right Action Menu: Credit Wallet, Help, Notifications, Theme Toggle */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
            {/* Credit Wallet Pill (Teacher/Admin or Student with Credits) */}
            {(isTeacher || (mounted && userCredits !== null && userCredits > 0)) && (
              <button
                type="button"
                onClick={() => {
                  if (isTeacher) {
                    setCreditRechargeModalOpen(true);
                  } else {
                    router.push("/dashboard/student/profile");
                  }
                }}
                className="flex items-center gap-1 xs:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title={isTeacher ? "Prepaid Credit Balance — Click to Recharge" : "Available Student Credits"}
              >
                <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-extrabold text-xs">{mounted && userCredits !== null ? userCredits.toLocaleString() : "0"}</span>
                <span className="hidden sm:inline font-medium">Credits</span>
                {isTeacher && (
                  <span className="text-[10px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0 leading-tight">+</span>
                )}
              </button>
            )}

            {/* Help & Support (Desktop & Tablet only; mobile has it in drawer) */}
            <Link 
              href="/dashboard/support"
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-colors"
              title="DPRAMP Tech Solutions Help & Support"
            >
              <HelpCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-1.5 xs:p-2 rounded-xl text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] relative transition-colors cursor-pointer" 
                title="Notifications"
              >
                <Bell className="h-4 w-4 xs:h-4.5 xs:w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 xs:h-4 xs:w-4 rounded-full bg-[#2563EB] text-white text-[8px] xs:text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Flyout */}
              {notifOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                  <div className="p-3.5 border-b border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-blue-100 text-[#1E3A8A] dark:bg-blue-950/60 dark:text-[#60A5FA] px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[11px] text-[#2563EB] hover:underline font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]/60 dark:divide-[#263449]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#64748B] dark:text-[#A3B1C6]">
                        <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        <span>No new notifications</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 text-xs transition-all hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] flex items-start justify-between gap-2.5 ${
                            !n.is_read ? "bg-[#EFF6FF] dark:bg-[#172B4D]/60 font-medium" : ""
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{n.title}</span>
                              <span className="text-[10px] text-[#64748B] dark:text-[#A3B1C6]">
                                {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">{n.message}</p>
                            {n.link && (
                              <a 
                                href={n.link}
                                onClick={() => { markRead(n.id); setNotifOpen(false); }}
                                className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline font-medium mt-1"
                              >
                                View details &rarr;
                              </a>
                            )}
                          </div>
                          {!n.is_read && (
                            <button 
                              onClick={() => markRead(n.id)}
                              className="h-2 w-2 rounded-full bg-[#2563EB] hover:scale-125 transition-all shrink-0 mt-1.5 cursor-pointer"
                              title="Mark read"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  </div>
                </>
              )}
            </div>

            {/* Universal Theme Toggle (Light / Dark / System Default) */}
            <ThemeToggle />

            {/* Topbar User Profile Card matching reference image */}
            <div className="relative ml-0.5 pl-1.5 sm:ml-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center shrink-0">
              <Link
                href={profileUrl}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                title="View Profile & Settings"
              >
                {mounted && getDisplayAvatarUrl(avatarUrl) && !avatarError ? (
                  <img
                    src={getDisplayAvatarUrl(avatarUrl)!}
                    alt={fullName || "User Avatar"}
                    onError={() => setAvatarError(true)}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {mounted && fullName ? fullName.trim().charAt(0).toUpperCase() : "R"}
                  </div>
                )}
                <div className="hidden lg:block text-left select-none min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-blue-600 transition-colors">
                    {mounted && fullName ? fullName : "Rohit Shahare"}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize truncate">
                    {mounted && role ? (role === "teacher" ? "Teacher" : role) : "Teacher"}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#F8FAFC] dark:bg-[#0B1120] bg-texture-dots">
          {children}
        </main>
      </div>

      {/* Credit Recharge Modal */}
      <CreditRechargeModal
        isOpen={creditRechargeModalOpen}
        onClose={() => setCreditRechargeModalOpen(false)}
        onRechargeSuccess={(newBal) => {
          setUserCredits(newBal);
        }}
      />
    </div>
  );
}
