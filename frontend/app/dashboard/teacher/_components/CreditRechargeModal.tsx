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
  const [bonusCredits, setBonusCredits] = useState<number>(0);
  const [bonusDaysRemaining, setBonusDaysRemaining] = useState<number>(0);
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
        setBonusCredits(data.bonus_credits || 0);
        setBonusDaysRemaining(data.bonus_days_remaining || 0);
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
        const userConfirmed = window.confirm(
          `[Razorpay Credit Recharge Simulation]

` +
          `Package: ${orderData.package_name}
` +
          `Credits to Add: +${orderData.credits_added.toLocaleString()} Credits
` +
          `Amount: ${orderData.formatted_amount}
` +
          `Order ID: ${orderData.order_id}

` +
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
          color: "#2563EB",
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
    window.open(`${API_V1}/payments/receipt/${successInfo.order_id}/html${token ? `?token=${encodeURIComponent(token)}` : ""}`, "_blank", "noopener,noreferrer");
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!processing) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111C31] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#17243A]/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shrink-0">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Prepaid Credit Wallet
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                1 credit = 1 candidate attempt • Instant access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body - flex-1 min-h-0 guarantees scrollability & avoids cutting off footer! */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3 touch-pan-y">
          {/* Compact Current Balance Bar */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-blue-50/50 dark:from-[#172B4D]/50 dark:to-[#17243A] flex items-center justify-between">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Current Available Balance
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 flex items-baseline gap-1.5">
                <span>{currentBalance.toLocaleString()}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">credits</span>
              </div>
              {bonusCredits > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 font-bold">
                    🎁 {bonusCredits.toLocaleString()} Welcome Bonus
                  </span>
                  <span>• Expires in {bonusDaysRemaining}d</span>
                </div>
              )}
            </div>
            <div className="p-2 rounded-full bg-white dark:bg-[#111C31] shadow-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          {/* Success View */}
          {successInfo ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Recharge Verified & Credited!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  +{successInfo.credits_added.toLocaleString()} credits have been added to your wallet.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Updated Total Balance:</span>
                  <span className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400">
                    {successInfo.new_balance.toLocaleString()} Credits
                  </span>
                </div>
                {successInfo.invoice_number && (
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Tax Invoice:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {successInfo.invoice_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Download / Print Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Done / Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2.5">
                  <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading packages...</p>
                </div>
              ) : errorMessage ? (
                <div className="p-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Notice:</span> {errorMessage}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Select Credit Package
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                      1 credit = 1 student attempt
                    </span>
                  </div>

                  {/* Compact High-Density Package Cards */}
                  <div className="space-y-2">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? "border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-slate-400 dark:border-slate-600"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {pkg.name}
                              </span>
                              {pkg.badge && (
                                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  pkg.popular 
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40"
                                }`}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
                                {pkg.formatted_amount}
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                                {pkg.rate_per_credit} / credit
                              </div>
                            </div>
                          </div>

                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                              {pkg.credits.toLocaleString()} Credits
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-none">
                              {pkg.description.split("•")[1]?.trim() || pkg.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Security notes */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1.5">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Razorpay Verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5 text-blue-600" />
                      <span>Instant Tax Invoice</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Footer - Always Visible & Pinned on Mobile & Desktop */}
        {!successInfo && (
          <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111C31]/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg z-20">
            <div className="hidden sm:block">
              {selectedPkg && (
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-medium">Selected Package</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedPkg.credits.toLocaleString()} Credits
                    <span className="text-blue-600 dark:text-blue-400 ml-1.5 font-black">
                      ({selectedPkg.formatted_amount})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading || processing || !selectedPackageId}
                onClick={handleRecharge}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                <span>
                  {processing
                    ? "Processing..."
                    : `Proceed to Pay • ${selectedPkg?.formatted_amount || "Select"}`}
                </span>
                {!processing && <ArrowRight className="h-4 w-4 ml-0.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
