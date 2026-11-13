"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Award,
  Clock,
  HelpCircle,
  CheckCircle2,
  Lock,
  Play,
  Search,
  Filter,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Tag,
  Coins,
  ChevronRight,
  X,
  FileText,
  Flame,
  Star,
  Compass,
  Layers,
  GraduationCap
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import MockTestTakingModal from "./MockTestTakingModal";

interface MockTestItem {
  id: string;
  company_name: string;
  company_slug: string;
  company_logo?: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  price_inr: number;
  price_paise: number;
  is_free: boolean;
  duration_minutes: number;
  total_questions: number;
  pass_percentage: number;
  attempts_count: number;
  is_active: boolean;
  is_unlocked: boolean;
  has_attempted: boolean;
  last_score?: number | null;
  last_percentage?: number | null;
  last_passed?: boolean | null;
}

interface CompanyFilter {
  name: string;
  slug: string;
  count: number;
}

interface CompanyTheme {
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  tagline: string;
  patternType: string;
}

const COMPANY_THEMES: Record<string, CompanyTheme> = {
  tcs: {
    bgGradient: "from-[#0F172A] via-[#1E293B] to-[#1E3A8A]",
    badgeBg: "bg-blue-500/20 border-blue-400/40",
    badgeText: "text-blue-300",
    accentColor: "#2563EB",
    tagline: "NQT Aptitude & Cognitive Pattern",
    patternType: "TCS National Qualifier"
  },
  infosys: {
    bgGradient: "from-[#0A192F] via-[#0D2447] to-[#0284C7]",
    badgeBg: "bg-sky-500/20 border-sky-400/40",
    badgeText: "text-sky-300",
    accentColor: "#0284C7",
    tagline: "DSE & Systems Engineer Qualifier",
    patternType: "Infosys Campus Qualifier"
  },
  hcl: {
    bgGradient: "from-[#1C1917] via-[#292524] to-[#C2410C]",
    badgeBg: "bg-orange-500/20 border-orange-400/40",
    badgeText: "text-orange-300",
    accentColor: "#EA580C",
    tagline: "First Careers & Tech Evaluation",
    patternType: "HCLTech Placement Drive"
  },
  wipro: {
    bgGradient: "from-[#18181B] via-[#27272A] to-[#7E22CE]",
    badgeBg: "bg-purple-500/20 border-purple-400/40",
    badgeText: "text-purple-300",
    accentColor: "#9333EA",
    tagline: "Elite NTH Candidate Pattern",
    patternType: "Wipro Elite National"
  },
  accenture: {
    bgGradient: "from-[#0F172A] via-[#1E1B4B] to-[#6D28D9]",
    badgeBg: "bg-violet-500/20 border-violet-400/40",
    badgeText: "text-violet-300",
    accentColor: "#7C3AED",
    tagline: "Critical Reasoning & Technical MCQ",
    patternType: "Accenture Digital Qualifier"
  }
};

const DEFAULT_THEME: CompanyTheme = {
  bgGradient: "from-[#0F172A] via-[#1E293B] to-[#334155]",
  badgeBg: "bg-slate-500/20 border-slate-400/40",
  badgeText: "text-slate-300",
  accentColor: "#2563EB",
  tagline: "Corporate Recruitment Pattern",
  patternType: "Placement Assessment"
};

export default function CompanyPlacementTests() {
  const { token, fullName } = useAuthStore();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [companies, setCompanies] = useState<CompanyFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Active Test Runner Modal
  const [activeTest, setActiveTest] = useState<MockTestItem | null>(null);

  // Load Razorpay checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const [testsRes, compsRes] = await Promise.all([
        apiFetch("/mock-tests", { token }),
        apiFetch("/mock-tests/companies", { token })
      ]);

      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(Array.isArray(testsData) ? testsData : []);
      }
      if (compsRes.ok) {
        const compsData = await compsRes.json();
        setCompanies(Array.isArray(compsData) ? compsData : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    loadRazorpayScript();
  }, [token]);

  // Handle Free Test Start
  const handleStartFree = async (test: MockTestItem) => {
    try {
      setProcessingId(test.id);
      const res = await apiFetch(`/mock-tests/${test.id}/start-free`, {
        method: "POST",
        token
      });
      if (res.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, is_unlocked: true } : t))
        );
        setActiveTest(test);
      }
    } catch {
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Paid Test Checkout (₹9 / ₹12 Razorpay)
  const handleUnlockPaid = async (test: MockTestItem) => {
    try {
      setProcessingId(test.id);
      
      const orderRes = await apiFetch(`/mock-tests/${test.id}/create-order`, {
        method: "POST",
        token
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        alert(err.detail || "Failed to initialize payment gateway order.");
        setProcessingId(null);
        return;
      }

      const orderData = await orderRes.json();
      const scriptLoaded = await loadRazorpayScript();

      const isSimulation =
        orderData.order_id.startsWith("order_mt_") ||
        orderData.key_id === "rzp_test_placeholder" ||
        !orderData.key_id;

      if (isSimulation || !scriptLoaded) {
        const confirmed = window.confirm(
          `[Testora Secure Payment Checkout]\n\n` +
          `Test: ${test.title}\n` +
          `Company: ${test.company_name}\n` +
          `Amount: ₹${test.price_inr}\n` +
          `Order ID: ${orderData.order_id}\n\n` +
          `Click OK to confirm mock test unlock.`
        );

        if (confirmed) {
          const verifyRes = await apiFetch(`/mock-tests/${test.id}/verify-payment`, {
            method: "POST",
            token,
            body: JSON.stringify({
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_sim_${Date.now()}`,
              razorpay_signature: "simulated_mock_test_signature"
            })
          });

          if (verifyRes.ok) {
            setTests((prev) =>
              prev.map((t) => (t.id === test.id ? { ...t, is_unlocked: true } : t))
            );
            setActiveTest(test);
          }
        }
        setProcessingId(null);
        return;
      }

      // Live Razorpay popup
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Testora Quiz",
        description: `${test.company_name} Placement Test: ${test.title}`,
        order_id: orderData.order_id,
        prefill: {
          name: fullName || "Student Candidate",
          email: ""
        },
        theme: {
          color: "#2563EB"
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await apiFetch(`/mock-tests/${test.id}/verify-payment`, {
              method: "POST",
              token,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              setTests((prev) =>
                prev.map((t) => (t.id === test.id ? { ...t, is_unlocked: true } : t))
              );
              setActiveTest(test);
            }
          } catch (err: any) {
            alert(err.message || "Payment verification failed.");
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (failResp: any) => {
        alert(failResp.error?.description || "Payment was declined.");
      });
      razorpayInstance.open();
    } catch (err: any) {
      alert(err.message || "Checkout error.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered Tests
  const filteredTests = tests.filter((t) => {
    const matchesCompany = selectedCompany === "all" || t.company_slug.toLowerCase() === selectedCompany.toLowerCase();
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && t.is_free) ||
      (priceFilter === "paid" && !t.is_free);
    const matchesDifficulty =
      difficultyFilter === "all" ||
      t.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.difficulty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCompany && matchesPrice && matchesDifficulty && matchesSearch;
  });

  // Aggregate stats
  const freeCount = tests.filter((t) => t.is_free).length;
  const paidCount = tests.filter((t) => !t.is_free).length;
  const attemptedCount = tests.filter((t) => t.has_attempted).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ═══════ HERO BANNER ═══════ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A2540] text-white p-5 sm:p-8 lg:p-10 shadow-xl border border-slate-700/50">
        
        {/* Glow ambient spheres */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-5">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="tracking-wide uppercase text-[10px] sm:text-[11px]">Corporate Campus Placement Arena</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Campus Placement <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Mock Tests & Qualifiers</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-2xl">
              Sharpen your speed and accuracy with real hiring test patterns from top recruiters. Experience actual aptitude, logical reasoning, verbal ability, and technical screening questions.
            </p>
          </div>

          {/* Key Value Highlights */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 text-[11px] sm:text-xs font-semibold text-slate-200">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Free Access Mocks</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all">
              <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Premium Tests at ₹9 & ₹12</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all">
              <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Instant Score & Explanations</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Standard Hiring Patterns</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 max-w-xl text-left">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider">Available Tests</div>
              <div className="text-base sm:text-xl font-black text-white mt-0.5">{tests.length} Mocks</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-[10px] sm:text-[11px] text-emerald-400 uppercase font-bold tracking-wider">Free Mocks</div>
              <div className="text-base sm:text-xl font-black text-emerald-300 mt-0.5">{freeCount} Free</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-[10px] sm:text-[11px] text-amber-400 uppercase font-bold tracking-wider">Starting At</div>
              <div className="text-base sm:text-xl font-black text-amber-300 mt-0.5">₹9 Only</div>
            </div>
            <div className="hidden sm:block p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-[10px] sm:text-[11px] text-blue-400 uppercase font-bold tracking-wider">Completed</div>
              <div className="text-base sm:text-xl font-black text-blue-300 mt-0.5">{attemptedCount} Taken</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ FILTER & SEARCH COMMAND CENTER ═══════ */}
      <div className="bg-white dark:bg-[#111C31] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4 shadow-sm">
        
        {/* Company Pills Selector with Monograms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Select Recruiting Company</span>
            </div>
            <span className="text-[11px] font-normal text-slate-500">
              {selectedCompany === "all" ? "Showing all companies" : `Filtered by ${selectedCompany.toUpperCase()}`}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            <button
              onClick={() => setSelectedCompany("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                selectedCompany === "all"
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
                  : "bg-slate-50 dark:bg-[#17243A] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400/50"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Companies</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                selectedCompany === "all" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}>
                {tests.length}
              </span>
            </button>

            {companies
              .filter((c) => c.slug !== "all")
              .map((comp) => {
                const isSelected = selectedCompany === comp.slug;
                return (
                  <button
                    key={comp.slug}
                    onClick={() => setSelectedCompany(comp.slug)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
                        : "bg-slate-50 dark:bg-[#17243A] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400/50"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black uppercase ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}>
                      {comp.name.slice(0, 2)}
                    </span>
                    <span>{comp.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}>
                      {comp.count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Secondary Search & Price & Difficulty Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, topic, or company (e.g. TCS NQT, Quantitative, Infosys)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggles Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Price Filter Segmented Pill */}
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 flex items-center gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPriceFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  priceFilter === "all"
                    ? "bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter("free")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  priceFilter === "free"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Free Mocks</span>
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter("paid")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  priceFilter === "paid"
                    ? "bg-amber-500 text-slate-950 shadow-2xs"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-800"
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>₹9 / ₹12</span>
              </button>
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy Level</option>
              <option value="medium">Medium Level</option>
              <option value="hard">Hard / Advanced</option>
            </select>
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTests.length}</strong> of {tests.length} mock tests
          </div>
          {(selectedCompany !== "all" || priceFilter !== "all" || difficultyFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCompany("all");
                setPriceFilter("all");
                setDifficultyFilter("all");
                setSearchQuery("");
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════ MOCK TESTS CATALOG GRID ═══════ */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading placement tests catalog...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-12 sm:p-16 text-center space-y-3.5 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No Placement Tests Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No mock tests match your current search or filter parameters. Try clearing your search keyword or switching companies.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCompany("all");
              setPriceFilter("all");
              setDifficultyFilter("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show All Tests</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredTests.map((test) => {
            const theme = COMPANY_THEMES[test.company_slug.toLowerCase()] || DEFAULT_THEME;
            const isProcessing = processingId === test.id;

            return (
              <div
                key={test.id}
                className="group bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Ribbon with Company Theme */}
                  <div className={`p-4 sm:p-5 bg-gradient-to-r ${theme.bgGradient} text-white relative overflow-hidden`}>
                    
                    {/* Decorative shimmer line */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {test.company_name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm tracking-wide truncate">
                            {test.company_name}
                          </div>
                          <div className="text-[10px] text-white/70 font-medium truncate">
                            {theme.patternType}
                          </div>
                        </div>
                      </div>

                      {/* Price Badge */}
                      <div className="shrink-0">
                        {test.is_free ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>FREE MOCK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                            <Tag className="w-3 h-3 text-slate-900" />
                            <span>₹{test.price_inr} ONLY</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    
                    {/* Category & Difficulty Tag */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {test.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-extrabold ${
                        test.difficulty.toLowerCase() === "easy"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : test.difficulty.toLowerCase() === "hard"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {test.difficulty}
                      </span>
                    </div>

                    {/* Test Title & Description */}
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1.5 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Questions</span>
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                          {test.total_questions} Qs
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Duration</span>
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                          {test.duration_minutes} Mins
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>Cutoff</span>
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                          {test.pass_percentage}%
                        </strong>
                      </div>
                    </div>

                    {/* Status Strip if previously attempted */}
                    {test.has_attempted ? (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        test.last_passed
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300"
                          : "bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 shrink-0" />
                          <span>Last Score: {test.last_score} / {test.total_questions} ({test.last_percentage}%)</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide">
                          {test.last_passed ? "✓ Passed" : "Needs Review"}
                        </span>
                      </div>
                    ) : test.is_unlocked ? (
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked & Ready to Attempt</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{test.attempts_count} taken</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          <span>Practice Test Locked</span>
                        </div>
                        <span className="text-[10px]">{test.attempts_count} candidates enrolled</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button Section */}
                <div className="p-4 sm:p-5 pt-0">
                  {test.has_attempted ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTest(test)}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTest(test)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Solutions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : test.is_unlocked ? (
                    <button
                      type="button"
                      onClick={() => setActiveTest(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Assessment Now →</span>
                    </button>
                  ) : test.is_free ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStartFree(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isProcessing ? "Preparing Test..." : "Start Free Mock Test →"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUnlockPaid(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-200" />
                      <span>{isProcessing ? "Initializing Checkout..." : `Unlock Placement Test for ₹${test.price_inr} →`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ INTERACTIVE IN-BROWSER TEST MODAL ═══════ */}
      {activeTest && (
        <MockTestTakingModal
          testId={activeTest.id}
          testTitle={activeTest.title}
          companyName={activeTest.company_name}
          durationMinutes={activeTest.duration_minutes}
          isOpen={Boolean(activeTest)}
          onClose={() => {
            setActiveTest(null);
            fetchTests();
          }}
          onCompleted={() => {
            fetchTests();
          }}
        />
      )}
    </div>
  );
}
