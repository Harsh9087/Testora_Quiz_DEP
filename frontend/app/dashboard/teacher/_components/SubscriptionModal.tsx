"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Loader2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Receipt
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Plan {
  id: string;
  name: string;
  description: string;
  amount: number;
  formatted_price: string;
  currency: string;
  interval: string;
  max_students: number;
  max_exams_per_month: number;
  features: string[];
  popular: boolean;
}

interface PaymentHistory {
  id: string;
  order_type?: string;
  plan_id?: string;
  exam_id?: string;
  exam_name?: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  invoice_number?: string;
  student_count?: number;
  question_count?: number;
  created_at: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { token, fullName } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "history">("plans");
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      fetchHistory();
      loadRazorpayScript();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processingPlanId) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, processingPlanId, onClose]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/payments/plans", { token });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/payments/history", { token });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      setProcessingPlanId(plan.id);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Create order on backend
      const res = await apiFetch("/payments/create-order", {
        method: "POST",
        token,
        body: JSON.stringify({ plan_id: plan.id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Could not create payment order.");
      }

      const orderData = await res.json();
      const isScriptLoaded = await loadRazorpayScript();

      // Check if real Razorpay keys are configured or if operating in simulation mode
      const isSimulation = orderData.order_id.startsWith("order_demo_") || orderData.key_id === "rzp_test_placeholder";

      if (isSimulation || !isScriptLoaded) {
        // Fallback simulation for local development / testing without live keys
        const confirmSim = window.confirm(
          `[Razorpay Test Mode]\n\nSimulate successful payment for ${plan.name} (${plan.formatted_price})?\n\nOrder ID: ${orderData.order_id}`
        );
        if (confirmSim) {
          await verifyPaymentOnBackend(
            orderData.order_id,
            `pay_sim_${Date.now()}`,
            "simulated_test_signature"
          );
        }
        setProcessingPlanId(null);
        return;
      }

      // 2. Open standard Razorpay Checkout Modal
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Testora Quiz",
        description: `Subscription: ${orderData.plan_name}`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.user_name || fullName || "Educator",
          email: orderData.user_email || ""
        },
        theme: {
          color: "#C84B18"
        },
        handler: async (response: any) => {
          await verifyPaymentOnBackend(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during payment.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const verifyPaymentOnBackend = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const res = await apiFetch("/payments/verify-payment", {
        method: "POST",
        token,
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Payment verification failed.");
      }

      const result = await res.json();
      setSuccessMsg(result.message || "Subscription activated successfully!");
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || "Payment verification failed.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!processingPlanId) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FFFFFF] dark:bg-[#171615] rounded-2xl border border-[#E5E0D8] dark:border-[#292524] shadow-2xl overflow-hidden text-[#242321] dark:text-[#F5F5F4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#C84B18]/10 text-[#C84B18] flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Academic Subscription & Razorpay Billing</h2>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                Upgrade your institutional plan to unlock higher limits and AI assessment capabilities.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[#716D67] hover:text-[#242321] hover:bg-[#F0ECE4] dark:hover:bg-[#201D1A] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E5E0D8] dark:border-[#292524] px-6 pt-2 bg-[#FFFFFF] dark:bg-[#171615]">
          <button
            onClick={() => setActiveTab("plans")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "plans"
                ? "border-[#C84B18] text-[#C84B18]"
                : "border-transparent text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4]"
            }`}
          >
            <Zap className="h-4 w-4" />
            Subscription Tiers
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "border-[#C84B18] text-[#C84B18]"
                : "border-transparent text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4]"
            }`}
          >
            <Clock className="h-4 w-4" />
            Payment History ({history.length})
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 flex items-center gap-3 text-green-700 dark:text-green-400 text-xs font-medium">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#716D67]">
              <Loader2 className="h-8 w-8 animate-spin text-[#C84B18] mb-3" />
              <p className="text-xs">Loading available plans...</p>
            </div>
          ) : activeTab === "plans" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                    plan.popular
                      ? "border-[#C84B18] shadow-lg shadow-[#C84B18]/10 bg-gradient-to-b from-[#C84B18]/5 to-transparent dark:from-[#C84B18]/10"
                      : "border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5]/50 dark:bg-[#141312]/50 hover:border-[#C84B18]/50"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#C84B18] text-white shadow-sm tracking-wider">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4]">{plan.name}</h3>
                    <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] mt-1 h-8 line-clamp-2">
                      {plan.description}
                    </p>

                    <div className="mt-4 mb-4 pb-4 border-b border-[#E5E0D8] dark:border-[#292524]">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#242321] dark:text-[#F5F5F4] tracking-tight">
                        {plan.formatted_price}
                      </div>
                      <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                        Billed {plan.interval} via Razorpay
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-[#57534E] dark:text-[#D6D3D1]">
                          <Check className="h-3.5 w-3.5 text-[#C84B18] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingPlanId === plan.id}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      plan.popular
                        ? "bg-[#C84B18] text-white hover:bg-[#B03F13] shadow-[#C84B18]/25"
                        : "bg-[#FFFFFF] dark:bg-[#1F1E1D] text-[#242321] dark:text-[#F5F5F4] border border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18] hover:text-[#C84B18]"
                    }`}
                  >
                    {processingPlanId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        Upgrade with Razorpay
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {history.length === 0 ? (
                <div className="text-center py-12 text-[#716D67]">
                  <CreditCard className="h-10 w-10 mx-auto text-[#A8A29E] mb-2 opacity-60" />
                  <p className="text-xs font-medium">No past payment transactions found.</p>
                </div>
              ) : (
                <div className="border border-[#E5E0D8] dark:border-[#292524] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] dark:bg-[#141312] border-b border-[#E5E0D8] dark:border-[#292524] text-[#716D67] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Item / Description</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Tax Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                      {history.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#1F1E1D]/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {tx.order_type === "EXAM_PAYMENT" ? (
                              <div className="flex flex-col">
                                <span className="text-[#C84B18] font-bold">Assessment License</span>
                                <span className="text-[11px] text-[#716D67]">{tx.exam_name || "Per-Test Payment"}</span>
                              </div>
                            ) : (
                              <span className="capitalize">{tx.plan_id ? tx.plan_id.replace("_", " ") : "Subscription"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            ₹{(tx.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-[#716D67]">
                            <div>{tx.razorpay_order_id}</div>
                            {tx.invoice_number && (
                              <div className="text-[9px] text-stone-500 font-sans">{tx.invoice_number}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === "paid"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                            }`}>
                              {tx.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.status === "paid" && (
                              <a
                                href={`${API_V1}/payments/receipt/${tx.id}/html`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E0D8] dark:border-[#292524] text-[11px] font-semibold text-[#242321] dark:text-[#F5F5F4] hover:bg-[#E5E0D8]/40 dark:hover:bg-[#292524] transition-colors"
                                title="Download Official Tax Invoice PDF/HTML"
                              >
                                <Receipt className="h-3 w-3 text-[#C84B18]" />
                                <span>Invoice</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] text-xs text-[#716D67]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>256-Bit SSL Encrypted Razorpay Payments (UPI, Cards, NetBanking, Wallets)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#FFFFFF] dark:hover:bg-[#1F1E1D] text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
