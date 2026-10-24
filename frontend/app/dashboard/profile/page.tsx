"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function GeneralProfileRedirect() {
  const router = useRouter();
  const { role } = useAuthStore();

  useEffect(() => {
    if (role === "student") {
      router.replace("/dashboard/student/profile");
    } else {
      router.replace("/dashboard/teacher/profile");
    }
  }, [role, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C84B18]" />
    </div>
  );
}
