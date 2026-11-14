"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Sparkles, 
  X, 
  Search, 
  ClipboardList, 
  Wand2, 
  FileEdit, 
  Users, 
  Send, 
  ExternalLink, 
  KeyRound, 
  ShieldCheck, 
  RefreshCw,
  Award,
  Layers,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Zap
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
    id: "test-drive",
    title: "New User Quick Start & Test Drive",
    shortTitle: "🚀 Quick Test",
    badge: "New User Guide",
    icon: Sparkles,
    color: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    summary: "Welcome to Testora Quiz! Test and explore every major feature in 1 click without complicated setups. Follow this quick test drive to experience the entire assessment ecosystem.",
    steps: [
      "⚡ Free Mock Tests: Practice with timed tests, Bloom's cognitive taxonomy, PYQ tracking, and instant auto-grading.",
      "📚 Study Material & Notes: Access curated company-specific placement guides (TCS, Wipro), DSA sheets, and CS core subjects.",
      "🤖 AI Form Builder: Type any form requirement in plain English and watch Testora AI construct custom fields, validations, and shareable links.",
      "🔑 Candidate Exam HUD: Test how students take scheduled assessments using a 6-digit access code (Try demo code: DEMO-2026).",
      "🎓 Tamper-Proof Certificates: Inspect official academic credentials with cryptographic verification and 300-DPI vector PDF downloads.",
      "🛡️ Anti-Cheat Proctoring: Server-side focus monitoring, tab-switch telemetry, and fullscreen lock enforce exam integrity."
    ],
    actionText: "Start With Free Mock Tests →",
    actionUrl: "/dashboard/student?tab=mock-tests",
    actionType: "link",
    keywords: ["test", "test all", "new user", "guide", "cat bot", "cah bot", "chat bot", "chatbot", "start", "demo", "tour", "how to use", "explore", "first time", "welcome", "all"]
  },
  {
    id: "mock-tests",
    title: "Free Mock Test Library",
    shortTitle: "Mock Tests",
    badge: "100% Free Practice",
    icon: Layers,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/40",
    summary: "Practice with full-length mock tests, subject-wise quizzes, and exam-oriented preparation resources with authentic PYQ tracking.",
    steps: [
      "Click 'Explore Mock Tests' from the home section or open Mock Tests in your student dashboard.",
      "Browse standardized tests by category: Corporate Placements (TCS, Wipro), JEE, NEET, SSC, Banking, or Engineering domains.",
      "Review the exam specifications: total questions, duration, marking scheme (+3/-1), and PYQ origin.",
      "Attempt the test in the realistic exam HUD with countdown timer, question palette, and autosaved answers.",
      "Submit to view instant performance telemetry, topic mastery scorecards, and step-by-step solutions."
    ],
    actionText: "Explore Mock Tests Now →",
    actionUrl: "/dashboard/student?tab=mock-tests",
    actionType: "link",
    keywords: ["mock", "test", "practice", "jee", "neet", "ssc", "banking", "free", "pyq", "exam library", "speed test", "questions", "placement"]
  },
  {
    id: "study-materials",
    title: "Study Material & Placement Notes",
    shortTitle: "Study Material",
    badge: "Free & Pro Notes",
    icon: BookOpen,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/40",
    summary: "Access curated semester notes, company-specific placement guides (TCS, Wipro, Accenture), DSA problem-solving sheets, and CS core subject cheat-sheets.",
    steps: [
      "Open 'Study Material' from the sidebar or click the Study Material link in the navbar.",
      "Filter notes by category: Company Notes (TCS, Wipro & More), DSA & Problem Solving, Web Development, or Cloud Computing.",
      "Look for 'FREE' tags for instant reading, or unlock comprehensive placement bundles using wallet credits.",
      "Read structured markdown summaries with syntax-highlighted code, diagrams, and key takeaway bullets.",
      "Download or save notes for offline interview preparation and last-minute revision."
    ],
    actionText: "Explore Study Materials →",
    actionUrl: "/dashboard/study-material",
    actionType: "link",
    keywords: ["study", "notes", "material", "tcs", "wipro", "placement", "dsa", "pdf", "revision", "interview", "cheat sheet", "free notes", "company notes"]
  },
  {
    id: "custom-forms",
    title: "AI-Powered Custom Form Builder",
    shortTitle: "AI Form Builder",
    badge: "Prompt-to-Form",
    icon: Wand2,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/40",
    summary: "Describe any workshop evaluation, feedback survey, or event registration in plain English, and Testora AI synthesizes the form instantly.",
    steps: [
      "Open 'Custom Forms' from the faculty sidebar or click 'AI Forms' in the top navigation.",
      "Enter a natural language description of your form (e.g. 'Post-exam feedback with rating scales and open comments').",
      "AI automatically generates calibrated form sections, dropdowns, checkboxes, and text inputs.",
      "Customize field labels, toggle required validation, and click 'Publish & Copy Link'.",
      "Analyze response charts and export submissions directly to CSV / Excel."
    ],
    actionText: "Open AI Form Studio →",
    actionUrl: "/dashboard/teacher?tab=custom-forms",
    actionType: "link",
    keywords: ["ai form", "custom form", "builder", "survey", "feedback", "workshop", "poll", "prompt", "synthesize", "forms"]
  },
  {
    id: "forms-registrations",
    title: "Student Data Collection Forms",
    shortTitle: "Student Forms",
    badge: "0-Login Required",
    icon: ClipboardList,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/40",
    summary: "Collect student roster information via shareable online forms without requiring students to create accounts, and import directly into Student Directories.",
    steps: [
      "Navigate to 'Forms & Registrations' from the faculty dashboard sidebar.",
      "Click 'Create Registration Form' and enter the Form Name (e.g. 'CS Branch Batch 2026').",
      "Copy the unique shareable link or present the QR code for students to scan on mobile.",
      "Students fill in their Name, Email, Roll Number, and Phone without creating accounts or signing in.",
      "Access submitted responses in the dashboard and export directly to CSV / Excel or import into student rosters."
    ],
    actionText: "Open Forms & Registrations →",
    actionUrl: "/dashboard/teacher?tab=forms",
    actionType: "link",
    keywords: ["form", "registration", "student form", "collect", "qr", "link", "no login", "data", "excel", "roster", "student info"]
  },
  {
    id: "student-portal",
    title: "Take Your Test (Exam Code Access)",
    shortTitle: "Take Test",
    badge: "Exam Code Access",
    icon: KeyRound,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/40",
    summary: "Students can access scheduled exams using a unique 6-digit access code without complicated account setups.",
    steps: [
      "Click 'Enter Exam Code' or visit the Candidate Portal.",
      "Enter the 6-digit assessment access code provided by your course instructor (e.g., DEMO-2026).",
      "Verify your full name, roll number, and student credentials on the verification screen.",
      "Complete the system proctoring check (camera, fullscreen mode, and browser permissions).",
      "Answer questions with real-time autosave. Every response is securely preserved locally and synced to the cloud."
    ],
    actionText: "Enter Exam Code Now →",
    actionUrl: "modal:exam-code",
    actionType: "code_modal",
    keywords: ["take", "student", "code", "enter", "access", "exam code", "portal", "candidate", "start", "attempt", "demo code"]
  },
  {
    id: "certificates",
    title: "Automated Verifiable Certificates",
    shortTitle: "Certificates",
    badge: "Tamper-Proof QR",
    icon: Award,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/40",
    summary: "Design professional certificates, automatically issue credentials to eligible students, and verify achievements via public QR codes.",
    steps: [
      "Access 'Certificate Management' in the faculty dashboard or verify any issued credential.",
      "Select an official template style: Classic Academic, Modern Navy & Gold, or Minimal Azure.",
      "Co-brand certificates with your institute logo, accredited examination center title, and director signature.",
      "Set automated issuance thresholds: minimum score percentage or attendance criteria.",
      "Deliver credentials automatically via email with 300-DPI A4 vector PDF download and instant QR verification."
    ],
    actionText: "Explore Certificate Features →",
    actionUrl: "/dashboard/student?tab=certificates",
    actionType: "link",
    keywords: ["certificate", "award", "degree", "verify", "qr", "pdf", "template", "gold", "seal", "credentials", "excellence"]
  },
  {
    id: "create-quiz",
    title: "Create Smart Tests with AI",
    shortTitle: "Create Tests",
    badge: "Faculty Studio",
    icon: FileEdit,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-800/40",
    summary: "Synthesize calibrated assessments from syllabus blueprints, textbook chapters, or custom question banks with Smart AI.",
    steps: [
      "Open 'Teacher Assessment Studio' from the home card or faculty dashboard.",
      "Click 'Create Test' and select your academic domain (e.g. Computer Science, Engineering, Mathematics).",
      "Upload course PDFs or DOCX files into the secure course Knowledge Base for exact syllabus alignment.",
      "Choose question distribution: MCQs, Subjective, True/False, and calibrate Bloom's taxonomy cognitive levels (L1 to L6).",
      "Review synthesized items with auto-formatted KaTeX formulas, configure proctoring limits, and publish your test."
    ],
    actionText: "Open Instructor Studio →",
    actionUrl: "/dashboard/teacher",
    actionType: "link",
    keywords: ["create", "exam", "test", "quiz", "make", "generate", "ai questions", "teacher", "syllabus", "pdf", "latex", "math"]
  },
  {
    id: "anti-cheat",
    title: "Anti-Cheat Proctor Radar",
    shortTitle: "Anti-Cheat",
    badge: "Server-Enforced",
    icon: ShieldCheck,
    color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200/80 dark:border-cyan-800/40",
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
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/40",
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

// Suggested quick prompts displayed above search input
const QUICK_PROMPTS = [
  { label: "🚀 New User Tour", query: "test all features for new user guide" },
  { label: "⚡ Mock Tests", query: "how to practice free mock tests" },
  { label: "📚 Study Notes", query: "study materials and placement notes" },
  { label: "🤖 AI Form Builder", query: "how to create ai custom form" },
  { label: "🔑 Enter Exam Code", query: "how to enter exam code as student" },
  { label: "🎓 Certificates", query: "how to issue and verify certificates" },
  { label: "🛡️ Anti-Cheat", query: "what are the proctoring and tab switch rules" }
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

  const [selectedTopicId, setSelectedTopicId] = useState<string>("test-drive");
  const [userQuestion, setUserQuestion] = useState("");
  const [answeredQuery, setAnsweredQuery] = useState<string | null>(null);
  const [copiedStepIdx, setCopiedStepIdx] = useState<number | null>(null);

  // Content scroll ref to ensure step 1 is never cut off
  const contentRef = useRef<HTMLDivElement>(null);

  // Global event listener so any button can open the AI guide
  useEffect(() => {
    const handleOpenGuide = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.topicId) {
        setSelectedTopicId(e.detail.topicId);
      }
    };
    window.addEventListener("open-ai-guide", handleOpenGuide);
    return () => window.removeEventListener("open-ai-guide", handleOpenGuide);
  }, []);

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

  const BTN_SIZE = 54;
  const PADDING = 14;

  // Whenever selected topic changes, scroll to top smoothly so step 1 is fully visible
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedTopicId, answeredQuery]);

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
        // Fallback to default
      }

      // Default: bottom-right corner
      setPosition({
        x: Math.max(PADDING, window.innerWidth - BTN_SIZE - 20),
        y: Math.max(PADDING, window.innerHeight - BTN_SIZE - 24),
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

  // Keyboard navigation: Escape key closes the widget
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside listener
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

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 120);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    const currentX = position?.x ?? Math.max(PADDING, window.innerWidth - BTN_SIZE - 20);
    const currentY = position?.y ?? Math.max(PADDING, window.innerHeight - BTN_SIZE - 24);

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

  // Smart Search & Question Matcher with friendly NLP intent handling
  const handleAskQuestion = (q: string) => {
    const query = q.trim().toLowerCase();
    if (!query) return;

    setAnsweredQuery(q);

    // 1. Direct intent recognition for new users & common features
    if (
      query.includes("cat bot") ||
      query.includes("cah bot") ||
      query.includes("chat bot") ||
      query.includes("chatbot") ||
      query.includes("test all") ||
      query.includes("new user") ||
      query.includes("guide") ||
      query.includes("tour") ||
      query.includes("start") ||
      query.includes("hello") ||
      query.includes("hi") ||
      query.includes("explore")
    ) {
      setSelectedTopicId("test-drive");
      setUserQuestion("");
      return;
    }

    if (query.includes("notes") || query.includes("study") || query.includes("material") || query.includes("dsa") || query.includes("company")) {
      setSelectedTopicId("study-materials");
      setUserQuestion("");
      return;
    }

    if (query.includes("mock") || query.includes("practice") || query.includes("test library") || query.includes("pyq")) {
      setSelectedTopicId("mock-tests");
      setUserQuestion("");
      return;
    }

    if (query.includes("ai form") || query.includes("form builder") || query.includes("generate form")) {
      setSelectedTopicId("custom-forms");
      setUserQuestion("");
      return;
    }

    if (query.includes("code") || query.includes("passcode") || query.includes("take exam") || query.includes("portal")) {
      setSelectedTopicId("student-portal");
      setUserQuestion("");
      return;
    }

    if (query.includes("certificate") || query.includes("verify") || query.includes("badge") || query.includes("qr")) {
      setSelectedTopicId("certificates");
      setUserQuestion("");
      return;
    }

    if (query.includes("cheat") || query.includes("proctor") || query.includes("tab") || query.includes("camera")) {
      setSelectedTopicId("anti-cheat");
      setUserQuestion("");
      return;
    }

    // 2. Fallback weighted scoring
    let bestTopic = GUIDE_TOPICS[0];
    let highestScore = -1;

    for (const topic of GUIDE_TOPICS) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (query.includes(kw)) score += 6;
      }
      if (topic.title.toLowerCase().includes(query)) score += 12;
      if (topic.shortTitle.toLowerCase().includes(query)) score += 10;
      if (topic.summary.toLowerCase().includes(query)) score += 4;
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
      } else {
        router.push("/" + topic.actionUrl);
      }
    } else {
      router.push(topic.actionUrl);
    }
  };

  const handleCopyStep = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStepIdx(idx);
    setTimeout(() => {
      setCopiedStepIdx(null);
    }, 1500);
  };

  // Find active topic (fallback to forms-registrations or first item)
  const selectedTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopicId) || 
    GUIDE_TOPICS.find((t) => t.id === "forms-registrations") || 
    GUIDE_TOPICS[0];
  const TopicIcon = selectedTopic.icon;

  // Dynamic positioning for the assistant card near the floating agent button
  const getWidgetPositionStyles = (): React.CSSProperties => {
    if (typeof window === "undefined") {
      return { bottom: "84px", right: "20px" };
    }

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return {
        bottom: "84px",
        left: "12px",
        right: "12px",
        maxHeight: "calc(100vh - 100px)",
      };
    }

    if (!position) {
      return { bottom: "84px", right: "24px" };
    }

    const style: React.CSSProperties = {};
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    if (position.x > winW / 2) {
      style.right = `${Math.max(16, winW - position.x - BTN_SIZE)}px`;
    } else {
      style.left = `${Math.max(16, position.x)}px`;
    }

    if (position.y > winH / 2) {
      style.bottom = `${Math.max(16, winH - position.y + 14)}px`;
    } else {
      style.top = `${Math.max(16, position.y + BTN_SIZE + 14)}px`;
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
            : { right: "20px", bottom: "24px" }
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
          className={`group relative w-[54px] h-[54px] rounded-full bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#FB923C] text-white shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 border-2 border-white/40 dark:border-slate-700/60 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "cursor-grabbing scale-105"
              : "cursor-grab hover:scale-105 active:scale-95"
          }`}
          title="Ask Testora AI Guide (Click to open, Drag anywhere)"
          aria-label="Ask Testora AI Platform Assistant"
        >
          {/* Inner Bot Icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <Bot className="w-5 h-5 text-white drop-shadow-xs" />
          </div>

          {/* Active Status Pulse */}
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#EA580C] shadow-xs animate-pulse pointer-events-none" />
        </button>
      </div>

      {/* ═══════ UPGRADED FLOATING AI AGENT POPUP WINDOW ═══════ */}
      {isOpen && (
        <div
          ref={widgetRef}
          style={getWidgetPositionStyles()}
          className="fixed z-50 w-[calc(100vw-24px)] sm:w-[440px] md:w-[460px] h-[610px] max-h-[calc(100vh-100px)] rounded-3xl bg-[#090F1E] text-slate-100 border border-slate-700/70 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 ring-1 ring-white/10 select-none backdrop-blur-xl"
        >
          {/* ── 1. HEADER (Deep Sapphire Navy + Orange AI Bot + LIVE + Close) ── */}
          <div className="px-4 py-3 bg-[#070D1B] text-white flex items-center justify-between border-b border-slate-800/90 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Vibrant Orange AI Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#FB923C] flex items-center justify-center text-white shadow-md shadow-orange-600/30 ring-1 ring-white/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                    Testora AI Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight truncate">
                  Instant step-by-step guidance &amp; quick actions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {answeredQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAnsweredQuery(null);
                    setSelectedTopicId("forms-registrations");
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset to all guides"
                  aria-label="Reset question"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Close assistant"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 2. UPGRADED TOPIC NAVIGATION PILLS (Horizontal Scroll with All 8 Modules) ── */}
          <div 
            role="tablist" 
            aria-label="Assistant Topics"
            className="px-3.5 py-2.5 bg-[#0B1326] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0"
          >
            {GUIDE_TOPICS.map((topic) => {
              const active = selectedTopic.id === topic.id;
              const IconComp = topic.icon;
              return (
                <button
                  key={topic.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setAnsweredQuery(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-[#1765F5] hover:bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                      : "bg-[#101B34] text-slate-300 hover:bg-[#162548] hover:text-white border border-slate-700/80"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 opacity-80" />
                  <span>{topic.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* ── 3. MAIN CONTENT (Scrollable Instructions & Action, Auto-Reset to Top) ── */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-[#090F1E] scroll-smooth"
          >
            {/* If user asked a question, show AI Prompt Confirmation Banner */}
            {answeredQuery && (
              <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#1765F5] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">Query: &ldquo;{answeredQuery}&rdquo;</div>
                  <div className="text-[11px] text-blue-300/90 mt-0.5">Matched best platform guide below:</div>
                </div>
              </div>
            )}

            {/* Topic Overview Card */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#0F1A34] border border-slate-700/60 shadow-xs">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${selectedTopic.color}`}>
                <TopicIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    {selectedTopic.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {selectedTopic.badge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-1">
                  {selectedTopic.summary}
                </p>
              </div>
            </div>

            {/* 1-Click Interactive Feature Testing Grid for New Users */}
            {selectedTopic.id === "test-drive" && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Instant 1-Click Feature Testing</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">
                    Test All
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      const el = document.getElementById("mock-tests");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      else router.push("/dashboard/student?tab=mock-tests");
                    }}
                    className="p-2.5 rounded-xl bg-[#0D182E] hover:bg-[#122344] border border-blue-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Free Mock Tests</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Practice with PYQs</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard/study-material");
                    }}
                    className="p-2.5 rounded-xl bg-[#0D182E] hover:bg-[#122344] border border-purple-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Study Material</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">TCS, Wipro &amp; DSA</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      const el = document.getElementById("form-builder");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      else router.push("/dashboard/teacher?tab=custom-forms");
                    }}
                    className="p-2.5 rounded-xl bg-[#0D182E] hover:bg-[#122344] border border-amber-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <Wand2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">AI Form Builder</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Describe &amp; generate</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenExamModal) onOpenExamModal();
                      else router.push("/portal");
                    }}
                    className="p-2.5 rounded-xl bg-[#0D182E] hover:bg-[#122344] border border-emerald-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Enter Exam Code</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Try DEMO-2026</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step-by-Step Instructions Block (Never cut off) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-300 px-0.5">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>STEP-BY-STEP INSTRUCTIONS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-semibold">
                  {selectedTopic.steps.length} STEPS
                </span>
              </div>

              {/* Numbered Step Cards */}
              <div className="space-y-2">
                {selectedTopic.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-start gap-3 p-3.5 rounded-2xl bg-[#0D182E] border border-slate-700/70 text-xs sm:text-[13px] text-slate-200 leading-relaxed shadow-sm hover:border-blue-500/50 hover:bg-[#101E39] transition-all"
                  >
                    {/* Royal Blue Step Badge matching reference */}
                    <span className="w-6 h-6 rounded-full bg-[#1765F5] text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-blue-600/30">
                      {idx + 1}
                    </span>
                    <span className="flex-1 pt-0.5 font-normal leading-relaxed text-slate-200">
                      {step}
                    </span>
                    
                    {/* Copy step button */}
                    <button
                      type="button"
                      onClick={() => handleCopyStep(step, idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-opacity cursor-pointer shrink-0"
                      title="Copy step instruction"
                    >
                      {copiedStepIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clickable Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleActionClick(selectedTopic)}
                className="w-full py-3 px-4 rounded-xl bg-[#1765F5] hover:bg-[#1253CE] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all cursor-pointer"
              >
                <span>{selectedTopic.actionText}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* ── 4. QUICK PROMPT CHIPS & SEARCH INPUT ── */}
          <div className="p-3 bg-[#070D1B] border-t border-slate-800/90 shrink-0 space-y-2">
            
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Ask:</span>
              </span>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskQuestion(p.query)}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-medium bg-[#101A33] hover:bg-[#162548] text-slate-300 hover:text-white border border-slate-700/70 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search / Question Input Bar */}
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
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#0F182F] border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!userQuestion.trim()}
                className="p-2.5 rounded-xl bg-[#1765F5] hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                title="Send Question"
                aria-label="Send Question"
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
