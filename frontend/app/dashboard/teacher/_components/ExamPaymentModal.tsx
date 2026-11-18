"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Receipt, 
  Calculator, 
  Users, 
  BookOpen, 
  ArrowRight, 
  RefreshCw, 
  Lock, 
  Clock, 
  ExternalLink,
  ChevronRight,
  FileText,
  Coins,
  Zap,
  Wallet
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";

interface ExamBillPreview {
  exam_id: string;
  exam_name: string;
  exam_code?: string;
  student_count: number;
  question_count: number;
  billable_units: number;
  rate_per_unit_paise: number;
  rate_per_unit_formatted?: string;
  rate_per_unit_inr?: number;
  subtotal_paise: number;
  subtotal_formatted?: string;
  gst_percentage?: number;
  tax_percentage?: number;
  tax_paise: number;
  tax_formatted?: string;
  total_paise: number;
  total_formatted?: string;
  formatted_amount?: string;
  currency: string;
  is_paid: boolean;
  can_publish: boolean;
  needs_additional_payment: boolean;
  additional_amount_due_paise: number;
  additional_amount_due_formatted?: string;
  paid_student_count: number;
  paid_question_count: number;
  paid_amount_paise: number;
  paid_amount_formatted?: string;
  payment_status: string;

  // Prepaid Credit Wallet fields
  user_credits_balance: number;
  credits_required: number;
  has_sufficient_credits: boolean;
  can_pay_with_credits: boolean;
}

interface ExamPaymentModalProps {
  isOpen: boolean;
  exam: any | null;
  onClose: () => void;
  onPaymentSuccess?: (examId: string) => void;
  onAutoPublish?: (examId: string) => void;
  onOpenRecharge?: () => void;
}

type ModalState = "PREVIEW" | "CHECKOUT" | "VERIFYING" | "SUCCESS" | "FAILED";
type PaymentMethod = "CREDITS" | "RAZORPAY";

export default function ExamPaymentModal({
  isOpen,
  exam,
  onClose,
  onPaymentSuccess,
  onAutoPublish,
  onOpenRecharge,
}: ExamPaymentModalProps) {
  const { token, fullName } = useAuthStore();
  const { showToast } = useToast();

  const [modalState, setModalState] = useState<ModalState>("PREVIEW");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDITS");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);
  const [isPayingWithCredits, setIsPayingWithCredits] = useState<boolean>(false);
  const [preview, setPreview] = useState<ExamBillPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    invoice_number?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    amount_paid_formatted?: string;
    order_db_id?: string;
  } | null>(null);
  const [isPublishingNow, setIsPublishingNow] = useState<boolean>(false);

  const formatCurrency = (paise?: number, formatted?: string) => {
    if (formatted && formatted.trim() && formatted !== "₹" && !formatted.includes("undefined")) {
      return formatted;
    }
    if (paise !== undefined && paise !== null) {
      return `₹${(paise / 100).toFixed(2)}`;
    }
    return "₹0.00";
  };

  // Dynamically load Razorpay standard checkout script if not present
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

  const fetchBillPreview = async () => {
    if (!exam || !token) return;
    try {
      setLoadingPreview(true);
      setErrorMessage(null);
      const res = await apiFetch(`/payments/exam/${exam.id}/preview`, { token });
      if (res.ok) {
        const data: ExamBillPreview = await res.json();
        setPreview(data);

        // Intelligently default to CREDITS if the educator has sufficient credits
        if (data.has_sufficient_credits || (data.user_credits_balance > 0 && data.user_credits_balance >= data.credits_required)) {
          setPaymentMethod("CREDITS");
        } else {
          setPaymentMethod("RAZORPAY");
        }

        if (data.is_paid && !data.needs_additional_payment) {
          setSuccessData({
            invoice_number: `INV-${exam.exam_code || "TEST"}`,
            razorpay_order_id: "PREVIOUSLY_SETTLED",
            razorpay_payment_id: "PAID",
            amount_paid_formatted: formatCurrency(data.paid_amount_paise, data.paid_amount_formatted),
            order_db_id: exam.id,
          });
          setModalState("SUCCESS");
        } else {
          setModalState("PREVIEW");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || "Unable to calculate billing metrics.");
      }
    } catch {
      setErrorMessage("Network error fetching payment preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen && exam) {
      setModalState("PREVIEW");
      setSuccessData(null);
      setErrorMessage(null);
      fetchBillPreview();
      loadRazorpayScript();
    }
  }, [isOpen, exam?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalState !== "VERIFYING" && !isPublishingNow) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, modalState, isPublishingNow, onClose]);

  if (!isOpen || !exam) return null;

  const handleInitiatePayment = async () => {
    if (!exam || !token) return;
    try {
      setModalState("CHECKOUT");
      setErrorMessage(null);

      // 1. Create order on backend
      const orderRes = await apiFetch(`/payments/exam/${exam.id}/create-order`, {
        method: "POST",
        token,
        body: JSON.stringify({ exam_id: exam.id }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to initialize payment gateway order.");
      }

      const orderData = await orderRes.json();
      const scriptLoaded = await loadRazorpayScript();

      const isSimulated =
        orderData.order_id?.startsWith("order_sim_") ||
        orderData.key_id === "rzp_test_placeholder" ||
        !orderData.key_id;

      if (isSimulated || !scriptLoaded) {
        const userConfirmed = window.confirm(
          `[Razorpay Mock Checkout Simulation]\n\n` +
          `Order ID: ${orderData.order_id}\n` +
          `Assessment: ${orderData.exam_name}\n` +
          `Amount: ${orderData.formatted_amount || formatCurrency(orderData.amount)}\n\n` +
          `Click OK to simulate successful card/UPI payment.`
        );

        if (userConfirmed) {
          await verifyPaymentOnBackend(
            {
              exam_id: exam.id,
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_sim_${Date.now()}`,
              razorpay_signature: "simulated_secure_signature",
            },
            orderData
          );
        } else {
          setModalState("PREVIEW");
        }
        return;
      }

      // 2. Open standard Razorpay Checkout Modal
      const rzpOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Testora Quiz",
        description: `Assessment License: ${exam.name}`,
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
            setModalState("PREVIEW");
          },
        },
        handler: async (response: any) => {
          await verifyPaymentOnBackend(
            {
              exam_id: exam.id,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            orderData
          );
        },
      };

      const razorpayInstance = new (window as any).Razorpay(rzpOptions);
      razorpayInstance.on("payment.failed", (failResponse: any) => {
        setErrorMessage(
          failResponse.error?.description || "Payment was declined by issuing bank."
        );
        setModalState("FAILED");
      });
      razorpayInstance.open();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout initialization.");
      setModalState("FAILED");
    }
  };

  const verifyPaymentOnBackend = async (
    verificationPayload: {
      exam_id: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    orderData: any
  ) => {
    try {
      setModalState("VERIFYING");
      const res = await apiFetch("/payments/exam/verify-payment", {
        method: "POST",
        token,
        body: JSON.stringify(verificationPayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Cryptographic payment verification failed.");
      }

      const verifyData = await res.json();
      setSuccessData({
        invoice_number: verifyData.invoice_number || `INV-${exam.exam_code}`,
        razorpay_order_id: verificationPayload.razorpay_order_id,
        razorpay_payment_id: verificationPayload.razorpay_payment_id,
        amount_paid_formatted: orderData.formatted_amount || formatCurrency(orderData.amount),
        order_db_id: verifyData.order_id,
      });

      setModalState("SUCCESS");
      showToast("Payment verified and assessment unlocked successfully!", "success");

      // Broadcast event so UI updates immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
        window.dispatchEvent(new Event("refresh-sidebar-stats"));
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(exam.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment verification failed. Please try again.");
      setModalState("FAILED");
    }
  };

  const handlePayWithCredits = async () => {
    if (!exam || !token || !preview) return;
    try {
      setIsPayingWithCredits(true);
      setErrorMessage(null);
      const res = await apiFetch(`/payments/exam/${exam.id}/pay-with-credits`, {
        method: "POST",
        token,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to deduct credits for assessment.");
      }

      const data = await res.json();
      setSuccessData({
        invoice_number: data.invoice_number,
        razorpay_order_id: `Wallet Deduction (${data.credits_deducted} Credits)`,
        razorpay_payment_id: "PREPAID_CREDIT_WALLET",
        amount_paid_formatted: `${data.credits_deducted.toLocaleString()} Credits`,
        order_db_id: data.invoice_number,
      });

      setModalState("SUCCESS");
      showToast(data.message || "Assessment unlocked successfully using prepaid credits!", "success");

      // Immediately notify dashboard to refresh header credits balance counter!
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
        window.dispatchEvent(new Event("refresh-sidebar-stats"));
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(exam.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to pay with credits. Please check your balance or recharge.");
      setModalState("FAILED");
    } finally {
      setIsPayingWithCredits(false);
    }
  };

  const handlePrintReceipt = (orderIdOrDbId?: string) => {
    const idToUse = orderIdOrDbId || successData?.order_db_id || successData?.razorpay_order_id;
    if (!idToUse) return;
    const receiptUrl = `${API_V1}/payments/receipt/${idToUse}/html${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(receiptUrl, "_blank", "noopener,noreferrer");
  };

  const handlePublishNow = async () => {
    if (!exam || !token) return;
    setIsPublishingNow(true);
    try {
      const res = await apiFetch(`/exams/${exam.id}/publish`, { token, method: "POST" });
      if (res.ok) {
        showToast("Assessment published successfully! Students can now attempt.", "success");
        if (onAutoPublish) onAutoPublish(exam.id);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to publish assessment.", "error");
      }
    } catch {
      showToast("Network error publishing assessment.", "error");
    } finally {
      setIsPublishingNow(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => {
        if (!isPublishingNow) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111C31] border-t sm:border border-[#E2E8F0] dark:border-[#263449] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90vh] animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F1F5F9] leading-tight truncate">
                Assessment Billing &amp; Unlock
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-[#A3B1C6] truncate">
                Prepaid Credits or Razorpay Per-Test Licensing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {/* STATE 1: PREVIEW & ITEMIZED INVOICE */}
          {modalState === "PREVIEW" && (
            <>
              {/* Exam Info Card */}
              <div className="p-2.5 sm:p-3 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    ASSESSMENT TARGET
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    {exam.exam_code}
                  </span>
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-[#111827] dark:text-[#F1F5F9] mt-1 line-clamp-1">
                  {exam.name}
                </h3>
              </div>

              {loadingPreview ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-xs text-slate-500">
                    Calculating billable units based on enrolled roster...
                  </p>
                </div>
              ) : errorMessage ? (
                <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Billing Calculation Notice</span>
                  </div>
                  <p className="text-xs">{errorMessage}</p>
                  <button
                    onClick={fetchBillPreview}
                    className="text-xs underline font-medium hover:opacity-80 cursor-pointer pt-1"
                  >
                    Retry Calculation
                  </button>
                </div>
              ) : preview ? (
                <>
                  {/* Billable Formula Metric Card */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Billing Formula</span>
                      </div>
                      <span className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                        students × questions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-[#E2E8F0] dark:border-[#263449] text-center">
                      <div className="bg-white dark:bg-[#111C31] p-1.5 sm:p-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449]">
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" /> Students
                        </div>
                        <div className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F1F5F9] mt-0.5">
                          {preview.student_count}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#111C31] p-1.5 sm:p-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449]">
                        <div className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] flex items-center justify-center gap-1">
                          <BookOpen className="h-3 w-3" /> Questions
                        </div>
                        <div className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#F1F5F9] mt-0.5">
                          {preview.question_count}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#111C31] p-1.5 sm:p-2 rounded-lg border border-blue-500/40">
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          Total Units
                        </div>
                        <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          {preview.billable_units}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                      <span>Rate per attempt unit:</span>
                      <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">
                        {formatCurrency(preview.rate_per_unit_paise, preview.rate_per_unit_formatted)}
                      </span>
                    </div>
                  </div>

                  {/* Top-Up Alert if configuration was expanded */}
                  {preview.needs_additional_payment && (
                    <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Assessment Configuration Expanded</span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        This test was previously paid for {preview.paid_student_count} students × {preview.paid_question_count} questions.
                        Additional candidates were added. Delta top-up: {formatCurrency(preview.additional_amount_due_paise, preview.additional_amount_due_formatted)}.
                      </p>
                    </div>
                  )}

                  {/* Payment Method Selector: Prepaid Credits vs Direct Razorpay */}
                  <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-[#17243A] p-1 border border-[#E2E8F0] dark:border-[#263449] gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CREDITS")}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "CREDITS"
                          ? "bg-white dark:bg-[#111C31] text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/20"
                          : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Prepaid Credits ({(preview.user_credits_balance ?? 0).toLocaleString()})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("RAZORPAY")}
                      className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "RAZORPAY"
                          ? "bg-white dark:bg-[#111C31] text-blue-600 dark:text-blue-400 shadow-xs border border-blue-500/20"
                          : "text-[#64748B] dark:text-[#A3B1C6] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Direct Pay ({formatCurrency(preview.total_paise, preview.total_formatted)})</span>
                    </button>
                  </div>

                  {/* TAB 1: PREPAID CREDITS BILLING (DEFAULT) */}
                  {paymentMethod === "CREDITS" && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-[#64748B] dark:text-[#A3B1C6]">
                        <span>Credits Required to Unlock:</span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {preview.credits_required.toLocaleString()} Credits
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#64748B] dark:text-[#A3B1C6]">
                        <span>Your Current Balance:</span>
                        <span className="font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          {preview.user_credits_balance.toLocaleString()} Credits
                        </span>
                      </div>

                      <div className="border-t border-amber-200/60 dark:border-amber-900/40 pt-2 flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-200">Balance After Unlock:</span>
                        <span className={`font-bold ${
                          preview.has_sufficient_credits 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {preview.has_sufficient_credits
                            ? `${(preview.user_credits_balance - preview.credits_required).toLocaleString()} Credits`
                            : "Insufficient Credits"}
                        </span>
                      </div>

                      {!preview.has_sufficient_credits && (
                        <div className="p-2.5 rounded-lg bg-red-100/80 dark:bg-red-950/50 text-red-700 dark:text-red-300 flex items-center justify-between text-[11px] gap-2">
                          <span>Short by {(preview.credits_required - preview.user_credits_balance).toLocaleString()} credits.</span>
                          {onOpenRecharge && (
                            <button
                              type="button"
                              onClick={onOpenRecharge}
                              className="font-bold underline text-red-800 dark:text-red-200 hover:opacity-80 cursor-pointer shrink-0"
                            >
                              Recharge Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DIRECT RAZORPAY BILLING */}
                  {paymentMethod === "RAZORPAY" && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#64748B] dark:text-[#A3B1C6]">
                        <span>Subtotal ({preview.billable_units} units @ {formatCurrency(preview.rate_per_unit_paise, preview.rate_per_unit_formatted)})</span>
                        <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
                          {formatCurrency(preview.subtotal_paise, preview.subtotal_formatted)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[#64748B] dark:text-[#A3B1C6]">
                        <span>Applicable GST ({preview.gst_percentage ?? preview.tax_percentage ?? 18}%)</span>
                        <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
                          +{formatCurrency(preview.tax_paise, preview.tax_formatted)}
                        </span>
                      </div>

                      {preview.paid_amount_paise > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Already Paid Credit</span>
                          <span className="font-medium">
                            -{formatCurrency(preview.paid_amount_paise, preview.paid_amount_formatted)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold border-t border-[#E2E8F0] dark:border-[#263449] pt-2 text-[#111827] dark:text-[#F1F5F9]">
                        <span>Total Amount Payable</span>
                        <span className="text-sm sm:text-base text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            preview.needs_additional_payment ? preview.additional_amount_due_paise : preview.total_paise,
                            preview.needs_additional_payment ? preview.additional_amount_due_formatted : preview.total_formatted
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Security Assurance Badges */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-0.5">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Razorpay Certified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-blue-600" />
                      <span>HMAC-SHA256 Verified</span>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* STATE 2: CHECKOUT LOADING */}
          {modalState === "CHECKOUT" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
                <CreditCard className="h-5 w-5 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Opening Payment Gateway
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Connecting to secure Razorpay portal. Complete payment in popup window.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: VERIFYING PAYMENT */}
          {modalState === "VERIFYING" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <ShieldCheck className="h-5 w-5 text-emerald-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Verifying Cryptographic Signature
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Authenticating server-side HMAC-SHA256 signature and unlocking assessment credentials...
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS */}
          {modalState === "SUCCESS" && successData && (
            <div className="py-3 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Payment Verified &amp; Assessment Unlocked!
                </h3>
                <p className="text-xs text-slate-500">
                  Your test is licensed. You can now publish live, dispatch candidate emails, or generate passcodes.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Tax Invoice / Receipt:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {successData.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {successData.amount_paid_formatted}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {successData.razorpay_order_id}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Success */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt()}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-600" />
                  <span>Download / Print Invoice</span>
                </button>

                <button
                  type="button"
                  disabled={isPublishingNow}
                  onClick={handlePublishNow}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isPublishingNow ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Publish Live to Students Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: FAILED */}
          {modalState === "FAILED" && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Payment Failed or Interrupted
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {errorMessage || "The transaction could not be completed. No charges were captured."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalState("PREVIEW")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Review Bill
                </button>
                <button
                  type="button"
                  onClick={paymentMethod === "CREDITS" ? handlePayWithCredits : handleInitiatePayment}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Retry Payment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (PREVIEW state) */}
        {modalState === "PREVIEW" && (
          <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-t border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC]/90 dark:bg-[#17243A]/90 shrink-0 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>

            {paymentMethod === "CREDITS" ? (
              preview?.has_sufficient_credits ? (
                <button
                  type="button"
                  disabled={loadingPreview || !!errorMessage || !preview || isPayingWithCredits}
                  onClick={handlePayWithCredits}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  {isPayingWithCredits ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Coins className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPayingWithCredits ? "Deducting..." : `Deduct ${preview.credits_required.toLocaleString()} Credits & Unlock`}
                  </span>
                  {!isPayingWithCredits && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenRecharge}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>Recharge Wallet Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={loadingPreview || !!errorMessage || !preview}
                onClick={handleInitiatePayment}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <span>
                  Pay {formatCurrency(
                    preview?.needs_additional_payment ? preview.additional_amount_due_paise : preview?.total_paise,
                    preview?.needs_additional_payment ? preview.additional_amount_due_formatted : preview?.total_formatted
                  )} &amp; Unlock
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {modalState === "SUCCESS" && (
          <div className="px-4 py-2.5 border-t border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] shrink-0 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
