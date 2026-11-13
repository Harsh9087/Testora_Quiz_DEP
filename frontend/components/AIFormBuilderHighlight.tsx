"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Sparkles,
  FileEdit,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Share2,
  Star,
  Copy,
  Check,
  Smartphone,
  Eye,
  Sliders,
  Send,
  Mic,
  Palette,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";

interface AIFormBuilderHighlightProps {
  isLoggedIn?: boolean;
  userRole?: string | null;
  onLearnMore?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    id: "admission",
    label: "Class 11 Admission",
    prompt: "Create an admission form for Class 11 Science & Commerce streams with parent contacts, 10th percentage, and subject choices.",
    title: "Class 11 Academic Admission Form 2026",
    fields: [
      { id: "name", label: "Candidate Full Name", type: "text", placeholder: "e.g. Aryan Sharma" },
      { id: "email", label: "Registered Email Address", type: "email", placeholder: "student@example.com" },
      { id: "stream", label: "Preferred Academic Stream", type: "select", options: ["Science (PCM)", "Science (PCB)", "Commerce with Maths", "Arts & Humanities"] },
      { id: "percent", label: "Class 10 Board Percentage (%)", type: "number", placeholder: "e.g. 94.5" },
      { id: "rating", label: "Campus Visit Experience", type: "rating", max: 5 }
    ]
  },
  {
    id: "placement",
    label: "Campus Placement Registration",
    prompt: "Generate a campus placement drive registration form for final year engineering students with branch, CGPA, and resume upload.",
    title: "Campus Recruitment Drive – Batch 2026",
    fields: [
      { id: "name", label: "Full Name (as per University ID)", type: "text", placeholder: "e.g. Ananya Roy" },
      { id: "branch", label: "Engineering Department", type: "select", options: ["Computer Science & Engg", "Electronics & Comm", "Mechanical Engg", "Information Technology"] },
      { id: "cgpa", label: "Cumulative CGPA (Till Semester 7)", type: "number", placeholder: "e.g. 8.75" },
      { id: "skills", label: "Core Technical Strengths", type: "select", options: ["Full-Stack Web (React/Node)", "Python & AI/ML", "Cloud & DevOps (AWS/Docker)", "Core Java & Spring"] },
      { id: "rating", label: "Self-Assessment of Coding Readiness", type: "rating", max: 5 }
    ]
  },
  {
    id: "feedback",
    label: "Faculty & Course Feedback",
    prompt: "Build an anonymous course feedback form evaluating instructor clarity, lab practicals, and syllabus coverage.",
    title: "Mid-Term Course & Faculty Feedback 2026",
    fields: [
      { id: "course", label: "Course & Semester Code", type: "select", options: ["CS-302: Database Management Systems", "CS-304: Algorithms & Data Structures", "MATH-201: Applied Linear Algebra"] },
      { id: "clarity", label: "Instructor Teaching Clarity & Pace", type: "rating", max: 5 },
      { id: "labs", label: "Laboratory & Hands-on Facilities", type: "rating", max: 5 },
      { id: "comments", label: "Suggestions for Academic Improvement", type: "text", placeholder: "Write constructive suggestions here..." }
    ]
  }
];

export default function AIFormBuilderHighlight({
  isLoggedIn = false,
  userRole = null,
  onLearnMore,
}: AIFormBuilderHighlightProps) {
  const exploreHref = isLoggedIn
    ? userRole === "teacher"
      ? "/dashboard/teacher#custom-forms"
      : "/dashboard/student"
    : "/login?role=teacher";

  // Active Sample Form Simulation
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [starValues, setStarValues] = useState<Record<string, number>>({ rating: 5, clarity: 5, labs: 4 });

  const activePreset = SAMPLE_PROMPTS[activePresetIndex];

  const handleCopyShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section
      id="form-builder"
      className="relative py-12 sm:py-16 lg:py-20 bg-[#FFFBF7] dark:bg-[#0A101D] border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden scroll-mt-16"
    >
      {/* Subtle Background Lighting & Ambient Grids */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header & Subtitle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN: CONTENT, VALUE PROPOSITION & CAPABILITIES
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Category / Kicker Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-bold shadow-2xs">
              <Wand2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>AI Form Studio &amp; Dynamic Portals</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            </div>

            {/* Main Heading */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Build Any Form in Seconds.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-300">
                  Just Describe It to AI.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                No more dragging and dropping fields manually. Simply type or speak your requirements, and Testora AI automatically generates production-ready admission forms, contest registrations, and feedback surveys with validations, themes, and instant QR codes.
              </p>
            </div>

            {/* 4 Core Value Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#111C31] border border-orange-100 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Natural Language to Form</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Describe any form in plain English or Hindi; AI configures dropdowns, text, numbers, and ratings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#111C31] border border-orange-100 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Voice &amp; Prompt Improver</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Speak your form structure hands-free, or 1-click expand prompts to include safety/consent fields.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#111C31] border border-orange-100 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Printable QR Codes</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Instant printable high-res QR codes for noticeboards, classroom flyers, and WhatsApp sharing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#111C31] border border-orange-100 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Gradebook Sync</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Submissions stream directly into the teacher dashboard with 1-click export to CSV and Excel.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={exploreHref}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-orange-600/25 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>Launch AI Form Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("form-builder-preview");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-5 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Try Live Simulator</span>
              </button>
            </div>

            {/* Trust Footer Bar */}
            <div className="flex items-center gap-6 pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Coding Required</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                <span>100% Mobile Ready</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>FERPA &amp; GDPR Compliant</span>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN: INTERACTIVE FORM BUILDER LIVE SIMULATOR
             ══════════════════════════════════════════════════════════ */}
          <div id="form-builder-preview" className="lg:col-span-6">
            <div className="relative rounded-3xl bg-white dark:bg-[#0D1830] border-2 border-orange-500/70 dark:border-orange-500/50 shadow-2xl shadow-orange-500/10 p-4 sm:p-6 space-y-4">
              
              {/* Simulator Header & Tab Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Live AI Form Simulator
                    </h3>
                    <p className="text-[10px] text-slate-400">Select a prompt below to see instant generation</p>
                  </div>
                </div>

                {/* Preset Switcher Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  {SAMPLE_PROMPTS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActivePresetIndex(idx);
                        setSubmitted(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        activePresetIndex === idx
                          ? "bg-white dark:bg-orange-600 text-orange-600 dark:text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Natural Language Prompt Preview Box */}
              <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 flex items-start gap-2.5">
                <Wand2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs text-orange-950 dark:text-orange-200 leading-relaxed font-mono">
                  <span className="font-bold text-orange-700 dark:text-orange-300 block text-[10px] uppercase font-sans tracking-wider mb-0.5">
                    Prompt Input:
                  </span>
                  &ldquo;{activePreset.prompt}&rdquo;
                </div>
              </div>

              {/* Simulated Generated Form Preview */}
              <form onSubmit={handleSimulatedSubmit} className="space-y-3.5 bg-slate-50/70 dark:bg-[#111D35] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{activePreset.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Public URL: testora.quiz/forms/{activePreset.id}-2026</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Share Link"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? "Copied" : "Share"}</span>
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  {activePreset.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold">*Required</span>
                      </label>
                      {field.type === "select" ? (
                        <select className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500">
                          {field.options?.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "rating" ? (
                        <div className="flex items-center gap-1.5 py-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setStarValues((prev) => ({ ...prev, [field.id]: star }))}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  (starValues[field.id] || 5) >= star
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                            {starValues[field.id] || 5}.0 / 5.0
                          </span>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          defaultValue=""
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit Simulator CTA */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Candidate Response</span>
                </button>
              </form>

              {/* Instant Success Banner */}
              {submitted && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Response registered successfully! Record logged in Teacher Gradebook.</span>
                </div>
              )}

              {/* Floating Verification Badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Generated by Testora AI Form Engine
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  Ready in 0.8s
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

