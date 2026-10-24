"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export function applyThemePreference(pref: ThemePreference): "light" | "dark" {
  let effectiveMode: "light" | "dark" = "light";

  if (pref === "dark") {
    effectiveMode = "dark";
  } else if (pref === "light") {
    effectiveMode = "light";
  } else {
    // System default
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

export default function ThemeToggle({ className = "", showDropdown = true }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [currentMode, setCurrentMode] = useState<"light" | "dark">("light");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedPref = (localStorage.getItem("theme_preference") ||
      localStorage.getItem("theme_mode") ||
      "system") as ThemePreference;
    setPreference(savedPref);

    const isSystemDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialMode =
      savedPref === "dark" ? "dark" : savedPref === "light" ? "light" : isSystemDark ? "dark" : "light";
    setCurrentMode(initialMode);

    // Listener for system preference changes when on "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentPref = localStorage.getItem("theme_preference");
      if (currentPref === "system" || !currentPref) {
        const newMode = e.matches ? "dark" : "light";
        setCurrentMode(newMode);
        applyThemePreference("system");
      }
    };

    // Listener for cross-component theme changes
    const handleThemeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.mode) setCurrentMode(detail.mode);
        if (detail.preference) setPreference(detail.preference);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    window.addEventListener("testora_theme_changed", handleThemeEvent);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener("testora_theme_changed", handleThemeEvent);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (pref: ThemePreference) => {
    setPreference(pref);
    const newMode = applyThemePreference(pref);
    setCurrentMode(newMode);
    setIsOpen(false);
  };

  const handleQuickToggle = () => {
    if (!showDropdown) {
      const nextMode = currentMode === "light" ? "dark" : "light";
      handleSelect(nextMode);
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Primary Toggle Button */}
      <button
        type="button"
        onClick={handleQuickToggle}
        className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#17243A] hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        title={`Current Theme: ${currentMode === "dark" ? "Dark Mode" : "Light Mode"} (${preference === "system" ? "System Default" : "Explicit"}). Click to change.`}
        aria-label="Theme Settings"
        aria-expanded={isOpen}
      >
        {currentMode === "dark" ? (
          <Moon className="w-4 h-4 text-blue-400 animate-in fade-in zoom-in-75 duration-200" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 animate-in fade-in zoom-in-75 duration-200" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111C31] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-[#263449]">
            Theme Appearance
          </div>

          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => handleSelect("light")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                preference === "light"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#17243A]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </div>
              {preference === "light" && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("dark")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                preference === "dark"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#17243A]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark Mode</span>
              </div>
              {preference === "dark" && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("system")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                preference === "system"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#17243A]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>System Default</span>
              </div>
              {preference === "system" && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
