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
  Coins
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

const COMPANY_THEMES: Record<string, { bgGradient: string; badgeColor: string; accentColor: string }> = {
  tcs: {
    bgGradient: "from-blue-900 to-indigo-950",
    badgeColor: "bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300",
    accentColor: "#1E3A8A"
  },
  infosys: {
    bgGradient: "from-sky-800 to-blue-900",
    badgeColor: "bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300",
    accentColor: "#0284C7"
  },
  hcl: {
    bgGradient: "from-orange-800 to-amber-950",
    badgeColor: "bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300",
    accentColor: "#EA580C"
  },
  wipro: {
    bgGradient: "from-purple-900 to-indigo-950",
    badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300",
    accentColor: "#7E22CE"
  },
  accenture: {
    bgGradient: "from-violet-900 to-slate-900",
    badgeColor: "bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-300 border-violet-300",
    accentColor: "#6D28D9"
  }
};

export default function CompanyPlacementTests() {
  const { token, fullName } = useAuthStore();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [companies, setCompanies] = useState<CompanyFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
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
        setTests(testsData);
      }
      if (compsRes.ok) {
        const compsData = await compsRes.json();
        setCompanies(compsData);
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
        // Mark unlocked locally and open modal
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
          `[Razorpay Mock Checkout Simulation]\n\n` +
          `Test: ${test.title}\n` +
          `Amount: ₹${test.price_inr}\n` +
          `Order ID: ${orderData.order_id}\n\n` +
          `Click OK to simulate successful payment and unlock this placement test.`
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
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCompany && matchesPrice && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Placement Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Corporate Placement & Mock Test Section</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Top Tech Companies Placement Mock Tests
          </h2>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Practice actual aptitude, reasoning, and technical qualifiers for <strong>TCS</strong>, <strong>Infosys</strong>, <strong>HCLTech</strong>, <strong>Wipro</strong>, and <strong>Accenture</strong>. Affordable practice tests from just ₹9 or ₹12 per test, plus free access mocks!
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-blue-200">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Free Access Tests Available
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-amber-300" />
              Per Test Fees ₹9 or ₹12
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Instant Grading & Full Solutions
            </span>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111C31] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#263449] space-y-3.5 shadow-2xs">
        {/* Company Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          <button
            onClick={() => setSelectedCompany("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCompany === "all"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Companies ({tests.length})
          </button>

          {companies
            .filter((c) => c.slug !== "all")
            .map((comp) => (
              <button
                key={comp.slug}
                onClick={() => setSelectedCompany(comp.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedCompany === comp.slug
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <span>{comp.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCompany === comp.slug
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {comp.count}
                </span>
              </button>
            ))}
        </div>

        {/* Secondary Search & Price Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests, companies, or topics (e.g. TCS NQT, Aptitude)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-400">Price:</span>
            <button
              onClick={() => setPriceFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                priceFilter === "all"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriceFilter("free")}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                priceFilter === "free"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Free Access
            </button>
            <button
              onClick={() => setPriceFilter("paid")}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                priceFilter === "paid"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Paid (₹9 - ₹12)
            </button>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading placement tests catalog...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h4 className="font-bold text-base text-slate-900 dark:text-white">No Placement Tests Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No tests matching your current filter criteria. Try resetting the filters or searching for another company.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => {
            const theme = COMPANY_THEMES[test.company_slug.toLowerCase()] || {
              bgGradient: "from-slate-800 to-slate-900",
              badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
              accentColor: "#2563EB"
            };

            const isProcessing = processingId === test.id;

            return (
              <div
                key={test.id}
                className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#2563EB]/40 transition-all flex flex-col justify-between"
              >
                {/* Card Header with Company Band */}
                <div>
                  <div className={`p-4 bg-gradient-to-r ${theme.bgGradient} text-white flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs">
                        {test.company_name.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="font-bold text-xs tracking-wide">
                        {test.company_name}
                      </span>
                    </div>

                    {/* Price Tag Badge */}
                    <div>
                      {test.is_free ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-2xs">
                          <Check className="w-3 h-3" />
                          <span>FREE ACCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-amber-950 shadow-2xs">
                          <Tag className="w-3 h-3" />
                          <span>₹{test.price_inr} ONLY</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {test.category} • {test.difficulty}
                      </div>
                      <h4 className="font-bold text-sm text-[#111827] dark:text-[#F1F5F9] leading-snug line-clamp-2">
                        {test.title}
                      </h4>
                      {test.description && (
                        <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-1 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Meta Specs */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#15233D] text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Questions</span>
                        <strong className="text-slate-800 dark:text-slate-200">{test.total_questions} Qs</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Duration</span>
                        <strong className="text-slate-800 dark:text-slate-200">{test.duration_minutes} Mins</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pass Mark</span>
                        <strong className="text-slate-800 dark:text-slate-200">{test.pass_percentage}%</strong>
                      </div>
                    </div>

                    {/* Status Pill if Attempted / Unlocked */}
                    <div className="flex items-center justify-between text-[11px]">
                      {test.has_attempted ? (
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          test.last_passed ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          <Award className="w-3.5 h-3.5" />
                          <span>Last Score: {test.last_score} ({test.last_percentage}%)</span>
                        </span>
                      ) : test.is_unlocked ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked & Ready</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}

                      <span className="text-slate-400">
                        {test.attempts_count} taken
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-4 pt-0">
                  {test.has_attempted ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTest(test)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTest(test)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Solutions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : test.is_unlocked ? (
                    <button
                      type="button"
                      onClick={() => setActiveTest(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Take Test Now →</span>
                    </button>
                  ) : test.is_free ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStartFree(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Unlocking..." : "Start Free Test →"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUnlockPaid(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Processing..." : `Unlock Test for ₹${test.price_inr} →`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive In-Browser Test Modal */}
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
