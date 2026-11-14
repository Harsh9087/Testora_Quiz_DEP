"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Teacher Dashboard Error Boundary caught error:", error);
  }, [error]);

  const handleClearDraftAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("testora_create_assessment_draft");
      }
    } catch (e) {
      console.warn("Could not clear localStorage draft:", e);
    }
    reset();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#121110] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#171615] rounded-3xl border border-[#E5E0D8] dark:border-[#292524] p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-[#242321] dark:text-[#F5F5F4]">
            Teacher Portal Recovery
          </h1>
          <p className="text-xs text-[#716D67] dark:text-[#A8A29E] leading-relaxed">
            A temporary client issue occurred while loading the teacher portal.
            You can clear any saved draft and reload cleanly below.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl text-left overflow-x-auto truncate">
              {error.message}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleClearDraftAndReload}
            className="w-full py-3 px-4 rounded-xl bg-[#C84B18] hover:bg-[#B33E0F] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Saved Draft & Reload Portal</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#201E1C] dark:hover:bg-[#282624] text-[#242321] dark:text-[#F5F5F4] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#716D67] hover:text-[#242321] dark:hover:text-white pt-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

