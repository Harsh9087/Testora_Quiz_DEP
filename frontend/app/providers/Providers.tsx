"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { ToastProvider } from "../../components/Toast";
import { usePreferenceStore } from "../../store/preferenceStore";
import { useAuthStore } from "../../store/authStore";

function PreferenceInitializer() {
  const { token } = useAuthStore();
  const { fetchFromBackend, applyToDom, theme } = usePreferenceStore();

  useEffect(() => {
    // 1. Initial application to DOM
    applyToDom();

    // 2. Fetch remote preferences if authenticated
    fetchFromBackend(token);
  }, [token]);

  useEffect(() => {
    // Dynamic system theme listener
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const currentTheme = usePreferenceStore.getState().theme;
      if (currentTheme === "system") {
        applyToDom();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PreferenceInitializer />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
