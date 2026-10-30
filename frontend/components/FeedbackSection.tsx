"use client";

import React, { useState, useRef } from "react";
import {
  MessageSquare,
  Lightbulb,
  Bug,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquarePlus
} from "lucide-react";
import FeedbackModal, { FeedbackType } from "./FeedbackModal";

interface FeedbackCardItem {
  id: FeedbackType;
  number: string;
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: "blue" | "orange" | "red" | "emerald";
  borderHover: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  btnClasses: string;
}

const CARDS: FeedbackCardItem[] = [
  {
    id: "general",
    number: "01",
    title: "Share Your Experience",
    description: "Tell us what you like and how we can improve.",
    buttonLabel: "Give Feedback",
    icon: MessageSquare,
    accentColor: "blue",
    borderHover: "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10",
    iconBg: "bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80",
    badgeText: "text-blue-700 dark:text-blue-300",
    btnClasses: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
  },
  {
    id: "feature",
    number: "02",
    title: "Suggest a Feature",
    description: "Share an idea for a new tool or improvement.",
    buttonLabel: "Suggest Feature",
    icon: Lightbulb,
    accentColor: "orange",
    borderHover: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10",
    iconBg: "bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-900/60",
    iconColor: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/80",
    badgeText: "text-amber-700 dark:text-amber-300",
    btnClasses: "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
  },
  {
    id: "bug",
    number: "03",
    title: "Report an Issue",
    description: "Help us identify bugs or technical problems.",
    buttonLabel: "Report Issue",
    icon: Bug,
    accentColor: "red",
    borderHover: "hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-rose-500/10",
    iconBg: "bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-900/60",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-50 dark:bg-rose-950/80 border border-rose-200/80 dark:border-rose-800/80",
    badgeText: "text-rose-700 dark:text-rose-300",
    btnClasses: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
  },
  {
    id: "rating",
    number: "04",
    title: "Rate Your Experience",
    description: "Rate your experience using Testora Quiz.",
    buttonLabel: "Give Rating",
    icon: Star,
    accentColor: "emerald",
    borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/80",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    btnClasses: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
  }
];

export default function FeedbackSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType>("general");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenModal = (type: FeedbackType = "general") => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = 320;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleContainerScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.clientWidth * 0.82;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveSlideIndex(Math.min(Math.max(index, 0), CARDS.length - 1));
  };

  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardElements = container.querySelectorAll(".feedback-card-item");
    if (cardElements[index]) {
      cardElements[index].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActiveSlideIndex(index);
    }
  };

  return (
    <section
      id="feedback"
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#F0F5FF]/60 via-white to-[#F8FAFC] dark:from-[#060D1E] dark:via-[#091122] dark:to-[#070D1D] overflow-hidden border-t border-slate-200/80 dark:border-slate-800/80"
    >
      {/* Subtle Dotted Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-15"
        style={{
          backgroundImage: "radial-gradient(#94A3B8 1px, transparent 1px)",
          backgroundSize: "22px 22px"
        }}
      />

      {/* Soft Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-600/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ══════════════════════════════════════════════════════════════════════
            1. SECTION HEADER WITH CALL TO ACTION
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-wide uppercase">
              Community Voice &amp; Ideas
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-[40px] font-black tracking-tight leading-tight text-slate-950 dark:text-white">
            <span>We Value </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Feedback
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-2xl">
            Help us improve Testora Quiz with your suggestions, ideas, and experience. Every submission shapes our upcoming releases.
          </p>

          {/* Prominent Header Action Button */}
          <div className="pt-2">
            <button
              onClick={() => handleOpenModal("general")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Give Feedback</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. FOUR FEEDBACK CARDS (RESPONSIVE ROW / MOBILE HORIZONTAL SCROLL)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="relative">
          {/* Mobile Navigation Arrows (Visible only on touch/mobile scroll) */}
          <div className="flex sm:hidden items-center justify-between mb-3 px-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Swipe cards</span>
              <ArrowRight className="w-3 h-3 text-blue-500" />
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs active:scale-90 transition-transform"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs active:scale-90 transition-transform"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Track: Desktop 4 in a row; Mobile horizontal scrolling with scroll snap */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContainerScroll}
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 sm:pb-0 px-2 sm:px-0 -mx-2 sm:mx-0"
          >
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className={`feedback-card-item w-[82vw] max-w-[310px] sm:w-auto shrink-0 sm:shrink snap-center flex flex-col justify-between bg-white dark:bg-[#0E1726] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ${card.borderHover}`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Number Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.iconBg} ${card.iconColor} shadow-xs`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${card.badgeBg} ${card.badgeText}`}
                      >
                        {card.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 pt-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(card.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${card.btnClasses}`}
                    >
                      <span>{card.buttonLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Dot Indicators */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2">
            {CARDS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  activeSlideIndex === idx ? "w-6 bg-blue-600" : "w-1.5 bg-slate-300 dark:bg-slate-700"
                }`}
                title={`Go to card ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. FUNCTIONAL POPUP FORM (MODAL)
      ══════════════════════════════════════════════════════════════════════ */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={selectedType}
      />
    </section>
  );
}
