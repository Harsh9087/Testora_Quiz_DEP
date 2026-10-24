"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Receipt,
  Printer
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";

export interface RechargePackage {
  id: string;
  name: string;
  credits: number;
  amount_paise: number;
  formatted_amount: string;
  rate_per_credit: string;
  popular?: boolean;
  badge?: string;
  description: string;
}

interface CreditRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRechargeSuccess?: (newBalance: number) => void;
}

export default function CreditRechargeModal({
  isOpen,
  onClose,
  onRechargeSuccess,
}: CreditRechargeModalProps) {
  const { token, fullName } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("pkg_2200");
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    credits_added: number;
    new_balance: number;
    invoice_number?: string;
    order_id?: string;
  } | null>(null);

  // Load Razorpay standard checkout script dynamically
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

  const fetchBalanceAndPackages = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await apiFetch("/payments/credits/balance", { token });
      if (res.ok) {
        const data = await res.json();
        setCurrentBalance(data.credits_balance || 0);
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
          const popularPkg = data.packages.find((p: RechargePackage) => p.popular);
          if (popularPkg) setSelectedPackageId(popularPkg.id);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || "Unable to load credit wallet details.");
      }
    } catch {
      setErrorMessage("Network error fetching credit recharge packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSuccessInfo(null);
      setErrorMessage(null);
      fetchBalanceAndPackages();
      loadRazorpayScript();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, processing, onClose]);

  if (!isOpen) return null;

  const handleRecharge = async () => {
    if (!selectedPackageId || !token) return;
    const pkg = packages.find((p) => p.id === selectedPackageId);
    if (!pkg) return;

    try {
      setProcessing(true);
      setErrorMessage(null);

      // 1. Create Recharge Order server-side
      const orderRes = await apiFetch("/payments/credits/recharge-order", {
        method: "POST",
        token,
        body: JSON.stringify({ package_id: selectedPackageId }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to initialize recharge order.");
      }

      const orderData = await orderRes.json();
      const scriptLoaded = await loadRazorpayScript();

      const isSimulated =
        orderData.order_id.startsWith("order_rec_") ||
        orderData.key_id === "rzp_test_placeholder" ||
        !orderData.key_id;

      if (isSimulated || !scriptLoaded) {
        // Fallback simulation for local dev
        const userConfirmed = window.confirm(
          `[Razorpay Credit Recharge Simulation]\n\n` +
          `Package: ${orderData.package_name}\n` +
          `Credits to Add: +${orderData.credits_added.toLocaleString()} Credits\n` +
          `Amount: ${orderData.formatted_amount}\n` +
          `Order ID: ${orderData.order_id}\n\n` +
          `Click OK to simulate successful bank payment.`
        );

        if (userConfirmed) {
          await verifyRecharge({
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: `pay_rec_sim_${Date.now()}`,
            razorpay_signature: "simulated_recharge_signature",
          });
        } else {
          setProcessing(false);
        }
        return;
      }

      // 2. Open Razorpay Standard Checkout
      const rzpOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Testora Quiz",
        description: `Prepaid Credit Recharge (${orderData.credits_added} Credits)`,
        order_id: orderData.order_id,
        prefill: {
          name: fullName || orderData.user_name || "Educator",
          email: orderData.user_email || "",
        },
        theme: {
          color: "#C84B18",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
        handler: async (response: any) => {
          await verifyRecharge({
            razorpay_order_id: response.razorpay_order_id || orderData.order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
      };

      const razorpayInstance = new (window as any).Razorpay(rzpOptions);
      razorpayInstance.on("payment.failed", (failResponse: any) => {
        setErrorMessage(
          failResponse.error?.description || "Payment was declined by issuing bank."
        );
        setProcessing(false);
      });
      razorpayInstance.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process recharge order.");
      setProcessing(false);
    }
  };

  const verifyRecharge = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const verifyRes = await apiFetch("/payments/credits/verify-recharge", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.detail || "Payment verification failed.");
      }

      const verifyData = await verifyRes.json();
      setCurrentBalance(verifyData.new_balance);
      setSuccessInfo({
        credits_added: verifyData.credits_added,
        new_balance: verifyData.new_balance,
        invoice_number: verifyData.invoice_number,
        order_id: verifyData.order_id,
      });

      showToast(`+${verifyData.credits_added.toLocaleString()} credits added to your wallet!`, "success");
      if (onRechargeSuccess) {
        onRechargeSuccess(verifyData.new_balance);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Verification error after checkout.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!successInfo?.order_id) return;
    window.open(`${API_V1}/payments/receipt/${successInfo.order_id}/html`, "_blank", "noopener,noreferrer");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!processing) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#181614] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1C1A18]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#242321] dark:text-[#F5F5F4] leading-tight">
                Prepaid Credit Wallet
              </h2>
              <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                Recharge credits to unlock and publish assessments instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4] hover:bg-[#E5E0D8]/40 dark:hover:bg-[#292524] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Current Balance Bar */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Current Available Balance
              </span>
              <div className="text-2xl font-black text-[#242321] dark:text-[#F5F5F4] mt-0.5 flex items-baseline gap-1.5">
                <span>{currentBalance.toLocaleString()}</span>
                <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E]">credits</span>
              </div>
            </div>
            <div className="p-2.5 rounded-full bg-white dark:bg-[#24211E] shadow-sm text-amber-500 border border-amber-200/60 dark:border-amber-900/40">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          {/* Success View */}
          {successInfo ? (
            <div className="py-4 space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#242321] dark:text-[#F5F5F4]">
                  Recharge Verified & Credited!
                </h3>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                  +{successInfo.credits_added.toLocaleString()} credits have been added to your wallet.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#716D67] dark:text-[#A8A29E]">Updated Total Balance:</span>
                  <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                    {successInfo.new_balance.toLocaleString()} Credits
                  </span>
                </div>
                {successInfo.invoice_number && (
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E5E0D8] dark:border-[#292524]">
                    <span className="text-[#716D67] dark:text-[#A8A29E]">Tax Invoice:</span>
                    <span className="font-mono font-medium text-stone-700 dark:text-stone-300">
                      {successInfo.invoice_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#201D1B] hover:bg-stone-50 dark:hover:bg-[#282522] text-[#242321] dark:text-[#F5F5F4] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="h-4 w-4 text-[#C84B18]" />
                  <span>Download / Print Recharge Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C84B18] dark:bg-[#EA580C] hover:opacity-90 text-white text-xs font-bold transition-opacity"
                >
                  Done / Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-6 w-6 text-[#C84B18] animate-spin" />
                  <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">Loading packages...</p>
                </div>
              ) : errorMessage ? (
                <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Notice:</span> {errorMessage}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Select Credit Package
                    </span>
                    <span className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                      1 credit = 1 student attempt
                    </span>
                  </div>

                  {/* Package Cards */}
                  <div className="space-y-2.5">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? "border-[#C84B18] bg-white dark:bg-[#201D1B] shadow-sm ring-1 ring-[#C84B18]/30"
                              : "border-[#E5E0D8] dark:border-[#292524] bg-white/60 dark:bg-[#1E1C1A]/60 hover:border-stone-400 dark:hover:border-stone-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? "border-[#C84B18] bg-[#C84B18]"
                                    : "border-stone-400 dark:border-stone-600"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="font-bold text-xs text-[#242321] dark:text-[#F5F5F4]">
                                {pkg.name}
                              </span>
                              {pkg.badge && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  pkg.popular 
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                }`}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-bold text-[#C84B18] dark:text-[#EA580C]">
                                {pkg.formatted_amount}
                              </div>
                              <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">
                                {pkg.rate_per_credit} / credit
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-[#E5E0D8]/60 dark:border-[#292524]/60 flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              {pkg.credits.toLocaleString()} Credits
                            </span>
                            <span className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                              {pkg.description.split("•")[1] || pkg.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Security notes */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-[#716D67] dark:text-[#A8A29E] pt-2">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Razorpay Verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5 text-stone-500" />
                      <span>Instant Tax Invoice Included</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successInfo && (
          <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-[#292524] bg-white/50 dark:bg-[#181614]/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-xs font-medium text-[#716D67] hover:text-[#242321] dark:hover:text-[#F5F5F4] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading || processing || !selectedPackageId}
              onClick={handleRecharge}
              className="px-5 py-2.5 rounded-xl bg-[#C84B18] dark:bg-[#EA580C] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              {processing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Coins className="h-3.5 w-3.5" />
              )}
              <span>
                {processing ? "Processing..." : `Recharge Now (${packages.find(p => p.id === selectedPackageId)?.formatted_amount || "..."})`}
              </span>
              {!processing && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
