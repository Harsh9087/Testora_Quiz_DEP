"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Printer,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Columns,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Zap,
  Database,
} from "lucide-react";

export default function ArchitectureCapabilitiesCarousel() {
  // Default focused card is Paper Studio (index 1)
  const [activeIndex, setActiveIndex] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + 4) % 4);
  };

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % 4);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
    setTouchStartX(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prevCard();
    if (e.key === "ArrowRight") nextCard();
  };

  // Compute 3D perspective transform per card based on shortest cyclic offset
  const getCardTransformClasses = (index: number) => {
    let offset = index - activeIndex;
    if (offset > 2) offset -= 4;
    if (offset < -1) offset += 4;

    if (offset === 0) {
      // Focused Center Card
      return {
        className:
          "z-30 opacity-100 scale-100 translate-x-0 rotate-y-0 pointer-events-auto cursor-default shadow-2xl shadow-purple-500/20",
        style: {
          transform: "translate(-50%, -50%) translateZ(0px) scale(1) rotateY(0deg)",
        },
      };
    } else if (offset === -1) {
      // Left Adjacent Card (tilted inward towards center)
      return {
        className:
          "z-20 opacity-90 scale-[0.88] pointer-events-auto cursor-pointer hover:opacity-100 transition-all shadow-xl shadow-slate-900/10",
        style: {
          transform:
            "translate(calc(-50% - min(54vw, 225px)), -50%) translateZ(-35px) scale(0.88) rotateY(24deg)",
        },
      };
    } else if (offset === 1) {
      // Right Adjacent Card (tilted inward towards center)
      return {
        className:
          "z-20 opacity-90 scale-[0.88] pointer-events-auto cursor-pointer hover:opacity-100 transition-all shadow-xl shadow-slate-900/10",
        style: {
          transform:
            "translate(calc(-50% + min(54vw, 225px)), -50%) translateZ(-35px) scale(0.88) rotateY(-24deg)",
        },
      };
    } else if (offset === 2) {
      // Far Right Card (behind adjacent right)
      return {
        className:
          "z-10 opacity-75 scale-[0.78] pointer-events-auto cursor-pointer hover:opacity-90 transition-all shadow-md shadow-slate-900/5",
        style: {
          transform:
            "translate(calc(-50% + min(88vw, 385px)), -50%) translateZ(-85px) scale(0.78) rotateY(-32deg)",
        },
      };
    } else {
      // Far Left Card (behind adjacent left)
      return {
        className:
          "z-10 opacity-75 scale-[0.78] pointer-events-auto cursor-pointer hover:opacity-90 transition-all shadow-md shadow-slate-900/5",
        style: {
          transform:
            "translate(calc(-50% - min(88vw, 385px)), -50%) translateZ(-85px) scale(0.78) rotateY(32deg)",
        },
      };
    }
  };

  const cards = [
    {
      id: "ai-question",
      number: "01",
      name: "AI Question Generation",
      accent: "blue",
      pillActiveColor: "bg-blue-600",
      badgeText: "Gemini API",
    },
    {
      id: "paper-studio",
      number: "02",
      name: "Paper Studio (PDFs)",
      accent: "purple",
      pillActiveColor: "bg-purple-600",
      badgeText: "Print Ready",
    },
    {
      id: "question-bank",
      number: "03",
      name: "Question Bank Studio",
      accent: "emerald",
      pillActiveColor: "bg-emerald-600",
      badgeText: "Reusable",
    },
    {
      id: "proctoring-radar",
      number: "04",
      name: "Proctoring Radar",
      accent: "rose",
      pillActiveColor: "bg-rose-500",
      badgeText: "Exam Security",
    },
  ];

  return (
    <section
      id="features"
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-[#F3F8FF] via-white to-[#F0F6FF] dark:from-[#070D1B] dark:via-[#0A1022] dark:to-[#070D1B] border-y border-slate-200/60 dark:border-slate-800/60 scroll-mt-20 select-none"
    >
      {/* Background Ambience & Dotted Matrix Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -left-20 top-1/4 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-200/35 dark:bg-blue-900/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 top-1/3 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-3xl pointer-events-none" />

      {/* Dotted Matrix Grids in Corners */}
      <div className="absolute top-12 left-4 sm:left-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />
      <div className="absolute top-12 right-4 sm:right-10 w-24 h-24 bg-[radial-gradient(#93C5FD_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 pointer-events-none hidden sm:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Header Block */}
        <div className="relative text-center max-w-3xl mx-auto space-y-3">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>CORE ARCHITECTURE SUMMARY</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Comprehensive Assessment <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Capabilities
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 font-normal max-w-xl mx-auto pt-1 leading-relaxed">
            From textbook-based AI generation to printable PDFs and multi-campus governance.
          </p>
        </div>

        {/* 3D Side-Angle Perspective Carousel Stage */}
        <div
          className="relative w-full max-w-5xl mx-auto h-[530px] sm:h-[570px] md:h-[600px] flex items-center justify-center overflow-hidden [perspective:1100px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Comprehensive Assessment Capabilities Carousel"
        >
          {/* Left Navigation Arrow */}
          <button
            type="button"
            onClick={prevCard}
            aria-label="Previous capability card"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            onClick={nextCard}
            aria-label="Next capability card"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* ───────────────────────────────────────────────────────────
              CARD 01: AI Question Generation (Blue Accent)
          ─────────────────────────────────────────────────────────── */}
          <div
            onClick={() => activeIndex !== 0 && setActiveIndex(0)}
            style={getCardTransformClasses(0).style}
            className={`absolute top-1/2 left-1/2 w-[285px] sm:w-[325px] md:w-[350px] lg:w-[370px] flex flex-col justify-between p-6 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-900/60 transition-all duration-500 ease-out will-change-transform ${
              getCardTransformClasses(0).className
            }`}
          >
            {/* Layered physical backing sheet */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-blue-100/80 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 -z-10" />

            <div className="space-y-4">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
                  01
                </span>
                <div className="w-11 h-11 rounded-2xl bg-blue-50/90 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  AI Question <br />Generation
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Generate MCQs, numericals, and subjective questions mapped to Bloom&apos;s Taxonomy.
                </p>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Bloom&apos;s levels</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Math formulas</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>PDF &amp; DOCX upload</span>
                </li>
              </ul>
            </div>

            {/* Bottom Action Link */}
            <div className="pt-6">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/link"
              >
                <span>Try Generator</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              CARD 02: Paper Studio (PDFs) (Purple Focal Card)
              Features top-right fold, purple gradient button, icon rows
          ─────────────────────────────────────────────────────────── */}
          <div
            onClick={() => activeIndex !== 1 && setActiveIndex(1)}
            style={getCardTransformClasses(1).style}
            className={`absolute top-1/2 left-1/2 w-[285px] sm:w-[325px] md:w-[350px] lg:w-[370px] flex flex-col justify-between p-6 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border-2 border-purple-400/90 dark:border-purple-500/80 transition-all duration-500 ease-out will-change-transform ${
              getCardTransformClasses(1).className
            }`}
          >
            {/* Top-Right Paper Peel / Folded Corner */}
            <div className="absolute -top-px -right-px w-9 h-9 pointer-events-none overflow-hidden rounded-tr-[26px]">
              <div
                className="absolute top-0 right-0 w-9 h-9 bg-gradient-to-bl from-purple-500 via-indigo-600 to-purple-700 shadow-sm"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
            </div>

            {/* Translucent Violet Flap Layer */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-purple-200/70 dark:bg-purple-950/60 border border-purple-300/60 dark:border-purple-800/50 -z-10" />

            <div className="space-y-4">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center">
                    02
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
                    Print Ready
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50/90 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Paper Studio (PDFs)
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Export printable offline question papers with custom institution headers, section divisions, and separate answer keys.
                </p>
              </div>

              {/* 3 Compact Feature Rows with Icons */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                      Custom headers
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add college logo, name and branding
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                      Separate answer keys
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Auto-generate keys and rubrics
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                      Multi-column layouts
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Print-friendly PDF formats
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Focal Full-Width Purple CTA Button */}
            <div className="pt-6">
              <Link
                href="/login?mode=signup"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span>Generate PDF</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              CARD 03: Question Bank Studio (Emerald Accent)
          ─────────────────────────────────────────────────────────── */}
          <div
            onClick={() => activeIndex !== 2 && setActiveIndex(2)}
            style={getCardTransformClasses(2).style}
            className={`absolute top-1/2 left-1/2 w-[285px] sm:w-[325px] md:w-[350px] lg:w-[370px] flex flex-col justify-between p-6 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-900/60 transition-all duration-500 ease-out will-change-transform ${
              getCardTransformClasses(2).className
            }`}
          >
            {/* Layered physical backing sheet */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-emerald-100/80 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 -z-10" />

            <div className="space-y-4">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center">
                  03
                </span>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Question Bank <br />Studio
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Organize questions by subject, topic, and difficulty.
                </p>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Topic tagging</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Difficulty levels</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Reuse questions</span>
                </li>
              </ul>
            </div>

            {/* Bottom Action Link */}
            <div className="pt-6">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group/link"
              >
                <span>Browse Bank</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              CARD 04: Proctoring Radar (Coral/Rose Accent)
          ─────────────────────────────────────────────────────────── */}
          <div
            onClick={() => activeIndex !== 3 && setActiveIndex(3)}
            style={getCardTransformClasses(3).style}
            className={`absolute top-1/2 left-1/2 w-[285px] sm:w-[325px] md:w-[350px] lg:w-[370px] flex flex-col justify-between p-6 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-rose-200/90 dark:border-rose-900/60 transition-all duration-500 ease-out will-change-transform ${
              getCardTransformClasses(3).className
            }`}
          >
            {/* Layered physical backing sheet */}
            <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[26px] bg-rose-100/80 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/40 -z-10" />

            <div className="space-y-4">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center">
                  04
                </span>
                <div className="w-11 h-11 rounded-2xl bg-rose-50/90 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Proctoring Radar
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Secure and fair online exams with smart monitoring.
                </p>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Full-screen mode</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Tab-switch alerts</span>
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-50 dark:fill-emerald-950" />
                  <span>Auto-submission</span>
                </li>
              </ul>
            </div>

            {/* Bottom Action Link */}
            <div className="pt-6">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 group/link"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Indicator Pills */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}: ${card.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx
                  ? `w-8 ${card.pillActiveColor}`
                  : "w-6 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* ───────────────────────────────────────────────────────────
            BOTTOM FEATURE SUMMARY ROW (As shown in Reference UI)
            4 items: AI Powered, Print Ready, Organized, Secure
        ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-10 max-w-4xl mx-auto text-center border-t border-slate-200/60 dark:border-slate-800/60">
          {/* 1. AI Powered */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto shadow-xs">
              <Zap className="w-5 h-5 fill-blue-500/20" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              AI Powered
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Create questions in minutes
            </div>
          </div>

          {/* 2. Print Ready */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center mx-auto shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Print Ready
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Professional exam papers
            </div>
          </div>

          {/* 3. Organized */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center mx-auto shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Organized
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Build and reuse your question bank
            </div>
          </div>

          {/* 4. Secure */}
          <div className="space-y-1.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Secure
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Maintain fair and reliable exams
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

