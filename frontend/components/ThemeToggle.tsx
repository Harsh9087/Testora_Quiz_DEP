"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeToggleProps {
  className?: string;
}

export function applyThemePreference(pref: ThemePreference): "light" | "dark" {
  let effectiveMode: "light" | "dark" = "light";

  if (pref === "dark") {
    effectiveMode = "dark";
  } else if (pref === "light") {
    effectiveMode = "light";
  } else {
    if (typeof window !== "undefined" && window.matchMedia) {
      effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  }

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (effectiveMode === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem("theme_preference", pref);
    localStorage.setItem("theme_mode", effectiveMode);
    localStorage.setItem("theme", effectiveMode);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("testora_theme_changed", {
        detail: { mode: effectiveMode, preference: pref },
      })
    );
  }

  return effectiveMode;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [currentMode, setCurrentMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const savedMode = (localStorage.getItem("theme_mode") ||
      localStorage.getItem("theme") ||
      localStorage.getItem("theme_preference")) as "light" | "dark" | null;

    let initialMode: "light" | "dark" = "light";
    if (savedMode === "dark" || savedMode === "light") {
      initialMode = savedMode;
    } else if (typeof window !== "undefined" && window.matchMedia) {
      initialMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    setCurrentMode(initialMode);
    applyThemePreference(initialMode);

    const handleThemeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.mode) {
        setCurrentMode(detail.mode);
      }
    };

    window.addEventListener("testora_theme_changed", handleThemeEvent);
    return () => {
      window.removeEventListener("testora_theme_changed", handleThemeEvent);
    };
  }, []);

  const handleDirectToggle = () => {
    const nextMode: "light" | "dark" = currentMode === "light" ? "dark" : "light";
    setCurrentMode(nextMode);
    applyThemePreference(nextMode);
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={handleDirectToggle}
      className={`flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#17243A] hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}
      title={`Current: ${currentMode === "dark" ? "Dark Mode" : "Light Mode"}. Click to switch to ${currentMode === "dark" ? "Light Mode" : "Dark Mode"}.`}
      aria-label="Toggle Dark / Light Mode"
    >
      {currentMode === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
