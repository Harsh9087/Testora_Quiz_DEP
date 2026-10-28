"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Sparkles, 
  X, 
  Search, 
  ChevronRight, 
  ClipboardList, 
  Wand2, 
  FileEdit, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  BookOpen,
  Send,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Cpu
} from "lucide-react";

export interface GuideTopic {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  summary: string;
  steps: string[];
  actionText: string;
  actionUrl: string;
  actionType?: "link" | "scroll" | "code_modal";
  keywords: string[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "create-quiz",
    title: "Create Smart Tests with AI",
    shortTitle: "Create Tests",
    badge: "Instructor Studio",
    icon: FileEdit,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    summary: "Synthesize calibrated assessments from syllabus blueprints, textbook chapters, or custom question banks with Gemini Pro AI.",
    steps: [
      "Open 'Teacher Assessment Studio' from the home card or faculty dashboard.",
      "Click 'Create Test' and select your domain (e.g. Computer Science, Engineering, Mathematics).",
      "Upload course PDFs or DOCX files into the ChromaDB vector knowledge base for exact syllabus alignment.",
      "Choose question distribution: MCQs, Subjective, True/False, and calibrate Bloom taxonomy difficulty.",
      "Review synthesized items with auto-formatted LaTeX formulas, edit questions, set time limits, and publish."
    ],
    actionText: "Open Instructor Studio →",
    actionUrl: "/dashboard/teacher",
    actionType: "link",
    keywords: ["create", "exam", "test", "quiz", "make", "generate", "ai questions", "teacher", "syllabus", "pdf", "latex", "math"]
  },
  {
    id: "student-portal",
    title: "Take Your Test (Exam Code Access)",
    shortTitle: "Take Test",
    badge: "Candidate HUD",
    icon: KeyRound,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    summary: "Students can access scheduled exams using a unique 6-digit access code without complicated account setups.",
    steps: [
      "Click 'Enter Exam Code' or visit the Candidate Portal.",
      "Enter the 6-digit assessment access code provided by your instructor.",
      "Verify your full name, roll number, and student credentials on the verification screen.",
      "Complete the system proctoring check (camera, fullscreen mode, and browser permissions).",
      "Answer questions with real-time autosave. Every answer is preserved locally and synced to the cloud."
    ],
    actionText: "Enter Exam Code Now →",
    actionUrl: "modal:exam-code",
    actionType: "code_modal",
    keywords: ["take", "student", "code", "enter", "access", "exam code", "portal", "candidate", "start", "attempt"]
  },
  {
    id: "forms-registrations",
    title: "Student Data Collection Forms",
    shortTitle: "Student Forms",
    badge: "No Login Needed",
    icon: ClipboardList,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    summary: "Collect verified student information via shareable mobile-friendly online forms and import directly to student rosters.",
    steps: [
      "Navigate to 'Forms & Registrations' from the faculty dashboard sidebar.",
      "Click 'Create Registration Form' and enter the Form Name (e.g. 'CS Branch Batch 2026').",
      "Copy the unique shareable link or present the QR code for students to scan on mobile.",
      "Students fill in their Name, Email, Roll Number, and Phone without creating accounts or signing in.",
      "Review live submissions with duplicate roll number detection, and click 'Import to Directory' or 'Export Excel'."
    ],
    actionText: "Create Student Form →",
    actionUrl: "/dashboard/teacher",
    actionType: "link",
    keywords: ["form", "registration", "student form", "collect", "qr", "link", "no login", "data", "excel", "roster"]
  },
  {
    id: "custom-forms",
    title: "AI-Powered Custom Form Builder",
    shortTitle: "AI Form Builder",
    badge: "Natural Language",
    icon: Wand2,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    summary: "Describe any workshop evaluation, feedback survey, or event registration in plain English, and AI synthesizes the form instantly.",
    steps: [
      "Open 'AI Form Builder' from the faculty dashboard.",
      "Type a natural language prompt (e.g. 'Create a Faculty Development Program feedback form with ratings and suggestions').",
      "Click 'Generate Form with AI' — Gemini synthesizes structured fields, rating scales, and choices in seconds.",
      "Customize field labels, toggle required validation, and click 'Publish & Copy Link'.",
      "Analyze response charts and export submissions directly to CSV/Excel."
    ],
    actionText: "Open AI Form Studio →",
    actionUrl: "/dashboard/teacher",
    actionType: "link",
    keywords: ["ai form", "custom form", "builder", "survey", "feedback", "workshop", "poll", "prompt", "synthesize"]
  },
  {
    id: "anti-cheat",
    title: "Anti-Cheat Proctor Radar",
    shortTitle: "Anti-Cheat",
    badge: "Server-Enforced",
    icon: ShieldCheck,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    summary: "Server-side focus monitoring and strict tab-switch telemetry prevent cheating and unauthorized browsing during active exams.",
    steps: [
      "Tab-Switch Detection: Exactly 1 tab violation is permitted with a prominent warning modal.",
      "Next Violation Enforcement: Second tab-switch triggers automatic exam submission with an audit incident flag.",
      "Telemetry Sync: All blur events, window switches, and copy/paste attempts are logged to the teacher audit trail.",
      "Full Screen Lock: Exams enforce full-screen focus throughout the assessment session."
    ],
    actionText: "Explore Proctoring Features →",
    actionUrl: "#capabilities",
    actionType: "scroll",
    keywords: ["cheat", "anti-cheat", "proctor", "radar", "tab", "switch", "security", "telemetry", "lock", "monitor"]
  },
  {
    id: "directories",
    title: "Student Directories & Roster Management",
    shortTitle: "Directories",
    badge: "Roster Management",
    icon: Users,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    summary: "Maintain cohorts, divisions, and batches for targeting assessments to specific groups of students.",
    steps: [
      "Access 'Student Directory' in the faculty dashboard sidebar.",
      "Create directories manually, upload via standard Excel/CSV templates, or import from Online Forms.",
      "Assign exams directly to an entire directory so candidates see their assessments automatically.",
      "Download candidate credentials, roll number mappings, and exam passcodes in CSV format with 1 click."
    ],
    actionText: "Manage Student Roster →",
    actionUrl: "/dashboard/teacher",
    actionType: "link",
    keywords: ["directory", "roster", "students", "cohort", "batch", "class", "csv", "excel", "import", "group"]
  }
];

interface AIAgentGuideWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenExamModal?: () => void;
}

export default function AIAgentGuideWidget({ 
  isOpen: controlledOpen, 
  onOpenChange,
  onOpenExamModal
}: AIAgentGuideWidgetProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [selectedTopicId, setSelectedTopicId] = useState<string>("create-quiz");
  const [searchQuery, setSearchQuery] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [answeredQuery, setAnsweredQuery] = useState<string | null>(null);

  // Movable / Draggable icon state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    elemX: 0,
    elemY: 0,
    hasMoved: false,
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const BTN_SIZE = 52;
  const PADDING = 12;

  // Initialize position on client mount
  useEffect(() => {
    const initPosition = () => {
      try {
        const saved = localStorage.getItem("testora_guide_widget_pos");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            const maxX = Math.max(PADDING, window.innerWidth - BTN_SIZE - PADDING);
            const maxY = Math.max(PADDING, window.innerHeight - BTN_SIZE - PADDING);
            setPosition({
              x: Math.min(Math.max(PADDING, parsed.x), maxX),
              y: Math.min(Math.max(PADDING, parsed.y), maxY),
            });
            return;
          }
        }
      } catch {
        // Fallback to default position
      }

      // Default: bottom-right corner
      setPosition({
        x: Math.max(PADDING, window.innerWidth - BTN_SIZE - 20),
        y: Math.max(PADDING, window.innerHeight - BTN_SIZE - 20),
      });
    };

    initPosition();

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const maxX = Math.max(PADDING, window.innerWidth - BTN_SIZE - PADDING);
        const maxY = Math.max(PADDING, window.innerHeight - BTN_SIZE - PADDING);
        return {
          x: Math.min(Math.max(PADDING, prev.x), maxX),
          y: Math.min(Math.max(PADDING, prev.y), maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click outside listener to close widget gently
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        widgetRef.current &&
        !widgetRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Attach after slight timeout to avoid immediate close on toggle click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // Only primary mouse button

    const currentX = position?.x ?? Math.max(PADDING, window.innerWidth - BTN_SIZE - 20);
    const currentY = position?.y ?? Math.max(PADDING, window.innerHeight - BTN_SIZE - 20);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: currentX,
      elemY: currentY,
      hasMoved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
      dragRef.current.hasMoved = true;
    }

    const maxX = Math.max(PADDING, window.innerWidth - BTN_SIZE - PADDING);
    const maxY = Math.max(PADDING, window.innerHeight - BTN_SIZE - PADDING);

    const nextX = Math.min(Math.max(PADDING, dragRef.current.elemX + dx), maxX);
    const nextY = Math.min(Math.max(PADDING, dragRef.current.elemY + dy), maxY);

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    setIsDragging(false);

    if (dragRef.current.hasMoved) {
      // It was a drag: persist position to localStorage
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const maxX = Math.max(PADDING, window.innerWidth - BTN_SIZE - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - BTN_SIZE - PADDING);
      const finalX = Math.min(Math.max(PADDING, dragRef.current.elemX + dx), maxX);
      const finalY = Math.min(Math.max(PADDING, dragRef.current.elemY + dy), maxY);
      try {
        localStorage.setItem("testora_guide_widget_pos", JSON.stringify({ x: finalX, y: finalY }));
      } catch {
        // ignore
      }
    } else {
      // It was a click without movement: toggle assistant
      setIsOpen(!isOpen);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDragging) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  // Smart Search & Question Matcher
  const handleAskQuestion = (q: string) => {
    const query = q.trim().toLowerCase();
    if (!query) return;

    setAnsweredQuery(q);

    // Score each topic based on keywords, title, summary, and steps
    let bestTopic = GUIDE_TOPICS[0];
    let highestScore = -1;

    for (const topic of GUIDE_TOPICS) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (query.includes(kw)) score += 5;
      }
      if (topic.title.toLowerCase().includes(query)) score += 10;
      if (topic.summary.toLowerCase().includes(query)) score += 3;
      for (const step of topic.steps) {
        if (step.toLowerCase().includes(query)) score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTopic = topic;
      }
    }

    setSelectedTopicId(bestTopic.id);
    setUserQuestion("");
  };

  const handleActionClick = (topic: GuideTopic) => {
    setIsOpen(false);
    if (topic.actionType === "code_modal") {
      if (onOpenExamModal) {
        onOpenExamModal();
      } else {
        router.push("/portal");
      }
    } else if (topic.actionType === "scroll" || topic.actionUrl.startsWith("#")) {
      const elementId = topic.actionUrl.replace("#", "");
      const elem = document.getElementById(elementId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(topic.actionUrl);
    }
  };

  const selectedTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopicId) || GUIDE_TOPICS[0];
  const TopicIcon = selectedTopic.icon;

  // Dynamic positioning for the assistant card near the floating agent button
  const getWidgetPositionStyles = (): React.CSSProperties => {
    if (typeof window === "undefined") {
      return { bottom: "80px", right: "20px" };
    }

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return {
        bottom: "80px",
        left: "12px",
        right: "12px",
        maxHeight: "calc(100vh - 100px)",
      };
    }

    if (!position) {
      return { bottom: "80px", right: "24px" };
    }

    // On desktop, anchor card to the side of the button so it sits neatly adjacent
    const style: React.CSSProperties = {};
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Horizontal placement: anchor near button X
    if (position.x > winW / 2) {
      style.right = `${Math.max(16, winW - position.x - BTN_SIZE)}px`;
    } else {
      style.left = `${Math.max(16, position.x)}px`;
    }

    // Vertical placement: open above the button if in bottom half, below if in top half
    if (position.y > winH / 2) {
      style.bottom = `${Math.max(16, winH - position.y + 12)}px`;
    } else {
      style.top = `${Math.max(16, position.y + BTN_SIZE + 12)}px`;
    }

    return style;
  };

  return (
    <>
      {/* ═══════ MOVABLE FLOATING AGENT ICON BUTTON ═══════ */}
      <div
        className="fixed z-40 select-none touch-none"
        style={
          position
            ? { left: `${position.x}px`, top: `${position.y}px` }
            : { right: "20px", bottom: "20px" }
        }
      >
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`group relative w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-[#9C3810] via-[#C84B18] to-[#EA580C] text-white shadow-xl hover:shadow-2xl hover:shadow-[#C84B18]/40 border-2 border-white/30 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "cursor-grabbing scale-105"
              : "cursor-grab hover:scale-105 active:scale-95"
          }`}
          title="Ask AI Guide (Click to open, Drag anywhere)"
          aria-label="Ask AI Platform Assistant"
        >
          {/* Inner Bot Icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <Bot className="w-5 h-5 text-white drop-shadow-xs" />
          </div>

          {/* Active Status Pulse */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#C84B18] shadow-xs animate-pulse pointer-events-none" />
        </button>
      </div>

      {/* ═══════ FLOATING AI AGENT POPUP WINDOW (OPEN NEAR AGENT ICON) ═══════ */}
      {isOpen && (
        <div
          ref={widgetRef}
          style={getWidgetPositionStyles()}
          className="fixed z-50 w-[calc(100vw-24px)] sm:w-[410px] md:w-[430px] h-[560px] max-h-[calc(100vh-100px)] rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/25 dark:shadow-black/70 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 ring-1 ring-slate-900/5 dark:ring-white/10 select-none"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-[#131D35] to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9C3810] via-[#C84B18] to-[#EA580C] flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Testora AI Assistant
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Instant step-by-step guidance &amp; quick actions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {answeredQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAnsweredQuery(null);
                    setSelectedTopicId("create-quiz");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset to all guides"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Questions Chips / Shortcuts */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 pl-1">
              Topics:
            </span>
            {GUIDE_TOPICS.map((topic) => {
              const active = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setAnsweredQuery(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                    active
                      ? "bg-[#C84B18] text-white border-[#C84B18] shadow-xs"
                      : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{topic.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area: Step-by-Step Instructions & Action Button */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#0D1527]">
            
            {/* If user asked a question, show user prompt pill */}
            {answeredQuery && (
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-xs text-orange-900 dark:text-orange-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C84B18] shrink-0" />
                <span className="font-semibold truncate">Q: &ldquo;{answeredQuery}&rdquo;</span>
              </div>
            )}

            {/* Topic Overview Card */}
            <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${selectedTopic.color}`}>
                  <TopicIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedTopic.title}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {selectedTopic.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {selectedTopic.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span>Step-by-Step Instructions</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedTopic.steps.length} Steps
                </span>
              </div>

              <div className="space-y-2">
                {selectedTopic.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#111A30] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed hover:border-blue-400/50 dark:hover:border-blue-500/40 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#9C3810] via-[#C84B18] to-[#EA580C] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CLICKABLE ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleActionClick(selectedTopic)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>{selectedTopic.actionText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Bottom Question Input Bar ("Kaha user kuch pooch sakta") */}
          <div className="p-3 bg-slate-50 dark:bg-[#0B1120] border-t border-slate-200/90 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion(userQuestion);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Ask a question (e.g. how to create quiz, proctoring)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={!userQuestion.trim()}
                className="p-2 rounded-xl bg-[#C84B18] hover:bg-[#B33F10] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                title="Send Question"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
