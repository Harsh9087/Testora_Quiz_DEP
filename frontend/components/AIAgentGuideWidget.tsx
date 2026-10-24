"use client";

import { useState } from "react";
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
  Send
} from "lucide-react";

interface GuideTopic {
  id: string;
  title: string;
  badge: string;
  icon: any;
  color: string;
  summary: string;
  steps: string[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "forms-registrations",
    title: "Student Data Collection Forms",
    badge: "New Feature",
    icon: ClipboardList,
    color: "text-[#C84B18] bg-[#C84B18]/10",
    summary: "Collect student information via shareable online forms without requiring students to create accounts, and import directly into Student Directories.",
    steps: [
      "Navigate to 'Forms & Registrations' from the faculty dashboard sidebar.",
      "Click 'Create Registration Form' and enter only the Form Name (e.g. 'Section C AIML').",
      "TestoraQuiz automatically includes the 6 predefined mandatory fields (Full Name, Email, Roll Number, Phone, Section, Branch).",
      "Copy the unique shareable link or display the QR code for students to scan on mobile.",
      "Students open the link and submit their details without needing to sign up or log in.",
      "Review submissions in your dashboard, detect duplicate roll numbers, and click 'Import to Directory' or 'Export Excel'."
    ]
  },
  {
    id: "custom-forms",
    title: "AI-Powered Custom Form Builder",
    badge: "AI Builder",
    icon: Wand2,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
    summary: "Generate custom surveys, workshop evaluations, and event registrations simply by describing them in natural language.",
    steps: [
      "Go to 'AI Form Builder' from the sidebar.",
      "Type a natural language prompt (e.g. 'Create a workshop feedback form with ratings, content clarity, and suggestions').",
      "Click 'Generate Form with AI' — Gemini will synthesize structured questions, input types, and choices.",
      "Preview and edit question labels, reorder fields, add new questions, or toggle required settings.",
      "Click 'Publish & Generate Link' to share with respondents across WhatsApp or Email.",
      "View live submissions with dynamic columns matching your questions and export to Excel with 1-click."
    ]
  },
  {
    id: "quiz-creation",
    title: "Create Quiz & RAG Knowledge Base",
    badge: "Core Workflow",
    icon: FileEdit,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    summary: "Synthesize calibrated assessments from course documents, textbook chapters, or custom syllabus blueprints.",
    steps: [
      "Open 'Create Quiz Wizard' from the Creator Studio sidebar.",
      "Step 1: Upload course files (PDF, DOCX, TXT) to the Knowledge Base for ChromaDB vector indexing.",
      "Step 2: Choose difficulty, question distribution (MCQs, Subjective, True/False), and passing criteria.",
      "Step 3: Review AI-generated question items with LaTeX math formulas and edit as needed.",
      "Step 4: Set scheduled time windows, anti-cheat rules, and publish to students."
    ]
  },
  {
    id: "student-portal",
    title: "Student Exam Portal & Anti-Cheat",
    badge: "Candidate HUD",
    icon: ShieldAlert,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
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
    badge: "Directory",
    icon: Users,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    summary: "Maintain cohorts, divisions, and batches for targeting assessments to specific groups of students.",
    steps: [
      "Access 'Student Directory' in the sidebar.",
      "Create directories manually, upload via the standard Excel/CSV template, or import from Online Forms.",
      "Assign exams directly to an entire directory so candidates see their assessments automatically in their portal.",
      "Download candidate credentials and passcodes in CSV format with 1 click."
    ]
  }
];

export default function AIAgentGuideWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("forms-registrations");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopicId) || GUIDE_TOPICS[0];

  const filteredTopics = GUIDE_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* ═══════ FLOATING AI AGENT TRIGGER BUTTON ═══════ */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#9C3810] via-[#C84B18] to-[#EA580C] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
          title="Open AI Platform Guide & Assistant"
        >
          {/* Agent Avatar Icon */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            {/* Online Pulse Indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#C84B18] animate-pulse" />
          </div>

          <div className="text-left hidden sm:block pr-1">
            <div className="text-[11px] font-extrabold tracking-tight leading-none flex items-center gap-1">
              <span>Platform Guide</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>
            <span className="text-[9px] text-white/80 font-medium">How to use features</span>
          </div>
        </button>
      </div>

      {/* ═══════ INTERACTIVE AI GUIDE MODAL / DRAWER ═══════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl max-w-3xl w-full h-[620px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E5E0D8] dark:border-[#292524] flex items-center justify-between bg-[#FAF8F5] dark:bg-[#1E1C1A]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9C3810] via-[#C84B18] to-[#EA580C] flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                      TestoraQuiz AI Platform Assistant
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C84B18]/10 text-[#C84B18] dark:text-[#EA580C]">
                      Interactive Guide
                    </span>
                  </div>
                  <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                    Step-by-step instructions for all features across the platform
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-[#716D67] hover:bg-white dark:hover:bg-[#171615] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search / Filter Bar */}
            <div className="p-3 border-b border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#171615]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8A29E]" />
                <input
                  type="text"
                  placeholder="Ask or search: How to create online forms, import students, build custom tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none placeholder:text-[#A8A29E]"
                />
              </div>
            </div>

            {/* Body: Split Layout (Topics Sidebar + Step-by-Step Details) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Topics List */}
              <div className="w-full md:w-64 border-r border-[#E5E0D8] dark:border-[#292524] overflow-y-auto p-2.5 space-y-1.5 bg-[#FAF8F5]/60 dark:bg-[#171615]">
                <div className="text-[10px] font-bold text-[#8C827A] px-2.5 py-1 uppercase tracking-wider">
                  Platform Features ({filteredTopics.length})
                </div>
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopic.id === topic.id;
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-[#C84B18] text-white shadow-xs"
                          : "text-[#57534E] dark:text-[#A8A29E] hover:bg-white dark:hover:bg-[#201D1A] hover:text-[#242321] dark:hover:text-[#F5F5F4]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : ""}`} />
                        <span className="truncate">{topic.title}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-[#A8A29E]"}`} />
                    </button>
                  );
                })}
              </div>

              {/* Right Topic Details & Steps */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white dark:bg-[#171615]">
                
                {/* Topic Header Card */}
                <div className="space-y-2 pb-4 border-b border-[#E5E0D8] dark:border-[#292524]">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl ${selectedTopic.color}`}>
                      <selectedTopic.icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-[#242321] dark:text-[#F5F5F4]">
                          {selectedTopic.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524] text-[#716D67] dark:text-[#A8A29E]">
                          {selectedTopic.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                        {selectedTopic.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#716D67]">
                    Step-by-Step Instructions
                  </div>

                  <div className="space-y-2.5">
                    {selectedTopic.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8]/70 dark:border-[#292524] text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#C84B18] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-[#242321] dark:text-[#F5F5F4] leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[#8C827A]">Ready to try this feature?</span>
                  <a
                    href="/dashboard/teacher"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C84B18] hover:bg-[#B33F10] text-white font-bold transition-all shadow-xs"
                  >
                    <span>Launch Faculty Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
