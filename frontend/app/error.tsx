"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#121110] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#171615] rounded-3xl border border-[#E5E0D8] dark:border-[#292524] p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-[#242321] dark:text-[#F5F5F4]">
            Something went wrong
          </h1>
          <p className="text-xs text-[#716D67] dark:text-[#A8A29E] leading-relaxed">
            An unexpected error occurred while loading this view. You can reload or return to the home screen.
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
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#716D67] hover:text-[#242321] dark:hover:text-white pt-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

