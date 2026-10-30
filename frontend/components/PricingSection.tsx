"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PricingBenefitsInfographic from "./PricingBenefitsInfographic";
import InstitutionalPlanRequestModal from "./InstitutionalPlanRequestModal";
import {
  GraduationCap,
  Building2,
  Database,
  Coins,
  ShieldCheck,
  Users,
  CheckCircle2,
  Zap,
  Send,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Infinity as InfinityIcon,
  Check,
  Loader2,
  Gift,
  Award
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface PricingPlanData {
  id: string;
  plan_code: string;
  name: string;
  plan_type: string;
  price_inr: number;
  price_paise: number;
  formatted_price: string;
  price_subtext?: string;
  base_credits: number;
  bonus_credits: number;
  total_credits: number;
  validity_days?: number | null;
  credits_never_expire: boolean;
  badge?: string;
  is_featured: boolean;
  is_recommended: boolean;
  is_active: boolean;
  display_order: number;
  color_accent: string;
  button_label: string;
  button_action: string;
  description?: string;
  features: string[];
}

// Fallback initial plans ensuring instant zero-delay render
const DEFAULT_PLANS: PricingPlanData[] = [
  {
    id: "default-1",
    plan_code: "teacher_signup_bonus",
    name: "Teacher Signup Bonus",
    plan_type: "FREE_SIGNUP",
    price_inr: 0,
    price_paise: 0,
    formatted_price: "₹0",
    price_subtext: "100% Free",
    base_credits: 0,
    bonus_credits: 200,
    total_credits: 200,
    validity_days: 15,
    credits_never_expire: false,
    badge: "100% Free",
    is_featured: false,
    is_recommended: false,
    is_active: true,
    display_order: 1,
    color_accent: "blue",
    button_label: "Get 200 Free Credits",
    button_action: "signup",
    description: "Start immediately with 200 free promotional credits to test AI assessments.",
    features: [
      "200 candidate question attempts",
      "AI Question Generation (Gemini AI)",
      "Printable Exam Papers with Keys",
      "Online Assessment Tools",
      "Valid for 15 days upon registration"
    ]
  },
  {
    id: "default-2",
    plan_code: "starter_recharge",
    name: "Starter Recharge",
    plan_type: "RECHARGE",
    price_inr: 100,
    price_paise: 10000,
    formatted_price: "₹100",
    price_subtext: "/ 1,000 Credits",
    base_credits: 1000,
    bonus_credits: 0,
    total_credits: 1000,
    validity_days: null,
    credits_never_expire: true,
    badge: "Starter",
    is_featured: false,
    is_recommended: false,
    is_active: true,
    display_order: 2,
    color_accent: "indigo",
    button_label: "Choose Starter Plan",
    button_action: "recharge",
    description: "Affordable credit recharge for individual tutors, weekly tests, and small coaching classes.",
    features: [
      "1,000 candidate question attempts",
      "AI Question Paper Synthesis",
      "Printable Papers & Online Delivery",
      "Purchased credits NEVER expire",
      "Instant Razorpay payment"
    ]
  },
  {
    id: "default-3",
    plan_code: "standard_recharge",
    name: "Standard Recharge",
    plan_type: "RECHARGE",
    price_inr: 199,
    price_paise: 19900,
    formatted_price: "₹199",
    price_subtext: "/ 2,200 Credits",
    base_credits: 2000,
    bonus_credits: 200,
    total_credits: 2200,
    validity_days: null,
    credits_never_expire: true,
    badge: "10% Extra",
    is_featured: true,
    is_recommended: true,
    is_active: true,
    display_order: 3,
    color_accent: "purple",
    button_label: "Get Started",
    button_action: "recharge",
    description: "Our most popular recharge for regular class assessments and midterms for batches of 50–100 students.",
    features: [
      "2,200 candidate question attempts",
      "Includes 200 Bonus Credits (10% extra)",
      "Purchased credits NEVER expire",
      "Tab-Switch Anti-Cheat Proctoring",
      "Performance Gradebook & Analytics"
    ]
  },
  {
    id: "default-4",
    plan_code: "professional_recharge",
    name: "Professional Recharge",
    plan_type: "RECHARGE",
    price_inr: 499,
    price_paise: 49900,
    formatted_price: "₹499",
    price_subtext: "/ 6,000 Credits",
    base_credits: 5000,
    bonus_credits: 1000,
    total_credits: 6000,
    validity_days: null,
    credits_never_expire: true,
    badge: "20% Extra",
    is_featured: false,
    is_recommended: false,
    is_active: true,
    display_order: 4,
    color_accent: "teal",
    button_label: "Choose Professional Plan",
    button_action: "recharge",
    description: "High-capacity package designed for busy college departments and extensive semester examinations.",
    features: [
      "6,000 candidate question attempts",
      "Includes 1,000 Bonus Credits (20% extra)",
      "Purchased credits NEVER expire",
      "Priority AI Document Processing & RAG",
      "Export Gradebook to Excel & CSV"
    ]
  },
  {
    id: "default-5",
    plan_code: "institutional_plan",
    name: "College & FDP Institutional Plan",
    plan_type: "INSTITUTIONAL",
    price_inr: 0,
    price_paise: 0,
    formatted_price: "Custom",
    price_subtext: "/ FDP Vouchers",
    base_credits: 10000,
    bonus_credits: 0,
    total_credits: 10000,
    validity_days: null,
    credits_never_expire: true,
    badge: "Institutional",
    is_featured: false,
    is_recommended: false,
    is_active: true,
    display_order: 5,
    color_accent: "emerald",
    button_label: "Request College Proposal",
    button_action: "institutional_modal",
    description: "Tailored packages with bulk FDP vouchers for affiliated engineering colleges, universities, and institutions.",
    features: [
      "10,000 credits per faculty voucher",
      "Multi-department administration & supervisor analytics",
      "Dedicated onboarding & faculty training support",
      "Custom institution branding on papers & student portal",
      "Super Admin customized institutional quotation"
    ]
  }
];

export default function PricingSection() {
  const router = useRouter();
  const { token, role, fullName } = useAuthStore();
  const [plans, setPlans] = useState<PricingPlanData[]>(DEFAULT_PLANS);
  const [modalOpen, setModalOpen] = useState(false);
  const [processingPlanCode, setProcessingPlanCode] = useState<string | null>(null);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);

  // Load Razorpay checkout script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch dynamic plans from backend
  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const res = await apiFetch("/pricing-plans");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setPlans(data);
          }
        }
      } catch (err) {
        // Fallback silently to DEFAULT_PLANS
      }
    };
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Split into 4 Educator plans and 1 Institutional plan
  const educatorPlans = plans.filter((p) => p.plan_type !== "INSTITUTIONAL" && p.is_active);
  const institutionalPlan =
    plans.find((p) => p.plan_type === "INSTITUTIONAL" && p.is_active) || DEFAULT_PLANS[4];

  // Handle plan button click
  const handlePlanClick = async (plan: PricingPlanData) => {
    if (plan.button_action === "institutional_modal" || plan.plan_type === "INSTITUTIONAL") {
      setModalOpen(true);
      return;
    }

    if (plan.button_action === "signup" || plan.price_inr === 0) {
      router.push("/login?mode=signup");
      return;
    }

    // Paid recharge plan
    if (!token) {
      // Direct guest user to signup and redirect back
      router.push(`/login?mode=signup&redirect=recharge&plan=${plan.plan_code}`);
      return;
    }

    // Authenticated user: trigger direct Razorpay recharge
    try {
      setProcessingPlanCode(plan.plan_code);
      setRechargeSuccess(null);

      const res = await apiFetch("/payments/credits/recharge-order", {
        method: "POST",
        token,
        body: JSON.stringify({ package_id: plan.plan_code })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to initialize payment order.");
      }

      const orderData = await res.json();
      const isScriptLoaded = await loadRazorpayScript();

      const isSimulation =
        orderData.order_id?.startsWith("order_rec_") ||
        orderData.order_id?.startsWith("order_demo_") ||
        orderData.key_id === "rzp_test_placeholder";

      if (isSimulation || !isScriptLoaded) {
        const confirmSim = window.confirm(
          `[Test Mode]\n\nSimulate successful payment for ${plan.name} (${plan.formatted_price})?\n\nOrder ID: ${orderData.order_id}\nCredits to Add: ${plan.total_credits.toLocaleString()}`
        );
        if (confirmSim) {
          const verifyRes = await apiFetch("/payments/credits/verify-recharge", {
            method: "POST",
            token,
            body: JSON.stringify({
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_sim_${Date.now()}`,
              razorpay_signature: "simulated_test_signature"
            })
          });
          if (verifyRes.ok) {
            setRechargeSuccess(`Successfully recharged ${plan.total_credits.toLocaleString()} credits to your wallet!`);
          }
        }
        setProcessingPlanCode(null);
        return;
      }

      // Live Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Testora Quiz",
        description: `Wallet Recharge: ${orderData.package_name} (+${orderData.credits_added} credits)`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.user_name || fullName || "Educator",
          email: orderData.user_email || ""
        },
        theme: {
          color: "#2563EB"
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await apiFetch("/payments/credits/verify-recharge", {
              method: "POST",
              token,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (verifyRes.ok) {
              setRechargeSuccess(`Payment verified! ${orderData.credits_added.toLocaleString()} credits added to your wallet.`);
            }
          } catch (err: any) {
            alert("Payment signature verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanCode(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setProcessingPlanCode(null);
    }
  };

  const getColorClasses = (color: string, isRecommended: boolean) => {
    switch (color) {
      case "blue":
        return {
          border: "border-blue-200/90 dark:border-blue-900/60",
          shadow: "shadow-blue-500/5 hover:shadow-blue-500/15",
          backing: "bg-blue-100/70 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/40",
          iconBg: "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/60",
          priceText: "text-blue-600 dark:text-blue-400",
          badge: "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800",
          btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
        };
      case "indigo":
        return {
          border: "border-indigo-200/90 dark:border-indigo-900/60",
          shadow: "shadow-indigo-500/5 hover:shadow-indigo-500/15",
          backing: "bg-indigo-100/70 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-800/40",
          iconBg: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60",
          priceText: "text-indigo-600 dark:text-indigo-400",
          badge: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800",
          btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
        };
      case "teal":
        return {
          border: "border-teal-200/90 dark:border-teal-900/60",
          shadow: "shadow-teal-500/5 hover:shadow-teal-500/15",
          backing: "bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/40",
          iconBg: "bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/60",
          priceText: "text-teal-600 dark:text-teal-400",
          badge: "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800",
          btn: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20"
        };
      case "purple":
      default:
        return {
          border: isRecommended
            ? "border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20"
            : "border-purple-200/90 dark:border-purple-900/60",
          shadow: "shadow-purple-500/10 hover:shadow-purple-500/20",
          backing: "bg-purple-100/70 dark:bg-purple-950/50 border-purple-200/60 dark:border-purple-800/40",
          iconBg: "bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/60",
          priceText: "text-purple-600 dark:text-purple-400",
          badge: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800",
          btn: "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25"
        };
    }
  };

  return (
    <section
      id="pricing"
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none"
    >
      {/* Background Ambience & Dotted Grid Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-200/35 dark:bg-blue-900/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
        {/* ───────────────────────────────────────────────────────────
            HEADER BLOCK
        ─────────────────────────────────────────────────────────── */}
        <div className="relative text-center max-w-3xl mx-auto space-y-3">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 shadow-xs">
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Transparent Credit Economics</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Simple, Transparent Pricing for{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Every Educator
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Choose the right credit plan for your teaching and assessment needs.
          </p>

          {rechargeSuccess && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{rechargeSuccess}</span>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────
            4 EDUCATOR PRICING CARDS IN A RESPONSIVE ROW
            1-col (<640px), 2-col (640-1024px), 4-col (>=1024px)
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-5 lg:gap-6 items-stretch max-w-7xl mx-auto relative pt-2">
          {educatorPlans.map((plan) => {
            const styling = getColorClasses(plan.color_accent, plan.is_recommended);
            const isProcessing = processingPlanCode === plan.plan_code;

            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-[26px] bg-white dark:bg-slate-900 border ${styling.border} shadow-md ${styling.shadow} hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Layered physical backing sheet */}
                <div
                  className={`absolute -bottom-2 -right-2 w-full h-full rounded-[26px] ${styling.backing} -z-10 group-hover:-bottom-2.5 group-hover:-right-2.5 transition-all`}
                />

                <div className="space-y-4">
                  {/* Header: Icon + Badge + Title + Price */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-1">
                      <div
                        className={`w-11 h-11 rounded-2xl ${styling.iconBg} border flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                      >
                        {plan.price_inr === 0 ? (
                          <Gift className="w-5 h-5" />
                        ) : plan.is_recommended ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <Coins className="w-5 h-5" />
                        )}
                      </div>
                      {plan.badge && (
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${styling.badge}`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`text-3xl sm:text-4xl font-black ${styling.priceText} tracking-tight`}>
                          {plan.formatted_price}
                        </span>
                        {plan.price_subtext && (
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            {plan.price_subtext}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credits & Validity Info Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500">Total Credits:</span>
                      <strong className="font-bold text-slate-900 dark:text-white">
                        {plan.total_credits.toLocaleString()}
                      </strong>
                    </div>
                    {plan.bonus_credits > 0 && (
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                        <span>Includes Bonus:</span>
                        <span>+{plan.bonus_credits.toLocaleString()} Extra</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span>Validity:</span>
                      <span>
                        {plan.credits_never_expire
                          ? "Never Expires"
                          : `${plan.validity_days || 15} Days`}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[32px]">
                      {plan.description}
                    </p>
                  )}

                  {/* Features List */}
                  <ul className="space-y-2 pt-1">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-5 mt-auto">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={isProcessing}
                    className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl ${styling.btn} font-bold text-xs text-center shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.button_label}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────
            PLAN 5: HIGHLIGHTED COLLEGE & FDP INSTITUTIONAL PLAN
        ─────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[28px] bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border-2 border-emerald-400/80 dark:border-emerald-600/80 p-6 sm:p-8 shadow-xl shadow-emerald-500/5 overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Details */}
              <div className="space-y-3.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                    {institutionalPlan.badge || "Institutional Plan"}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    10,000 Credits Per Faculty Voucher
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {institutionalPlan.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {institutionalPlan.description ||
                    "Tailored packages with bulk FDP vouchers for affiliated engineering colleges, universities, and coaching chains. Conduct semester exams, lab assessments, and practice tests across departments."}
                </p>

                {/* Benefits Badges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                    <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>10K Credits / Voucher</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Multi-Department Admin</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Dedicated Onboarding</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom Branding</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Proposal Button */}
              <div className="lg:text-right shrink-0 space-y-3 pt-2 lg:pt-0">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Pricing Model
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    Custom Quote
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tailored per institution &amp; voucher volume
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{institutionalPlan.button_label || "Request College Proposal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            TRANSPARENT CREDIT USAGE EXPLANATION
        ─────────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Transparent Credit Usage
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clear conversion economics and wallet policies with zero hidden surcharges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="block text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                1 Credit = 1 Attempt (₹0.10)
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                1 credit allows 1 candidate to attempt 1 question unit. For example, a 50-student quiz with 20 questions consumes exactly 1,000 credits.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="block text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <InfinityIcon className="w-3.5 h-3.5 text-purple-500" />
                Purchased Credits Never Expire
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                All credits purchased via Starter, Standard, or Professional recharges remain in your account indefinitely with zero monthly expiration lock-ins.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <strong className="block text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Bonus Credit Transparency
              </strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Signup bonus credits (200 credits) are valid for 15 days. Recharge bonuses (+200 on Standard, +1,000 on Professional) are transparently tracked.
              </p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────
            CONNECTED CIRCULAR BENEFITS INFOGRAPHIC
        ─────────────────────────────────────────────────────────── */}
        <div className="pt-2 sm:pt-4 max-w-4xl mx-auto">
          <PricingBenefitsInfographic />
        </div>
      </div>

      <InstitutionalPlanRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultVouchers={25}
      />
    </section>
  );
}
