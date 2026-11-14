"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, Coins, ArrowRight, ShieldCheck, CheckCircle2, Gift, Zap } from "lucide-react";

interface WelcomeOfferModalProps {
  onScrollToPricing?: () => void;
}

export default function WelcomeOfferModal({ onScrollToPricing }: WelcomeOfferModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const alreadySeen = localStorage.getItem("testora_welcome_offer_seen_v1");
      if (!alreadySeen) {
        // Show after 1.8 seconds delay so the homepage loads cleanly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("testora_welcome_offer_seen_v1", "true");
    } catch {}
  };

  const handlePricingClick = () => {
    handleClose();
    if (onScrollToPricing) {
      onScrollToPricing();
    } else {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative Top Accent Banner */}
        <div className="relative h-20 sm:h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-5 flex items-center justify-between overflow-hidden">
          {/* Subtle Shimmer Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/25 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
              <Sparkles className="w-3 h-3 fill-slate-950" /> Welcome Bonus
            </span>
            <h2 className="text-base sm:text-lg font-black text-white mt-1 tracking-tight drop-shadow-xs">
              Start with 200 Free Credits!
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close welcome offer modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Create AI-powered assessments, auto-generate question papers from PDFs, and issue tamper-proof verifiable certificates in minutes.
          </p>

          {/* Key Benefit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Card 1: 200 Free Credits */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-blue-950 dark:text-blue-100">
                  200 Free Credits
                </h3>
                <p className="text-[10.5px] text-blue-700 dark:text-blue-300 leading-tight mt-0.5">
                  Instant activation on signup. No credit card required.
                </p>
              </div>
            </div>

            {/* Card 2: ₹999 Master Recharge */}
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold text-amber-950 dark:text-amber-100">
                    ₹999 Master Plan
                  </h3>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 font-extrabold">
                    NEW
                  </span>
                </div>
                <p className="text-[10.5px] text-amber-700 dark:text-amber-300 leading-tight mt-0.5">
                  15,000 Credits (+5,000 Free Bonus) for power educators.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Bullets */}
          <div className="space-y-1.5 pt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>AI Question Paper generation from Syllabus or PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Full Anti-cheating & Live Proctoring dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Blockchain-grade QR verifiable student certificates</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              href="/register"
              onClick={handleClose}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold text-center shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <span>Claim 200 Free Credits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handlePricingClick}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Explore Plans
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Don't show this again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
