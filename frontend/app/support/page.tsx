"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SupportPage from "../dashboard/support/page";

export default function PublicSupportPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
      {/* Top Public Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Testora Quiz
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </header>

      {/* Render the full Support Component */}
      <SupportPage />
    </div>
  );
}

