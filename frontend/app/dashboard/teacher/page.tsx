"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";
import { useToast } from "../../../components/Toast";
import { apiFetch, API_V1, getWebSocketUrl } from "../../../lib/api";
import { 
  parseUtcDate, formatLocalizedDate, formatLocalForInput, 
  formatISTDate, formatISTTime, formatISTDateTime, formatISTForInput, parseISTInputToUtcIso 
} from "../../../lib/dateUtils";

import { 
  Plus, BookOpen, Calendar, ChevronRight, ChevronLeft, ChevronDown, Check,
  Users, BarChart3, GraduationCap, Clock, 
  Sparkles, ArrowRight, ArrowLeft, Radio, FileSpreadsheet,
  UploadCloud, CloudUpload, FileUp, FileText, FilePlus, FileEdit, FileDown, Loader2, CheckCircle2, X, RefreshCw, Trash2,
  Lightbulb, HelpCircle, Sliders, Scale, Layers, Calculator,
  ClipboardList, Wand2, ArrowUpRight, Database,
  UserCheck, Contact, Settings, Play, AlertCircle, ShieldCheck, Eye, Key,
  Camera, Bot, Sparkles as SparklesIcon, Award, ExternalLink, Coins
} from "lucide-react";

import StudentDirectoryManager from "./_components/StudentDirectoryManager";
import CreateDirectoryModal from "./_components/CreateDirectoryModal";
import KnowledgeBaseManager from "./_components/KnowledgeBaseManager";
import QuestionBankManager from "./_components/QuestionBankManager";
import LiveAssessmentsTable from "./_components/LiveAssessmentsTable";
import PaperStudioModal from "./_components/PaperStudioModal";
import LiveProctoringModal from "./_components/LiveProctoringModal";
import ExamPaymentModal from "./_components/ExamPaymentModal";
import CreditRechargeModal from "./_components/CreditRechargeModal";
import GradebookAnalytics from "./_components/GradebookAnalytics";
import UploadKBModal from "./_components/UploadKBModal";
import FormsRegistrationManager from "./_components/FormsRegistrationManager";
import CustomFormsManager from "./_components/CustomFormsManager";
import CSVImportModal from "./_components/CSVImportModal";
import CertificateStudioModal from "./_components/CertificateStudioModal";
import CertificateManagementDrawer from "./_components/CertificateManagementDrawer";
import TeacherMockTestLibrary from "./_components/TeacherMockTestLibrary";
import CompanyPlacementTests from "../student/_components/CompanyPlacementTests";
import { fetchStudentDirectories } from "@/lib/api/studentDirectories";
import { StudentDirectory } from "@/types/studentDirectory";

interface ReadyMadePrompt {
  id: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  prompt: string;
}

const READY_MADE_PROMPTS: ReadyMadePrompt[] = [
  {
    id: "code-debugging",
    title: "Code & Bug Hunt",
    icon: "💻",
    badge: "Coding / STEM",
    description: "Embed code snippets & edge cases",
    prompt: "Include concise Python or JavaScript code snippets in questions. Ask students to predict terminal output, trace variable states, or identify subtle syntax and logical errors.",
  },
  {
    id: "numerical-calc",
    title: "Numerical Calculations",
    icon: "🧮",
    badge: "Math & Physics",
    description: "Multi-step quantitative calculations",
    prompt: "Focus on multi-step numerical calculations. Provide explicit input variables and formulas, requiring students to calculate exact numerical solutions.",
  },
  {
    id: "case-scenario",
    title: "Workplace Case Studies",
    icon: "🏢",
    badge: "Applied / Business",
    description: "Real-world dilemmas & diagnosis",
    prompt: "Frame questions as realistic workplace scenarios. Require students to analyze the situation, evaluate architectural trade-offs, and recommend optimal decisions.",
  },
  {
    id: "critical-theory",
    title: "Deep Concepts (Anti-Guessing)",
    icon: "🧠",
    badge: "Conceptual",
    description: "Deep theory with plausible distractors",
    prompt: "Strictly avoid trivial definitions or rote memorization. Craft plausible distractors reflecting common student misconceptions to evaluate deep understanding.",
  },
  {
    id: "assertion-reason",
    title: "Assertion & Reason",
    icon: "⚖️",
    badge: "Analytical Reasoning",
    description: "Logical causality & truth values",
    prompt: "Formulate Assertion and Reason pairs. Test whether Assertion and Reason are true independently, and whether the Reason correctly explains the Assertion.",
  },
  {
    id: "foundational-clear",
    title: "Foundational & Clear",
    icon: "🎯",
    badge: "Introductory",
    description: "Accessible language with zero jargon",
    prompt: "Keep questions straightforward, direct, and unambiguous. Focus on fundamental principles with clear, educational explanations for each option.",
  },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const { token, fullName, role } = useAuthStore();
  const { showToast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<string>("overview");

  const isOverview = activeSectionTab === "all" || activeSectionTab === "overview" || !activeSectionTab;

  useEffect(() => {
    const activeRole = role || (typeof window !== "undefined" ? localStorage.getItem("role") : null);
    if (activeRole === "student") {
      router.replace("/dashboard/student");
    }
  }, [role, router]);

  const switchSectionTab = (tab: string) => {
    const normalized = (tab === "all" || tab === "overview" || !tab) ? "overview" : tab;
    setActiveSectionTab(normalized);
    if (normalized === "create") {
      reloadStudentDirectories();
    }
    if (typeof window !== "undefined") {
      if (normalized === "overview") {
        if (window.location.hash) {
          window.history.pushState(null, "", window.location.pathname);
        }
      } else {
        window.location.hash = normalized;
      }
      window.scrollTo(0, 0);
      window.dispatchEvent(new CustomEvent("switch-tab", { detail: normalized }));
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveSectionTab(hash);
      } else {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab) {
          setActiveSectionTab(tab);
        } else {
          setActiveSectionTab("overview");
        }
      }
    };
    handleHash();
    const handleCustom = (e: any) => {
      if (e.detail) {
        const target = e.detail === "all" ? "overview" : e.detail;
        setActiveSectionTab(target);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("switch-tab", handleCustom);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("switch-tab", handleCustom);
    };
  }, []);
  
  // Data states
  const [createStep, setCreateStep] = useState<number>(1);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [documents, setDocuments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any | null>(null);
  const [kbSubjects, setKbSubjects] = useState<any[]>([]);
  const [registrationFormsCount, setRegistrationFormsCount] = useState<number>(0);
  
  // Step 1 Direct KB Upload state
  const [step1SourceMode, setStep1SourceMode] = useState<"select" | "upload" | "ai_prompt" | "camera">("select");
  const [step1UploadFile, setStep1UploadFile] = useState<File | null>(null);
  const [step1UploadSubject, setStep1UploadSubject] = useState("");
  const [isStep1Uploading, setIsStep1Uploading] = useState(false);
  const [step1UploadSuccess, setStep1UploadSuccess] = useState<{ fileName: string; subjectId: string } | null>(null);
  const [isStep1KbModalOpen, setIsStep1KbModalOpen] = useState(false);
  const [step1IsDragging, setStep1IsDragging] = useState(false);
  // AI Prompt mode state
  const [step1AiPrompt, setStep1AiPrompt] = useState("");
  // Camera mode state
  const [step1CameraPhoto, setStep1CameraPhoto] = useState<File | null>(null);
  const [step1CameraPreview, setStep1CameraPreview] = useState<string | null>(null);
  const [step1CameraUploading, setStep1CameraUploading] = useState(false);
  
  // Modal states
  const [previewExam, setPreviewExam] = useState<any | null>(null);
  const [liveProctorExam, setLiveProctorExam] = useState<any | null>(null);
  const [liveProctorAlerts, setLiveProctorAlerts] = useState<any[]>([]);
  const [paymentModalExam, setPaymentModalExam] = useState<any | null>(null);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [showTeacherPromo, setShowTeacherPromo] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("testora_teacher_promo_dismissed");
      if (dismissed === "true") {
        setShowTeacherPromo(false);
      }
    }
  }, []);

  // Certificate Settings State
  const [enableCertificate, setEnableCertificate] = useState(false);
  const [isCertStudioOpen, setIsCertStudioOpen] = useState(false);
  const [certDrawerExam, setCertDrawerExam] = useState<{ id: string; name: string } | null>(null);
  const [certificateConfig, setCertificateConfig] = useState<any>({
    template_id: "testora_default",
    passing_criteria_type: "percentage",
    passing_criteria_value: 40,
    institute_name: "",
    display_marks: true,
    display_percentage: true,
    display_grade: true,
  });

  // Form: Exam Generator
  const [examName, setExamName] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examTopic, setExamTopic] = useState("General");
  const [examDuration, setExamDuration] = useState("30");
  const [examMarks, setExamMarks] = useState("50");
  const [examPass, setExamPass] = useState("20");
  const [examNegative, setExamNegative] = useState("0");
  const [numMcq, setNumMcq] = useState("5");
  const [numSubjective, setNumSubjective] = useState("0");
  const [questionType, setQuestionType] = useState<"mcq" | "subjective" | "tf" | "mixed">("mcq");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [cognitiveTarget, setCognitiveTarget] = useState("apply");
  const [diffEasyPct, setDiffEasyPct] = useState(30);
  const [diffMedPct, setDiffMedPct] = useState(50);
  const [diffHardPct, setDiffHardPct] = useState(20);
  const [customPromptInstructions, setCustomPromptInstructions] = useState("");
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [examStartDate, setExamStartDate] = useState("");
  const [examEndDate, setExamEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [studentDirectories, setStudentDirectories] = useState<StudentDirectory[]>([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string>("");
  const [isCreateDirModalOpen, setIsCreateDirModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);
  const [draftExpiresAt, setDraftExpiresAt] = useState<string | null>(null);

  // Custom Marks Distribution state
  const [marksDistMode, setMarksDistMode] = useState<"equal" | "by_type" | "by_difficulty" | "custom">("equal");
  const [marksByType, setMarksByType] = useState<{ mcq: number; subjective: number; tf: number }>({
    mcq: 2,
    subjective: 5,
    tf: 1,
  });
  const [marksByDiff, setMarksByDiff] = useState<{ easy: number; medium: number; hard: number }>({
    easy: 1,
    medium: 2,
    hard: 4,
  });
  const [customSlotMarks, setCustomSlotMarks] = useState<number[]>([]);

  // Computed total question count across modes
  const computedQuestionCount = useMemo(() => {
    if (questionType === "mixed") {
      return (parseInt(numMcq) || 0) + (parseInt(numSubjective) || 0);
    } else if (questionType === "subjective") {
      return parseInt(numSubjective) || 5;
    } else {
      return parseInt(numMcq) || 5;
    }
  }, [questionType, numMcq, numSubjective]);

  // Keep custom slot marks length aligned with question count
  useEffect(() => {
    const count = Math.max(1, computedQuestionCount);
    setCustomSlotMarks((prev) => {
      if (prev.length === count) return prev;
      const initialVal = Math.max(1, Math.round((parseFloat(examMarks) || 50) / count));
      const next = [...prev];
      if (next.length < count) {
        while (next.length < count) {
          next.push(initialVal);
        }
      } else {
        next.length = count;
      }
      return next;
    });
  }, [computedQuestionCount]);

  // Dynamically calculate total marks based on active distribution mode
  const calculatedTotalMarks = useMemo(() => {
    const totalQ = Math.max(1, computedQuestionCount);
    if (marksDistMode === "equal") {
      return parseFloat(examMarks) || 50;
    }
    if (marksDistMode === "by_type") {
      if (questionType === "mixed") {
        const mcqs = parseInt(numMcq) || 0;
        const subjs = parseInt(numSubjective) || 0;
        return (mcqs * (marksByType.mcq || 2)) + (subjs * (marksByType.subjective || 5));
      } else if (questionType === "subjective") {
        return totalQ * (marksByType.subjective || 5);
      } else if (questionType === "tf") {
        return totalQ * (marksByType.tf || 1);
      } else {
        return totalQ * (marksByType.mcq || 2);
      }
    }
    if (marksDistMode === "by_difficulty") {
      const easyCount = Math.round(totalQ * (diffEasyPct / 100));
      const hardCount = Math.round(totalQ * (diffHardPct / 100));
      const medCount = Math.max(0, totalQ - easyCount - hardCount);
      return (easyCount * (marksByDiff.easy || 1)) + (medCount * (marksByDiff.medium || 2)) + (hardCount * (marksByDiff.hard || 4));
    }
    if (marksDistMode === "custom") {
      if (!customSlotMarks || customSlotMarks.length === 0) {
        return parseFloat(examMarks) || 50;
      }
      return customSlotMarks.slice(0, totalQ).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    }
    return parseFloat(examMarks) || 50;
  }, [marksDistMode, examMarks, computedQuestionCount, questionType, numMcq, numSubjective, marksByType, marksByDiff, diffEasyPct, diffMedPct, diffHardPct, customSlotMarks]);

  // Auto-sync total marks helper
  const syncTotalMarks = (overrideVal?: number) => {
    const val = overrideVal !== undefined ? overrideVal : calculatedTotalMarks;
    setExamMarks(String(val));
    setExamPass(String(Math.max(1, Math.round(val * 0.4))));
  };

  // Load initial data
  const fetchData = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) return;
    try {
      if (typeof window !== "undefined") {
        setWorkspaceName(localStorage.getItem("workspaceName") || "Teacher Workspace");
      }
      const [docsRes, examsRes, subjectsRes, dirsRes, formsRes] = await Promise.all([
        apiFetch("/kb/documents", { token: activeToken }).catch(() => null),
        apiFetch("/exams/", { token: activeToken }).catch(() => null),
        apiFetch("/kb/subjects", { token: activeToken }).catch(() => null),
        fetchStudentDirectories(activeToken).catch(() => []),
        apiFetch("/registration-forms", { token: activeToken }).catch(() => null),
      ]);

      if (docsRes && docsRes.ok) {
        const dData = await docsRes.json().catch(() => []);
        setDocuments(Array.isArray(dData) ? dData : []);
      }
      if (examsRes && examsRes.ok) {
        const eData = await examsRes.json().catch(() => []);
        setExams(Array.isArray(eData) ? eData : []);
      }
      if (subjectsRes && subjectsRes.ok) {
        const sData = await subjectsRes.json().catch(() => []);
        setKbSubjects(Array.isArray(sData) ? sData : []);
      }
      if (Array.isArray(dirsRes)) {
        setStudentDirectories(dirsRes);
        if (dirsRes.length > 0 && !selectedDirectoryId) {
          setSelectedDirectoryId(dirsRes[0].id);
        }
      }
      if (formsRes && formsRes.ok) {
        const formsData = await formsRes.json().catch(() => []);
        setRegistrationFormsCount(Array.isArray(formsData) ? formsData.length : 0);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-sidebar-stats"));
      }
    } catch (e) {
      console.warn("fetchData notice:", e);
    }
  };

  const reloadStudentDirectories = async (forcedToken?: string) => {
    const activeToken = forcedToken || token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) return;
    try {
      const dirs = await fetchStudentDirectories(activeToken);
      if (Array.isArray(dirs)) {
        setStudentDirectories(dirs);
        if (dirs.length > 0 && !selectedDirectoryId) {
          setSelectedDirectoryId(dirs[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to reload student directories:", err);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      reloadStudentDirectories();
    };
    window.addEventListener("refresh-student-directories", handleRefresh);
    return () => window.removeEventListener("refresh-student-directories", handleRefresh);
  }, [token]);

  // Draft auto-save restoration on mount (with 7-day auto-expiry)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("testora_create_assessment_draft");
      if (saved) {
        const d = JSON.parse(saved);
        const savedTime = d.savedAt ? new Date(d.savedAt).getTime() : Date.now();
        const expiresAtTime = d.expiresAt ? new Date(d.expiresAt).getTime() : (savedTime + 7 * 24 * 60 * 60 * 1000);
        
        // Auto-expire check: If older than 7 days, remove from storage automatically
        if (Date.now() > expiresAtTime) {
          localStorage.removeItem("testora_create_assessment_draft");
          setIsDraftLoaded(true);
          return;
        }

        if (d && (d.examName || d.examSubject || d.step1AiPrompt || (d.createStep && d.createStep > 1))) {
          if (d.expiresAt) setDraftExpiresAt(d.expiresAt);
          if (d.examName !== undefined) setExamName(d.examName);
          if (d.examSubject !== undefined) setExamSubject(d.examSubject);
          if (d.examTopic !== undefined) setExamTopic(d.examTopic);
          if (d.examDuration !== undefined) setExamDuration(d.examDuration);
          if (d.examMarks !== undefined) setExamMarks(d.examMarks);
          if (d.examPass !== undefined) setExamPass(d.examPass);
          if (d.examNegative !== undefined) setExamNegative(d.examNegative);
          if (d.numMcq !== undefined) setNumMcq(d.numMcq);
          if (d.numSubjective !== undefined) setNumSubjective(d.numSubjective);
          if (d.questionType !== undefined) setQuestionType(d.questionType);
          if (d.difficulty !== undefined) setDifficulty(d.difficulty);
          if (d.cognitiveTarget !== undefined) setCognitiveTarget(d.cognitiveTarget);
          if (d.diffEasyPct !== undefined) setDiffEasyPct(d.diffEasyPct);
          if (d.diffMedPct !== undefined) setDiffMedPct(d.diffMedPct);
          if (d.diffHardPct !== undefined) setDiffHardPct(d.diffHardPct);
          if (d.customPromptInstructions !== undefined) setCustomPromptInstructions(d.customPromptInstructions);
          if (d.examStartDate !== undefined) setExamStartDate(d.examStartDate);
          if (d.examEndDate !== undefined) setExamEndDate(d.examEndDate);
          if (d.selectedDirectoryId !== undefined) setSelectedDirectoryId(d.selectedDirectoryId);
          if (d.marksDistMode !== undefined) setMarksDistMode(d.marksDistMode);
          if (d.marksByType !== undefined) setMarksByType(d.marksByType);
          if (d.marksByDiff !== undefined) setMarksByDiff(d.marksByDiff);
          if (Array.isArray(d.customSlotMarks)) setCustomSlotMarks(d.customSlotMarks);
          if (d.step1SourceMode !== undefined) setStep1SourceMode(d.step1SourceMode);
          if (d.step1AiPrompt !== undefined) setStep1AiPrompt(d.step1AiPrompt);
          if (d.createStep !== undefined) setCreateStep(d.createStep);
          if (d.expandedStep !== undefined) setExpandedStep(d.expandedStep);
          if (d.savedAt) setDraftSavedAt(d.savedAt);
          setIsDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn("Could not parse saved draft", e);
    } finally {
      setIsDraftLoaded(true);
    }
  }, []);

  // Draft auto-saving debounced
  useEffect(() => {
    if (!isDraftLoaded || typeof window === "undefined") return;
    const hasMeaningfulContent = Boolean(
      examName.trim() ||
      examSubject ||
      step1AiPrompt.trim() ||
      createStep > 1 ||
      (customPromptInstructions && customPromptInstructions.trim())
    );
    if (!hasMeaningfulContent) return;

    const handler = setTimeout(() => {
      const nowIso = new Date().toISOString();
      const expiresAtIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const draftObj = {
        examName,
        examSubject,
        examTopic,
        examDuration,
        examMarks,
        examPass,
        examNegative,
        numMcq,
        numSubjective,
        questionType,
        difficulty,
        cognitiveTarget,
        diffEasyPct,
        diffMedPct,
        diffHardPct,
        customPromptInstructions,
        examStartDate,
        examEndDate,
        selectedDirectoryId,
        marksDistMode,
        marksByType,
        marksByDiff,
        customSlotMarks,
        step1SourceMode,
        step1AiPrompt,
        createStep,
        expandedStep,
        savedAt: nowIso,
        expiresAt: expiresAtIso,
      };
      try {
        localStorage.setItem("testora_create_assessment_draft", JSON.stringify(draftObj));
        setDraftSavedAt(nowIso);
        setDraftExpiresAt(expiresAtIso);
      } catch (err) {
        console.warn("Failed to auto-save draft:", err);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [
    isDraftLoaded,
    examName,
    examSubject,
    examTopic,
    examDuration,
    examMarks,
    examPass,
    examNegative,
    numMcq,
    numSubjective,
    questionType,
    difficulty,
    cognitiveTarget,
    diffEasyPct,
    diffMedPct,
    diffHardPct,
    customPromptInstructions,
    examStartDate,
    examEndDate,
    selectedDirectoryId,
    marksDistMode,
    marksByType,
    marksByDiff,
    customSlotMarks,
    step1SourceMode,
    step1AiPrompt,
    createStep,
    expandedStep,
  ]);

  const activeDraftInfo = useMemo(() => {
    if (!mounted || typeof window === "undefined") return null;
    const hasContent = Boolean(
      examName.trim() ||
      examSubject ||
      step1AiPrompt.trim() ||
      createStep > 1 ||
      (customPromptInstructions && customPromptInstructions.trim())
    );
    if (!hasContent) return null;

    const expiryTime = draftExpiresAt 
      ? new Date(draftExpiresAt).getTime() 
      : (draftSavedAt ? new Date(draftSavedAt).getTime() + 7 * 24 * 60 * 60 * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (Date.now() > expiryTime) {
      return null;
    }

    const msLeft = Math.max(0, expiryTime - Date.now());
    const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

    const stepTitles: Record<number, string> = {
      1: "1. Source",
      2: "2. Questions",
      3: "3. Schedule",
      4: "4. Review",
    };

    return {
      examName: examName.trim() || "Untitled Assessment Draft",
      examSubject: examSubject || "General",
      createStep,
      totalSteps: 4,
      stepTitle: stepTitles[createStep] || `Step ${createStep}`,
      questionsCount: computedQuestionCount || parseInt(numMcq) || 5,
      duration: examDuration || "30",
      marks: examMarks || "50",
      savedAt: draftSavedAt || new Date().toISOString(),
      expiresAt: draftExpiresAt,
      daysLeft,
    };
  }, [
    mounted,
    examName,
    examSubject,
    step1AiPrompt,
    createStep,
    customPromptInstructions,
    draftSavedAt,
    draftExpiresAt,
    computedQuestionCount,
    numMcq,
    examDuration,
    examMarks,
  ]);

  const handleClearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("testora_create_assessment_draft");
    }
    setExamName("");
    setExamSubject("");
    setExamTopic("General");
    setExamDuration("30");
    setExamMarks("50");
    setExamPass("20");
    setExamNegative("0");
    setNumMcq("5");
    setNumSubjective("0");
    setQuestionType("mcq");
    setDifficulty("medium");
    setCognitiveTarget("apply");
    setDiffEasyPct(30);
    setDiffMedPct(50);
    setDiffHardPct(20);
    setCustomPromptInstructions("");
    setExamStartDate("");
    setExamEndDate("");
    setSelectedDirectoryId("");
    setMarksDistMode("by_type");
    setMarksByType({ mcq: 2, subjective: 5, tf: 1 });
    setMarksByDiff({ easy: 1, medium: 2, hard: 3 });
    setCustomSlotMarks([]);
    setStep1SourceMode("select");
    setStep1AiPrompt("");
    setCreateStep(1);
    setExpandedStep(1);
    setDraftSavedAt(null);
    setDraftExpiresAt(null);
    setIsDraftRestored(false);
    showToast("Assessment draft cleared. Ready for a new test.", "info");
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Real Computed Exam Statuses for Intelligent Activity Feed
  const getExamStatus = (exam: any) => {
    if (!exam.is_published) return { status: "draft", label: "Draft", dot: "bg-amber-500" };
    const now = new Date();
    const start = parseUtcDate(exam.start_time);
    const end = parseUtcDate(exam.end_time);
    if (start && now < start) return { status: "scheduled", label: "Scheduled", dot: "bg-blue-500" };
    if (end && now > end) return { status: "completed", label: "Completed", dot: "bg-stone-400" };
    return { status: "live", label: "Live Active", dot: "bg-emerald-500 animate-pulse" };
  };

  const liveExams = useMemo(() => {
    return exams.filter((e) => getExamStatus(e).status === "live");
  }, [exams]);

  const upcomingExams = useMemo(() => {
    return exams.filter((e) => getExamStatus(e).status === "scheduled");
  }, [exams]);

  const draftExams = useMemo(() => {
    return exams.filter((e) => !e.is_published);
  }, [exams]);

  const completedExams = useMemo(() => {
    return exams.filter((e) => e.is_published && getExamStatus(e).status === "completed");
  }, [exams]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    const handleSwitch = (e: any) => {
      const el = document.getElementById(e.detail);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("switch-tab", handleSwitch);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("switch-tab", handleSwitch);
    };
  }, []);

  // WebSocket Live Proctoring alerts feed
  useEffect(() => {
    if (!liveProctorExam || !token) return;

    let ws: WebSocket | null = null;
    try {
      const wsUrl = getWebSocketUrl(`/attempts/ws/teacher/${liveProctorExam.id}`);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data);
          setLiveProctorAlerts((prev) => [alert, ...prev]);
          showToast(`⚠️ Proctor Flag: ${alert.event_type || "Violation"} - ${alert.details || ""}`, "error");
        } catch {}
      };

      ws.onerror = () => {
        console.warn("Proctor WebSocket connection error");
      };
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, [liveProctorExam, token]);

  // Exam Action Handlers
  const handlePublishExam = async (examId: string) => {
    try {
      const res = await apiFetch(`/exams/${examId}/publish`, { token, method: "POST" });
      if (res.ok) {
        showToast("Assessment published live to eligible candidates!", "success");
        fetchData();
      } else {
        if (res.status === 402) {
          const target = exams.find((e) => e.id === examId);
          if (target) {
            setPaymentModalExam(target);
            showToast("Per-test Razorpay payment required before publishing.", "warning");
            return;
          }
        }
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to publish assessment", "error");
      }
    } catch {
      showToast("Network error publishing exam", "error");
    }
  };

  const handleEndExamEarly = async (examId: string, examName: string) => {
    if (!confirm(`Are you sure you want to end assessment "${examName}" early? All active candidate sessions will close.`)) return;
    try {
      const res = await apiFetch(`/exams/${examId}/end-early`, { token, method: "POST" });
      if (res.ok) {
        showToast(`Assessment "${examName}" ended early. Grades computed.`, "success");
        fetchData();
        if (liveProctorExam && liveProctorExam.id === examId) setLiveProctorExam(null);
      } else {
        showToast("Failed to end exam early", "error");
      }
    } catch {
      showToast("Network error ending exam", "error");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      const res = await apiFetch(`/exams/${examId}`, { token, method: "DELETE" });
      if (res.ok) {
        showToast("Assessment successfully deleted", "success");
        fetchData();
      } else {
        showToast("Failed to delete assessment", "error");
      }
    } catch {
      showToast("Network error deleting exam", "error");
    }
  };

  const handleGenerateCredentials = async (examId: string, examName: string) => {
    try {
      const res = await apiFetch(`/exams/${examId}/credentials`, { token, method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data.count || 0);
        showToast(`Generated & emailed passcodes for ${count} candidates!`, "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to generate candidate passcodes", "error");
      }
    } catch {
      showToast("Network error generating passcodes", "error");
    }
  };

  const handleDownloadCredentialsCSV = async (examId: string, examName: string) => {
    try {
      const res = await apiFetch(`/exams/${examId}/credentials/export`, { token });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Candidate_Passcodes_${examName.replace(/\s+/g, "_")}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("Candidate credentials CSV exported!", "success");
      }
    } catch {
      showToast("Failed to export credentials CSV", "error");
    }
  };

  // Create Exam Handler
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    // If teacher selected a document in Upload mode but didn't click the inner upload button, auto-upload it now!
    let activeSubject = examSubject;
    if (step1SourceMode === "upload" && step1UploadFile) {
      try {
        setIsGenerating(true);
        const sub = step1UploadSubject.trim() || activeSubject || "General_101";
        const formData = new FormData();
        formData.append("file", step1UploadFile);
        formData.append("subject_id", sub);

        const upRes = await apiFetch("/kb/upload", {
          token,
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          activeSubject = sub;
          setExamSubject(sub);
          setStep1UploadFile(null);
          showToast(`Document "${step1UploadFile.name}" uploaded & indexed!`, "success");
        }
      } catch (upErr) {
        console.warn("Auto-upload notice:", upErr);
      }
    }

    // AI Prompt mode: use prompt as knowledge context, no KB required
    const isAiPromptMode = step1SourceMode === "ai_prompt";
    if (isAiPromptMode && !step1AiPrompt.trim()) {
      showToast("Please enter a topic/prompt for AI to generate questions from.", "error");
      setIsGenerating(false);
      return;
    }
    const effectiveSubject = isAiPromptMode
      ? (activeSubject || "ai_prompt_generated")
      : activeSubject;
    const effectiveCustomInstructions = isAiPromptMode
      ? `${step1AiPrompt.trim()}${customPromptInstructions ? `\n\nAdditional: ${customPromptInstructions}` : ""}`
      : customPromptInstructions;

    if (!examName || !effectiveSubject) {
      showToast("Please provide an assessment title and select a knowledge source", "error");
      setIsGenerating(false);
      return;
    }
    setIsGenerating(true);
    try {
      const totalMarksNum = marksDistMode === "equal"
        ? (parseFloat(examMarks) || 50)
        : (calculatedTotalMarks || parseFloat(examMarks) || 50);
      const numQuestions = computedQuestionCount || 5;
      const marksPerQ = Math.max(1, Math.round(totalMarksNum / (numQuestions || 1)));

      const distributionPayload = {
        mode: marksDistMode,
        by_type: {
          mcq: Number(marksByType.mcq) || 2,
          subjective: Number(marksByType.subjective) || 5,
          true_false: Number(marksByType.tf) || 1,
        },
        by_difficulty: {
          easy: Number(marksByDiff.easy) || 1,
          medium: Number(marksByDiff.medium) || 2,
          hard: Number(marksByDiff.hard) || 4,
        },
        custom_marks: marksDistMode === "custom" && customSlotMarks.length > 0
          ? customSlotMarks.slice(0, numQuestions).map((m) => Number(m) || 1)
          : undefined,
      };

      const blueprint = {
        topic: examTopic || "General",
        num_questions: numQuestions,
        difficulty: difficulty,
        question_type: questionType,
        marks_per_question: marksPerQ,
        cognitive_target: cognitiveTarget,
        custom_instructions: customPromptInstructions,
        marks_distribution: distributionPayload,
        distribution: {
          easy_pct: diffEasyPct,
          medium_pct: diffMedPct,
          hard_pct: diffHardPct,
        },
      };

      const payload = {
        name: examName,
        subject_id: effectiveSubject,
        topic: examTopic || (isAiPromptMode ? step1AiPrompt.slice(0, 80) : "General"),
        num_questions: numQuestions,
        num_mcq: questionType === "mixed" ? (parseInt(numMcq) || 0) : questionType === "subjective" ? 0 : numQuestions,
        num_subjective: questionType === "mixed" ? (parseInt(numSubjective) || 0) : questionType === "subjective" ? numQuestions : 0,
        question_type: questionType,
        difficulty: difficulty,
        duration_minutes: parseInt(examDuration) || 30,
        total_marks: totalMarksNum,
        passing_marks: parseFloat(examPass) || Math.max(1, Math.round(totalMarksNum * 0.4)),
        negative_marking: parseFloat(examNegative) || 0,
        marks_distribution: distributionPayload,
        start_time: examStartDate ? parseISTInputToUtcIso(examStartDate) : null,
        end_time: examEndDate ? parseISTInputToUtcIso(examEndDate) : null,
        student_directory_id: selectedDirectoryId || null,
        custom_instructions: effectiveCustomInstructions,
        blueprint: { ...blueprint, custom_instructions: effectiveCustomInstructions },
        enable_ai_paper: true,
        is_published: true,
      };

      const res = await apiFetch("/exams/generate-from-kb", {
        token,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newExam = await res.json();

        // Save passing certificate configuration if enabled
        if (enableCertificate) {
          try {
            await apiFetch(`/certificates/exam/${newExam.id}/config`, {
              token,
              method: "POST",
              body: JSON.stringify({
                is_enabled: true,
                template_id: certificateConfig.template_id || "testora_default",
                passing_criteria_type: certificateConfig.passing_criteria_type || "percentage",
                passing_criteria_value: certificateConfig.passing_criteria_value ?? (parseFloat(examPass) || 40),
                custom_title: certificateConfig.custom_title || null,
                statement_template: certificateConfig.statement_template || null,
                institute_name: certificateConfig.institute_name || workspaceName || "Testora Academy",
                institute_logo_url: certificateConfig.institute_logo_url || null,
                signatory_1_name: certificateConfig.signatory_1_name || null,
                signatory_1_title: certificateConfig.signatory_1_title || null,
                signatory_1_signature_url: certificateConfig.signatory_1_signature_url || null,
                signatory_2_name: certificateConfig.signatory_2_name || null,
                signatory_2_title: certificateConfig.signatory_2_title || null,
                signatory_2_signature_url: certificateConfig.signatory_2_signature_url || null,
                stamp_url: certificateConfig.stamp_url || null,
                display_marks: certificateConfig.display_marks ?? true,
                display_percentage: certificateConfig.display_percentage ?? true,
                display_grade: certificateConfig.display_grade ?? true,
                display_qr: true,
              }),
            });
          } catch (certErr) {
            console.warn("Notice: could not save certificate settings", certErr);
          }
        }

        showToast(`Assessment "${newExam.name}" successfully created and published!`, "success");
        if (typeof window !== "undefined") {
          localStorage.removeItem("testora_create_assessment_draft");
        }
        setDraftSavedAt(null);
        setIsDraftRestored(false);
        setCreateStep(1);
        setExpandedStep(1);
        setExamName("");
        setActiveSectionTab("exams");
        if (typeof window !== "undefined") {
          window.location.hash = "exams";
        }
        fetchData();
      } else {
        const requestId = res.headers.get("X-Request-ID") || "";
        const errData = await res.json().catch(() => ({}));
        const reqTag = requestId || errData.request_id ? ` [Req: ${requestId || errData.request_id}]` : "";
        
        if (res.status === 422) {
          showToast(`Validation error: Please verify question count, passing marks, and dates.${reqTag}`, "error");
        } else if (res.status === 401 || res.status === 403) {
          showToast(`Authorization error: You do not have permission to publish in this workspace.${reqTag}`, "error");
        } else if (res.status === 404) {
          showToast(`Resource not found: The selected Knowledge Source or Directory is unavailable.${reqTag}`, "error");
        } else {
          showToast(errData.detail ? `${errData.detail}${reqTag}` : `Server error generating assessment. Please try again.${reqTag}`, "error");
        }
      }
    } catch (err: any) {
      showToast(err?.message ? `Network error: ${err.message}` : "Unable to reach server. Please check your internet connection.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateAndSetStep1File = (file: File) => {
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSizeBytes) {
      showToast("File size exceeds 25MB limit. Please choose a smaller document.", "error");
      return;
    }
    setStep1UploadFile(file);

    // Auto-suggest subject name if empty
    if (!step1UploadSubject) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setStep1UploadSubject(cleanName.slice(0, 30));
    }
  };

  const handleStep1DirectUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!step1UploadFile) {
      showToast("Please select or drop a document to upload.", "error");
      return;
    }
    if (!step1UploadSubject.trim()) {
      showToast("Please specify a subject domain name for this document.", "error");
      return;
    }

    setIsStep1Uploading(true);
    try {
      const formData = new FormData();
      formData.append("file", step1UploadFile);
      formData.append("subject_id", step1UploadSubject.trim());

      const res = await apiFetch("/kb/upload", {
        token,
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const sub = step1UploadSubject.trim();
        const fName = step1UploadFile.name;
        showToast(`Document "${fName}" indexed into "${sub}"!`, "success");
        setStep1UploadSuccess({ fileName: fName, subjectId: sub });
        setExamSubject(sub);

        // Auto-fill exam title if empty
        if (!examName) {
          const cleanName = fName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          setExamName(`${cleanName} Assessment`);
        }

        // Auto-fill topic if default
        if (!examTopic || examTopic === "General") {
          setExamTopic(sub);
        }

        setStep1UploadFile(null);
        setStep1UploadSubject("");
        setStep1SourceMode("select");

        // Refresh subjects and documents
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || "Upload failed. Please check the document format.", "error");
      }
    } catch {
      showToast("Upload network error. Please check your internet connection.", "error");
    } finally {
      setIsStep1Uploading(false);
    }
  };

  const formatLocalDateTime = (date: Date) => {
    return formatISTForInput(date);
  };

  const setSchedulePreset = (preset: string) => {
    const durMins = parseInt(examDuration) || 30;
    const now = new Date();
    if (preset === "now") {
      setExamStartDate(formatISTForInput(now));
      const end = new Date(now.getTime() + durMins * 60000);
      setExamEndDate(formatISTForInput(end));
    } else if (preset === "today4pm") {
      const todayIST = formatISTForInput(now).split("T")[0];
      let targetStartIso = parseISTInputToUtcIso(`${todayIST}T16:00`)!;
      if (Date.now() > new Date(targetStartIso).getTime()) {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const tomorrowIST = formatISTForInput(tomorrow).split("T")[0];
        targetStartIso = parseISTInputToUtcIso(`${tomorrowIST}T16:00`)!;
      }
      setExamStartDate(formatISTForInput(targetStartIso));
      const end = new Date(new Date(targetStartIso).getTime() + durMins * 60000);
      setExamEndDate(formatISTForInput(end));
    } else if (preset === "tomorrow10am") {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowIST = formatISTForInput(tomorrow).split("T")[0];
      const targetStartIso = parseISTInputToUtcIso(`${tomorrowIST}T10:00`)!;
      setExamStartDate(formatISTForInput(targetStartIso));
      const end = new Date(new Date(targetStartIso).getTime() + durMins * 60000);
      setExamEndDate(formatISTForInput(end));
    } else if (preset === "open30days") {
      setExamStartDate(formatISTForInput(now));
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60000);
      setExamEndDate(formatISTForInput(end));
    }
  };

  const labelCls = "block text-xs font-semibold text-[#111827] dark:text-[#F1F5F9] mb-1 uppercase tracking-wider";
  const inputCls = "w-full bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#263449] rounded-lg px-3 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]";

  const WIZARD_STEPS = [
    {
      step: 1,
      title: "01. Knowledge Source & Details",
      shortTitle: "1. Source",
      summary: examName ? `${examName} • ${examSubject || "General"}` : (examSubject || "Domain & Title"),
      icon: BookOpen,
    },
    {
      step: 2,
      title: "02. Questions & AI Blueprint",
      shortTitle: "2. Questions",
      summary: `${numMcq} MCQ • ${difficulty.toUpperCase()}`,
      icon: Sparkles,
    },
    {
      step: 3,
      title: "03. Rules & Scheduling",
      shortTitle: "3. Schedule",
      summary: `${examDuration} min • ${examMarks} pts`,
      icon: Clock,
    },
    {
      step: 4,
      title: "04. Review & Synthesis",
      shortTitle: "4. Review",
      summary: "Directory & Generate",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-7 animate-fadeIn">
      {/* ═══════ TOP COMMAND CENTER HEADER & STATS (Only on Main Dashboard / Overview) ═══════ */}
      {isOverview ? (
        <>
          {/* Header & Quick Action Toolbar Group (Compact Gap) */}
          <div className="space-y-2 sm:space-y-3">
            {/* Promotional Offer Callout Box (Master Recharge Plan) */}
            {showTeacherPromo && (
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-950/90 to-slate-900 text-white p-3 sm:py-2.5 sm:px-4 border border-purple-400/30 shadow-md">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          Upgrade to Master Recharge Plan
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider">
                          ₹999 • 15,000 Credits
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-xs text-purple-200/90 font-medium mt-0.5 leading-snug">
                        Includes +5,000 Extra Bonus credits for AI exam generation, instant candidate evaluation & verified certificates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setIsRechargeOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <span>Recharge Now</span>
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTeacherPromo(false);
                        try {
                          sessionStorage.setItem("testora_teacher_promo_dismissed", "true");
                        } catch {}
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Dismiss notice"
                      aria-label="Dismiss banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Heading Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/80 dark:border-[#263449] pb-2 sm:pb-2.5">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  ACADEMIC INSTRUCTOR WORKSPACE
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F1F5F9] mt-0.5 tracking-tight">
                  Teacher Command Center
                </h1>
                <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                  Manage assessments, students, questions and resources in one place.
                </p>
              </div>
            </div>

            {/* Horizontal Quick-Action Toolbar (14 Core Shortcuts) - Refined, Sleek & Compact */}
            <div className="relative bg-white dark:bg-[#111C31] border border-slate-200/90 dark:border-[#263449] rounded-xl sm:rounded-2xl py-1.5 sm:py-2.5 px-1 xs:px-2 sm:px-3 shadow-xs flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("quick-toolbar-scroll");
                if (el) el.scrollBy({ left: -220, behavior: "smooth" });
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 shadow-2xs cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Scroll Left"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
            </button>

            <div 
              id="quick-toolbar-scroll" 
              className="flex items-start flex-1 overflow-x-auto no-scrollbar scroll-smooth gap-1.5 xs:gap-2 sm:gap-4 md:gap-5 py-0.5 px-0.5"
            >
              {/* 1. Create Assessment */}
              <button
                type="button"
                onClick={() => switchSectionTab("create")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#1877F2] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <FilePlus className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Create<br />Assessment
                </span>
              </button>

              {/* 2. Mock Test Library (NEW) */}
              <button
                type="button"
                onClick={() => switchSectionTab("mock-tests")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#4F46E5] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <GraduationCap className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Mock Test<br />Library
                </span>
              </button>

              {/* 3. Certificates & Awards (NEW) */}
              <button
                type="button"
                onClick={() => switchSectionTab("certificates")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#D97706] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Award className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Certificates<br />&amp; Awards
                </span>
              </button>

              {/* 4. AI Question Generator */}
              <button
                type="button"
                onClick={() => switchSectionTab("create")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#00B5B8] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Wand2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  AI Question<br />Generator
                </span>
              </button>

              {/* 5. Upload PDF / Document */}
              <button
                type="button"
                onClick={() => setIsStep1KbModalOpen(true)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#16A34A] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <CloudUpload className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Upload PDF /<br />Document
                </span>
              </button>

              {/* 6. AI Form Studio */}
              <button
                type="button"
                onClick={() => switchSectionTab("custom-forms")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#F97316] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <FileEdit className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  AI Form<br />Studio
                </span>
              </button>

              {/* 7. Question Bank */}
              <button
                type="button"
                onClick={() => switchSectionTab("bank")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#EF4444] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Database className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Question<br />Bank
                </span>
              </button>

              {/* 8. Knowledge Base */}
              <button
                type="button"
                onClick={() => switchSectionTab("kb")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#8B5CF6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <BookOpen className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Knowledge<br />Base
                </span>
              </button>

              {/* 9. Student Rosters */}
              <button
                type="button"
                onClick={() => switchSectionTab("students")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#10B981] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Student<br />Rosters
                </span>
              </button>

              {/* 10. Student Directory */}
              <button
                type="button"
                onClick={() => switchSectionTab("students")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#0284C7] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Contact className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Student<br />Directory
                </span>
              </button>

              {/* 11. Results & Analytics */}
              <button
                type="button"
                onClick={() => switchSectionTab("reports")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#14B8A6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <BarChart3 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Results &amp;<br />Analytics
                </span>
              </button>

              {/* 12. Live Proctoring */}
              <button
                type="button"
                onClick={() => {
                  switchSectionTab("exams");
                  if (exams && exams.length > 0) {
                    const active = exams.find((e: any) => e.is_published || e.status === "active") || exams[0];
                    setLiveProctorExam(active);
                  }
                }}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#EC4899] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Radio className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Live<br />Proctoring
                </span>
              </button>

              {/* 13. Import Questions */}
              <button
                type="button"
                onClick={() => setIsCsvImportModalOpen(true)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#8B5CF6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <FileDown className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Import<br />Questions
                </span>
              </button>

              {/* 14. Platform Settings */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings")}
                className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group cursor-pointer focus:outline-none min-w-[50px] xs:min-w-[58px] sm:min-w-[68px] text-center"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-[36px] sm:h-[36px] rounded-full bg-[#3B82F6] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md active:scale-95 transition-all duration-200">
                  <Settings className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-[17px] sm:h-[17px] text-white stroke-[2.2]" />
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center leading-[1.15] max-w-[52px] xs:max-w-[60px] sm:max-w-[70px]">
                  Platform<br />Settings
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("quick-toolbar-scroll");
                if (el) el.scrollBy({ left: 220, behavior: "smooth" });
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 shadow-2xs cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Scroll Right"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
            </button>
          </div>
          </div>

          {/* Systematic 4 Summary KPI Cards (2 in a Row on Mobile, All 4 in a Single Row on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3.5 lg:gap-4">
            {/* ══════════════════════════════════════════════════════
                CARD 1 — ASSESSMENTS (Blue Gradient Header)
               ══════════════════════════════════════════════════════ */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchSectionTab("exams")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  switchSectionTab("exams");
                }
              }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/80 dark:border-[#263449] shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-200 p-2.5 xs:p-3 sm:p-3.5 lg:p-4 group cursor-pointer flex flex-col justify-between"
            >
              {/* Curved Top-Left Header Background Decoration */}
              <div className="absolute top-0 left-0 w-[70px] xs:w-[80px] sm:w-[95px] lg:w-[90px] xl:w-[96px] h-[40px] xs:h-[46px] sm:h-[54px] lg:h-[52px] pointer-events-none select-none">
                <svg 
                  viewBox="0 0 190 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="card-blue-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0052D4" />
                      <stop offset="50%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0,0 L125,0 C155,0 185,8 180,30 C174,52 130,70 80,78 C38,84 14,86 0,86 Z" 
                    fill="url(#card-blue-grad)" 
                  />
                </svg>
              </div>

              {/* Header White Outline Icon */}
              <div className="absolute top-1.5 left-2 sm:top-2 sm:left-2.5 text-white z-10 pointer-events-none drop-shadow-xs">
                <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>

              {/* Upper Block: Title & Subtitle + Big Metric */}
              <div>
                {/* Top Row: Spacer clearing the curve + Title block */}
                <div className="flex items-start justify-between min-h-[30px] xs:min-h-[34px] sm:min-h-[38px] mb-1 sm:mb-1.5">
                  <div className="w-[52px] xs:w-[60px] sm:w-[72px] lg:w-[68px] xl:w-[74px] shrink-0" />
                  <div className="flex-1 text-left pl-1 sm:pl-1.5 min-w-0">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm lg:text-[13px] xl:text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                      Assessments
                    </h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Testing Portal
                    </p>
                  </div>
                </div>

                {/* Metric Number & Label (Underneath curve on left side) */}
                <div className="mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {exams.length}
                  </div>
                  <div className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Total Assessments
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1.5 sm:my-2" />

                {/* Status Sub-Metrics: 2 Columns */}
                <div className="grid grid-cols-2 gap-1 xs:gap-1.5 text-xs">
                  <div className="min-w-0">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      LIVE
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] xs:text-[11px] sm:text-xs flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                      <span className="truncate">{liveExams.length} Active</span>
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-slate-100 dark:border-slate-800/80 pl-1.5 xs:pl-2">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      DRAFTS
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      {draftExams.length} Ready
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div className="mt-2 sm:mt-2.5 pt-0.5">
                <div className="w-full flex items-center justify-between px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#F0F6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] group-hover:bg-[#E0EDFF] dark:group-hover:bg-blue-950/60 transition-all">
                  <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs truncate">View Assessments</span>
                  <div className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#DBEAFE] dark:bg-blue-900/60 text-[#2563EB] dark:text-[#93C5FD] flex items-center justify-center shrink-0 shadow-2xs ml-1">
                    <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                CARD 2 — KNOWLEDGE BASE (Orange Gradient Header)
               ══════════════════════════════════════════════════════ */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchSectionTab("kb")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  switchSectionTab("kb");
                }
              }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/80 dark:border-[#263449] shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700/60 transition-all duration-200 p-2.5 xs:p-3 sm:p-3.5 lg:p-4 group cursor-pointer flex flex-col justify-between"
            >
              {/* Curved Top-Left Header Background Decoration */}
              <div className="absolute top-0 left-0 w-[70px] xs:w-[80px] sm:w-[95px] lg:w-[90px] xl:w-[96px] h-[40px] xs:h-[46px] sm:h-[54px] lg:h-[52px] pointer-events-none select-none">
                <svg 
                  viewBox="0 0 190 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="card-orange-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF512F" />
                      <stop offset="50%" stopColor="#F97316" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0,0 L125,0 C155,0 185,8 180,30 C174,52 130,70 80,78 C38,84 14,86 0,86 Z" 
                    fill="url(#card-orange-grad)" 
                  />
                </svg>
              </div>

              {/* Header White Outline Icon */}
              <div className="absolute top-1.5 left-2 sm:top-2 sm:left-2.5 text-white z-10 pointer-events-none drop-shadow-xs">
                <BookOpen className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>

              {/* Upper Block: Title & Subtitle + Big Metric */}
              <div>
                {/* Top Row: Spacer clearing the curve + Title block */}
                <div className="flex items-start justify-between min-h-[30px] xs:min-h-[34px] sm:min-h-[38px] mb-1 sm:mb-1.5">
                  <div className="w-[52px] xs:w-[60px] sm:w-[72px] lg:w-[68px] xl:w-[74px] shrink-0" />
                  <div className="flex-1 text-left pl-1 sm:pl-1.5 min-w-0">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm lg:text-[13px] xl:text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                      Knowledge Base
                    </h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      RAG Sources
                    </p>
                  </div>
                </div>

                {/* Metric Number & Label */}
                <div className="mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {documents.length}
                  </div>
                  <div className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Total Documents
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1.5 sm:my-2" />

                {/* Status Sub-Metrics: 2 Columns */}
                <div className="grid grid-cols-2 gap-1 xs:gap-1.5 text-xs">
                  <div className="min-w-0">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      COLLECTIONS
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      {kbSubjects.length} Subject{kbSubjects.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-slate-100 dark:border-slate-800/80 pl-1.5 xs:pl-2">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      GROUNDING
                    </div>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStep1KbModalOpen(true);
                      }}
                      className="font-bold text-orange-500 dark:text-orange-400 text-[10px] xs:text-[11px] sm:text-xs truncate hover:underline cursor-pointer"
                      title="Click to upload PDF study materials"
                    >
                      Upload PDFs
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div className="mt-2 sm:mt-2.5 pt-0.5">
                <div className="w-full flex items-center justify-between px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#FFF7ED] dark:bg-orange-950/40 text-[#EA580C] dark:text-[#FB923C] group-hover:bg-[#FFEDD5] dark:group-hover:bg-orange-950/60 transition-all">
                  <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs truncate">Manage Knowledge</span>
                  <div className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#FFEDD5] dark:bg-orange-900/60 text-[#EA580C] dark:text-[#FDBA74] flex items-center justify-center shrink-0 shadow-2xs ml-1">
                    <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                CARD 3 — COHORTS & STUDENTS (Teal Gradient Header)
               ══════════════════════════════════════════════════════ */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchSectionTab("students")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  switchSectionTab("students");
                }
              }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/80 dark:border-[#263449] shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700/60 transition-all duration-200 p-2.5 xs:p-3 sm:p-3.5 lg:p-4 group cursor-pointer flex flex-col justify-between"
            >
              {/* Curved Top-Left Header Background Decoration */}
              <div className="absolute top-0 left-0 w-[70px] xs:w-[80px] sm:w-[95px] lg:w-[90px] xl:w-[96px] h-[40px] xs:h-[46px] sm:h-[54px] lg:h-[52px] pointer-events-none select-none">
                <svg 
                  viewBox="0 0 190 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="card-teal-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#009245" />
                      <stop offset="50%" stopColor="#00A896" />
                      <stop offset="100%" stopColor="#02C39A" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0,0 L125,0 C155,0 185,8 180,30 C174,52 130,70 80,78 C38,84 14,86 0,86 Z" 
                    fill="url(#card-teal-grad)" 
                  />
                </svg>
              </div>

              {/* Header White Outline Icon */}
              <div className="absolute top-1.5 left-2 sm:top-2 sm:left-2.5 text-white z-10 pointer-events-none drop-shadow-xs">
                <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>

              {/* Upper Block: Title & Subtitle + Big Metric */}
              <div>
                {/* Top Row: Spacer clearing the curve + Title block */}
                <div className="flex items-start justify-between min-h-[30px] xs:min-h-[34px] sm:min-h-[38px] mb-1 sm:mb-1.5">
                  <div className="w-[52px] xs:w-[60px] sm:w-[72px] lg:w-[68px] xl:w-[74px] shrink-0" />
                  <div className="flex-1 text-left pl-1 sm:pl-1.5 min-w-0">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm lg:text-[13px] xl:text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                      Cohorts & Students
                    </h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Candidate Rosters
                    </p>
                  </div>
                </div>

                {/* Metric Number & Label */}
                <div className="mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {studentDirectories.reduce((acc, d) => acc + (d.student_count || 0), 0)}
                  </div>
                  <div className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Total Candidates
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1.5 sm:my-2" />

                {/* Status Sub-Metrics: 2 Columns */}
                <div className="grid grid-cols-2 gap-1 xs:gap-1.5 text-xs">
                  <div className="min-w-0">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      COHORTS
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      {studentDirectories.length} Active
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-slate-100 dark:border-slate-800/80 pl-1.5 xs:pl-2">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      PASSCODES
                    </div>
                    <div className="font-bold text-teal-600 dark:text-teal-400 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      Auto-Emailed
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div className="mt-2 sm:mt-2.5 pt-0.5">
                <div className="w-full flex items-center justify-between px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/40 text-[#0D9488] dark:text-[#2DD4BF] group-hover:bg-[#DCFCE7] dark:group-hover:bg-emerald-950/60 transition-all">
                  <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs truncate">Student Rosters</span>
                  <div className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#CCFBF1] dark:bg-teal-900/60 text-[#0D9488] dark:text-[#5EEAD4] flex items-center justify-center shrink-0 shadow-2xs ml-1">
                    <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                CARD 4 — REGISTRATION FORMS (Purple Gradient Header)
               ══════════════════════════════════════════════════════ */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchSectionTab("custom-forms")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  switchSectionTab("custom-forms");
                }
              }}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200/80 dark:border-[#263449] shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700/60 transition-all duration-200 p-2.5 xs:p-3 sm:p-3.5 lg:p-4 group cursor-pointer flex flex-col justify-between"
            >
              {/* Curved Top-Left Header Background Decoration */}
              <div className="absolute top-0 left-0 w-[70px] xs:w-[80px] sm:w-[95px] lg:w-[90px] xl:w-[96px] h-[40px] xs:h-[46px] sm:h-[54px] lg:h-[52px] pointer-events-none select-none">
                <svg 
                  viewBox="0 0 190 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="card-purple-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7F00FF" />
                      <stop offset="50%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#E100FF" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0,0 L125,0 C155,0 185,8 180,30 C174,52 130,70 80,78 C38,84 14,86 0,86 Z" 
                    fill="url(#card-purple-grad)" 
                  />
                </svg>
              </div>

              {/* Header White Outline Icon */}
              <div className="absolute top-1.5 left-2 sm:top-2 sm:left-2.5 text-white z-10 pointer-events-none drop-shadow-xs">
                <ClipboardList className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>

              {/* Upper Block: Title & Subtitle + Big Metric */}
              <div>
                {/* Top Row: Spacer clearing the curve + Title block */}
                <div className="flex items-start justify-between min-h-[30px] xs:min-h-[34px] sm:min-h-[38px] mb-1 sm:mb-1.5">
                  <div className="w-[52px] xs:w-[60px] sm:w-[72px] lg:w-[68px] xl:w-[74px] shrink-0" />
                  <div className="flex-1 text-left pl-1 sm:pl-1.5 min-w-0">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm lg:text-[13px] xl:text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                      Registration Forms
                    </h3>
                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      AI Form Studio
                    </p>
                  </div>
                </div>

                {/* Metric Number & Label */}
                <div className="mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                  <div className="text-lg xs:text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {registrationFormsCount}
                  </div>
                  <div className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Total Forms
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1.5 sm:my-2" />

                {/* Status Sub-Metrics: 2 Columns */}
                <div className="grid grid-cols-2 gap-1 xs:gap-1.5 text-xs">
                  <div className="min-w-0">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      TEMPLATES
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      20 Themes
                    </div>
                  </div>
                  <div className="min-w-0 border-l border-slate-100 dark:border-slate-800/80 pl-1.5 xs:pl-2">
                    <div className="text-[8px] xs:text-[9px] sm:text-[9.5px] lg:text-[9px] xl:text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                      FORMAT
                    </div>
                    <div className="font-bold text-orange-500 dark:text-orange-400 text-[10px] xs:text-[11px] sm:text-xs truncate">
                      Google Forms
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div className="mt-2 sm:mt-2.5 pt-0.5">
                <div className="w-full flex items-center justify-between px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#FAF5FF] dark:bg-purple-950/40 text-[#9333EA] dark:text-[#C084FC] group-hover:bg-[#F3E8FF] dark:group-hover:bg-purple-950/60 transition-all">
                  <span className="font-bold text-[10px] xs:text-[11px] sm:text-xs truncate">AI Form Studio</span>
                  <div className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#F3E8FF] dark:bg-purple-900/60 text-[#9333EA] dark:text-[#D8B4FE] flex items-center justify-center shrink-0 shadow-2xs ml-1">
                    <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Incomplete Assessment Draft Alert Banner in Overview */}
          {activeDraftInfo && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#FAF8F5] to-amber-500/5 dark:from-amber-950/30 dark:via-[#171615] dark:to-amber-950/20 border border-amber-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Incomplete Assessment Draft
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Saved at Step {activeDraftInfo.createStep} of 4 ({activeDraftInfo.stepTitle})
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#242321] dark:text-[#F5F5F4]">
                    {activeDraftInfo.examName}
                  </h3>
                  <p className="text-xs text-[#716D67] dark:text-[#A8A29E] flex items-center gap-2 flex-wrap">
                    <span>{activeDraftInfo.questionsCount} Questions</span>
                    <span>•</span>
                    <span>{activeDraftInfo.duration} mins</span>
                    <span>•</span>
                    <span>{activeDraftInfo.marks} marks</span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      Auto-expires in {activeDraftInfo.daysLeft} day{activeDraftInfo.daysLeft !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Discard or expire this draft immediately"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Expire Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchSectionTab("create")}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C84B18] hover:bg-[#B33F12] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Resume Test Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Live Class Assessments & Proctoring Section */}
          <section id="exams" className="scroll-mt-16 pt-2">
            <LiveAssessmentsTable
              activeDraft={activeDraftInfo}
              onResumeDraft={() => switchSectionTab("create")}
              onDiscardDraft={handleClearDraft}
              exams={exams}
              showCreateButton={false}
              title="Live Class Assessments & Proctoring"
              description="Manage active examination sessions, live anti-cheat monitoring, and candidate credentials."
              onOpenCreate={() => switchSectionTab("create")}
              onViewAll={() => switchSectionTab("exams")}
              onOpenCertificates={(exam) => setCertDrawerExam(exam)}
              onPreviewExam={(exam) => setPreviewExam(exam)}
              onOpenLiveProctor={(exam) => {
                setLiveProctorExam(exam);
                setLiveProctorAlerts([]);
              }}
              onEndExamEarly={handleEndExamEarly}
              onPublishExam={handlePublishExam}
              onDeleteExam={handleDeleteExam}
              onGenerateCredentials={handleGenerateCredentials}
              onDownloadCredentialsCSV={handleDownloadCredentialsCSV}
              onOpenPaymentModal={(exam) => setPaymentModalExam(exam)}
            />
          </section>
        </>
      ) : (
        /* Top Navigation Bar when in single module view */
        <div className="flex items-center justify-start gap-2 pb-1 mb-1">
          <button
            onClick={() => switchSectionTab("overview")}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#172B4D] hover:bg-blue-100 dark:hover:bg-[#1e3a66] border border-[#2563EB]/25 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
            title="Return to Main Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Back to Dashboard</span>
            <span className="xs:hidden">Dashboard</span>
          </button>
        </div>
      )}

      {/* ═══════ SECTION 1: ASSESSMENTS TABLE (Standalone Mode) ═══════ */}
      {activeSectionTab === "exams" && (
      <section id="exams" className="scroll-mt-16 space-y-4">
        <LiveAssessmentsTable
          activeDraft={activeDraftInfo}
          onResumeDraft={() => switchSectionTab("create")}
          onDiscardDraft={handleClearDraft}
          exams={exams}
          showCreateButton={true}
          onOpenCreate={() => switchSectionTab("create")}
          onOpenCertificates={(exam) => setCertDrawerExam(exam)}
          onPreviewExam={(exam) => setPreviewExam(exam)}
          onOpenLiveProctor={(exam) => {
            setLiveProctorExam(exam);
            setLiveProctorAlerts([]);
          }}
          onEndExamEarly={handleEndExamEarly}
          onPublishExam={handlePublishExam}
          onDeleteExam={handleDeleteExam}
          onGenerateCredentials={handleGenerateCredentials}
          onDownloadCredentialsCSV={handleDownloadCredentialsCSV}
          onOpenPaymentModal={(exam) => setPaymentModalExam(exam)}
        />
      </section>
      )}

      {/* ═══════ SECTION 2: CREATE ASSESSMENT WORKFLOW WIZARD ═══════ */}
      {activeSectionTab === "create" && (
      <section id="create" className="scroll-mt-16 space-y-4">
        <div className="bg-[#FFFFFF] dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
          {/* ═══════ HEADER & PROGRESS SUMMARY ═══════ */}
          <div className="space-y-4 pb-4 border-b border-[#E5E0D8] dark:border-[#292524]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                    Create New Assessment
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
                  Configure your knowledge source, question specifications, schedule, and candidate directory.
                </p>
              </div>

              {/* Step Progress Pill & Toggle Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {draftSavedAt && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-medium" title={`Auto-saved at ${new Date(draftSavedAt).toLocaleTimeString()}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Draft Saved {activeDraftInfo ? `(Expires in ${activeDraftInfo.daysLeft}d)` : ""}</span>
                  </div>
                )}
                {(examName || examSubject || step1AiPrompt || createStep > 1) && (
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Discard saved draft and start fresh"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Expire Draft</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] dark:bg-[#172B4D] dark:text-[#60A5FA] text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                  <span>Step {createStep} of 4: {WIZARD_STEPS[Math.max(0, Math.min(3, (createStep || 1) - 1))]?.shortTitle || `Step ${createStep}`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedStep(expandedStep ? null : createStep)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E2E8F0] dark:border-[#263449] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] text-[#64748B] dark:text-[#A3B1C6] transition-colors cursor-pointer"
                >
                  {expandedStep ? "Hide / Minimize Step" : "Expand Step"}
                </button>
              </div>
            </div>

            {/* Visual Progress Line */}
            <div className="w-full bg-[#E2E8F0]/60 dark:bg-[#263449] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#2563EB] to-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(createStep / 4) * 100}%` }}
              />
            </div>

            {/* Restored Draft Notice Banner */}
            {isDraftRestored && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Resumed from your auto-saved draft. All configured steps and settings are preserved.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDraftRestored(false)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-white px-2 py-0.5 rounded cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* ═══════ TOP-DOWN COLLAPSIBLE STEPPER ═══════ */}
          <form onSubmit={handleCreateExam} className="space-y-4">
            
            {/* STEP 1: CONTENT SOURCE */}
            <div className={`border rounded-2xl transition-all overflow-hidden ${
              createStep === 1
                ? "bg-white dark:bg-[#111C31] border-[#2563EB]/40 shadow-sm ring-1 ring-[#2563EB]/20"
                : createStep > 1
                ? "bg-white dark:bg-[#111C31] border-[#E2E8F0] dark:border-[#263449]"
                : "bg-[#F8FAFC]/60 dark:bg-[#0B1120]/60 border-[#E2E8F0] dark:border-[#263449] opacity-85"
            }`}>
              {/* Step 1 Header Button */}
              <button
                type="button"
                onClick={() => {
                  if (expandedStep === 1) {
                    setExpandedStep(null);
                  } else {
                    setExpandedStep(1);
                    setCreateStep(1);
                  }
                }}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#F7F4EF]/50 dark:hover:bg-[#1D1B19]/50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    createStep > 1
                      ? "bg-emerald-600 text-white"
                      : createStep === 1
                      ? "bg-[#C84B18] text-white"
                      : "bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67]"
                  }`}>
                    {createStep > 1 ? <Check className="h-4 w-4" /> : "1"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] break-words leading-snug">
                      01. Knowledge Source & Assessment Details
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] break-words line-clamp-2 mt-0.5">
                      {examName ? `${examName} • ${examSubject || "General"}` : "Select curriculum domain and title"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hidden sm:inline">
                    {expandedStep === 1 ? "Minimize" : "Expand"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#716D67] transition-transform duration-200 ${expandedStep === 1 ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Step 1 Body */}
              {expandedStep === 1 && (
                <div className="p-4 sm:p-5 pt-1 border-t border-[#E5E0D8] dark:border-[#292524] space-y-4 max-w-3xl animate-fadeIn">
                  
                  {/* Knowledge Source Selection / Upload Dual-Mode Toggle */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className={labelCls}>Knowledge Source</label>
                      <button
                        type="button"
                        onClick={() => setIsStep1KbModalOpen(true)}
                        className="text-xs font-bold text-[#C84B18] dark:text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Upload New KB</span>
                      </button>
                    </div>

                    {/* Mode Toggle Switcher — 4 compact options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-[#F0ECE4]/60 dark:bg-[#1D1B19] rounded-xl border border-[#E5E0D8] dark:border-[#292524] gap-1">
                      {/* 1. Existing KB */}
                      <button
                        type="button"
                        onClick={() => setStep1SourceMode("select")}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          step1SourceMode === "select"
                            ? "bg-white dark:bg-[#292524] text-[#242321] dark:text-[#F5F5F4] shadow-xs"
                            : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white"
                        }`}
                        title="Use existing indexed Knowledge Base"
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate hidden xs:inline">Existing KB</span>
                        <span className="xs:hidden">KB</span>
                      </button>

                      {/* 2. Upload Document */}
                      <button
                        type="button"
                        onClick={() => setStep1SourceMode("upload")}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          step1SourceMode === "upload"
                            ? "bg-[#C84B18] dark:bg-[#EA580C] text-white shadow-xs"
                            : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white"
                        }`}
                        title="Upload a PDF/DOCX/TXT document as source"
                      >
                        <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate hidden xs:inline">Upload Doc</span>
                        <span className="xs:hidden">Doc</span>
                      </button>

                      {/* 3. AI Prompt */}
                      <button
                        type="button"
                        onClick={() => setStep1SourceMode("ai_prompt")}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          step1SourceMode === "ai_prompt"
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white"
                        }`}
                        title="Describe the topic — AI generates questions directly"
                      >
                        <Bot className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate hidden xs:inline">AI Prompt</span>
                        <span className="xs:hidden">AI</span>
                      </button>

                      {/* 4. Camera Photo */}
                      <button
                        type="button"
                        onClick={() => setStep1SourceMode("camera")}
                        className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          step1SourceMode === "camera"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-[#716D67] dark:text-[#A8A29E] hover:text-[#242321] dark:hover:text-white"
                        }`}
                        title="Take a photo of notes/textbook — AI reads & creates questions"
                      >
                        <Camera className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate hidden xs:inline">Camera</span>
                        <span className="xs:hidden">📷</span>
                      </button>
                    </div>

                    {/* Notification Chip if document was just uploaded */}
                    {step1UploadSuccess && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            Indexed <b>&ldquo;{step1UploadSuccess.fileName}&rdquo;</b> &rarr; Selected <b>&ldquo;{step1UploadSuccess.subjectId}&rdquo;</b>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep1UploadSuccess(null)}
                          className="text-emerald-600 hover:text-emerald-800 p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* MODE A: Select from Existing Knowledge Base */}
                    {step1SourceMode === "select" && (
                      <div className="space-y-1.5">
                        {kbSubjects.length > 0 ? (
                          <select
                            required
                            value={examSubject}
                            onChange={(e) => {
                              setExamSubject(e.target.value);
                              if (step1UploadSuccess && e.target.value !== step1UploadSuccess.subjectId) {
                                setStep1UploadSuccess(null);
                              }
                            }}
                            className={inputCls}
                          >
                            <option value="">Select Knowledge Source...</option>
                            {kbSubjects.map((s: any, idx: number) => {
                              const sId = typeof s === "string" ? s : s.subject_id;
                              const sName = typeof s === "string" ? s : s.name;
                              const sCount = typeof s === "object" && s !== null ? s.document_count : undefined;
                              return (
                                <option key={sId || idx} value={sId}>
                                  {sName} {sCount !== undefined ? `(${sCount} document${sCount > 1 ? "s" : ""})` : ""}
                                </option>
                              );
                            })}
                            <option value="general_101">General Knowledge Base</option>
                          </select>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              required
                              value={examSubject}
                              onChange={(e) => setExamSubject(e.target.value)}
                              placeholder="e.g. general_101 or ai_unit_1"
                              className={inputCls}
                            />
                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                              No existing KB documents found. Switch to &ldquo;Upload New Document Now&rdquo; above to add your lecture notes or textbooks!
                            </p>
                          </div>
                        )}
                        <p className="text-[11px] text-[#716D67]">
                          Questions will be strictly generated using documents in this knowledge source.
                        </p>
                      </div>
                    )}

                    {/* MODE B: Direct Inline KB Document Upload */}
                    {step1SourceMode === "upload" && (
                      <div className="space-y-3 p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#1D1B19] border border-[#E5E0D8] dark:border-[#292524]">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                            Subject / Knowledge Domain <span className="text-[#C84B18]">*</span>
                          </label>
                          <input
                            type="text"
                            value={step1UploadSubject}
                            onChange={(e) => setStep1UploadSubject(e.target.value)}
                            placeholder="e.g. Machine_Learning_Unit_1"
                            list="existing-kb-subjects-list"
                            className={inputCls}
                          />
                          {kbSubjects.length > 0 && (
                            <datalist id="existing-kb-subjects-list">
                              {kbSubjects.map((s: any, idx: number) => {
                                const sVal = typeof s === "string" ? s : s.subject_id;
                                return <option key={sVal || idx} value={sVal} />;
                              })}
                            </datalist>
                          )}
                        </div>

                        {/* Dropzone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setStep1IsDragging(true);
                          }}
                          onDragLeave={() => setStep1IsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setStep1IsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              validateAndSetStep1File(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            step1IsDragging
                              ? "border-[#C84B18] bg-[#C84B18]/5"
                              : step1UploadFile
                              ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                              : "border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/60 bg-white dark:bg-[#171615]"
                          }`}
                          onClick={() => {
                            const input = document.getElementById("step1-file-input");
                            if (input) input.click();
                          }}
                        >
                          <input
                            id="step1-file-input"
                            type="file"
                            accept=".pdf,.txt,.docx,.pptx,.md"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                validateAndSetStep1File(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />

                          {step1UploadFile ? (
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#171615] border border-emerald-500/30">
                              <div className="flex items-center gap-2.5 text-left truncate">
                                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="truncate">
                                  <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] truncate">{step1UploadFile.name}</div>
                                  <div className="text-[10px] text-[#716D67]">{(step1UploadFile.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStep1UploadFile(null);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1 py-1">
                              <UploadCloud className="h-6 w-6 text-[#C84B18] mx-auto" />
                              <div className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                                Drop document file or click to browse
                              </div>
                              <div className="text-[10px] text-[#716D67] dark:text-[#A8A29E]">
                                PDF, DOCX, TXT, PPTX (Max 25MB)
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload & Index Button */}
                        <button
                          type="button"
                          onClick={() => handleStep1DirectUpload()}
                          disabled={isStep1Uploading || !step1UploadFile || !step1UploadSubject.trim()}
                          className="w-full py-2 px-4 bg-[#C84B18] hover:bg-[#B33E0F] dark:bg-[#EA580C] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isStep1Uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Processing Document into Knowledge Base...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4" />
                              <span>Upload & Use as Knowledge Source</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ── MODE C: AI Prompt — describe topic, AI generates directly ── */}
                    {step1SourceMode === "ai_prompt" && (
                      <div className="space-y-3 p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                          <Bot className="h-3.5 w-3.5 shrink-0" />
                          <span>AI Direct Prompt — No KB Required</span>
                        </div>
                        <p className="text-[11px] text-purple-600 dark:text-purple-400 leading-relaxed">
                          Describe the topic you want tested. The AI will generate questions directly from your description — no document needed.
                        </p>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase tracking-wider">
                            Your Prompt / Topic Description <span className="text-[#C84B18]">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={step1AiPrompt}
                            onChange={(e) => {
                              setStep1AiPrompt(e.target.value);
                              // Auto-fill topic and subject from prompt
                              if (e.target.value.trim() && !examTopic) {
                                setExamTopic(e.target.value.trim().slice(0, 60));
                              }
                              if (e.target.value.trim() && !examSubject) {
                                setExamSubject("ai_prompt_generated");
                              }
                            }}
                            placeholder="e.g. Generate MCQs on the water cycle, photosynthesis, and plant respiration for Class 10 Biology students at medium difficulty."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#171615] text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:border-purple-500 placeholder:text-[#A8A29E] resize-none"
                          />
                          {step1AiPrompt.trim() && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>Ready — AI will use this prompt as the knowledge context</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── MODE D: Camera / Photo Upload — take or pick a photo of notes ── */}
                    {step1SourceMode === "camera" && (
                      <div className="space-y-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                          <Camera className="h-3.5 w-3.5 shrink-0" />
                          <span>Photo of Notes / Textbook Page</span>
                        </div>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                          Take a photo of your textbook, whiteboard, or handwritten notes. OCR AI will scan the content and generate questions from it.
                        </p>

                        {/* Preview + Clear */}
                        {step1CameraPreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800/50">
                            <img
                              src={step1CameraPreview}
                              alt="Captured notes preview"
                              className="w-full max-h-48 object-contain bg-black/5 dark:bg-white/5"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setStep1CameraPhoto(null);
                                setStep1CameraPreview(null);
                              }}
                              className="absolute top-2 right-2 p-1 rounded-full bg-white/90 dark:bg-black/70 text-rose-600 hover:bg-rose-100 transition-all shadow cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                              ✓ Photo Ready
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {/* Take Photo — opens camera on mobile */}
                            <label className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-[#171615] cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-center">
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setStep1CameraPhoto(file);
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setStep1CameraPreview(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                  // auto-fill subject if empty
                                  if (!examSubject) setExamSubject("photo_scan_source");
                                }}
                              />
                              <Camera className="h-6 w-6 text-blue-500" />
                              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Take Photo</span>
                              <span className="text-[10px] text-blue-500 dark:text-blue-400">Opens Camera</span>
                            </label>

                            {/* Upload existing photo */}
                            <label className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-[#171615] cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-center">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setStep1CameraPhoto(file);
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setStep1CameraPreview(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                  if (!examSubject) setExamSubject("photo_scan_source");
                                }}
                              />
                              <UploadCloud className="h-6 w-6 text-blue-500" />
                              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Upload Photo</span>
                              <span className="text-[10px] text-blue-500 dark:text-blue-400">From Gallery</span>
                            </label>
                          </div>
                        )}

                        {/* Upload photo to KB as image */}
                        {step1CameraPhoto && (
                          <button
                            type="button"
                            disabled={step1CameraUploading}
                            onClick={async () => {
                              setStep1CameraUploading(true);
                              try {
                                const subjectId = examSubject || "photo_scan_source";
                                const formData = new FormData();
                                formData.append("file", step1CameraPhoto);
                                formData.append("subject_id", subjectId);
                                const res = await apiFetch("/kb/upload", { token, method: "POST", body: formData });
                                if (res.ok) {
                                  setExamSubject(subjectId);
                                  setStep1UploadSuccess({ fileName: step1CameraPhoto.name, subjectId });
                                  showToast("Photo indexed! AI will generate questions from it.", "success");
                                  setStep1SourceMode("select");
                                  setStep1CameraPhoto(null);
                                  setStep1CameraPreview(null);
                                  fetchData();
                                } else {
                                  showToast("Failed to upload photo. Please try again.", "error");
                                }
                              } catch {
                                showToast("Network error uploading photo.", "error");
                              } finally {
                                setStep1CameraUploading(false);
                              }
                            }}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {step1CameraUploading ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /><span>Scanning Photo with Smart OCR...</span></>
                            ) : (
                              <><Camera className="h-4 w-4" /><span>Index Photo & Use as Knowledge Source</span></>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Assessment Title</label>
                    <input
                      type="text"
                      required
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="e.g. Unit 1 Examination Paper"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Topic Keyword</label>
                    <input
                      type="text"
                      value={examTopic}
                      onChange={(e) => setExamTopic(e.target.value)}
                      placeholder="e.g. Neural Networks, Machine Learning"
                      className={inputCls}
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (step1SourceMode === "upload" && step1UploadFile && !examSubject) {
                          await handleStep1DirectUpload();
                        }
                        setCreateStep(2);
                        setExpandedStep(2);
                      }} 
                      className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Continue to Questions</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: QUESTIONS CONFIG */}
            <div className={`border rounded-2xl transition-all overflow-hidden ${
              createStep === 2
                ? "bg-white dark:bg-[#171615] border-[#C84B18]/40 shadow-sm ring-1 ring-[#C84B18]/20"
                : createStep > 2
                ? "bg-white dark:bg-[#171615] border-[#E5E0D8] dark:border-[#292524]"
                : "bg-[#F7F4EF]/60 dark:bg-[#141312]/60 border-[#E5E0D8] dark:border-[#292524] opacity-85"
            }`}>
              {/* Step 2 Header Button */}
              <button
                type="button"
                onClick={() => {
                  if (expandedStep === 2) {
                    setExpandedStep(null);
                  } else {
                    setExpandedStep(2);
                    setCreateStep(2);
                  }
                }}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#F7F4EF]/50 dark:hover:bg-[#1D1B19]/50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    createStep > 2
                      ? "bg-emerald-600 text-white"
                      : createStep === 2
                      ? "bg-[#C84B18] text-white"
                      : "bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67]"
                  }`}>
                    {createStep > 2 ? <Check className="h-4 w-4" /> : "2"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] break-words leading-snug">
                      02. Question Format, Difficulty & AI Blueprint
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] break-words line-clamp-2 mt-0.5">
                      {numMcq} MCQ • {numSubjective} Subjective • Difficulty: {difficulty.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hidden sm:inline">
                    {expandedStep === 2 ? "Minimize" : "Expand"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#716D67] transition-transform duration-200 ${expandedStep === 2 ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Step 2 Body */}
              {expandedStep === 2 && (
                <div className="p-4 sm:p-5 pt-1 border-t border-[#E5E0D8] dark:border-[#292524] space-y-4 max-w-3xl animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Question Format</label>
                      <select
                        value={questionType}
                        onChange={(e: any) => setQuestionType(e.target.value)}
                        className={inputCls}
                      >
                        <option value="mcq">Multiple Choice (MCQ)</option>
                        <option value="subjective">Subjective / Descriptive</option>
                        <option value="tf">True / False</option>
                        <option value="mixed">Mixed (MCQ + Subjective)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls}>Difficulty Level</label>
                      <select
                        value={difficulty}
                        onChange={(e: any) => setDifficulty(e.target.value)}
                        className={inputCls}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Question Count Controls */}
                  {questionType === "mcq" && (
                    <div className="space-y-1.5">
                      <label className={labelCls}>Number of Multiple Choice Questions (MCQs)</label>
                      <input
                        type="number"
                        value={numMcq}
                        onChange={(e) => setNumMcq(e.target.value)}
                        min="1"
                        max="50"
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[#716D67]">
                        Each question will have 4 domain-specific options with single correct answer.
                      </p>
                    </div>
                  )}

                  {questionType === "tf" && (
                    <div className="space-y-1.5">
                      <label className={labelCls}>Number of True / False Questions</label>
                      <input
                        type="number"
                        value={numMcq}
                        onChange={(e) => setNumMcq(e.target.value)}
                        min="1"
                        max="50"
                        className={inputCls}
                      />
                    </div>
                  )}

                  {questionType === "subjective" && (
                    <div className="space-y-1.5">
                      <label className={labelCls}>Number of Subjective Questions</label>
                      <input
                        type="number"
                        value={numSubjective || "5"}
                        onChange={(e) => setNumSubjective(e.target.value)}
                        min="1"
                        max="20"
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[#716D67]">
                        Students will provide descriptive answers evaluated against rubric key concepts.
                      </p>
                    </div>
                  )}

                  {questionType === "mixed" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className={labelCls}>No. of MCQs</label>
                        <input
                          type="number"
                          value={numMcq}
                          onChange={(e) => setNumMcq(e.target.value)}
                          min="1"
                          max="40"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelCls}>No. of Subjective</label>
                        <input
                          type="number"
                          value={numSubjective || "2"}
                          onChange={(e) => setNumSubjective(e.target.value)}
                          min="1"
                          max="15"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Cognitive Target & Custom Guidelines */}
                  <div className="p-4 rounded-xl bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] space-y-3.5 pt-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#C84B18] dark:text-[#EA580C]" />
                      <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                        AI Blueprint Co-Pilot Tuning
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase">
                          Bloom&apos;s Cognitive Target
                        </label>
                        <select
                          value={cognitiveTarget}
                          onChange={(e: any) => setCognitiveTarget(e.target.value)}
                          className={inputCls}
                        >
                          <option value="recall">Recall & Definitions (Knowledge)</option>
                          <option value="understand">Conceptual Understanding</option>
                          <option value="apply">Application & Problem Solving</option>
                          <option value="analyze">Critical Analysis & Reasoning</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase">
                          Difficulty Ratio Blend
                        </label>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#C84B18] bg-[#C84B18]/10 px-2 py-0.5 rounded">Easy: {diffEasyPct}%</span>
                          <span className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Med: {diffMedPct}%</span>
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">Hard: {diffHardPct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] uppercase flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C84B18]" />
                          <span>Teacher Instructions to AI Generator</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPromptGuide((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C84B18] dark:text-[#EA580C] hover:underline cursor-pointer"
                          >
                            <Lightbulb className="w-3 h-3" />
                            <span>{showPromptGuide ? "Hide Guide" : "Formulation Guide"}</span>
                          </button>
                          {customPromptInstructions && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPromptInstructions("");
                                showToast("Custom instructions cleared", "info");
                              }}
                              className="text-[11px] text-[#716D67] hover:text-red-500 transition-colors cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Formulation Guide Collapsible */}
                      {showPromptGuide && (
                        <div className="p-3 bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs space-y-2 animate-fadeIn">
                          <div className="flex items-center gap-1.5 font-bold text-[#242321] dark:text-[#F5F5F4] text-[11px]">
                            <HelpCircle className="w-3.5 h-3.5 text-[#C84B18]" />
                            <span>How to Formulate an Effective Prompt for AI Question Generation</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                            <div className="p-2 rounded-lg bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524]">
                              <p className="font-semibold text-[#242321] dark:text-[#F5F5F4] mb-0.5">1. Target Concepts</p>
                              <p>Pinpoint subtopics: &quot;Focus on concurrency, deadlocks, and thread safety rather than general OS definitions.&quot;</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524]">
                              <p className="font-semibold text-[#242321] dark:text-[#F5F5F4] mb-0.5">2. Practical Format</p>
                              <p>Request specific forms: &quot;Include a 4-line Python code block with tricky indexing and ask for stdout.&quot;</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524]">
                              <p className="font-semibold text-[#242321] dark:text-[#F5F5F4] mb-0.5">3. Negative Constraints</p>
                              <p>Eliminate weak questions: &quot;No trivia, no questions on history or year numbers, no &apos;All of the above&apos;.&quot;</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524]">
                              <p className="font-semibold text-[#242321] dark:text-[#F5F5F4] mb-0.5">4. Plausible Distractors</p>
                              <p>Prevent guessing: &quot;Ensure all 4 options look mathematically valid and target common conceptual misconceptions.&quot;</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={customPromptInstructions}
                        onChange={(e) => setCustomPromptInstructions(e.target.value)}
                        placeholder="e.g. Include Python code snippets, focus on numerical calculations, avoid trivial definitions... or click any ready-made sample below!"
                        className="w-full bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-xl p-2.5 text-xs text-[#242321] dark:text-[#F5F5F4] focus:outline-none focus:ring-1 focus:ring-[#C84B18] shadow-xs"
                      />

                      {/* Ready-made sample prompt pills */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#716D67] dark:text-[#A8A29E] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#C84B18]" />
                            <span>Ready-Made Sample Prompts (Click to Insert)</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {READY_MADE_PROMPTS.map((item) => {
                            const isSelected = customPromptInstructions.includes(item.prompt);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomPromptInstructions((prev) =>
                                      prev.replace(item.prompt, "").replace(/\n\n+/g, "\n").trim()
                                    );
                                    showToast(`Removed "${item.title}" prompt`, "info");
                                  } else {
                                    setCustomPromptInstructions((prev) =>
                                      prev ? `${prev.trim()}\n\n${item.prompt}` : item.prompt
                                    );
                                    showToast(`Inserted "${item.title}" prompt!`, "success");
                                  }
                                }}
                                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                                  isSelected
                                    ? "bg-[#C84B18]/10 dark:bg-[#EA580C]/15 border-[#C84B18] dark:border-[#EA580C] shadow-xs"
                                    : "bg-[#FAF8F5] dark:bg-[#1C1A17] hover:bg-[#F0ECE4] dark:hover:bg-[#292524] border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18]/40"
                                }`}
                                title={item.prompt}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                                    <span>{item.icon}</span>
                                    <span className="group-hover:text-[#C84B18] transition-colors">{item.title}</span>
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E5E0D8]/60 dark:bg-[#292524] text-[#716D67] dark:text-[#A8A29E] font-medium shrink-0">
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E] line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep(1);
                        setExpandedStep(1);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs font-semibold text-[#716D67] hover:text-[#242321] flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-[#171615]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Source</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCreateStep(3);
                        setExpandedStep(3);
                      }} 
                      className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Continue to Rules</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: RULES & SCHEDULING */}
            <div className={`border rounded-2xl transition-all overflow-hidden ${
              createStep === 3
                ? "bg-white dark:bg-[#171615] border-[#C84B18]/40 shadow-sm ring-1 ring-[#C84B18]/20"
                : createStep > 3
                ? "bg-white dark:bg-[#171615] border-[#E5E0D8] dark:border-[#292524]"
                : "bg-[#F7F4EF]/60 dark:bg-[#141312]/60 border-[#E5E0D8] dark:border-[#292524] opacity-85"
            }`}>
              {/* Step 3 Header Button */}
              <button
                type="button"
                onClick={() => {
                  if (expandedStep === 3) {
                    setExpandedStep(null);
                  } else {
                    setExpandedStep(3);
                    setCreateStep(3);
                  }
                }}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#F7F4EF]/50 dark:hover:bg-[#1D1B19]/50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    createStep > 3
                      ? "bg-emerald-600 text-white"
                      : createStep === 3
                      ? "bg-[#C84B18] text-white"
                      : "bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67]"
                  }`}>
                    {createStep > 3 ? <Check className="h-4 w-4" /> : "3"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] break-words leading-snug">
                      03. Duration, Marks & Schedule Window
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] break-words line-clamp-2 mt-0.5">
                      {examDuration} min • {examMarks} pts • Strategy: {marksDistMode === "equal" ? "Equal" : marksDistMode === "by_type" ? "By Type" : marksDistMode === "by_difficulty" ? "By Difficulty" : "Custom Slots"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hidden sm:inline">
                    {expandedStep === 3 ? "Minimize" : "Expand"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#716D67] transition-transform duration-200 ${expandedStep === 3 ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Step 3 Body */}
              {expandedStep === 3 && (
                <div className="p-4 sm:p-5 pt-1 border-t border-[#E5E0D8] dark:border-[#292524] space-y-4 max-w-3xl animate-fadeIn">
                  {/* Duration & Total Marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Duration (Minutes)</label>
                      <input
                        type="number"
                        value={examDuration}
                        onChange={(e) => setExamDuration(e.target.value)}
                        min="1"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={labelCls}>Total Marks</label>
                        {marksDistMode !== "equal" && (
                          <span className="text-[10px] text-[#C84B18] dark:text-[#EA580C] font-semibold">
                            Auto-sync from {marksDistMode === "by_type" ? "types" : marksDistMode === "by_difficulty" ? "tiers" : "slots"}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={examMarks}
                          onChange={(e) => setExamMarks(e.target.value)}
                          min="1"
                          className={inputCls}
                        />
                        {marksDistMode !== "equal" && examMarks !== String(calculatedTotalMarks) && (
                          <button
                            type="button"
                            onClick={() => syncTotalMarks()}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#C84B18] text-white hover:bg-[#A0360D] transition-colors cursor-pointer"
                            title="Click to synchronize total marks with calculated strategy sum"
                          >
                            Sync ({calculatedTotalMarks})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ════ Marks Distribution Strategy Card ════ */}
                  <div className="p-4 rounded-xl bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-[#C84B18] dark:text-[#EA580C]" />
                        <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] uppercase tracking-wider">
                          Marks Distribution Strategy
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] text-[11px] font-semibold text-[#242321] dark:text-[#F5F5F4] shadow-2xs self-start sm:self-auto">
                        <span className="text-[#716D67]">Calculated:</span>
                        <span className="text-[#C84B18] font-bold">{calculatedTotalMarks} pts</span>
                        {examMarks !== String(calculatedTotalMarks) && (
                          <button
                            type="button"
                            onClick={() => syncTotalMarks()}
                            className="ml-1 text-[10px] text-[#C84B18] hover:underline font-bold cursor-pointer"
                          >
                            (Sync)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mode Selector Segmented Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] rounded-xl">
                      {[
                        { id: "equal", label: "Equal", icon: "=", desc: "Flat per question" },
                        { id: "by_type", label: "By Format", icon: "🎯", desc: "MCQ vs Subj" },
                        { id: "by_difficulty", label: "By Difficulty", icon: "⚡", desc: "Easy/Med/Hard" },
                        { id: "custom", label: "Custom Slots", icon: "✏️", desc: "Individual Qs" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setMarksDistMode(mode.id as any);
                            if (mode.id !== "equal") {
                              setTimeout(() => syncTotalMarks(), 50);
                            }
                          }}
                          className={`p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                            marksDistMode === mode.id
                              ? "bg-[#C84B18] text-white shadow-xs"
                              : "hover:bg-[#F7F4EF] dark:hover:bg-[#242321] text-[#716D67] dark:text-[#A8A29E]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className="text-xs">{mode.icon}</span>
                            <span className={marksDistMode === mode.id ? "text-white" : "text-[#242321] dark:text-[#F5F5F4]"}>
                              {mode.label}
                            </span>
                          </div>
                          <span className={`text-[10px] mt-0.5 truncate ${marksDistMode === mode.id ? "text-white/80" : "text-[#716D67]"}`}>
                            {mode.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* MODE 1: EQUAL */}
                    {marksDistMode === "equal" && (
                      <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-[#716D67] dark:text-[#A8A29E]">
                          <span>
                            Total <b className="text-[#242321] dark:text-[#F5F5F4]">{examMarks} pts</b> divided equally across <b className="text-[#242321] dark:text-[#F5F5F4]">{computedQuestionCount} questions</b>.
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#C84B18]/10 text-[#C84B18] font-bold text-[11px]">
                            ~{(parseFloat(examMarks) / Math.max(1, computedQuestionCount)).toFixed(2)} pts / question
                          </span>
                        </div>
                        <div className="pt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-[#716D67] uppercase">Quick Presets:</span>
                          {[1, 2, 4, 5].map((pts) => {
                            const total = computedQuestionCount * pts;
                            return (
                              <button
                                key={pts}
                                type="button"
                                onClick={() => syncTotalMarks(total)}
                                className="px-2 py-1 rounded-md text-[11px] font-medium border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#141312] hover:border-[#C84B18] transition-colors cursor-pointer"
                              >
                                {pts} pt/Q ({total} pts)
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MODE 2: BY QUESTION TYPE / FORMAT */}
                    {marksDistMode === "by_type" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* MCQ Weight */}
                          {(questionType === "mcq" || questionType === "mixed") && (
                            <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1">
                                  <span>🔘</span> MCQ Marks
                                </span>
                                <span className="text-[10px] text-[#716D67]">{numMcq} questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={marksByType.mcq}
                                  onChange={(e) => {
                                    const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                    setMarksByType((prev) => ({ ...prev, mcq: val }));
                                  }}
                                  className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                                />
                                <span className="text-xs font-semibold text-[#716D67]">pts</span>
                              </div>
                              <div className="text-[10px] text-[#716D67]">
                                Subtotal: <b className="text-[#242321] dark:text-[#F5F5F4]">{(parseInt(numMcq) || 0) * marksByType.mcq} pts</b>
                              </div>
                            </div>
                          )}

                          {/* Subjective Weight */}
                          {(questionType === "subjective" || questionType === "mixed") && (
                            <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1">
                                  <span>📝</span> Subjective Marks
                                </span>
                                <span className="text-[10px] text-[#716D67]">{numSubjective || 2} questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={marksByType.subjective}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseFloat(e.target.value) || 1);
                                    setMarksByType((prev) => ({ ...prev, subjective: val }));
                                  }}
                                  className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                                />
                                <span className="text-xs font-semibold text-[#716D67]">pts</span>
                              </div>
                              <div className="text-[10px] text-[#716D67]">
                                Subtotal: <b className="text-[#242321] dark:text-[#F5F5F4]">{(parseInt(numSubjective) || 2) * marksByType.subjective} pts</b>
                              </div>
                            </div>
                          )}

                          {/* True/False Weight */}
                          {questionType === "tf" && (
                            <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1">
                                  <span>⚖️</span> True/False Marks
                                </span>
                                <span className="text-[10px] text-[#716D67]">{numMcq} questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={marksByType.tf}
                                  onChange={(e) => {
                                    const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                    setMarksByType((prev) => ({ ...prev, tf: val }));
                                  }}
                                  className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                                />
                                <span className="text-xs font-semibold text-[#716D67]">pts</span>
                              </div>
                              <div className="text-[10px] text-[#716D67]">
                                Subtotal: <b className="text-[#242321] dark:text-[#F5F5F4]">{(parseInt(numMcq) || 5) * marksByType.tf} pts</b>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] flex items-center justify-between text-xs">
                          <span className="text-[#716D67] dark:text-[#A8A29E]">Formula Total:</span>
                          <span className="font-bold text-[#C84B18]">{calculatedTotalMarks} pts</span>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: BY DIFFICULTY TIER */}
                    {marksDistMode === "by_difficulty" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Easy */}
                          <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">🟢 Easy Tier</span>
                              <span className="text-[10px] text-[#716D67]">{diffEasyPct}% blend</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={marksByDiff.easy}
                                onChange={(e) => {
                                  const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                  setMarksByDiff((prev) => ({ ...prev, easy: val }));
                                }}
                                className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                              />
                              <span className="text-xs font-semibold text-[#716D67]">pts</span>
                            </div>
                            <div className="text-[10px] text-[#716D67]">
                              Count: ~{Math.round(computedQuestionCount * (diffEasyPct / 100))} Qs
                            </div>
                          </div>

                          {/* Medium */}
                          <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">🟡 Medium Tier</span>
                              <span className="text-[10px] text-[#716D67]">{diffMedPct}% blend</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={marksByDiff.medium}
                                onChange={(e) => {
                                  const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                  setMarksByDiff((prev) => ({ ...prev, medium: val }));
                                }}
                                className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                              />
                              <span className="text-xs font-semibold text-[#716D67]">pts</span>
                            </div>
                            <div className="text-[10px] text-[#716D67]">
                              Count: ~{Math.max(0, computedQuestionCount - Math.round(computedQuestionCount * (diffEasyPct / 100)) - Math.round(computedQuestionCount * (diffHardPct / 100)))} Qs
                            </div>
                          </div>

                          {/* Hard */}
                          <div className="p-3 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">🔴 Hard Tier</span>
                              <span className="text-[10px] text-[#716D67]">{diffHardPct}% blend</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={marksByDiff.hard}
                                onChange={(e) => {
                                  const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                  setMarksByDiff((prev) => ({ ...prev, hard: val }));
                                }}
                                className="w-full bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-lg p-2 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                              />
                              <span className="text-xs font-semibold text-[#716D67]">pts</span>
                            </div>
                            <div className="text-[10px] text-[#716D67]">
                              Count: ~{Math.round(computedQuestionCount * (diffHardPct / 100))} Qs
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] flex items-center justify-between text-xs">
                          <span className="text-[#716D67] dark:text-[#A8A29E]">Difficulty-Weighted Total:</span>
                          <span className="font-bold text-[#C84B18]">{calculatedTotalMarks} pts</span>
                        </div>
                      </div>
                    )}

                    {/* MODE 4: CUSTOM QUESTION SLOTS */}
                    {marksDistMode === "custom" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="text-[#716D67] dark:text-[#A8A29E]">
                            Assign individual mark weights for each of the {computedQuestionCount} questions:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const even = Math.max(1, Math.round((parseFloat(examMarks) || 50) / computedQuestionCount));
                                setCustomSlotMarks(Array(computedQuestionCount).fill(even));
                              }}
                              className="px-2 py-1 rounded bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] text-[11px] font-semibold text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer"
                            >
                              Auto-Balance
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomSlotMarks(Array(computedQuestionCount).fill(2))}
                              className="px-2 py-1 rounded bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] text-[11px] font-semibold text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer"
                            >
                              Set All to 2
                            </button>
                          </div>
                        </div>

                        {/* Interactive Slots Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1.5 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524]">
                          {Array.from({ length: computedQuestionCount }).map((_, idx) => {
                            const val = customSlotMarks[idx] !== undefined ? customSlotMarks[idx] : 2;
                            return (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] flex flex-col items-center gap-1 text-center"
                              >
                                <span className="text-[10px] font-bold text-[#716D67]">Q{idx + 1}</span>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={val}
                                  onChange={(e) => {
                                    const next = [...customSlotMarks];
                                    next[idx] = Math.max(0.5, parseFloat(e.target.value) || 1);
                                    setCustomSlotMarks(next);
                                  }}
                                  className="w-14 text-center bg-white dark:bg-[#1C1A17] border border-[#E5E0D8] dark:border-[#292524] rounded p-1 text-xs font-bold text-[#242321] dark:text-[#F5F5F4] focus:ring-1 focus:ring-[#C84B18]"
                                />
                                <span className="text-[9px] text-[#716D67]">pts</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-2.5 bg-white dark:bg-[#1C1A17] rounded-xl border border-[#E5E0D8] dark:border-[#292524] flex items-center justify-between text-xs">
                          <span className="text-[#716D67] dark:text-[#A8A29E]">Sum of {computedQuestionCount} Question Slots:</span>
                          <span className="font-bold text-[#C84B18]">{calculatedTotalMarks} pts</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Passing Marks & Negative Marking */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={labelCls}>Passing Marks</label>
                        <span className="text-[10px] text-[#716D67]">
                          (~{Math.round(((parseFloat(examPass) || 0) / (parseFloat(examMarks) || 1)) * 100)}% threshold)
                        </span>
                      </div>
                      <input
                        type="number"
                        value={examPass}
                        onChange={(e) => setExamPass(e.target.value)}
                        min="1"
                        max={examMarks}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={labelCls}>Negative Marking (Penalty per Incorrect)</label>
                        <span className="text-[10px] text-[#716D67]">0 = Disabled</span>
                      </div>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={examNegative}
                        onChange={(e) => setExamNegative(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Presets Grid */}
                  <div className="space-y-2 pt-1">
                    <label className={labelCls}>Quick Schedule Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setSchedulePreset("now")}
                        className="p-2 text-center text-xs font-semibold border border-[#E5E0D8] dark:border-[#292524] rounded-xl bg-[#F7F4EF] dark:bg-[#141312] hover:border-[#C84B18] transition-colors cursor-pointer truncate"
                      >
                        ⚡ Start Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchedulePreset("open30days")}
                        className="p-2 text-center text-xs font-semibold border border-[#E5E0D8] dark:border-[#292524] rounded-xl bg-[#F7F4EF] dark:bg-[#141312] hover:border-[#C84B18] transition-colors cursor-pointer truncate"
                      >
                        📅 30-Day Window
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchedulePreset("today4pm")}
                        className="p-2 text-center text-xs font-semibold border border-[#E5E0D8] dark:border-[#292524] rounded-xl bg-[#F7F4EF] dark:bg-[#141312] hover:border-[#C84B18] transition-colors cursor-pointer truncate"
                      >
                        Today 4 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchedulePreset("tomorrow10am")}
                        className="p-2 text-center text-xs font-semibold border border-[#E5E0D8] dark:border-[#292524] rounded-xl bg-[#F7F4EF] dark:bg-[#141312] hover:border-[#C84B18] transition-colors cursor-pointer truncate"
                      >
                        Tomorrow 10 AM
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={labelCls}>Start Date & Time</label>
                        <span className="text-[10px] font-bold text-[#C84B18] dark:text-[#F97316]">
                          IST (Asia/Kolkata)
                        </span>
                      </div>
                      <input
                        type="datetime-local"
                        value={examStartDate}
                        onChange={(e) => setExamStartDate(e.target.value)}
                        className={`${inputCls} min-w-0`}
                      />
                      {examStartDate && (
                        <p className="text-[10px] text-[#047857] dark:text-[#10B981] font-medium">
                          ✓ Starts: {formatISTDateTime(parseISTInputToUtcIso(examStartDate))}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={labelCls}>End Date & Time</label>
                        <span className="text-[10px] font-bold text-[#C84B18] dark:text-[#F97316]">
                          IST (Asia/Kolkata)
                        </span>
                      </div>
                      <input
                        type="datetime-local"
                        value={examEndDate}
                        onChange={(e) => setExamEndDate(e.target.value)}
                        className={`${inputCls} min-w-0`}
                      />
                      {examEndDate && (
                        <p className="text-[10px] text-[#047857] dark:text-[#10B981] font-medium">
                          ✓ Closes: {formatISTDateTime(parseISTInputToUtcIso(examEndDate))}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ═══════ PASSING CERTIFICATE SETTINGS ═══════ */}
                  <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263449] space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449]">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Enable Passing Certificates
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Optional
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Automatically issue verified digital certificates with QR codes to students who pass.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={enableCertificate}
                          onChange={(e) => setEnableCertificate(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {enableCertificate && (
                      <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              <span>Template: {certificateConfig.template_id === "testora_default" ? "Testora Navy & Gold (Official)" : certificateConfig.template_id}</span>
                            </div>
                            <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                              Passing Benchmark: {examPass ? `${examPass} passing marks` : "40% threshold"} • 1 Credit per issued certificate
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCertStudioOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Customize Certificate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep(2);
                        setExpandedStep(2);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs font-semibold text-[#716D67] hover:text-[#242321] flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-[#171615]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Questions</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCreateStep(4);
                        setExpandedStep(4);
                      }} 
                      className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Review & Generate</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: REVIEW & GENERATE */}
            <div className={`border rounded-2xl transition-all overflow-hidden ${
              createStep === 4
                ? "bg-white dark:bg-[#171615] border-[#C84B18]/40 shadow-sm ring-1 ring-[#C84B18]/20"
                : "bg-[#F7F4EF]/60 dark:bg-[#141312]/60 border-[#E5E0D8] dark:border-[#292524] opacity-85"
            }`}>
              {/* Step 4 Header Button */}
              <button
                type="button"
                onClick={() => {
                  if (expandedStep === 4) {
                    setExpandedStep(null);
                  } else {
                    setExpandedStep(4);
                    setCreateStep(4);
                  }
                }}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#F7F4EF]/50 dark:hover:bg-[#1D1B19]/50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    createStep === 4
                      ? "bg-[#C84B18] text-white"
                      : "bg-[#E5E0D8] dark:bg-[#292524] text-[#716D67]"
                  }`}>
                    4
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] break-words leading-snug">
                      04. Final Blueprint Review & AI Paper Synthesis
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] break-words line-clamp-2 mt-0.5">
                      Confirm blueprint specs and generate assessment
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-[#716D67] dark:text-[#A8A29E] hidden sm:inline">
                    {expandedStep === 4 ? "Minimize" : "Expand"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#716D67] transition-transform duration-200 ${expandedStep === 4 ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Step 4 Body */}
              {expandedStep === 4 && (
                <div className="p-4 sm:p-5 pt-1 border-t border-[#E5E0D8] dark:border-[#292524] space-y-5 max-w-3xl animate-fadeIn">
                  {/* Assessment Title (Auto-generated + Fully Customizable) */}
                  <div className="pt-2 space-y-1.5 p-3.5 bg-white dark:bg-[#1E1C1A] border border-[#E5E0D8] dark:border-[#292524] rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#C84B18]" />
                        <span>Assessment Title</span>
                      </label>
                      <span className="text-[11px] font-medium text-[#C84B18] dark:text-[#EA580C] bg-[#C84B18]/10 px-2 py-0.5 rounded-full">
                        Customizable
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="e.g. Unit 1 Examination Paper"
                        className={`${inputCls} font-semibold text-sm pl-3 pr-24`}
                      />
                      {examSubject && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = examSubject.replace(/[_-]/g, " ");
                            setExamName(`${clean} Assessment`);
                            showToast("Title reset to default auto-generated name", "info");
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#C84B18] hover:text-[#A0360D] bg-[#C84B18]/10 hover:bg-[#C84B18]/20 px-2 py-1 rounded cursor-pointer transition-colors"
                          title="Re-generate title from source name"
                        >
                          Auto-Fill
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#716D67] dark:text-[#A8A29E]">
                      Auto-generated from your knowledge source. You can customize this title anytime before creating the test.
                    </p>
                  </div>

                  {/* Student Directory Selector with + Create Directory & Refresh buttons */}
                  <div className="pt-2 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#C84B18]" />
                        <span>Target Student Directory</span>
                      </label>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => reloadStudentDirectories()}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#716D67] hover:text-[#242321] dark:hover:text-white transition-colors cursor-pointer"
                          title="Refresh Directories list"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreateDirModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C84B18] hover:text-[#A0360D] dark:text-[#EA580C] dark:hover:text-[#F97316] transition-colors cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create New Student Directory</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {studentDirectories.length > 0 ? (
                        <select
                          value={selectedDirectoryId}
                          onChange={(e) => setSelectedDirectoryId(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">No Directory (Open Access)</option>
                          {studentDirectories.map((dir) => (
                            <option key={dir.id} value={dir.id}>
                              {dir.name} ({dir.student_count} candidate{dir.student_count !== 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3.5 border border-dashed border-[#E5E0D8] dark:border-[#292524] rounded-xl bg-[#F7F4EF]/50 dark:bg-[#141312]/50 text-center">
                          <p className="text-xs text-[#716D67] mb-2">No student directory created yet.</p>
                          <button
                            type="button"
                            onClick={() => setIsCreateDirModalOpen(true)}
                            className="btn-primary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create First Student Directory</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-[#716D67]">
                      Eligible students in this directory will be snapped as immutable assessment candidates.
                    </p>
                  </div>

                  <div className="bg-[#F7F4EF] dark:bg-[#141312] border border-[#E5E0D8] dark:border-[#292524] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#242321] dark:text-[#F5F5F4] text-xs uppercase tracking-wider">
                        Assessment Synthesis Summary
                      </h4>
                      <span className="text-[11px] font-bold text-[#C84B18] dark:text-[#EA580C] bg-[#C84B18]/10 px-2 py-0.5 rounded-full">
                        {marksDistMode === "equal" ? "Equal Marks" : marksDistMode === "by_type" ? "Format-Weighted" : marksDistMode === "by_difficulty" ? "Tier-Weighted" : "Custom Slot Weighted"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#716D67] dark:text-[#A8A29E]">
                      <div className="break-words">Title: <b className="text-[#242321] dark:text-[#F5F5F4]">{examName || "Untitled Assessment"}</b></div>
                      <div className="break-words">Source: <b className="text-[#242321] dark:text-[#F5F5F4]">{examSubject || "General"}</b></div>
                      <div>Questions: <b className="text-[#242321] dark:text-[#F5F5F4]">{computedQuestionCount} Total ({questionType === "mixed" ? `${numMcq} MCQ + ${numSubjective} Subj` : questionType === "subjective" ? `${numSubjective} Subj` : `${numMcq} ${questionType === "tf" ? "T/F" : "MCQ"}`})</b></div>
                      <div>Duration: <b className="text-[#242321] dark:text-[#F5F5F4]">{examDuration} min</b></div>
                      <div>Total Marks: <b className="text-[#242321] dark:text-[#F5F5F4]">{examMarks} pts</b> <span className="text-[11px] text-[#716D67]">(Pass: {examPass} pts)</span></div>
                      <div className="break-words">Directory: <b className="text-[#242321] dark:text-[#F5F5F4]">{studentDirectories.find(d => d.id === selectedDirectoryId)?.name || "Open / Unassigned"}</b></div>
                    </div>

                    {/* Marks Breakdown Pill */}
                    <div className="pt-1.5 border-t border-[#E5E0D8]/60 dark:border-[#292524] flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-[#C84B18]" />
                        <span>Weight Allocation:</span>
                      </span>
                      {marksDistMode === "equal" && (
                        <span className="text-[#716D67] dark:text-[#A8A29E]">
                          ~{(parseFloat(examMarks) / Math.max(1, computedQuestionCount)).toFixed(1)} pts per question
                        </span>
                      )}
                      {marksDistMode === "by_type" && (
                        <span className="text-[#716D67] dark:text-[#A8A29E]">
                          MCQ: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByType.mcq} pts</b> | Subjective: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByType.subjective} pts</b> | T/F: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByType.tf} pts</b>
                        </span>
                      )}
                      {marksDistMode === "by_difficulty" && (
                        <span className="text-[#716D67] dark:text-[#A8A29E]">
                          Easy: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByDiff.easy} pts</b> | Med: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByDiff.medium} pts</b> | Hard: <b className="text-[#242321] dark:text-[#F5F5F4]">{marksByDiff.hard} pts</b>
                        </span>
                      )}
                      {marksDistMode === "custom" && (
                        <span className="text-[#716D67] dark:text-[#A8A29E]">
                          Custom slots: <b className="text-[#242321] dark:text-[#F5F5F4]">{customSlotMarks.slice(0, Math.min(8, computedQuestionCount)).join(", ")}{computedQuestionCount > 8 ? "..." : ""} pts</b>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep(3);
                        setExpandedStep(3);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-[#E5E0D8] dark:border-[#292524] rounded-xl text-xs font-semibold text-[#716D67] hover:text-[#242321] flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-[#171615]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Schedule</span>
                    </button>
                    <button 
                      type="submit" 
                      disabled={isGenerating} 
                      className="w-full sm:w-auto btn-primary py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Synthesizing Exam Paper...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Generate & Publish Assessment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>
      </section>
      )}

      {/* ═══════ SECTION 3: QUESTION BANK STUDIO ═══════ */}
      {activeSectionTab === "bank" && (
      <section id="bank" className="scroll-mt-16 space-y-4">
        <QuestionBankManager />
      </section>
      )}

      {/* ═══════ SECTION 4: KNOWLEDGE SOURCES (SMART KNOWLEDGE BASE) ═══════ */}
      {activeSectionTab === "kb" && (
      <section id="kb" className="scroll-mt-16 space-y-4">
        <KnowledgeBaseManager
          documents={documents}
          token={token}
          onRefresh={fetchData}
        />
      </section>
      )}

      {/* ═══════ SECTION 5: STUDENT DIRECTORY MANAGER ═══════ */}
      {activeSectionTab === "students" && (
      <section id="students" className="scroll-mt-16 space-y-4">
        <StudentDirectoryManager token={token} />
      </section>
      )}

      {/* ═══════ SECTION 5B: STUDENT DATA COLLECTION FORMS ═══════ */}
      {activeSectionTab === "forms" && (
      <section id="forms" className="scroll-mt-16 space-y-4">
        <FormsRegistrationManager token={token} />
      </section>
      )}

      {/* ═══════ SECTION 5C: AI CUSTOM FORM BUILDER ═══════ */}
      {activeSectionTab === "custom-forms" && (
      <section id="custom-forms" className="scroll-mt-16 space-y-4">
        <CustomFormsManager token={token} />
      </section>
      )}

      {/* Inline Create Directory Modal */}
      <CreateDirectoryModal
        isOpen={isCreateDirModalOpen}
        onClose={() => setIsCreateDirModalOpen(false)}
        onCreated={(newDir) => {
          setStudentDirectories((prev) => [newDir, ...prev.filter(d => d.id !== newDir.id)]);
          setSelectedDirectoryId(newDir.id);
          showToast(`Student Directory "${newDir.name}" created and selected!`, "success");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refresh-student-directories"));
          }
        }}
      />

      {/* Step 1 Quick Upload KB Modal */}
      <UploadKBModal
        isOpen={isStep1KbModalOpen}
        onClose={() => setIsStep1KbModalOpen(false)}
        token={token}
        availableSubjects={kbSubjects}
        onUploaded={(subId, fName) => {
          setStep1UploadSuccess({ fileName: fName, subjectId: subId });
          setExamSubject(subId);
          if (!examName) {
            const cleanName = fName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            setExamName(`${cleanName} Assessment`);
          }
          if (!examTopic || examTopic === "General") {
            setExamTopic(subId);
          }
          setStep1SourceMode("select");
          fetchData();
        }}
      />

      {/* ═══════ SECTION 6: GENERALIZED CLASSROOM QUIZ ANALYTICS ═══════ */}
      {activeSectionTab === "reports" && (
      <section id="reports" className="scroll-mt-16 space-y-4">
        <GradebookAnalytics exams={exams} />
      </section>
      )}

      {/* ═══════ SECTION: CENTRAL MOCK TEST LIBRARY ═══════ */}
      {activeSectionTab === "mock-tests" && (
      <section id="mock-tests" className="scroll-mt-16 space-y-4">
        <TeacherMockTestLibrary />
      </section>
      )}

      {/* ═══════ SECTION: PLACEMENT MOCK TESTS ═══════ */}
      {(activeSectionTab === "placement-tests" || activeSectionTab === "company-tests") && (
      <section id="placement-tests" className="scroll-mt-16 space-y-4 animate-fadeIn">
        <CompanyPlacementTests />
      </section>
      )}

      {/* ═══════ SECTION: CERTIFICATE MANAGEMENT & STUDIO ═══════ */}
      {activeSectionTab === "certificates" && (
      <section id="certificates" className="scroll-mt-16 space-y-6 animate-fadeIn">
        {/* ══════════════════════════════════════════════════════════════════════
            HERO BANNER: PREMIUM WHITE-THEME 300-320PX 16:5 BANNER
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-amber-900/40 bg-white dark:bg-[#071328] text-slate-900 dark:text-white shadow-xl min-h-[290px] lg:min-h-[300px] lg:max-h-[320px] flex items-center">
          {/* 16:5 Wide Landscape White-Themed Background Image with Responsive Positioning */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/images/certificates_white_banner_bg.jpg"
              alt="Certificate Management Background"
              className="w-full h-full object-cover object-right opacity-95"
            />
            {/* Clean White / Warm Ivory Gradient Overlay on the Left for pure legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/85 md:via-white/70 to-transparent dark:from-[#071124] dark:via-[#071124]/95 dark:sm:via-[#071124]/85 dark:md:via-[#071124]/70 dark:to-transparent" />
            {/* Additional Mobile Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-[#050C1B]/95 dark:via-[#050C1B]/50 dark:to-transparent sm:hidden" />
          </div>

          <div className="relative z-10 w-full p-4 sm:p-5 lg:px-7 lg:py-4 flex flex-col justify-center">
            {/* Left Column: Sharp Pure HTML Typography & Bottom-Left CTAs */}
            <div className="space-y-2.5 max-w-xl">
              {/* Small Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[10.5px] font-bold tracking-wide shadow-2xs backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-300 animate-pulse" />
                <span>SMART CERTIFICATE MANAGEMENT</span>
              </div>

              {/* Main Heading & Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 sm:h-6 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Celebrate Achievement. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-400 dark:to-yellow-300">Recognize Success.</span>
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl pl-3.5 font-medium">
                  Design professional certificates, automatically issue certificates to eligible students and verify achievements through secure QR codes.
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10.5px]">
                <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Custom Certificate Templates</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-yellow-600 dark:text-yellow-300" />
                  <span>Automated Certificate Issuance</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>QR Code Verification</span>
                </span>
              </div>

              {/* Bottom Left Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsCertStudioOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/35 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 stroke-[2.5]" />
                  <span>Design Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("certificates-table");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Manage Certificates</span>
                </button>
                <Link
                  href="/verify-certificate/demo"
                  target="_blank"
                  className="px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Verify Certificate Demo"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verify Demo</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Standard Templates</span>
            <div className="text-sm font-black text-slate-900 dark:text-white">4 Available Styles</div>
            <p className="text-[11px] text-slate-500">Classic, Modern, Minimal, Achievement</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Delivery Format</span>
            <div className="text-sm font-black text-slate-900 dark:text-white">A4 Vector PDF (300 DPI)</div>
            <p className="text-[11px] text-slate-500">Print-ready + Email attachment</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Authenticity Check</span>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">QR Code Embedded</div>
            <p className="text-[11px] text-slate-500">Instant scan to verify status</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Cost Structure</span>
            <div className="text-sm font-black text-blue-600 dark:text-blue-400">1 Credit / Qualified Student</div>
            <p className="text-[11px] text-slate-500">Only charged for qualified students</p>
          </div>
        </div>

        {/* Assessment Certificates Table */}
        <div id="certificates-table" className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Examination Certificate Status</h3>
              <p className="text-xs text-slate-500">Select an assessment to view or issue student certificates</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{exams.length} Total Assessments</span>
          </div>

          {exams.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No assessments created yet. Create a quiz first to enable certificates for qualified students.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {exams.map((ex) => (
                <div key={ex.id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ex.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                        {ex.subject || "General"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Code: <b className="font-mono">{ex.code}</b></span>
                      <span>•</span>
                      <span>Pass Criteria: <b>{ex.passing_marks || 40}%</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCertDrawerExam(ex)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Manage Certificates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExamName(ex.name);
                        setIsCertStudioOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Customize Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ═══════ GLOBAL PAPER STUDIO PREVIEW MODAL ═══════ */}
      {previewExam && (
        <PaperStudioModal
          exam={previewExam}
          onClose={() => setPreviewExam(null)}
          onRefresh={fetchData}
          onPublishExam={handlePublishExam}
          onEndExamEarly={handleEndExamEarly}
          onDeleteExam={handleDeleteExam}
          onOpenPaymentModal={(exam) => setPaymentModalExam(exam)}
        />
      )}

      {/* ═══════ GLOBAL LIVE ANTI-CHEAT PROCTORING COMMAND CENTER MODAL ═══════ */}
      {liveProctorExam && (
        <LiveProctoringModal
          exam={liveProctorExam}
          alerts={liveProctorAlerts}
          onClose={() => setLiveProctorExam(null)}
          onEndExamEarly={handleEndExamEarly}
        />
      )}

      {/* ═══════ MANDATORY EXAM RAZORPAY PAYMENT MODAL ═══════ */}
      {paymentModalExam && (
        <ExamPaymentModal
          isOpen={!!paymentModalExam}
          exam={paymentModalExam}
          onClose={() => setPaymentModalExam(null)}
          onPaymentSuccess={() => {
            fetchData();
          }}
          onAutoPublish={() => {
            fetchData();
          }}
          onOpenRecharge={() => {
            setPaymentModalExam(null);
            setIsRechargeOpen(true);
          }}
        />
      )}

      {/* ═══════ PREPAID CREDIT WALLET RECHARGE MODAL ═══════ */}
      <CreditRechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onRechargeSuccess={() => {
          fetchData();
        }}
      />

      {/* ═══════ CSV / EXCEL QUESTIONS IMPORT MODAL ═══════ */}
      {isCsvImportModalOpen && (
        <CSVImportModal
          onClose={() => setIsCsvImportModalOpen(false)}
          onSuccess={() => {
            setIsCsvImportModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* ═══════ CERTIFICATE STUDIO MODAL ═══════ */}
      <CertificateStudioModal
        isOpen={isCertStudioOpen}
        onClose={() => setIsCertStudioOpen(false)}
        examName={examName || "Assessment"}
        instituteName={workspaceName}
        passingMarks={parseFloat(examPass) || 20}
        totalMarks={parseFloat(examMarks) || 50}
        token={token}
        onSaved={(cfg) => {
          setCertificateConfig(cfg);
          setEnableCertificate(true);
          showToast("Certificate design updated!", "success");
        }}
      />

      {/* ═══════ CERTIFICATE MANAGEMENT DRAWER ═══════ */}
      {certDrawerExam && (
        <CertificateManagementDrawer
          isOpen={!!certDrawerExam}
          onClose={() => setCertDrawerExam(null)}
          examId={certDrawerExam.id}
          examName={certDrawerExam.name}
          token={token}
          onOpenDesigner={() => {
            setCertDrawerExam(null);
            setIsCertStudioOpen(true);
          }}
        />
      )}
    </div>
  );
}
