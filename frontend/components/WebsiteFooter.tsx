"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  Building2,
  BookOpen,
  ShieldCheck,
  User,
  ArrowRight,
  Key,
  Headphones,
  ArrowUp,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  ChevronDown,
  FileText,
} from "lucide-react";
import AppLogo from "./AppLogo";

interface WebsiteFooterProps {
  onOpenCodeModal?: () => void;
  onOpenGuideWidget?: () => void;
  onScrollTo?: (id: string) => void;
}

interface NavLinkItem {
  label: string;
  href?: string;
  action?: "codeModal" | "guide" | "scroll" | "mailto";
  targetId?: string;
  email?: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  iconDarkBg: string;
  subtitle: string;
  links: NavLinkItem[];
}

export default function WebsiteFooter({
  onOpenCodeModal,
  onOpenGuideWidget,
  onScrollTo,
}: WebsiteFooterProps) {
  // Mobile accordion state (one or none open at a time)
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const handleScrollTo = (id: string) => {
    if (onScrollTo) {
      onScrollTo(id);
    } else if (typeof window !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = id;
      }
    }
  };

  const handleOpenCodeModal = () => {
    if (onOpenCodeModal) {
      onOpenCodeModal();
    } else if (typeof window !== "undefined") {
      window.location.href = "/portal";
    }
  };

  const handleOpenGuide = () => {
    if (onOpenGuideWidget) {
      onOpenGuideWidget();
    } else if (typeof window !== "undefined") {
      window.location.href = "/guide";
    }
  };

  const handleBackToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Structured navigation data matching reference UI
  const navSections: NavSection[] = [
    {
      id: "product",
      title: "PRODUCT",
      icon: Sparkles,
      iconColor: "text-[#1764F5]",
      iconBg: "bg-[#E6F0FF]",
      iconDarkBg: "dark:bg-blue-950/70",
      subtitle:
        "Platform Capabilities, Paper Studio (PDFs), Tab-Switch Proctoring, AI Question Generator",
      links: [
        {
          label: "Platform Capabilities",
          action: "scroll",
          targetId: "capabilities",
        },
        {
          label: "Paper Studio (PDFs)",
          action: "scroll",
          targetId: "features",
        },
        {
          label: "Tab-Switch Proctoring",
          action: "scroll",
          targetId: "capabilities",
        },
        {
          label: "AI Question Generator",
          action: "scroll",
          targetId: "how-it-works",
        },
        {
          label: "Prepaid Credit Wallet",
          action: "scroll",
          targetId: "pricing",
        },
      ],
    },
    {
      id: "portals",
      title: "PORTALS",
      icon: Users,
      iconColor: "text-[#8B4DFF]",
      iconBg: "bg-[#F4ECFF]",
      iconDarkBg: "dark:bg-purple-950/70",
      subtitle:
        "Instructor Studio, Candidate Exam Portal, Direct Passcode Access, Paper Studio",
      links: [
        {
          label: "Instructor Studio",
          href: "/login?role=teacher",
        },
        {
          label: "Candidate Exam Portal",
          href: "/portal",
        },
        {
          label: "Direct Passcode Access",
          action: "codeModal",
        },
        {
          label: "Question Paper Studio",
          href: "/login?role=teacher",
        },
        {
          label: "Claim Free 200 Credits",
          href: "/login?role=teacher",
        },
      ],
    },
    {
      id: "institutional",
      title: "INSTITUTIONAL",
      icon: Building2,
      iconColor: "text-[#F59E0B]",
      iconBg: "bg-[#FFF5E6]",
      iconDarkBg: "dark:bg-amber-950/70",
      subtitle:
        "FDP Grant Vouchers, Department Plans, Campus Partnerships, Razorpay Secure Billing",
      links: [
        {
          label: "FDP Grant Vouchers",
          action: "scroll",
          targetId: "fdp-solutions",
        },
        {
          label: "Department Plans",
          action: "scroll",
          targetId: "fdp-solutions",
        },
        {
          label: "Campus Partnerships",
          action: "mailto",
          email: "partnerships@testoraquiz.com",
        },
        {
          label: "Razorpay Secure Billing",
          action: "scroll",
          targetId: "pricing",
        },
        {
          label: "Institutional Inquiries",
          action: "mailto",
          email: "contact@testoraquiz.com",
        },
      ],
    },
    {
      id: "resources",
      title: "RESOURCES",
      icon: BookOpen,
      iconColor: "text-[#10B981]",
      iconBg: "bg-[#E8FAF3]",
      iconDarkBg: "dark:bg-emerald-950/70",
      subtitle:
        "AI Guide Assistant, FAQ, System Architecture, Faculty User Guide, Dedicated Support Desk",
      links: [
        {
          label: "AI Guide Assistant",
          action: "guide",
        },
        {
          label: "Frequently Asked Questions",
          action: "scroll",
          targetId: "faq",
        },
        {
          label: "System Architecture",
          action: "scroll",
          targetId: "capabilities",
        },
        {
          label: "Faculty User Guide",
          href: "/guide",
        },
        {
          label: "Dedicated Support Desk",
          action: "mailto",
          email: "support@testoraquiz.com",
        },
      ],
    },
  ];

  const renderLinkItem = (link: NavLinkItem, isMobile = false) => {
    const baseStyle =
      "text-[#607397] hover:text-[#1764F5] dark:text-[#A9B9D3] dark:hover:text-[#60A5FA] transition-colors cursor-pointer text-left block";

    if (link.href) {
      return (
        <Link
          href={link.href}
          className={`${baseStyle} ${isMobile ? "py-1.5 text-[13px]" : "text-xs sm:text-[13px]"}`}
        >
          {link.label}
        </Link>
      );
    }

    if (link.action === "codeModal") {
      return (
        <button
          type="button"
          onClick={handleOpenCodeModal}
          className={`${baseStyle} ${isMobile ? "py-1.5 text-[13px] w-full" : "text-xs sm:text-[13px]"}`}
        >
          {link.label}
        </button>
      );
    }

    if (link.action === "guide") {
      return (
        <button
          type="button"
          onClick={handleOpenGuide}
          className={`${baseStyle} flex items-center gap-1.5 ${isMobile ? "py-1.5 text-[13px] w-full" : "text-xs sm:text-[13px]"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1764F5] animate-pulse" />
          <span>{link.label}</span>
        </button>
      );
    }

    if (link.action === "scroll" && link.targetId) {
      return (
        <button
          type="button"
          onClick={() => handleScrollTo(link.targetId!)}
          className={`${baseStyle} ${isMobile ? "py-1.5 text-[13px] w-full" : "text-xs sm:text-[13px]"}`}
        >
          {link.label}
        </button>
      );
    }

    if (link.action === "mailto" && link.email) {
      return (
        <a
          href={`mailto:${link.email}`}
          className={`${baseStyle} ${isMobile ? "py-1.5 text-[13px]" : "text-xs sm:text-[13px]"}`}
        >
          {link.label}
        </a>
      );
    }

    return (
      <span className={`${baseStyle} ${isMobile ? "py-1.5 text-[13px]" : "text-xs sm:text-[13px]"}`}>
        {link.label}
      </span>
    );
  };

  return (
    <div className="relative w-full">
      {/* ───────────────────────────────────────────────────────────
          1. TOP THIN DARK NAVY STRIP (Exact Requirement)
      ─────────────────────────────────────────────────────────── */}
      <div
        className="w-full h-1 bg-[#102448] dark:bg-[#1E3A8A]"
        aria-hidden="true"
      />

      {/* ───────────────────────────────────────────────────────────
          2. FULL-WIDTH FOOTER CONTAINER
          Soft light-blue gradient transitioning into pale lavender.
          Dark Mode: Deep navy #080E1E.
      ─────────────────────────────────────────────────────────── */}
      <footer className="relative w-full bg-gradient-to-r from-[#F3F8FF] via-[#EAF3FF] to-[#F1F5FE] dark:from-[#080E1E] dark:via-[#0D182E] dark:to-[#080E1E] text-[#607397] dark:text-[#A9B9D3] transition-colors duration-300 overflow-hidden select-none">
        {/* Subtle Ambient Dotted Pattern & Radial Glows */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#60A5FA_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-30 dark:opacity-10 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -top-24 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Centered Main Content Container */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-14 pb-8 sm:pb-10 relative z-10 space-y-8 sm:space-y-10">
          {/* ══════════════════════════════════════════════════════════
              MAIN FOOTER TOP SECTION:
              - Left (~30-33%): Brand & Platform Intro & CTAs
              - Center (~22-25%): Large Transparent Educational Product Illustration
              - Right (~42-45%): 4 Navigation Columns (Product, Portals, Institutional, Resources)
          ══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-center">
            {/* ──── COLUMN 1: Brand & Platform Introduction ──── */}
            <div className="md:col-span-5 lg:col-span-4 xl:col-span-4 space-y-4">
              {/* Brand Logo */}
              <Link
                href="/"
                className="inline-block group focus:outline-hidden transition-transform duration-200 active:scale-98"
                title="Return to Testora Quiz Home"
              >
                <AppLogo variant="row" height={36} showBadge={false} />
              </Link>

              {/* Platform Description (Exact Requested Text) */}
              <p className="text-xs sm:text-[13px] text-[#607397] dark:text-[#A9B9D3] leading-relaxed max-w-sm sm:max-w-md">
                Testora Quiz is an AI-powered assessment synthesizer, automated
                question paper studio, and real-time proctoring platform designed
                for educators, universities, and students.
              </p>

              {/* Status Badge & Security Trust Statement */}
              <div className="space-y-2 pt-0.5">
                {/* System Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[#10B981] text-xs font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>All Evaluation Engines Operational</span>
                </div>

                {/* Security Trust Statement */}
                <div className="flex items-center gap-2 text-xs text-[#607397] dark:text-[#A9B9D3]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1764F5] dark:text-[#60A5FA] shrink-0" />
                  <span>
                    Role-Based Access Control · Server-Enforced Anti-Cheat
                  </span>
                </div>
              </div>

              {/* Action Buttons: Faculty Login & Enter Exam Code (Always in ONE Row on Mobile & Desktop) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1 w-full max-w-sm sm:max-w-md">
                {/* Faculty Login (Primary Blue) */}
                <Link
                  href="/login?role=teacher"
                  className="py-2.5 px-2 xs:px-3 sm:px-4 rounded-xl bg-[#1764F5] hover:bg-blue-600 active:scale-98 text-white font-bold text-[11px] xs:text-xs sm:text-[13px] shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1 sm:gap-1.5 group cursor-pointer whitespace-nowrap text-center"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Faculty Login</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Enter Exam Code (White Button with Key Icon) */}
                <button
                  type="button"
                  onClick={handleOpenCodeModal}
                  className="py-2.5 px-2 xs:px-3 sm:px-4 rounded-xl bg-white dark:bg-[#111D35] hover:bg-slate-50 dark:hover:bg-[#162744] text-[#10234E] dark:text-[#F8FAFC] border border-[#DCE5F2] dark:border-[#263957] font-semibold text-[11px] xs:text-xs sm:text-[13px] shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap text-center"
                >
                  <Key className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span className="truncate">Enter Exam Code</span>
                </button>
              </div>

              {/* Mobile Laptop Showcase: Complete, Uncropped Laptop Illustration */}
              <div className="block md:hidden pt-4 pb-2 w-full flex justify-center">
                <div className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[360px] px-2 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full bg-blue-400/15 dark:bg-blue-600/15 blur-2xl pointer-events-none -z-10"
                    aria-hidden="true"
                  />
                  <img
                    src="/images/laptop_mockup.png"
                    alt="Testora Quiz Assessment Studio on Laptop"
                    className="w-full h-auto object-contain drop-shadow-[0_10px_22px_rgba(22,119,255,0.12)] dark:drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* ──── CENTER PRODUCT ILLUSTRATION (Complete Laptop Illustration, Uncropped & Large) ──── */}
            <div className="hidden md:flex md:col-span-3 lg:col-span-3 xl:col-span-3 items-center justify-center px-1 lg:px-2">
              <div className="relative w-full max-w-[320px] lg:max-w-[350px] xl:max-w-[380px] flex items-center justify-center">
                {/* Soft Ambient Radial Glow Behind the Laptop */}
                <div
                  className="absolute -inset-4 rounded-full bg-blue-400/15 dark:bg-blue-600/15 blur-2xl pointer-events-none -z-10"
                  aria-hidden="true"
                />
                <img
                  src="/images/laptop_mockup.png"
                  alt="Testora Quiz Assessment Studio on Laptop"
                  className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(22,119,255,0.12)] dark:drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* ──── DESKTOP 4-COLUMN NAVIGATION (Hidden on mobile < md) ──── */}
            <div className="hidden md:grid md:col-span-4 lg:col-span-5 xl:col-span-5 grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6">
              {navSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <div key={section.id} className="space-y-3.5">
                    {/* Header with Colored Outline Icon */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg ${section.iconBg} ${section.iconDarkBg} ${section.iconColor} flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-800/50 shadow-2xs`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black text-[#10234E] dark:text-[#F8FAFC] tracking-wider uppercase">
                        {section.title}
                      </h4>
                    </div>

                    {/* Links List */}
                    <ul className="space-y-2">
                      {section.links.map((link, idx) => (
                        <li key={idx}>{renderLinkItem(link)}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              MOBILE ACCORDION NAVIGATION (Visible on mobile < md)
              Matches Reference Image
          ══════════════════════════════════════════════════════════ */}
          <div className="block md:hidden border-t border-[#DCE5F2] dark:border-[#263957] divide-y divide-[#DCE5F2] dark:divide-[#263957]">
            {navSections.map((section) => {
              const IconComponent = section.icon;
              const isOpen = openSection === section.id;

              return (
                <div key={section.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-panel-${section.id}`}
                    className="w-full flex items-start justify-between gap-3 text-left focus:outline-hidden group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Outline Icon */}
                      <div className="mt-0.5 shrink-0">
                        <IconComponent
                          className={`w-5 h-5 ${section.iconColor}`}
                        />
                      </div>

                      {/* Title & Preview Subtitle */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#10234E] dark:text-[#F8FAFC] tracking-wider uppercase">
                          {section.title}
                        </h4>
                        <p className="text-[11px] text-[#607397] dark:text-[#A9B9D3] leading-snug line-clamp-2 mt-0.5">
                          {section.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <div className="shrink-0 mt-0.5 text-[#607397] dark:text-[#A9B9D3] group-hover:text-[#1764F5] transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Collapsible Panel with Links */}
                  {isOpen && (
                    <div
                      id={`accordion-panel-${section.id}`}
                      className="pt-3 pl-8 pr-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {section.links.map((link, idx) => (
                        <div key={idx}>{renderLinkItem(link, true)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════════════
              4. BOTTOM FOOTER BAR
              Divided by a thin border #DCE5F2
              Matches Reference for Desktop and Mobile (Single row on desktop)
          ══════════════════════════════════════════════════════════ */}
          <div className="pt-6 sm:pt-8 border-t border-[#DCE5F2] dark:border-[#263957] flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-[13px] text-[#607397] dark:text-[#A9B9D3]">
            {/* Left: Copyright & Academic Mission Notice */}
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
              <span className="font-bold text-[#10234E] dark:text-[#F8FAFC]">
                &copy; 2026 Testora Quiz. All rights reserved.
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
                •
              </span>
              <span className="text-[#607397] dark:text-[#A9B9D3] text-[11px] sm:text-xs">
                Crafted for academic integrity & modern assessment excellence.
              </span>
            </div>

            {/* Right: Quick Links, Social Icons & Back to Top */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 font-medium">
              {/* FAQ */}
              <button
                type="button"
                onClick={() => handleScrollTo("faq")}
                className="inline-flex items-center gap-1 hover:text-[#1764F5] dark:hover:text-white transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 md:hidden text-[#1764F5]" />
                <span>FAQ</span>
              </button>

              {/* Support */}
              <a
                href="mailto:support@testoraquiz.com"
                className="inline-flex items-center gap-1 hover:text-[#1764F5] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 md:hidden text-[#1764F5]" />
                <span>Support</span>
              </a>

              {/* Privacy */}
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 hover:text-[#1764F5] dark:hover:text-white transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 md:hidden text-[#1764F5]" />
                <span>Privacy</span>
              </Link>

              {/* Terms */}
              <Link
                href="/terms"
                className="inline-flex items-center gap-1 hover:text-[#1764F5] dark:hover:text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 md:hidden" />
                <span>Terms</span>
              </Link>

              {/* Social Media Icons */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#DCE5F2] dark:border-[#263957]">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-7 h-7 rounded-lg bg-white/70 dark:bg-[#111D35] border border-[#DCE5F2] dark:border-[#263957] text-[#607397] dark:text-[#A9B9D3] hover:text-[#1764F5] dark:hover:text-white hover:border-[#1764F5]/40 flex items-center justify-center transition-all shadow-2xs"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-7 h-7 rounded-lg bg-white/70 dark:bg-[#111D35] border border-[#DCE5F2] dark:border-[#263957] text-[#607397] dark:text-[#A9B9D3] hover:text-[#1764F5] dark:hover:text-white hover:border-[#1764F5]/40 flex items-center justify-center transition-all shadow-2xs"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-7 h-7 rounded-lg bg-white/70 dark:bg-[#111D35] border border-[#DCE5F2] dark:border-[#263957] text-[#607397] dark:text-[#A9B9D3] hover:text-[#1764F5] dark:hover:text-white hover:border-[#1764F5]/40 flex items-center justify-center transition-all shadow-2xs"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-7 h-7 rounded-lg bg-white/70 dark:bg-[#111D35] border border-[#DCE5F2] dark:border-[#263957] text-[#607397] dark:text-[#A9B9D3] hover:text-[#1764F5] dark:hover:text-white hover:border-[#1764F5]/40 flex items-center justify-center transition-all shadow-2xs"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Back to Top Button */}
              <button
                type="button"
                onClick={handleBackToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111D35] border border-[#DCE5F2] dark:border-[#263957] text-[#1764F5] dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-white font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
