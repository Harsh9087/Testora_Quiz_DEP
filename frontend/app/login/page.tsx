"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  School, 
  Sun, 
  Moon, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  CheckCircle2, 
  KeyRound, 
  X,
  FileCode2,
  BookOpen,
  Check,
  ExternalLink
} from "lucide-react";

import Script from "next/script";
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

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const resolveDestination = (userRole: string) => {
    // Role-based routing is strictly authoritative:
    // A student account must NEVER be sent to the teacher dashboard
    if (userRole === "student") {
      if (targetDestination && targetDestination.startsWith("/exam/")) {
        return targetDestination;
      }
      return "/dashboard/student";
    }

    // Super admin account
    if (userRole === "super_admin") {
      if (targetDestination && targetDestination.startsWith("/") && !targetDestination.startsWith("/dashboard/student")) {
        return targetDestination;
      }
      return "/admin";
    }

    // Teacher or institution administrator accounts
    if (userRole === "teacher" || userRole === "inst_admin") {
      if (targetDestination && targetDestination.startsWith("/") && !targetDestination.startsWith("/dashboard/student")) {
        return targetDestination;
      }
      return "/dashboard/teacher";
    }

    // Safe fallback if role is unrecognized
    if (targetDestination) {
      if (targetDestination === "student_dashboard") return "/dashboard/student";
      if (targetDestination === "teacher_dashboard") return "/dashboard/teacher";
      if (targetDestination.startsWith("/dashboard/teacher")) return "/dashboard/teacher";
      if (targetDestination.startsWith("/")) return targetDestination;
    }
    return "/dashboard/student";
  };

  useEffect(() => {
    // Check URL query parameters for initial mode, role, and target
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
      } else if (roleParam === "teacher") {
        setRegRole("teacher");
        regRoleRef.current = "teacher";
        setTargetDestination("teacher_dashboard");
      }
      const targetParam = params.get("target");
      if (targetParam) {
        setTargetDestination(targetParam);
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
      }
    }

    // Load saved preferences
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const savedEmail = localStorage.getItem("eduquiz_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

      setAuth(data.access_token, assignedRole, data.full_name);
      router.push(resolveDestination(assignedRole));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Intercept GSI_LOGGER origin mismatch to prevent Next.js dev overlay from interrupting local testing
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

  const initGoogleGIS = () => {
    setGisLoaded(true);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "716730043675-rq3tq97avgrrbtjoup3hjdhteg4k7pql.apps.googleusercontent.com";
    if (clientId && clientId.trim()) {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
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
          // Only prompt One-Tap outside of localhost or if origin is known valid
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
  }, [theme, gisLoaded, authMode, regRole, currentStep]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Incorrect email or password");
      }

      if (data.workspace_id) {
        localStorage.setItem("workspaceId", data.workspace_id);
        localStorage.setItem("workspaceName", data.workspace_name || "Personal Workspace");
      }

      setAuth(data.access_token, data.role, data.full_name);
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

      setAuth(data.access_token, data.role, data.full_name);
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
    const cleanCode = examCodeInput.trim().replace(/^.*\/exam\//, "");
    router.push(`/exam/${cleanCode}`);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() })
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
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] px-4 py-4 sm:py-6 transition-colors duration-200">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGIS}
      />
      
      {/* Subtle Ambient Decorative Circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Options: Theme Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[460px] z-10 space-y-4 my-auto">
        
        {/* Logo & Platform Headline */}
        <div className="flex flex-col justify-center items-center text-center pb-1">
          <a href="/" title="Testora Quiz Home" className="transition-transform hover:scale-105 duration-200">
            <AppLogo variant="stacked" height={88} />
          </a>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white dark:bg-[#111C31] rounded-2xl p-5 sm:p-7 border border-[#E2E8F0] dark:border-[#263449] shadow-sm relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A]" />

          {/* ═══════ STEPPER PROGRESS BAR ═══════ */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#E5E0D8]/60 dark:border-[#292524]/60">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                currentStep === 1 
                  ? "text-[#C84B18] dark:text-[#EA580C]" 
                  : "text-[#716D67] hover:text-[#242321] dark:text-[#A8A29E] dark:hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 
                  ? "bg-[#C84B18] text-white dark:bg-[#EA580C]" 
                  : "bg-emerald-600 text-white"
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
              </span>
              <span>1. Choose Mode</span>
            </button>

            <div className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
              currentStep > 1 ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[#E5E0D8] dark:bg-[#292524]"
            }`} />

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                currentStep === 2 
                  ? "text-[#C84B18] dark:text-[#EA580C]" 
                  : "text-[#716D67] hover:text-[#242321] dark:text-[#A8A29E] dark:hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 
                  ? "bg-[#C84B18] text-white dark:bg-[#EA580C]" 
                  : "bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67] dark:text-[#A8A29E]"
              }`}>
                2
              </span>
              <span>2. {authMode === "signup" ? "Account Details" : "Sign In"}</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: SELECT MODE & RICH FEATURE HIGHLIGHTS
              ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] tracking-tight">
                    Select Portal Mode
                  </h2>
                  <p className="text-[#716D67] dark:text-[#A8A29E] text-xs mt-0.5">
                    Choose your role to get tailored assessment tools & analytics
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors shrink-0 ${
                  regRole === "teacher"
                    ? "bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border-[#C84B18]/20"
                    : "bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA] border-[#7C3AED]/20"
                }`}>
                  {regRole === "teacher" ? "Instructor Mode" : "Candidate Mode"}
                </span>
              </div>

              {/* 3D Mode Cards Side-by-Side (Duo Characters) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Teacher / Educator Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    setRegRole("teacher");
                    regRoleRef.current = "teacher";
                    setTargetDestination("teacher_dashboard");
                  }}
                  className={`group relative rounded-2xl overflow-hidden border-2 text-center transition-all duration-300 cursor-pointer flex flex-col bg-white dark:bg-[#1C1A17] shadow-xs ${
                    regRole === "teacher"
                      ? "border-[#C84B18] dark:border-[#EA580C] ring-2 ring-[#C84B18]/30 shadow-md shadow-[#C84B18]/15 scale-[1.02]"
                      : "border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/50 opacity-80 hover:opacity-100 hover:scale-[1.01]"
                  }`}
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-[#F5F2EB] dark:bg-[#201D1A]">
                    <img
                      src="/images/teacher_mode_3d.jpg"
                      alt="Teacher Mode Faculty"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                    {regRole === "teacher" ? (
                      <div className="absolute top-2 right-2 bg-[#C84B18] text-white p-1 rounded-full shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full border border-white/80 bg-black/25 backdrop-blur-xs" />
                    )}

                    <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#242321]/75 text-white backdrop-blur-xs shadow-2xs">
                      Faculty & Admins
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-white dark:bg-[#171615]">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#242321] dark:text-[#F5F5F4] group-hover:text-[#C84B18] dark:group-hover:text-[#EA580C] transition-colors leading-tight">
                      Teacher Mode
                    </h3>
                    <p className="text-[10px] text-[#716D67] dark:text-[#A8A29E] mt-0.5 truncate">
                      Create & Proctor
                    </p>
                  </div>
                </button>

                {/* Student / Candidate Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    setRegRole("student");
                    regRoleRef.current = "student";
                    setTargetDestination("student_dashboard");
                  }}
                  className={`group relative rounded-2xl overflow-hidden border-2 text-center transition-all duration-300 cursor-pointer flex flex-col bg-white dark:bg-[#1C1A17] shadow-xs ${
                    regRole === "student"
                      ? "border-[#7C3AED] dark:border-[#8B5CF6] ring-2 ring-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/15 scale-[1.02]"
                      : "border-[#E5E0D8] dark:border-[#292524] hover:border-[#7C3AED]/50 opacity-80 hover:opacity-100 hover:scale-[1.01]"
                  }`}
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-[#F5F2EB] dark:bg-[#201D1A]">
                    <img
                      src="/images/student_mode_3d.jpg"
                      alt="Student Mode Candidates"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                    {regRole === "student" ? (
                      <div className="absolute top-2 right-2 bg-[#7C3AED] text-white p-1 rounded-full shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full border border-white/80 bg-black/25 backdrop-blur-xs" />
                    )}

                    <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#242321]/75 text-white backdrop-blur-xs shadow-2xs">
                      Candidate Group
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-white dark:bg-[#171615]">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#242321] dark:text-[#F5F5F4] group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors leading-tight">
                      Student Mode
                    </h3>
                    <p className="text-[10px] text-[#716D67] dark:text-[#A8A29E] mt-0.5 truncate">
                      Take Assessments
                    </p>
                  </div>
                </button>
              </div>

              {/* Dynamic Mode Highlights / Info Card */}
              {regRole === "teacher" ? (
                <div className="bg-[#FAF8F5] dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] rounded-xl p-3.5 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#C84B18] dark:text-[#EA580C] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Instructor Portal Highlights</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#716D67] dark:text-[#A8A29E]">
                      Faculty & Admins
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">AI Quiz & Question Generator</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Instantly generate multi-tier quizzes from syllabus files and custom topics.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">Live Anti-Cheat Proctoring</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Real-time face verification, tab switch telemetry & automated cheating logs.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">Automated Grading & Student Directories</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Detailed analytics, class score distribution and student roster management.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF8F5] dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] rounded-xl p-3.5 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Candidate Portal Highlights</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#716D67] dark:text-[#A8A29E]">
                      Students & Learners
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                        <FileCode2 className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">Distraction-Free Exam Interface</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Clean full-screen quiz runner with auto-save and responsive question palette.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">Instant Result Breakdown & Rationales</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Immediate score feedback with clear explanations for all question solutions.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">Academic Profile & Credit Wallet</p>
                        <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">Dedicated student dashboard with test history and allocated wallet balance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 Actions: Next Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full bg-[#C84B18] hover:bg-[#B33E0F] dark:bg-[#EA580C] dark:hover:bg-[#C2410C] text-white font-bold rounded-xl py-3 text-xs transition-all shadow-md shadow-[#C84B18]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Continue to {authMode === "signup" ? "Account Details" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Taking a test shortcut */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    setShowExamCodeGateway(true);
                  }}
                  className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hover:text-[#C84B18] dark:hover:text-[#EA580C] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  <span>Taking a Test? Enter Exam Code Directly →</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: AUTHENTICATION FORM (WITH BACK BUTTON)
              ═══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 2 Top Bar: Back Button & Active Role Badge */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716D67] hover:text-[#242321] dark:text-[#A8A29E] dark:hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#F0ECE4]/60 dark:hover:bg-[#292524] border border-[#E5E0D8]/60 dark:border-[#292524]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mode</span>
                </button>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  regRole === "teacher"
                    ? "bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] border-[#C84B18]/20"
                    : "bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/15 dark:text-[#A78BFA] border-[#7C3AED]/20"
                }`}>
                  <img
                    src={regRole === "teacher" ? "/images/teacher_mode_3d.jpg" : "/images/student_mode_3d.jpg"}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{regRole === "teacher" ? "Instructor Mode" : "Candidate Mode"}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] tracking-tight">
                  {authMode === "signin" ? "Portal Sign In" : "Create New Account"}
                </h2>
                <p className="text-[#716D67] dark:text-[#A8A29E] text-xs mt-0.5">
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

              {/* ═══════════════════════════════════════════════════════════════
                  SIGN IN FORM
                  ═══════════════════════════════════════════════════════════════ */}
              {authMode === "signin" ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                      User Name / Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@aegeus.edu"
                        className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl pl-9.5 pr-3.5 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                      />
                      <Mail className="h-4 w-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
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
                        className="text-xs font-semibold text-[#C84B18] dark:text-[#EA580C] hover:underline cursor-pointer"
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
                        placeholder="••••••••"
                        className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl pl-9.5 pr-10 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                      />
                      <Lock className="h-4 w-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#242321] dark:hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#E5E0D8] dark:border-[#292524] text-[#C84B18] focus:ring-[#C84B18]/30 cursor-pointer h-3.5 w-3.5"
                      />
                      <span>Remember my login email</span>
                    </label>
                  </div>

                  {/* Sign In Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C84B18] hover:bg-[#B33E0F] dark:bg-[#EA580C] dark:hover:bg-[#C2410C] text-white font-bold rounded-xl py-3 text-xs transition-all shadow-md shadow-[#C84B18]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? "Signing in..." : "Sign In to Portal"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                /* ═══════════════════════════════════════════════════════════════
                   CREATE ACCOUNT (SIGN UP) FORM
                   ═══════════════════════════════════════════════════════════════ */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl px-3.5 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="sarah@university.edu"
                        className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl pl-9.5 pr-3.5 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                      />
                      <Mail className="h-4 w-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password Field with Strength Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                        Create Password
                      </label>
                      {regPassword && (
                        <span className="text-[10px] font-bold text-[#716D67] dark:text-[#A8A29E]">
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
                        className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl pl-9.5 pr-10 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                      />
                      <Lock className="h-4 w-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#242321] dark:hover:text-white cursor-pointer"
                      >
                        {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Strength Meter Bar */}
                    {regPassword && (
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full transition-all ${
                              step <= pwdStrength.score ? pwdStrength.color : "bg-[#E5E0D8] dark:bg-[#292524]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={regShowPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl pl-9.5 pr-3.5 py-2.5 text-sm text-[#242321] dark:text-[#F5F5F4] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30 focus:border-[#C84B18] transition-all font-medium"
                      />
                      <KeyRound className="h-4 w-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Sign Up Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C84B18] hover:bg-[#B33E0F] dark:bg-[#EA580C] dark:hover:bg-[#C2410C] text-white font-bold rounded-xl py-3 text-xs transition-all shadow-md shadow-[#C84B18]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? "Creating Account..." : "Create Account & Get Started"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E5E0D8] dark:border-[#292524] w-full" />
                <span className="bg-white dark:bg-[#171615] px-3 text-[11px] font-semibold text-[#716D67] dark:text-[#A8A29E] uppercase tracking-wider shrink-0">
                  or {authMode === "signup" ? "sign up with" : "continue with"}
                </span>
                <div className="border-t border-[#E5E0D8] dark:border-[#292524] w-full" />
              </div>

              {/* Google Identity Services Container */}
              <div className="w-full flex justify-center min-h-[44px]">
                <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]" />
              </div>

              {/* Bottom Switcher: Sign In vs Create Account */}
              <div className="text-center text-xs text-[#716D67] dark:text-[#A8A29E] pt-1">
                {authMode === "signin" ? (
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setError(null);
                      }}
                      className="font-bold text-[#C84B18] dark:text-[#EA580C] hover:underline cursor-pointer"
                    >
                      Create one now →
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
                      className="font-bold text-[#C84B18] dark:text-[#EA580C] hover:underline cursor-pointer"
                    >
                      Sign in here →
                    </button>
                  </p>
                )}
              </div>

              {/* Direct Exam Code Gateway Toggle */}
              <div className="pt-2 border-t border-[#E5E0D8]/60 dark:border-[#292524]/60">
                {!showExamCodeGateway ? (
                  <button
                    type="button"
                    onClick={() => setShowExamCodeGateway(true)}
                    className="w-full text-center text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hover:text-[#C84B18] dark:hover:text-[#EA580C] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>Taking a Test? Enter Exam Code</span>
                  </button>
                ) : (
                  <form onSubmit={handleDirectExamJump} className="space-y-2.5 bg-[#FBF9F5] dark:bg-[#1D1B19] p-3 rounded-xl border border-[#E5E0D8] dark:border-[#292524] overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode2 className="h-3.5 w-3.5 text-[#C84B18] dark:text-[#EA580C]" />
                        <span>Candidate Direct Access</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowExamCodeGateway(false)}
                        className="p-1 -mr-1 rounded-lg text-[#716D67] hover:text-[#242321] dark:hover:text-white hover:bg-[#E5E0D8]/50 dark:hover:bg-[#292524] transition-colors cursor-pointer"
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
                          className="w-full h-9 bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-lg px-2.5 text-xs text-[#242321] dark:text-[#F5F5F4] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C84B18]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-9 px-3.5 bg-[#C84B18] text-white rounded-lg text-xs font-bold hover:bg-[#B33E0F] active:scale-[0.98] transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
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
        
        {/* Footer Security Badge & Developer Credit */}
        <div className="flex items-center justify-center gap-3 text-xs text-[#64748B] dark:text-[#A3B1C6]">
          <div className="flex items-center gap-1 font-medium text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>AES-256 Secure</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Developed by</span>
            <a 
              href="https://dpramp.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-0.5 font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
            >
              <span>dpramp.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════ FORGOT PASSWORD MODAL ═══════ */}
      {forgotModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={() => setForgotModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-[#716D67] hover:text-[#242321] dark:hover:text-white p-1 rounded-lg hover:bg-[#F0ECE4]/50 dark:hover:bg-[#292524]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C84B18]/10 text-[#C84B18] dark:bg-[#EA580C]/15 dark:text-[#EA580C] flex items-center justify-center font-bold">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">Password Recovery</h3>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">Receive a tokenized reset password link</p>
              </div>
            </div>

            {forgotMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Recovery Dispatched</span>
                </div>
                <p>{forgotMessage}</p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                {forgotError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                    {forgotError}
                  </div>
                )}
                
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E] leading-relaxed">
                  Enter your verified student or faculty email address below. We will send you a tokenized password reset link immediately.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. teacher@aegeus.edu"
                    className="w-full bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524] rounded-xl px-3 py-2 text-sm text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/30"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-xs font-semibold text-[#716D67] hover:bg-[#F0ECE4]/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-[#C84B18] hover:bg-[#B33E0F] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? "Dispatching..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══════ FORGOT PASSWORD MODAL ═══════ */}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#0F0E0D] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#C84B18] border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
