"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { role, token, syncFromStorage } = useAuthStore();

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role === "student") {
      router.replace("/dashboard/student");
    } else if (role === "super_admin" || role === "inst_admin") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard/teacher");
    }
  }, [token, role, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Redirecting to your workspace...</span>
      </div>
    </div>
  );
}

