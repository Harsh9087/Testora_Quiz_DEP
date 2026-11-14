"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

interface FloatingPromoBannerProps {
  onScrollToPricing?: () => void;
}

export default function FloatingPromoBanner({ onScrollToPricing }: FloatingPromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = sessionStorage.getItem("testora_floating_promo_dismissed");
      if (!dismissed) {
        // Show after 4 seconds of reading the page
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    try {
      sessionStorage.setItem("testora_floating_promo_dismissed", "true");
    } catch {}
  };

  const handleClick = () => {
    if (onScrollToPricing) {
      onScrollToPricing();
    } else {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div 
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-purple-500/30 text-white p-3 sm:py-2.5 sm:px-3.5 shadow-xl shadow-purple-950/40 hover:border-purple-400/50 transition-all hover:scale-[1.01]"
      >
        {/* Glow Shimmer */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-500 opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />

        <div className="relative flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white tracking-tight truncate">
                  Master Recharge Offer
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider shrink-0">
                  ₹999
                </span>
              </div>
              <p className="text-[10px] text-purple-200/90 truncate font-medium">
                Get 15,000 Credits (+5,000 Extra Bonus)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white text-indigo-900 group-hover:bg-amber-300 group-hover:text-slate-950 transition-colors flex items-center gap-1 whitespace-nowrap shadow-xs">
              Plans <ArrowRight className="w-3 h-3 inline" />
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

