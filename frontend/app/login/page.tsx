"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  KeyRound,
  X,
  FileCode2,
  Check,
  ExternalLink,
  Users,
  FileText,
  BarChart3,
  ChevronRight,
  Zap,
  Database,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { apiFetch } from "../../lib/api";
import ThemeToggle from "../../components/ThemeToggle";
import AppLogo from "../../components/AppLogo";

function LoginContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isRegisterRoute = pathname === "/register" || searchParams.get("mode") === "signup";
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [gisLoaded, setGisLoaded] = useState(false);

  // Auth Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">(isRegisterRoute ? "signup" : "signin");

  // Step state: 1 = Mode selection & details, 2 = Auth credentials
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Registration Form State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regRole, setRegRole] = useState<"teacher" | "student">("teacher");
  const regRoleRef = useRef<"teacher" | "student">(regRole);

  useEffect(() => {
    regRoleRef.current = regRole;
  }, [regRole]);

  // Direct Exam Code Fast Gateway
  const [examCodeInput, setExamCodeInput] = useState("");
  const [showExamCodeGateway, setShowExamCodeGateway] = useState(false);

  // Target destination query parameter
  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const googleInitializedRef = useRef(false);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const resolveDestination = (userRole: string) => {
    if (userRole === "student") {
      if (targetDestination && targetDestination.startsWith("/exam/")) {
        return targetDestination;
      }
      return "/dashboard/student";
    }

    if (userRole === "super_admin") {
      if (targetDestination && targetDestination.startsWith("/") && !targetDestination.startsWith("/dashboard/student")) {
        return targetDestination;
      }
      return "/admin";
    }

    if (userRole === "inst_admin") {
      if (targetDestination && targetDestination.startsWith("/admin")) {
        return targetDestination;
      }
      return "/admin";
    }

    if (userRole === "teacher") {
      if (targetDestination && targetDestination.startsWith("/") && !targetDestination.startsWith("/dashboard/student") && !targetDestination.startsWith("/admin")) {
        return targetDestination;
      }
      return "/dashboard/teacher";
    }

    if (targetDestination) {
      if (targetDestination === "student_dashboard") return "/dashboard/student";
      if (targetDestination === "teacher_dashboard") return "/dashboard/teacher";
      if (targetDestination.startsWith("/dashboard/teacher")) return "/dashboard/teacher";
      if (targetDestination.startsWith("/")) return targetDestination;
    }
    return "/dashboard/student";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup" || window.location.pathname === "/register") {
        setAuthMode("signup");
      }
      const roleParam = params.get("role");
      if (roleParam === "student") {
        setRegRole("student");
        regRoleRef.current = "student";
        setTargetDestination("student_dashboard");
        setCurrentStep(2);
      } else if (roleParam === "teacher") {
        setRegRole("teacher");
        regRoleRef.current = "teacher";
        setTargetDestination("teacher_dashboard");
        setCurrentStep(2);
      }
      const targetParam = params.get("target") || params.get("redirect");
      if (targetParam) {
        setTargetDestination(targetParam);
        if (targetParam === "/admin" || targetParam.startsWith("/admin")) {
          setRegRole("teacher");
          setCurrentStep(2);
        }
      }
      const stepParam = params.get("step");
      if (stepParam === "2") {
        setCurrentStep(2);
      }
      const demoParam = params.get("demo");
      if (demoParam === "teacher") {
        setEmail("teacher@aegeus.edu");
        setPassword("securepassword");
      } else if (demoParam === "student") {
        setEmail("student@aegeus.edu");
        setPassword("securepassword");
      } else if (demoParam === "admin" || roleParam === "admin") {
        setEmail("admin@aegeus.edu");
        setPassword("securepassword");
        setTargetDestination("/admin");
        setCurrentStep(2);
      }
    }

    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const savedEmail = localStorage.getItem("eduquiz_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Prefetch destination dashboards in the background so login transition is instant
    try {
      router.prefetch("/dashboard/teacher");
      router.prefetch("/dashboard/student");
    } catch {}
  }, [router]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setError(null);
    setLoading(true);
    const selectedRole = regRoleRef.current;
    try {
      const res = await apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          token: response.credential,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Google authentication failed");
      }

      const assignedRole = data.role || selectedRole;

      if (data.workspace_id) {
        localStorage.setItem("workspaceId", data.workspace_id);
        localStorage.setItem("workspaceName", data.workspace_name || "Personal Workspace");
      }

      setAuth(data.access_token, assignedRole, data.full_name, undefined, data.avatar_url);
      router.push(resolveDestination(assignedRole));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("[GSI_LOGGER]")
      ) {
        console.warn("[GSI Notice - Google Origin Whitelist Required]:", ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const handleGoogleCredentialResponseRef = useRef(handleGoogleCredentialResponse);
  handleGoogleCredentialResponseRef.current = handleGoogleCredentialResponse;

  const initGoogleGIS = () => {
    setGisLoaded(true);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "716730043675-rq3tq97avgrrbtjoup3hjdhteg4k7pql.apps.googleusercontent.com";
    if (clientId && clientId.trim()) {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          const isAlreadyInit = (window as any).__googleGsiInitialized;
          if (!isAlreadyInit) {
            (window as any).google.accounts.id.initialize({
              client_id: clientId.trim(),
              callback: (response: any) => handleGoogleCredentialResponseRef.current(response),
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            (window as any).__googleGsiInitialized = true;
            googleInitializedRef.current = true;
          }
          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = "";
            const computedWidth = typeof window !== "undefined" ? Math.min(380, Math.max(240, window.innerWidth - 64)) : 300;
            (window as any).google.accounts.id.renderButton(btnContainer, {
              theme: theme === "dark" ? "filled_black" : "outline",
              size: "large",
              width: computedWidth,
              text: authMode === "signup" ? "signup_with" : "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
          if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            try {
              (window as any).google.accounts.id.prompt();
            } catch {}
          }
        } catch (err) {
          console.warn("GIS button initialization notice:", err);
        }
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      if (currentStep === 2) {
        setTimeout(initGoogleGIS, 60);
      }
    }
  }, [theme, authMode, regRole, currentStep]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("eduquiz_remember_email", email);
      } else {
        localStorage.removeItem("eduquiz_remember_email");
      }

      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role: regRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Incorrect email or password");
      }

      if (data.workspace_id) {
        localStorage.setItem("workspaceId", data.workspace_id);
        localStorage.setItem("workspaceName", data.workspace_name || "Personal Workspace");
      }

      setAuth(data.access_token, data.role, data.full_name, undefined, data.avatar_url);
      router.push(resolveDestination(data.role));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!regEmail.trim()) {
      setError("Please enter a valid email address");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: regFullName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Account creation failed");
      }

      if (data.workspace_id) {
        localStorage.setItem("workspaceId", data.workspace_id);
        localStorage.setItem("workspaceName", data.workspace_name || "Personal Workspace");
      }

      setAuth(data.access_token, data.role, data.full_name, undefined, data.avatar_url);
      router.push(resolveDestination(data.role));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectExamJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCodeInput.trim()) return;
    const cleanCode = examCodeInput.trim().toUpperCase().replace(/^.*\/EXAM\//, "");
    router.push(`/exam/${cleanCode}/instructions`);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to process password reset request");
      }
      setForgotMessage(data.message || "Reset link dispatched! Please check your email inbox.");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, text: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, text: "Good", color: "bg-blue-500" };
    return { score: 4, text: "Strong", color: "bg-emerald-500" };
  };

  const pwdStrength = getPasswordStrength(regPassword);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#F4F7FB] dark:bg-[#070F1E] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGIS}
      />

      {/* 1. REAL CAMPUS BACKGROUND (Crisp, High-Resolution Architectural Photography) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 dark:opacity-20 transition-opacity duration-300"
        style={{ backgroundImage: "url('/images/campus_bg_highres.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#F4F7FB]/90 via-[#F4F7FB]/80 to-[#EEF4FC]/95 dark:from-[#070F1E]/90 dark:via-[#070F1E]/85 dark:to-[#0B1528]/98"
        aria-hidden="true"
      />

      {/* Floating Theme Toggle */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 2. TOP HEADER - Centered Stacked Logo (Icon on top, Text below) */}
      <header className="relative z-10 w-full max-w-[560px] mx-auto px-4 pt-5 sm:pt-7 pb-2 sm:pb-3 flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          className="inline-flex flex-col items-center justify-center transition-transform hover:opacity-95 active:scale-95"
          title="Return to Testora Quiz Home"
        >
          <AppLogo variant="stacked" height={64} />
        </Link>
      </header>

      {/* 3. MAIN CONTAINER (Clean centered card on all viewports) */}
      <main className="relative z-10 w-full max-w-[560px] mx-auto px-2.5 xs:px-3.5 sm:px-4 py-2 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="w-full">
            <div className="w-full bg-white dark:bg-[#0D182E] rounded-2xl sm:rounded-3xl p-3.5 xs:p-4.5 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden space-y-3.5 sm:space-y-6">

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                currentStep === 1
                  ? "text-[#1765F5] dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 1
                    ? "bg-[#1765F5] text-white shadow-xs"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
              </span>
              <span>1. Choose Mode</span>
            </button>

            <div
              className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                currentStep > 1 ? "bg-[#1765F5] dark:bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                currentStep === 2
                  ? "text-[#1765F5] dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 2
                    ? "bg-[#1765F5] text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                2
              </span>
              <span>2. {authMode === "signup" ? "Account Details" : "Sign In"}</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              STEP 1: SELECT MODE & HIGHLIGHTS
          ══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-3.5 sm:space-y-5 animate-in fade-in duration-200">
              {/* Heading & Role Tag */}
              <div className="flex items-start justify-between gap-2 sm:gap-3 pt-0.5">
                <div>
                  <h1 className="text-xl sm:text-[26px] font-bold text-[#101D3A] dark:text-white tracking-tight leading-tight">
                    Select Portal Mode
                  </h1>
                  <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                    Choose your role to get tailored assessment tools &amp; analytics
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-[#EEF5FF] dark:bg-blue-950/70 text-[#1765F5] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs whitespace-nowrap">
                    {regRole === "teacher" ? "Instructor Mode" : "Student Mode"}
                  </span>
                </div>
              </div>

              {/* Two Mode Cards Side-by-Side (Both cards visible in one row on mobile & desktop) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-6">
                {/* 1. TEACHER MODE CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setRegRole("teacher");
                    regRoleRef.current = "teacher";
                    setTargetDestination("teacher_dashboard");
                  }}
                  className={`group relative rounded-2xl p-1.5 xs:p-2 sm:p-2.5 pb-2.5 xs:pb-3 sm:pb-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col ${
                    regRole === "teacher"
                      ? "bg-white dark:bg-[#121E36] border-2 border-[#1765F5] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/10"
                      : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <img
                      src="/images/teacher_group_faculty.jpg?v=hd4"
                      alt="Teacher Mode - Faculty and Educators Group"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/teacher_mode.jpg?v=hd4";
                      }}
                    />
                    {/* Subtle bottom gradient vignette for contrast and legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Selection Checkmark on Top-Right */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                      {regRole === "teacher" ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1765F5] text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 shadow-xs backdrop-blur-xs" />
                      )}
                    </div>

                    {/* Tag on Bottom-Left */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10">
                      <span className="px-1.5 xs:px-2 py-0.5 rounded-md text-[9px] xs:text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md shadow-2xs inline-flex items-center gap-1 border border-white/10">
                        <Users className="w-2.5 h-2.5 text-blue-300" />
                        <span>
                          <span className="hidden xs:inline">Faculty &amp; Admins</span>
                          <span className="xs:hidden">Faculty</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="text-center mt-2 sm:mt-3">
                    <h2 className="text-xs xs:text-sm sm:text-base font-bold text-[#101D3A] dark:text-white leading-tight">
                      Teacher Mode
                    </h2>
                    <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Create &amp; Proctor
                    </p>
                  </div>
                </button>

                {/* 2. STUDENT MODE CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setRegRole("student");
                    regRoleRef.current = "student";
                    setTargetDestination("student_dashboard");
                  }}
                  className={`group relative rounded-2xl p-1.5 xs:p-2 sm:p-2.5 pb-2.5 xs:pb-3 sm:pb-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col ${
                    regRole === "student"
                      ? "bg-white dark:bg-[#121E36] border-2 border-[#1765F5] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/10"
                      : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <img
                      src="/images/student_group_college.jpg?v=hd4"
                      alt="Student Mode - University Student Study Group"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/student_mode.jpg?v=hd4";
                      }}
                    />
                    {/* Subtle bottom gradient vignette for contrast and legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Selection Checkmark on Top-Right */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                      {regRole === "student" ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1765F5] text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 shadow-xs backdrop-blur-xs" />
                      )}
                    </div>

                    {/* Tag on Bottom-Left */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10">
                      <span className="px-1.5 xs:px-2 py-0.5 rounded-md text-[9px] xs:text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md shadow-2xs inline-flex items-center gap-1 border border-white/10">
                        <Users className="w-2.5 h-2.5 text-cyan-300" />
                        <span>
                          <span className="hidden xs:inline">Candidate Group</span>
                          <span className="xs:hidden">Students</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="text-center mt-2 sm:mt-3">
                    <h2 className="text-xs xs:text-sm sm:text-base font-bold text-[#101D3A] dark:text-white leading-tight">
                      Student Mode
                    </h2>
                    <p className="text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Take Assessments
                    </p>
                  </div>
                </button>
              </div>

              {/* Core Platform Features Infographic Panel */}
              <div className="bg-[#EEF5FF]/70 dark:bg-[#111D35]/80 border border-blue-200/70 dark:border-[#263957] rounded-2xl p-2.5 xs:p-3 sm:p-4 space-y-2 sm:space-y-2.5 transition-all">
                <div className="flex items-center justify-between pb-1 border-b border-blue-100/80 dark:border-blue-900/40">
                  <span className="text-[10.5px] xs:text-xs font-bold text-[#1765F5] dark:text-[#278BFF] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#278BFF]" />
                    <span>CORE PLATFORM CAPABILITIES</span>
                  </span>
                  <span className="text-[10px] xs:text-[11px] font-semibold text-slate-500 dark:text-[#A9B9D3]">
                    {regRole === "teacher" ? "Faculty & Admins" : "Candidate Group"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {/* 01 AI Powered */}
                  <div className="flex items-center gap-1.5 xs:gap-2.5 p-1.5 xs:p-2 rounded-xl bg-white/80 dark:bg-[#080E1E]/80 border border-blue-100/90 dark:border-[#263957] shadow-2xs">
                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-[#278BFF] text-white flex items-center justify-center text-[10px] xs:text-xs font-black shrink-0 ring-1.5 xs:ring-2 ring-white dark:ring-[#111D35]">
                      01
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight truncate">
                        AI Powered
                      </h4>
                      <p className="text-[9.5px] xs:text-[10.5px] text-slate-500 dark:text-[#A9B9D3] truncate">
                        Create in minutes.
                      </p>
                    </div>
                    <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#278BFF] items-center justify-center shrink-0 hidden xs:flex">
                      <Zap className="w-3 h-3 xs:w-3.5 xs:h-3.5" strokeWidth={2.3} />
                    </div>
                  </div>

                  {/* 02 Print Ready */}
                  <div className="flex items-center gap-1.5 xs:gap-2.5 p-1.5 xs:p-2 rounded-xl bg-white/80 dark:bg-[#080E1E]/80 border border-purple-100/90 dark:border-[#263957] shadow-2xs">
                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-[#8B4DFF] text-white flex items-center justify-center text-[10px] xs:text-xs font-black shrink-0 ring-1.5 xs:ring-2 ring-white dark:ring-[#111D35]">
                      02
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight truncate">
                        Print Ready
                      </h4>
                      <p className="text-[9.5px] xs:text-[10.5px] text-slate-500 dark:text-[#A9B9D3] truncate">
                        Exam papers.
                      </p>
                    </div>
                    <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-purple-50 dark:bg-purple-950/70 text-[#8B4DFF] items-center justify-center shrink-0 hidden xs:flex">
                      <FileText className="w-3 h-3 xs:w-3.5 xs:h-3.5" strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* 03 Organized */}
                  <div className="flex items-center gap-1.5 xs:gap-2.5 p-1.5 xs:p-2 rounded-xl bg-white/80 dark:bg-[#080E1E]/80 border border-emerald-100/90 dark:border-[#263957] shadow-2xs">
                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] xs:text-xs font-black shrink-0 ring-1.5 xs:ring-2 ring-white dark:ring-[#111D35]">
                      03
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight truncate">
                        Organized
                      </h4>
                      <p className="text-[9.5px] xs:text-[10.5px] text-slate-500 dark:text-[#A9B9D3] truncate">
                        Question banks.
                      </p>
                    </div>
                    <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-[#10B981] items-center justify-center shrink-0 hidden xs:flex">
                      <Database className="w-3 h-3 xs:w-3.5 xs:h-3.5" strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* 04 Secure */}
                  <div className="flex items-center gap-1.5 xs:gap-2.5 p-1.5 xs:p-2 rounded-xl bg-white/80 dark:bg-[#080E1E]/80 border border-rose-100/90 dark:border-[#263957] shadow-2xs">
                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-[#FF4D5A] text-white flex items-center justify-center text-[10px] xs:text-xs font-black shrink-0 ring-1.5 xs:ring-2 ring-white dark:ring-[#111D35]">
                      04
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight truncate">
                        Secure
                      </h4>
                      <p className="text-[9.5px] xs:text-[10.5px] text-slate-500 dark:text-[#A9B9D3] truncate">
                        Proctor radar.
                      </p>
                    </div>
                    <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-rose-50 dark:bg-rose-950/70 text-[#FF4D5A] items-center justify-center shrink-0 hidden xs:flex">
                      <ShieldCheck className="w-3 h-3 xs:w-3.5 xs:h-3.5" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1 Actions: Continue Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full bg-[#1765F5] hover:bg-[#1253CE] text-white font-bold rounded-xl py-3 sm:py-3.5 text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Continue to {authMode === "signup" ? "Account Details" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Direct Code Gateway Link */}
              <div className="space-y-3 pt-1">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-[#0D182E] px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                    OR
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                      setShowExamCodeGateway(true);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#1765F5] dark:text-blue-400 hover:text-[#1253CE] dark:hover:text-blue-300 transition-colors cursor-pointer group"
                  >
                    <FileCode2 className="w-4 h-4" />
                    <span>Taking a Test? Enter Exam Code Directly</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@aegeus.edu");
                      setPassword("securepassword");
                      setTargetDestination("/admin");
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer py-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Administrator? Sign in to Admin Control Center &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2: AUTHENTICATION FORM
          ══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Step 2 Top Bar: Back Button & Active Role Badge */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mode</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF5FF] dark:bg-blue-950/70 text-[#1765F5] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs">
                  <img
                    src={regRole === "teacher" ? "/images/teacher_group_faculty.jpg?v=hd4" : "/images/student_group_college.jpg?v=hd4"}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-blue-500/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = regRole === "teacher" ? "/images/teacher_mode.jpg?v=3" : "/images/student_mode.jpg?v=3";
                    }}
                  />
                  <span>{regRole === "teacher" ? "Instructor Mode" : "Candidate Mode"}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#101D3A] dark:text-white tracking-tight">
                  {authMode === "signin" ? "Portal Sign In" : "Create New Account"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                  {authMode === "signin"
                    ? `Sign in to access your ${regRole === "teacher" ? "instructor workspace" : "student portal"}`
                    : `Get started with your personalized ${regRole === "teacher" ? "teacher" : "student"} account`}
                </p>
              </div>

              {error && (
                <div className="flex gap-2 items-center p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authMode === "signin" ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      User Name / Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@aegeus.edu"
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                      />
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotMessage(null);
                          setForgotError(null);
                          setForgotModalOpen(true);
                        }}
                        className="text-xs font-semibold text-[#1765F5] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                      />
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-[#1765F5] focus:ring-[#1765F5]/30 cursor-pointer h-3.5 w-3.5"
                      />
                      <span>Remember my login email</span>
                    </label>
                  </div>

                  {/* Sign In Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1765F5] hover:bg-[#1253CE] text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* CREATE ACCOUNT FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="sarah@university.edu"
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                      />
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password Field with Strength Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Create Password
                      </label>
                      {regPassword && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Strength: <span className="font-semibold">{pwdStrength.text}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={regShowPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                      />
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full transition-all ${
                              step <= pwdStrength.score ? pwdStrength.color : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={regShowPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40 focus:border-[#1765F5] transition-all font-medium"
                      />
                      <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Sign Up Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1765F5] hover:bg-[#1253CE] text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Get Started</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-[#0D182E] px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                  or {authMode === "signup" ? "sign up with" : "continue with"}
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {/* Google Identity Services Container */}
              <div className="w-full flex justify-center min-h-[44px]">
                <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]" />
              </div>

              {/* Bottom Switcher: Sign In vs Create Account */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                {authMode === "signin" ? (
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setError(null);
                      }}
                      className="font-bold text-[#1765F5] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Create one now &rarr;
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signin");
                        setError(null);
                      }}
                      className="font-bold text-[#1765F5] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Sign in here &rarr;
                    </button>
                  </p>
                )}
              </div>

              {/* Direct Exam Code Gateway Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                {!showExamCodeGateway ? (
                  <button
                    type="button"
                    onClick={() => setShowExamCodeGateway(true)}
                    className="w-full text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#1765F5] dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>Taking a Test? Enter Exam Code</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleDirectExamJump}
                    className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode2 className="h-3.5 w-3.5 text-[#1765F5]" />
                        <span>Candidate Direct Access</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowExamCodeGateway(false)}
                        className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          required
                          value={examCodeInput}
                          onChange={(e) => setExamCodeInput(e.target.value)}
                          placeholder="e.g. ex-com-1234"
                          className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-9 px-3.5 bg-[#1765F5] text-white rounded-lg text-xs font-bold hover:bg-[#1253CE] active:scale-[0.98] transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <span>Take Exam</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
            </div>

            {/* 4. FOOTER SECURITY & TRUST */}
            <footer className="w-full max-w-[560px] mx-auto px-4 pt-4 pb-6 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">AES-256 Secure</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span>Developed by</span>
                <a
                  href="https://dpramp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1765F5] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  <span>dpramp.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </footer>
        </div>
      </main>

      {/* 5. FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0D182E] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered account email. If the account exists, we will dispatch a secure reset token link.
            </p>

            {forgotError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{forgotMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2.5 bg-[#1765F5] hover:bg-[#1253CE] text-white rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1765F5]/40"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-[#1765F5] hover:bg-[#1253CE] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    {forgotLoading ? "Dispatching..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#070F1E] flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-[#1765F5] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
