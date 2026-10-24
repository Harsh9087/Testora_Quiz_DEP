"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Compass,
  Server,
  Zap,
  Globe,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Wand2,
  FileEdit,
  ShieldAlert,
  Users,
  Search,
  Activity,
  Layers,
  Code2,
  Sun,
  Moon,
  Sparkles,
  BarChart3,
  HelpCircle
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface GuideTopic {
  id: string;
  title: string;
  badge: string;
  icon: any;
  color: string;
  routeHref: string;
  summary: string;
  steps: string[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "forms-registrations",
    title: "Student Data Collection Forms",
    badge: "Direct Public Link",
    icon: ClipboardList,
    color: "text-[#2563EB] bg-[#EFF6FF] dark:bg-[#172B4D] dark:text-[#60A5FA]",
    routeHref: "/dashboard/teacher/forms",
    summary: "Collect student information via shareable online forms without requiring students to create accounts, and import directly into Student Directories.",
    steps: [
      "Navigate to 'Forms & Registrations' from the faculty dashboard sidebar or click the action button.",
      "Click 'Create Registration Form' and enter only the Form Name (e.g. 'Section C AIML').",
      "TestoraQuiz automatically includes the 6 predefined mandatory fields (Full Name, Email, Roll Number, Phone, Section, Branch).",
      "Copy the unique shareable link or display the QR code for students to scan on mobile devices.",
      "Students open the link and submit their details without needing to sign up or log in.",
      "Review submissions in your dashboard, detect duplicate roll numbers, and click 'Import to Directory' or 'Export Excel'."
    ]
  },
  {
    id: "custom-forms",
    title: "AI-Powered Custom Form Builder",
    badge: "Gemini AI Engine",
    icon: Wand2,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
    routeHref: "/dashboard/teacher/ai-forms",
    summary: "Generate custom surveys, workshop evaluations, and event registrations simply by describing them in natural language.",
    steps: [
      "Go to 'AI Form Builder' from the sidebar.",
      "Type a natural language prompt (e.g. 'Create a workshop feedback form with ratings, content clarity, and suggestions').",
      "Click 'Generate Form with AI' — Gemini will synthesize structured questions, input types, and choices.",
      "Preview and edit question labels, reorder fields, add new questions, or toggle required settings.",
      "Click 'Publish & Generate Link' to share with respondents across WhatsApp, LMS, or Email.",
      "View live submissions with dynamic columns matching your questions and export to Excel with 1 click."
    ]
  },
  {
    id: "quiz-creation",
    title: "Create Quiz & RAG Knowledge Base",
    badge: "ChromaDB + Gemini",
    icon: FileEdit,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40",
    routeHref: "/dashboard/teacher/exams/create",
    summary: "Synthesize calibrated assessments from course documents, textbook chapters, or custom syllabus blueprints.",
    steps: [
      "Open 'Create Quiz Wizard' from the Creator Studio sidebar.",
      "Step 1: Upload course files (PDF, DOCX, TXT) to the Knowledge Base for ChromaDB vector indexing.",
      "Step 2: Choose difficulty, question distribution (MCQs, Subjective, True/False), and passing criteria.",
      "Step 3: Review AI-generated question items with LaTeX math formulas and edit as needed.",
      "Step 4: Set scheduled time windows, anti-cheat rules, and publish to candidates."
    ]
  },
  {
    id: "student-portal",
    title: "Student Exam Portal & Anti-Cheat",
    badge: "Candidate HUD",
    icon: ShieldAlert,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
    routeHref: "/dashboard/student",
    summary: "Secure testing interface with real-time response syncing and tab-switch telemetry proctoring.",
    steps: [
      "Candidates open their Student Portal and click 'Start Assessment' or enter a 6-digit access code.",
      "Dual autosave engine backs up every answer locally and synchronizes to the cloud on keystroke.",
      "Built-in scientific tools: scientific calculator, LaTeX rendering, and flag-for-review navigation.",
      "Strict anti-cheat proctoring: exactly 1 tab switch allowed with warning; next violation triggers automatic submission and logs telemetry."
    ]
  },
  {
    id: "directories",
    title: "Student Directories & Roster Management",
    badge: "Class Cohorts",
    icon: Users,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    routeHref: "/dashboard/teacher/directories",
    summary: "Maintain cohorts, divisions, and batches for targeting assessments to specific groups of students.",
    steps: [
      "Access 'Student Directory' in the sidebar.",
      "Create directories manually, upload via the standard Excel/CSV template, or import from Online Forms.",
      "Assign exams directly to an entire directory so candidates see their assessments automatically in their portal.",
      "Download candidate credentials and passcodes in CSV format with 1 click."
    ]
  }
];

const ROUTE_INFO_ITEMS = [
  { path: "/dashboard/teacher", name: "Faculty Command Center", type: "Dynamic SSR", auth: "Teacher / Faculty" },
  { path: "/dashboard/teacher/exams/create", name: "AI Quiz Creator & RAG", type: "Client & Vector", auth: "Teacher" },
  { path: "/dashboard/teacher/forms", name: "Student Online Forms", type: "Dynamic SSR", auth: "Teacher" },
  { path: "/dashboard/teacher/ai-forms", name: "AI Natural Language Form Builder", type: "Dynamic SSR", auth: "Teacher" },
  { path: "/dashboard/teacher/directories", name: "Student Cohort Directories", type: "Dynamic SSR", auth: "Teacher" },
  { path: "/dashboard/student", name: "Candidate Assessment Portal", type: "Dynamic SSR", auth: "Student" },
  { path: "/exam/[code]", name: "Proctored Exam Room", type: "Dynamic Real-Time", auth: "Student" },
  { path: "/forms/[slug]", name: "Public Registration Link", type: "Static / ISR", auth: "Public (No Login)" },
  { path: "/api/v1/health", name: "FastAPI Backend Health", type: "REST API", auth: "Public" }
];

interface PlatformSettingsAndGuideProps {
  currentRole?: string;
  themeMode?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function PlatformSettingsAndGuide({
  currentRole = "teacher",
  themeMode = "light",
  onToggleTheme
}: PlatformSettingsAndGuideProps) {
  const [activeTab, setActiveTab] = useState<"features" | "routes" | "preferences">("features");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("forms-registrations");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTopics = GUIDE_TOPICS.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopicId) || GUIDE_TOPICS[0];

  return (
    <div className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl overflow-hidden shadow-sm">
      {/* Top Header / Mode Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#17243A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172B4D] dark:text-[#60A5FA] flex items-center justify-center shrink-0 border border-[#2563EB]/20">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
              <span>Platform Feature Guide & System Diagnostics</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1E3A8A] text-white dark:bg-[#2563EB]">
                v1.5.0
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
              Interactive walkthroughs, route engine telemetry, and display preferences
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("features")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "features"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Feature Guides</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("routes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "routes"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Route Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FEATURE GUIDES */}
      {activeTab === "features" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platform capabilities, forms, AI quiz wizard, anti-cheat..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left selector column */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#A3B1C6] px-1">
                Select Feature Guide ({filteredTopics.length})
              </span>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredTopics.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-[#EFF6FF] dark:bg-[#172B4D] border-[#2563EB] dark:border-[#3B82F6] shadow-xs"
                          : "bg-white dark:bg-[#111C31] border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${topic.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#1E3A8A] dark:text-[#60A5FA]" : "text-[#111827] dark:text-[#F1F5F9]"
                          }`}>
                            {topic.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#A3B1C6] line-clamp-1">
                          {topic.summary}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right topic details column */}
            <div className="lg:col-span-7 bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#263449]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                      {selectedTopic.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172B4D] dark:text-[#60A5FA] border border-[#2563EB]/20">
                      {selectedTopic.badge}
                    </span>
                  </div>
                  <Link
                    href={selectedTopic.routeHref}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                  >
                    <span>Launch</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-3 mb-4 leading-relaxed">
                  {selectedTopic.summary}
                </p>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#111827] dark:text-[#F1F5F9]">
                    Step-by-Step Instructions:
                  </span>
                  <div className="space-y-2 mt-1">
                    {selectedTopic.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#111827] dark:text-[#F1F5F9] leading-relaxed">
                        <span className="h-5 w-5 rounded-full bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] text-[10px] font-bold text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
                <span className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                  Ready to test this capability?
                </span>
                <Link
                  href={selectedTopic.routeHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>Open {selectedTopic.title.split(" ")[0]}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE INFO & ARCHITECTURE */}
      {activeTab === "routes" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick status bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-1">
                <Activity className="h-4 w-4" />
                <span>Route Architecture</span>
              </div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                App Router (Static + Dynamic)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-1">
                <Server className="h-4 w-4" />
                <span>Backend Gateway</span>
              </div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                FastAPI v0.115 + SQLite/ChromaDB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold mb-1">
                <Zap className="h-4 w-4" />
                <span>Theme Engine</span>
              </div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                Navy Blue + White (Light/Dark/System)
              </div>
            </div>
          </div>

          {/* Route Table */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-[#263449] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#17243A] border-b border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                Registered Application Routes & Endpoints
              </span>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#A3B1C6]">
                {ROUTE_INFO_ITEMS.length} routes registered
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] max-h-[300px] overflow-y-auto">
              {ROUTE_INFO_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                      {item.path}
                    </span>
                    <span className="text-[#64748B] dark:text-[#A3B1C6] hidden sm:inline">
                      — {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-mono">
                      {item.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {item.auth}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="p-4 sm:p-5 space-y-3">
          {/* Theme switcher */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
            <div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                Interface Color Theme
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                Toggle between Light, Dark, or System Default with automatic OS sync
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Real-time sync engine */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
            <div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                Dual Auto-Save Telemetry
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                Automatic local storage checkpointing + keystroke cloud sync
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Active</span>
            </span>
          </div>

          {/* Dev Indicator Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
            <div>
              <div className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9]">
                Development Overlay Indicators
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                Next.js dev badges and popups removed from public view
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
              Disabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
