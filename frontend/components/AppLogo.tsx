"use client";

import React from "react";

interface AppLogoProps {
  variant?: "row" | "stacked";
  className?: string;
  imgClassName?: string;
  height?: number;
  showBadge?: boolean;
}

/**
 * AppLogo Component
 * Renders Testora Quiz brand logo with dual-mode support (Light & Dark theme)
 * Supports:
 * - variant="row": Horizontal in-row logo (ideal for navbars, headers, sidebars)
 * - variant="stacked": Top-bottom layout with icon on top & text below (ideal for hero, auth, cards)
 */
export default function AppLogo({
  variant = "row",
  className = "",
  imgClassName = "",
  height = 36,
  showBadge = false,
}: AppLogoProps) {
  const lightSrc = variant === "row" ? "/images/logo-row-light.png" : "/images/logo-stacked-light.png";
  const darkSrc = variant === "row" ? "/images/logo-row-dark.png" : "/images/logo-stacked-dark.png";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Light Mode Logo (Dark navy text on transparent background) */}
      <img
        src={lightSrc}
        alt="Testora Quiz"
        style={{ height: `${height}px`, width: "auto" }}
        className={`object-contain block dark:hidden transition-opacity duration-200 ${imgClassName}`}
        draggable={false}
      />
      {/* Dark Mode Logo (White & electric blue text on transparent background) */}
      <img
        src={darkSrc}
        alt="Testora Quiz"
        style={{ height: `${height}px`, width: "auto" }}
        className={`object-contain hidden dark:block transition-opacity duration-200 ${imgClassName}`}
        draggable={false}
      />

      {showBadge && (
        <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E3A8A] dark:bg-blue-900/30 dark:text-[#60A5FA] border border-blue-200/50 dark:border-blue-800/40">
          v2.4
        </span>
      )}
    </div>
  );
}
