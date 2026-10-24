"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GuideRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#platform-guide");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors">
      <div className="flex items-center gap-3 bg-white dark:bg-[#111C31] px-5 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] shadow-md">
        <div className="w-4 h-4 rounded-full border-2 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent animate-spin" />
        <span className="font-medium text-xs text-[#111827] dark:text-[#F1F5F9]">Loading User Guide...</span>
      </div>
    </div>
  );
}
