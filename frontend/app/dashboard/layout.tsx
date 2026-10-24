"use client";

import { useAuthStore } from "../../store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "../../lib/api";
import { 
  GraduationCap, 
  BookOpen, 
  School, 
  Menu, 
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
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  CreditCard,
  Coins,
  ClipboardList,
  Wand2
} from "lucide-react";
import SubscriptionModal from "./teacher/_components/SubscriptionModal";
import CreditRechargeModal from "./teacher/_components/CreditRechargeModal";
import ThemeToggle from "../../components/ThemeToggle";
import AppLogo from "../../components/AppLogo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, fullName, role, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [creditRechargeModalOpen, setCreditRechargeModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("exams");
  
  // Notification Center State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

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
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUserCredits();
    }, 20000);
    return () => clearInterval(interval);
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
        if (tab) setCurrentTab(tab);
      }
    };
    handlePop();
    window.addEventListener("hashchange", handlePop);
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("hashchange", handlePop);
      window.removeEventListener("popstate", handlePop);
    };
  }, [pathname]);

  const navToTab = (tab: string) => {
    closeSidebarMobile();
    setCurrentTab(tab);
    if (pathname === "/dashboard/teacher") {
      window.location.hash = tab;
      const el = document.getElementById(tab);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.dispatchEvent(new CustomEvent("switch-tab", { detail: tab }));
    } else {
      router.push(`/dashboard/teacher#${tab}`);
    }
  };
  const isTeacher = pathname?.startsWith("/dashboard/teacher") || (mounted && (role === "teacher" || role === "inst_admin" || role === "super_admin"));

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
                <AppLogo variant="stacked" height={32} />
              </a>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                <a href="/" title="Testora Quiz" className="hover:opacity-95 transition-opacity shrink-0">
                  <AppLogo variant="row" height={28} />
                </a>
                <button 
                  onClick={() => setSubscriptionModalOpen(true)}
                  className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded transition-colors cursor-pointer shrink-0"
                  title="Manage Subscription & Razorpay Billing"
                >
                  PRO
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleSidebarCollapsed}
            className={`hidden md:flex p-1.5 rounded-lg text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-[#F5F5F4] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] transition-colors cursor-pointer ${sidebarCollapsed ? "md:hidden" : ""}`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[#716D67] hover:text-[#242321] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapsed Mode Expand Button */}
        {sidebarCollapsed && (
          <div className="hidden md:flex justify-center pt-2 pb-1 border-b border-[#E5E0D8] dark:border-[#292524]">
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-[#F5F5F4] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
          {/* SECTION: CREATOR STUDIO OR STUDENT PORTAL */}
          <div className="space-y-1.5">
            <div className={`text-[10px] font-bold text-[#8C827A] dark:text-[#8C827A] px-3 mb-2 uppercase tracking-widest ${sidebarCollapsed ? "md:hidden" : ""}`}>
              {pathname === "/dashboard/teacher" ? "Creator Studio" : "Student Portal"}
            </div>
            {sidebarCollapsed && (
              <div className="hidden md:block w-6 h-0.5 bg-[#E5E0D8] dark:bg-[#292524] mx-auto mb-2 rounded" />
            )}

            <div className="space-y-1">
              {pathname === "/dashboard/teacher" ? (
                <>
                  {/* Assessments Tab */}
                  <button 
                    onClick={() => navToTab("exams")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "exams"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <GraduationCap className={`h-4.5 w-4.5 shrink-0 ${currentTab === "exams" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Assessments</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Assessments
                      </span>
                    )}
                  </button>

                  {/* Create Quiz Tab */}
                  <button 
                    onClick={() => navToTab("create")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "create"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <FileText className={`h-4.5 w-4.5 shrink-0 ${currentTab === "create" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Create Quiz</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Create Quiz Wizard
                      </span>
                    )}
                  </button>

                  {/* Question Bank Tab */}
                  <button 
                    onClick={() => navToTab("bank")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "bank"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <Layers className={`h-4.5 w-4.5 shrink-0 ${currentTab === "bank" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Question Bank</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Question Bank
                      </span>
                    )}
                  </button>

                  {/* Knowledge Base Tab */}
                  <button 
                    onClick={() => navToTab("kb")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "kb"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <BookOpen className={`h-4.5 w-4.5 shrink-0 ${currentTab === "kb" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Knowledge Base</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Knowledge Base (RAG)
                      </span>
                    )}
                  </button>

                  {/* Student Directory Tab */}
                  <button 
                    onClick={() => navToTab("students")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "students"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <Users className={`h-4.5 w-4.5 shrink-0 ${currentTab === "students" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Student Directory</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Student Directories & Cohorts
                      </span>
                    )}
                  </button>

                  {/* Forms & Registrations Tab */}
                  <button 
                    onClick={() => navToTab("forms")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "forms"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <ClipboardList className={`h-4.5 w-4.5 shrink-0 ${currentTab === "forms" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Forms & Registrations</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Student Data Collection Forms
                      </span>
                    )}
                  </button>

                  {/* AI Custom Form Builder Tab */}
                  <button 
                    onClick={() => navToTab("custom-forms")}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      currentTab === "custom-forms"
                        ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                        : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                    }`}
                  >
                    <Wand2 className={`h-4.5 w-4.5 shrink-0 ${currentTab === "custom-forms" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>AI Form Builder</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        AI-Powered Custom Form Builder
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <a
                  href="/dashboard/student"
                  onClick={closeSidebarMobile}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] border border-[#2563EB]/20 transition-all ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  }`}
                >
                  <UserCheck className="h-4.5 w-4.5 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
                  <span className={sidebarCollapsed ? "md:hidden" : ""}>Student Portal</span>
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Student Exam Portal
                    </span>
                  )}
                </a>
              )}
            </div>
          </div>

          {/* SECTION: ANALYTICS (Creator Mode Only) */}
          {pathname === "/dashboard/teacher" && (
            <div className="space-y-1.5">
              <div className={`text-[10px] font-bold text-[#64748B] dark:text-[#A3B1C6] px-3 mb-2 uppercase tracking-widest ${sidebarCollapsed ? "md:hidden" : ""}`}>
                Analytics & Reports
              </div>
              {sidebarCollapsed && (
                <div className="hidden md:block w-6 h-0.5 bg-[#E2E8F0] dark:border-[#263449] mx-auto mb-2 rounded" />
              )}
              
              <div className="space-y-1">
                <button 
                  onClick={() => navToTab("reports")}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    sidebarCollapsed ? "md:justify-center md:px-0" : ""
                  } ${
                    currentTab === "reports"
                      ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                      : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                  }`}
                >
                  <BarChart2 className={`h-4.5 w-4.5 shrink-0 ${currentTab === "reports" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                  <span className={sidebarCollapsed ? "md:hidden" : ""}>Results & Gradebook</span>
                  {sidebarCollapsed && (
                    <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      Results & Gradebook Analytics
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECTION: SYSTEM & PREFERENCES */}
          <div className="space-y-1.5">
            <div className={`text-[10px] font-bold text-[#64748B] dark:text-[#A3B1C6] px-3 mb-2 uppercase tracking-widest ${sidebarCollapsed ? "md:hidden" : ""}`}>
              Preferences
            </div>
            {sidebarCollapsed && (
              <div className="hidden md:block w-6 h-0.5 bg-[#E2E8F0] dark:border-[#263449] mx-auto mb-2 rounded" />
            )}

            <div className="space-y-1">
              {isTeacher && (
                <>
                  <button 
                    onClick={() => { closeSidebarMobile(); setCreditRechargeModalOpen(true); }}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    }`}
                  >
                    <Coins className="h-4.5 w-4.5 shrink-0 text-amber-500 group-hover:text-amber-600" />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>
                      Prepaid Credits ({mounted && userCredits !== null ? userCredits.toLocaleString() : "0"})
                    </span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Prepaid Credits ({mounted && userCredits !== null ? userCredits.toLocaleString() : "0"})
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => { closeSidebarMobile(); setSubscriptionModalOpen(true); }}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-all cursor-pointer ${
                      sidebarCollapsed ? "md:justify-center md:px-0" : ""
                    }`}
                  >
                    <CreditCard className="h-4.5 w-4.5 shrink-0 text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]" />
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>Subscription & Billing</span>
                    {sidebarCollapsed && (
                      <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                        Subscription & Billing (Razorpay)
                      </span>
                    )}
                  </button>
                </>
              )}

              <button 
                onClick={() => { closeSidebarMobile(); router.push(role === "student" ? "/dashboard/student/profile" : "/dashboard/teacher/profile"); }}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sidebarCollapsed ? "md:justify-center md:px-0" : ""
                } ${
                  pathname === "/dashboard/teacher/profile" || pathname === "/dashboard/student/profile"
                    ? "bg-[#EFF6FF] dark:bg-[#172B4D] text-[#1E3A8A] dark:text-[#60A5FA] font-bold border-l-4 border-[#2563EB] dark:border-[#3B82F6] shadow-2xs"
                    : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A]"
                }`}
              >
                <Sliders className={`h-4.5 w-4.5 shrink-0 ${pathname === "/dashboard/teacher/profile" || pathname === "/dashboard/student/profile" ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#64748B] dark:text-[#A3B1C6] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]"}`} />
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  {role === "student" ? "My Profile & Wallet" : "Profile & Billing Summary"}
                </span>
                {sidebarCollapsed && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 bg-[#0F172A] text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                    {role === "student" ? "My Profile & Wallet" : "Profile & Billing Summary"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════
            BOTTOM PROFILE & LOGOUT CARD
           ══════════════════════════════════════════════════════ */}
        <div className="p-3 border-t border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] shrink-0">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "md:flex-col md:justify-center" : "justify-between"}`}>
            <div 
              onClick={() => { closeSidebarMobile(); router.push(role === "student" ? "/dashboard/student/profile" : "/dashboard/teacher/profile"); }}
              className={`flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-85 transition-opacity ${sidebarCollapsed ? "md:justify-center" : ""}`}
              title="Click to view full Profile & Credits Wallet"
            >
              <div 
                className="h-9 w-9 rounded-xl bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524] text-[#716D67] dark:text-[#A8A29E] flex items-center justify-center shadow-xs shrink-0"
              >
                <User className="h-4.5 w-4.5 text-[#716D67] dark:text-[#A8A29E]" />
              </div>
              <div className={`overflow-hidden ${sidebarCollapsed ? "md:hidden" : ""}`}>
                <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] truncate">
                  {mounted && fullName ? fullName : "User Account"}
                </div>
                <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E] font-medium capitalize truncate">
                  {mounted && role ? role : (isTeacher ? "Teacher" : "Student")} · Testora Quiz
                </div>
              </div>
            </div>

            <button 
              onClick={() => { logout(); router.push("/login"); }}
              className={`p-2 rounded-xl text-[#716D67] dark:text-[#A8A29E] hover:text-red-500 hover:bg-[#F0ECE4] dark:hover:bg-[#201D1A] transition-colors cursor-pointer ${
                sidebarCollapsed ? "md:mt-1" : ""
              }`}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA & TOPBAR
         ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top App Navigation Header */}
        <header className="h-16 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FFFFFF] dark:bg-[#171615] px-3 sm:px-4 md:px-6 flex items-center justify-between shrink-0 shadow-xs">
          
          {/* Left Breadcrumb & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#716D67] hover:text-[#242321] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1A] cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#716D67] dark:text-[#A8A29E] min-w-0">
              <span className="hidden sm:inline font-medium">Testora Quiz</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-bold text-[#242321] dark:text-[#F5F5F4] truncate max-w-[140px] sm:max-w-none">
                {pathname === "/dashboard/teacher/profile"
                  ? "Teacher Profile & Account"
                  : pathname === "/dashboard/student/profile"
                  ? "Student Profile & Account"
                  : pathname === "/dashboard/teacher"
                  ? "Creator Studio"
                  : "Student Portal"}
              </span>
              <a 
                href="/" 
                className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-blue-950/60 text-xs font-semibold transition-all border border-[#2563EB]/20"
                title="Switch Workspace Mode"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Switch Mode</span>
              </a>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] dark:text-[#A3B1C6]" />
              <input 
                type="text" 
                placeholder="Search assessments, candidate cohorts, questions..." 
                className="w-full bg-[#F8FAFC] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl pl-9 pr-4 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#A3B1C6] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* Right Action Menu: Credit Wallet, Help, Notifications, Theme Toggle */}
          <div className="flex items-center gap-2.5">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                title={isTeacher ? "Prepaid Credit Balance — Click to Recharge" : "Available Student Credits"}
              >
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>{mounted && userCredits !== null ? `${userCredits.toLocaleString()} Credits` : "0 Credits"}</span>
                {isTeacher && (
                  <span className="text-[10px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">+</span>
                )}
              </button>
            )}

            <a 
              href="/guide"
              className="p-2 rounded-xl text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] transition-colors"
              title="Documentation Guide"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </a>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] relative transition-colors cursor-pointer" 
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute 1 top-1 right-1 h-4 w-4 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
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

      {/* Razorpay Subscription Modal */}
      <SubscriptionModal 
        isOpen={subscriptionModalOpen} 
        onClose={() => setSubscriptionModalOpen(false)} 
      />
    </div>
  );
}
