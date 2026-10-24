"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { apiFetch } from "../../lib/api";
import ThemeToggle from "../../components/ThemeToggle";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("Missing reset token in link URL.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMessage(data.detail || "Failed to reset password. Link may be expired.");
      }
    } catch {
      setErrorMessage("Network error processing password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F1F5F9] flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        
        <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0] dark:border-[#263449]">
          <div className="p-2.5 bg-[#EFF6FF] dark:bg-[#172B4D] text-[#2563EB] dark:text-[#60A5FA] rounded-xl border border-[#2563EB]/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">Set New Password</h1>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">Testora Quiz Account Password Recovery</p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">Password Reset Complete!</h2>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">Your account password has been updated successfully. You can now sign in with your new password.</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-2 mt-4 shadow-md transition-all cursor-pointer"
            >
              <span>Return to Login</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                Warning: No reset token detected in link parameters.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6]">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#A3B1C6]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
