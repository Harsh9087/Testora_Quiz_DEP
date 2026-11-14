"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  GraduationCap,
  Award,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  BookOpen,
  Info,
  Layers,
  Sparkles,
  Check,
  X,
  HelpCircle,
  ShieldCheck,
  Share2,
  Copy,
  Plus,
  Send,
  BarChart3,
  Edit,
  Trash2,
  AlertCircle,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Users,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  FileQuestion,
  UserCheck,
  Mail
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { fetchStudentDirectories } from "@/lib/api/studentDirectories";
import { StudentDirectory } from "@/types/studentDirectory";

interface MockTestItem {
  id: string;
  category: string;
  subcategory?: string;
  class_level?: string;
  subject?: string;
  test_type?: string;
  title: string;
  description?: string;
  difficulty: string;
  status: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  marks_per_question: number;
  negative_marking: number;
  passing_marks: number;
  instructions?: string;
  attempts_count: number;
  is_platform_library?: boolean;
  creator_role?: string;
  share_token?: string;
  share_access_type?: "assigned_only" | "anyone_with_link";
  login_required?: boolean;
  is_link_active?: boolean;
  start_time?: string;
  end_time?: string;
  attempt_limit?: number;
  results_visibility?: "immediate" | "after_release";
  are_results_released?: boolean;
  assigned_directories_count?: number;
  created_at?: string;
}

interface QuestionDraft {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  marks?: number;
  negative_marks?: number;
  domain?: string;
}

interface StudentResultItem {
  id: string;
  student_id?: string;
  student_name: string;
  student_email: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  attempt_number: number;
  completed_at: string;
  directory_name?: string;
}

export default function TeacherMockTestLibrary() {
  const { token, fullName } = useAuthStore();

  // Top tabs: "my_tests" vs "platform_library"
  const [activeTab, setActiveTab] = useState<"my_tests" | "platform_library">("my_tests");

  // State for teacher tests
  const [myTests, setMyTests] = useState<MockTestItem[]>([]);
  const [platformTests, setPlatformTests] = useState<MockTestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Student directories (classes) for assignment
  const [directories, setDirectories] = useState<StudentDirectory[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState(false);

  // Toast / copy feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [savingTest, setSavingTest] = useState(false);

  // Assign & Share Modal
  const [assignModalTest, setAssignModalTest] = useState<MockTestItem | null>(null);
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);
  const [assignAccessType, setAssignAccessType] = useState<"assigned_only" | "anyone_with_link">("assigned_only");
  const [assignLoginRequired, setAssignLoginRequired] = useState(true);
  const [assignAttemptLimit, setAssignAttemptLimit] = useState(1);
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [assignResultsVisibility, setAssignResultsVisibility] = useState<"immediate" | "after_release">("immediate");
  const [assignSendEmail, setAssignSendEmail] = useState(true);
  const [dispatchingEmail, setDispatchingEmail] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Results Modal
  const [resultsModalTest, setResultsModalTest] = useState<MockTestItem | null>(null);
  const [resultsList, setResultsList] = useState<StudentResultItem[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [releasingResults, setReleasingResults] = useState(false);

  // Preview Modal
  const [previewTest, setPreviewTest] = useState<MockTestItem | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<QuestionDraft[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state for Create / Edit Mock Test
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubject, setFormSubject] = useState("Physics");
  const [formClassLevel, setFormClassLevel] = useState("Class 11");
  const [formDifficulty, setFormDifficulty] = useState("Medium");
  const [formDuration, setFormDuration] = useState(30);
  const [formTotalMarks, setFormTotalMarks] = useState(50);
  const [formPassingMarks, setFormPassingMarks] = useState(20);
  const [formNegativeMarking, setFormNegativeMarking] = useState(0.25);
  const [formInstructions, setFormInstructions] = useState(
    "1. Each question carries marks as indicated. Negative marking applies for wrong answers.\n2. Do not close or reload the browser while attempting.\n3. The test will automatically submit when the timer expires."
  );
  const [formQuestions, setFormQuestions] = useState<QuestionDraft[]>([]);

  // AI Question Generation inside Create Modal
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch teacher's own mock tests
  const fetchMyTests = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter !== "all" 
        ? `/mock-tests/teacher/my-tests?status=${statusFilter}` 
        : `/mock-tests/teacher/my-tests`;
      const res = await apiFetch(url, { token });
      if (res.ok) {
        const data = await res.json();
        setMyTests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  // Fetch platform library tests
  const fetchPlatformTests = useCallback(async () => {
    try {
      const res = await apiFetch("/mock-tests/teacher-library", { token });
      if (res.ok) {
        const data = await res.json();
        setPlatformTests(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  // Fetch directories
  const loadDirectories = useCallback(async () => {
    try {
      setLoadingDirectories(true);
      const dirs = await fetchStudentDirectories(token);
      setDirectories(dirs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDirectories(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyTests();
    fetchPlatformTests();
    loadDirectories();
  }, [fetchMyTests, fetchPlatformTests, loadDirectories]);

  // Open Create Modal in fresh state
  const handleOpenCreateModal = () => {
    setEditingTestId(null);
    setFormTitle("");
    setFormDescription("");
    setFormSubject("Physics");
    setFormClassLevel("Class 11");
    setFormDifficulty("Medium");
    setFormDuration(30);
    setFormTotalMarks(50);
    setFormPassingMarks(20);
    setFormNegativeMarking(0.25);
    setFormInstructions(
      "1. Each question carries marks as indicated. Negative marking applies for wrong answers.\n2. Do not close or reload the browser while attempting.\n3. The test will automatically submit when the timer expires."
    );
    setFormQuestions([
      {
        question: "What is Newton's first law of motion primarily known as?",
        options: ["Law of Inertia", "Law of Acceleration", "Law of Gravitation", "Law of Momentum"],
        correct_answer: "Law of Inertia",
        marks: 4,
        negative_marks: 1,
        explanation: "Newton's first law defines inertia: an object remains at rest or in uniform motion unless acted upon by a net external force."
      }
    ]);
    setShowCreateModal(true);
  };

  // Open Edit Modal with existing test
  const handleOpenEditModal = async (testItem: MockTestItem) => {
    try {
      setEditingTestId(testItem.id);
      setShowCreateModal(true);
      const res = await apiFetch(`/mock-tests/teacher/${testItem.id}`, { token });
      if (res.ok) {
        const detail = await res.json();
        setFormTitle(detail.title || "");
        setFormDescription(detail.description || "");
        setFormSubject(detail.subject || "Physics");
        setFormClassLevel(detail.class_level || "Class 11");
        setFormDifficulty(detail.difficulty || "Medium");
        setFormDuration(detail.duration_minutes || 30);
        setFormTotalMarks(detail.total_marks || 50);
        setFormPassingMarks(detail.passing_marks || 20);
        setFormNegativeMarking(detail.negative_marking || 0.25);
        setFormInstructions(detail.instructions || "");
        setFormQuestions(detail.questions || []);
      }
    } catch (e) {
      showToast("Error loading test details.");
    }
  };

  // Trigger AI Question Generator
  const handleAIGenerateQuestions = async () => {
    if (!aiTopic.trim()) {
      alert("Please enter a subject topic for AI question generation.");
      return;
    }
    try {
      setAiGenerating(true);
      const res = await apiFetch("/mock-tests/teacher/ai-generate-questions", {
        method: "POST",
        token,
        body: JSON.stringify({
          subject: formSubject,
          topic: aiTopic.trim(),
          class_level: formClassLevel,
          difficulty: formDifficulty,
          num_questions: aiCount,
          question_type: "mcq"
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to generate questions with AI.");
        return;
      }

      const generated = await res.json();
      if (Array.isArray(generated) && generated.length > 0) {
        setFormQuestions((prev) => [...prev, ...generated]);
        setAiTopic("");
        showToast(`✨ Generated ${generated.length} questions successfully!`);
      }
    } catch (e: any) {
      alert(e.message || "AI question generation error.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Add a blank manual question
  const handleAddManualQuestion = () => {
    setFormQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "Option A",
        marks: 4,
        negative_marks: formNegativeMarking > 0 ? 1 : 0,
        explanation: ""
      }
    ]);
  };

  // Save or Publish Mock Test
  const handleSaveMockTest = async (statusToSet: "draft" | "published") => {
    if (!formTitle.trim()) {
      alert("Please enter a title for the mock test.");
      return;
    }
    if (formQuestions.length === 0) {
      alert("Please add at least one question to the mock test.");
      return;
    }

    try {
      setSavingTest(true);
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        subject: formSubject,
        class_level: formClassLevel,
        difficulty: formDifficulty,
        duration_minutes: Number(formDuration),
        total_marks: Number(formTotalMarks),
        passing_marks: Number(formPassingMarks),
        negative_marking: Number(formNegativeMarking),
        instructions: formInstructions,
        status: statusToSet,
        questions: formQuestions
      };

      const url = editingTestId
        ? `/mock-tests/teacher/${editingTestId}`
        : `/mock-tests/teacher/create`;
      const method = editingTestId ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        token,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to save mock test.");
        return;
      }

      const saved = await res.json();
      showToast(statusToSet === "published" ? "🎉 Mock Test Published!" : "💾 Saved as Draft!");
      setShowCreateModal(false);
      fetchMyTests();

      // If published, directly open the Assign & Share modal
      if (statusToSet === "published" && saved.id) {
        handleOpenAssignModal(saved);
      }
    } catch (e: any) {
      alert(e.message || "Failed to save test.");
    } finally {
      setSavingTest(false);
    }
  };

  // Duplicate / Clone Test
  const handleDuplicateTest = async (testItem: MockTestItem) => {
    try {
      const res = await apiFetch(`/mock-tests/teacher/${testItem.id}/duplicate`, {
        method: "POST",
        token
      });
      if (res.ok) {
        showToast("✨ Mock test cloned successfully!");
        fetchMyTests();
        setActiveTab("my_tests");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to duplicate test.");
      }
    } catch (e) {
      showToast("Error cloning mock test.");
    }
  };

  // Archive / Delete Test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete / archive this mock test? Historical student submissions will remain saved.")) {
      return;
    }
    try {
      const res = await apiFetch(`/mock-tests/teacher/${testId}`, {
        method: "DELETE",
        token
      });
      if (res.ok) {
        showToast("Mock test archived.");
        fetchMyTests();
      } else {
        showToast("Failed to delete mock test.");
      }
    } catch (e) {
      showToast("Error deleting test.");
    }
  };

  // Open Assign & Share Modal
  const handleOpenAssignModal = (testItem: MockTestItem) => {
    setAssignModalTest(testItem);
    setSelectedDirectoryIds([]);
    setAssignAccessType(testItem.share_access_type || "assigned_only");
    setAssignLoginRequired(testItem.login_required ?? true);
    setAssignAttemptLimit(testItem.attempt_limit ?? 1);
    setAssignStartTime(testItem.start_time ? testItem.start_time.slice(0, 16) : "");
    setAssignEndTime(testItem.end_time ? testItem.end_time.slice(0, 16) : "");
    setAssignResultsVisibility(testItem.results_visibility || "immediate");
    setAssignSendEmail(true);
  };

  // Save Assignment Settings
  const handleSaveAssignment = async () => {
    if (!assignModalTest) return;

    try {
      setSavingAssignment(true);
      const res = await apiFetch(`/mock-tests/teacher/${assignModalTest.id}/assign`, {
        method: "POST",
        token,
        body: JSON.stringify({
          directory_ids: selectedDirectoryIds,
          share_access_type: assignAccessType,
          login_required: assignLoginRequired,
          attempt_limit: Number(assignAttemptLimit),
          start_time: assignStartTime ? new Date(assignStartTime).toISOString() : null,
          end_time: assignEndTime ? new Date(assignEndTime).toISOString() : null,
          results_visibility: assignResultsVisibility,
          send_email_notification: assignSendEmail
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update assignment settings.");
        return;
      }

      const data = await res.json();
      const emailNote = data.dispatched_emails_count > 0 ? ` (${data.dispatched_emails_count} emails sent)` : "";
      showToast(`✅ Assignment & distribution settings updated!${emailNote}`);
      setAssignModalTest(null);
      fetchMyTests();
      fetchPlatformTests();
    } catch (e: any) {
      alert(e.message || "Failed to save assignment.");
    } finally {
      setSavingAssignment(false);
    }
  };

  // Direct Email Dispatch Action
  const handleDispatchEmailsNow = async () => {
    if (!assignModalTest) return;
    if (selectedDirectoryIds.length === 0) {
      alert("Please select at least one class roster to send email invitations to.");
      return;
    }
    try {
      setDispatchingEmail(true);
      const res = await apiFetch(`/mock-tests/teacher/${assignModalTest.id}/send-email-invites`, {
        method: "POST",
        token,
        body: JSON.stringify({
          directory_ids: selectedDirectoryIds,
          student_emails: []
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to dispatch email invitations.");
        return;
      }
      const data = await res.json();
      showToast(`📧 Successfully dispatched ${data.sent_count} invitation email(s) directly to students!`);
    } catch (e: any) {
      alert(e.message || "Error dispatching emails.");
    } finally {
      setDispatchingEmail(false);
    }
  };

  // Launch Desktop / Web Mail Client with Formatted Draft
  const handleOpenMailClient = (testItem: MockTestItem) => {
    if (!testItem.share_token) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://testora.online";
    const shareUrl = `${origin}/mock-test/share/${testItem.share_token}`;
    const subject = encodeURIComponent(`[Testora] Mock Test Assigned: ${testItem.title}`);
    const deadlineStr = testItem.end_time ? `\nDeadline / Closes: ${new Date(testItem.end_time).toLocaleDateString()}` : "";
    const teacherStr = fullName ? ` by ${fullName}` : "";
    const body = encodeURIComponent(
      `Hello,\n\nYour mock test has been assigned${teacherStr}.\n\nTest: ${testItem.title}\nDuration: ${testItem.duration_minutes} Mins${deadlineStr}\n\nStart your test here:\n${shareUrl}\n\nBest of luck!\nTestora Quiz Examination System`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // Revoke / Regenerate Share Token
  const handleRevokeShareLink = async (testId: string) => {
    if (!confirm("Revoking the link will deactivate the previous URL. Anyone with the old link will no longer be able to access the test. Continue?")) {
      return;
    }
    try {
      const res = await apiFetch(`/mock-tests/teacher/${testId}/revoke-link`, {
        method: "POST",
        token
      });
      if (res.ok) {
        const updated = await res.json();
        showToast("🔑 New secure link generated!");
        if (assignModalTest && assignModalTest.id === testId) {
          setAssignModalTest(updated);
        }
        fetchMyTests();
      }
    } catch (e) {
      showToast("Error revoking link.");
    }
  };

  // Open Results Modal
  const handleOpenResultsModal = async (testItem: MockTestItem) => {
    setResultsModalTest(testItem);
    try {
      setLoadingResults(true);
      const res = await apiFetch(`/mock-tests/teacher/${testItem.id}/results`, { token });
      if (res.ok) {
        const data = await res.json();
        setResultsList(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResults(false);
    }
  };

  // Release Withheld Results
  const handleReleaseResults = async (testId: string) => {
    if (!confirm("Release results now? All students who took this test will immediately be able to see their scores and detailed answer explanations.")) {
      return;
    }
    try {
      setReleasingResults(true);
      const res = await apiFetch(`/mock-tests/teacher/${testId}/release-results`, {
        method: "POST",
        token
      });
      if (res.ok) {
        showToast("📢 Results released to students successfully!");
        if (resultsModalTest) {
          setResultsModalTest({ ...resultsModalTest, are_results_released: true });
        }
        fetchMyTests();
      }
    } catch (e) {
      showToast("Error releasing results.");
    } finally {
      setReleasingResults(false);
    }
  };

  // Copy Public Link Helper
  const handleCopyLink = (shareToken?: string) => {
    if (!shareToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://testora.online";
    const shareUrl = `${origin}/mock-test/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("📋 Test link copied to clipboard!");
  };

  // Share on WhatsApp Helper
  const handleShareWhatsApp = (testItem: MockTestItem) => {
    if (!testItem.share_token) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://testora.online";
    const shareUrl = `${origin}/mock-test/share/${testItem.share_token}`;
    const deadlineStr = testItem.end_time ? `\nDeadline: ${new Date(testItem.end_time).toLocaleDateString()}` : "";
    const teacherStr = fullName ? ` by ${fullName}` : "";

    const message = `Hello! Your Mock Test is ready${teacherStr}.\n\nTest: ${testItem.title}\nDuration: ${testItem.duration_minutes} mins${deadlineStr}\nStart your test here: ${shareUrl}\n\nBest of luck!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Open Preview Modal
  const handleOpenPreview = async (testItem: MockTestItem) => {
    setPreviewTest(testItem);
    try {
      setLoadingPreview(true);
      const res = await apiFetch(`/mock-tests/teacher/${testItem.id}`, { token });
      if (res.ok) {
        const data = await res.json();
        setPreviewQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Filtered test lists
  const filteredMyTests = useMemo(() => {
    return myTests.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesSubject = t.subject?.toLowerCase().includes(query);
        const matchesClass = t.class_level?.toLowerCase().includes(query);
        return matchesTitle || matchesSubject || matchesClass;
      }
      return true;
    });
  }, [myTests, statusFilter, searchQuery]);

  const filteredPlatformTests = useMemo(() => {
    if (!searchQuery.trim()) return platformTests;
    const query = searchQuery.toLowerCase();
    return platformTests.filter((t) => {
      return (
        t.title.toLowerCase().includes(query) ||
        t.subject?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    });
  }, [platformTests, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

          {/* ══════════════════════════════════════════════════════════════════════
              HERO BANNER: PREMIUM WHITE-THEME 300-320PX 16:5 BANNER
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-blue-900/40 bg-white dark:bg-[#071328] text-slate-900 dark:text-white shadow-xl min-h-[290px] lg:min-h-[300px] lg:max-h-[320px] flex items-center">
            {/* 16:5 Wide Landscape White-Themed Background Image with Responsive Positioning */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Light Mode Banner */}
              <img
                src="/images/mock_test_white_banner_bg.jpg"
                alt="Mock Test Examination Background"
                className="w-full h-full object-cover object-right opacity-95 block dark:hidden"
              />
              {/* Dark Mode Banner (Complete Dark Image) */}
              <img
                src="/images/mock_test_banner_bg.jpg"
                alt="Mock Test Examination Background"
                className="w-full h-full object-cover object-right opacity-95 hidden dark:block"
              />
              {/* Clean White / Ice-Blue Gradient Overlay on the Left for pure legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/85 md:via-white/70 to-transparent dark:from-[#071328] dark:via-[#071328]/95 dark:sm:via-[#071328]/85 dark:md:via-[#071328]/70 dark:to-transparent" />
              {/* Additional Mobile Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-[#050E1D]/95 dark:via-[#050E1D]/50 dark:to-transparent sm:hidden" />
            </div>

            <div className="relative z-10 w-full p-4 sm:p-5 lg:px-7 lg:py-4 flex flex-col justify-center">
              {/* Left Column: Sharp Pure HTML Typography & Bottom-Left CTAs */}
              <div className="space-y-2.5 max-w-xl">
                {/* Small Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-cyan-300 text-[10.5px] font-bold tracking-wide shadow-2xs backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-300 animate-pulse" />
                  <span>FREE MOCK TEST LIBRARY</span>
                </div>

                {/* Main Heading & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 sm:h-6 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-[0_0_8px_rgba(37,99,235,0.5)] shrink-0" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      Practice Smarter. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-400 dark:to-blue-400">Perform Better.</span>
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl pl-3.5 font-medium">
                    Explore mock tests, practice subject-wise questions, prepare with exam-oriented assessments and track your performance.
                  </p>
                </div>

                {/* Feature Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10.5px]">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                    <BookOpen className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>Full-Length Mock Tests</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-amber-300" />
                    <span>Subject-Wise Practice</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                    <BarChart3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Performance Analytics</span>
                  </span>
                </div>

                {/* Bottom Left Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/35 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Create Mock Test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("platform_library");
                      const el = document.getElementById("mock-tests-tabs-switcher");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Explore Mock Tests</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchMyTests();
                      fetchPlatformTests();
                    }}
                    disabled={loading}
                    className="px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Refresh Mock Tests Library"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600 dark:text-cyan-400" : "text-slate-600 dark:text-slate-300"}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>


      {/* Tab Switcher: My Mock Tests vs Super Admin Platform Library */}
      <div id="mock-tests-tabs-switcher" className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab("my_tests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "my_tests"
              ? "bg-white dark:bg-blue-600 text-blue-900 dark:text-white font-black shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>My Created Tests ({myTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("platform_library")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "platform_library"
              ? "bg-white dark:bg-blue-600 text-blue-900 dark:text-white font-black shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Platform Library ({platformTests.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: MY CREATED TESTS
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "my_tests" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "published", "draft", "expired"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search mock tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Test Cards Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading your mock tests...</p>
            </div>
          ) : filteredMyTests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <FileQuestion className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  No Mock Tests Found
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search filters or status."
                    : "You haven't created any mock tests yet. Click '+ Create Mock Test' to build your first exam."}
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Mock Test Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyTests.map((testItem) => (
                <div
                  key={testItem.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Header Chips */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            testItem.status === "published"
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : testItem.status === "draft"
                              ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {testItem.status}
                        </span>
                        {testItem.subject && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            {testItem.subject}
                          </span>
                        )}
                        {testItem.class_level && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                            {testItem.class_level}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">
                        {testItem.difficulty}
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {testItem.title}
                      </h3>
                      {testItem.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {testItem.description}
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Duration</div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {testItem.duration_minutes}m
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Questions</div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {testItem.total_questions}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Total Marks</div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {testItem.total_marks}
                        </div>
                      </div>
                    </div>

                    {/* Submissions Badge */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>{testItem.attempts_count || 0} Submissions</span>
                      </span>
                      {testItem.are_results_released ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Results Public</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Results Held
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Primary Distribution Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenAssignModal(testItem)}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Assign &amp; Share</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(testItem)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenMailClient(testItem)}
                          title="Open / Send via Email Client"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenResultsModal(testItem)}
                          title="View Student Submissions &amp; Analytics"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(testItem.share_token)}
                          title="Copy Public Link"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPreview(testItem)}
                          title="Preview Test Questions"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(testItem)}
                          title="Edit Mock Test"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTest(testItem)}
                          title="Clone Test"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(testItem.id)}
                          title="Delete / Archive Test"
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: PLATFORM LIBRARY (SUPER ADMIN CENTRALLY MANAGED)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "platform_library" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>
                These are verified, quality-reviewed mock tests from the Testora Platform Library. You can browse, preview, and <strong>Clone to My Tests</strong> to assign or modify for your students.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlatformTests.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                      {item.category || "Platform Test"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.duration_minutes}m • {item.total_questions} Qs
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Primary Distribution Buttons for Platform / Company Tests */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenAssignModal(item)}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Assign &amp; Share</span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(item)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Secondary Actions: Email, Results, Copy Link, Preview, Clone */}
                  <div className="flex items-center justify-between gap-1 pt-1 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenMailClient(item)}
                        title="Send / Open in Email Client"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenResultsModal(item)}
                        title="View Student Submissions &amp; Results"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyLink(item.share_token)}
                        title="Copy Public Link"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenPreview(item)}
                        title="Preview Questions"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTest(item)}
                        title="Clone to My Tests"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Clone</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: CREATE / EDIT MOCK TEST
      ───────────────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {editingTestId ? "Edit Mock Test" : "Create New Mock Test"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configure examination details, questions, and scoring rules.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Test Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 11 Physics - Weekly Unit Test on Kinematics"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide context, topics covered, or expectations for the test..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Physics, Math, Biology, etc."
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Class / Target Level
                </label>
                <input
                  type="text"
                  placeholder="Class 10, Class 11, JEE, etc."
                  value={formClassLevel}
                  onChange={(e) => setFormClassLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Marks
                </label>
                <input
                  type="number"
                  min={1}
                  value={formTotalMarks}
                  onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Passing Marks
                </label>
                <input
                  type="number"
                  min={0}
                  value={formPassingMarks}
                  onChange={(e) => setFormPassingMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Negative Marking per Wrong Answer
                </label>
                <select
                  value={formNegativeMarking}
                  onChange={(e) => setFormNegativeMarking(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value={0}>No Negative Marking (0.00)</option>
                  <option value={0.25}>0.25 Marks Deduction</option>
                  <option value={0.33}>0.33 Marks Deduction</option>
                  <option value={0.5}>0.50 Marks Deduction</option>
                  <option value={1.0}>1.00 Marks Deduction</option>
                </select>
              </div>
            </div>

            {/* AI Question Generator Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                  AI Question Generator (Gemini Powered)
                </h4>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter specific topic (e.g. Projectile Motion, Photosynthesis, Quadratic Equations)..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleAIGenerateQuestions}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiGenerating ? "Generating..." : "Generate with AI"}</span>
                </button>
              </div>
            </div>

            {/* Questions List & Manual Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-blue-600" />
                  <span>Questions in Test ({formQuestions.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question Manually</span>
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {formQuestions.map((qItem, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-700 dark:text-slate-300">
                        Q{qIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                        }
                        className="text-rose-500 hover:text-rose-600 font-bold text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question text..."
                      value={qItem.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, question: val } : item))
                        );
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    />

                    {/* Options 4 inputs with radio for correct answer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qItem.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = qItem.correct_answer === opt;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_answer_${qIdx}`}
                              checked={isCorrect}
                              onChange={() => {
                                setFormQuestions((prev) =>
                                  prev.map((item, i) =>
                                    i === qIdx ? { ...item, correct_answer: opt } : item
                                  )
                                );
                              }}
                              className="accent-emerald-600 cursor-pointer"
                            />
                            <span className="font-bold text-[11px] text-slate-500">{letter}</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpt = e.target.value;
                                setFormQuestions((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== qIdx) return item;
                                    const nextOpts = [...item.options];
                                    const wasCorrect = item.correct_answer === nextOpts[oIdx];
                                    nextOpts[oIdx] = newOpt;
                                    return {
                                      ...item,
                                      options: nextOpts,
                                      correct_answer: wasCorrect ? newOpt : item.correct_answer
                                    };
                                  })
                                );
                              }}
                              className="flex-1 bg-transparent border-none text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="Explanation / solution rationale..."
                      value={qItem.explanation || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormQuestions((prev) =>
                          prev.map((item, i) =>
                            i === qIdx ? { ...item, explanation: val } : item
                          )
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={savingTest}
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingTest}
                onClick={() => handleSaveMockTest("draft")}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={savingTest}
                onClick={() => handleSaveMockTest("published")}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
              >
                {savingTest ? "Saving..." : "Publish &amp; Prepare Distribution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: ASSIGN & SHARE WORKFLOW (CLASSES, SECURITY, WHATSAPP)
      ───────────────────────────────────────────────────────────────────────────── */}
      {assignModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Assign &amp; Distribute Mock Test
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                    {assignModalTest.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalTest(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ready WhatsApp Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Instant WhatsApp Share</span>
                </span>
                <button
                  onClick={() => handleCopyLink(assignModalTest.share_token)}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Link</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {`Hello! Your Mock Test is ready.\n\nTest: ${assignModalTest.title}\nDuration: ${assignModalTest.duration_minutes} mins\nStart your test here: ${(typeof window !== "undefined" ? window.location.origin : "https://testora.online") + "/mock-test/share/" + (assignModalTest.share_token || "")}\n\nBest of luck!`}
              </div>

              <button
                onClick={() => handleShareWhatsApp(assignModalTest)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Launch WhatsApp with Test Invite</span>
              </button>
            </div>

            {/* Ready Email Direct Share & Dispatch Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Direct Email Dispatch to Students</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenMailClient(assignModalTest)}
                  className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Mail App</span>
                </button>
              </div>

              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                Send personalized assessment invitation emails containing the test link, instructions, and duration directly to registered students in your selected classes.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={dispatchingEmail || selectedDirectoryIds.length === 0}
                  onClick={handleDispatchEmailsNow}
                  className="w-full sm:w-auto flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{dispatchingEmail ? "Dispatching Emails..." : "Send Email Invites to Selected Classes Now"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMailClient(assignModalTest)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Draft in Mail Client</span>
                </button>
              </div>
            </div>

            {/* Target Classes / Roster Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assign to Classes &amp; Student Rosters</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDirectoryIds.length === directories.length) {
                      setSelectedDirectoryIds([]);
                    } else {
                      setSelectedDirectoryIds(directories.map((d) => d.id));
                    }
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {selectedDirectoryIds.length === directories.length ? "Deselect All" : "Select All Classes"}
                </button>
              </div>

              {loadingDirectories ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading your classes...</div>
              ) : directories.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
                  No student rosters found in your directory. You can create classes under the &quot;Student Directory&quot; tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {directories.map((dir) => {
                    const isSelected = selectedDirectoryIds.includes(dir.id);
                    return (
                      <div
                        key={dir.id}
                        onClick={() => {
                          setSelectedDirectoryIds((prev) =>
                            isSelected ? prev.filter((id) => id !== dir.id) : [...prev, dir.id]
                          );
                        }}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-100 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="truncate">{dir.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {dir.student_count || 0} Students
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sharing & Access Security Controls */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5 text-xs">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Access &amp; Security Controls</span>
              </h4>

              {/* Mode: Assigned only vs Anyone with link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignAccessType("assigned_only")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    assignAccessType === "assigned_only"
                      ? "border-blue-600 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-extrabold">Assigned Students Only</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Only students in your selected classes can take this test.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignAccessType("anyone_with_link")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    assignAccessType === "anyone_with_link"
                      ? "border-blue-600 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-extrabold">Anyone with Secure Link</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Open access for students who have this test link.
                  </div>
                </button>
              </div>

              {/* Toggles & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Require Student Login</span>
                  <input
                    type="checkbox"
                    checked={assignLoginRequired}
                    onChange={(e) => setAssignLoginRequired(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Attempt Limit</span>
                  <select
                    value={assignAttemptLimit}
                    onChange={(e) => setAssignAttemptLimit(Number(e.target.value))}
                    className="bg-transparent font-bold text-xs focus:outline-none"
                  >
                    <option value={1}>1 Attempt</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                    <option value={999}>Unlimited</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Start Time (Optional)</span>
                  <input
                    type="datetime-local"
                    value={assignStartTime}
                    onChange={(e) => setAssignStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Expiry Time (Optional)</span>
                  <input
                    type="datetime-local"
                    value={assignEndTime}
                    onChange={(e) => setAssignEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Results &amp; Answers Visibility</span>
                  <select
                    value={assignResultsVisibility}
                    onChange={(e) => setAssignResultsVisibility(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="immediate">Immediate (Show Score &amp; Explanations Right After Submission)</option>
                    <option value="after_release">Hold Results (Release Scores After Teacher Review)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 sm:col-span-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Send Email Notification on Assign
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Automatically dispatch test invitations to enrolled students upon saving.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignSendEmail}
                    onChange={(e) => setAssignSendEmail(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Link Security Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500">
                  Need to invalidate shared links?
                </span>
                <button
                  type="button"
                  onClick={() => handleRevokeShareLink(assignModalTest.id)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  Revoke &amp; Generate New Link
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalTest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
              <button
                type="button"
                disabled={savingAssignment}
                onClick={handleSaveAssignment}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                {savingAssignment ? "Saving..." : "Save Assignment Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 3: STUDENT RESULTS & ANALYTICS
      ───────────────────────────────────────────────────────────────────────────── */}
      {resultsModalTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Student Submissions &amp; Performance
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {resultsModalTest.title} • {resultsList.length} Submissions Total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!resultsModalTest.are_results_released && (
                  <button
                    disabled={releasingResults}
                    onClick={() => handleReleaseResults(resultsModalTest.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    {releasingResults ? "Releasing..." : "Release Results to Students"}
                  </button>
                )}
                <button
                  onClick={() => setResultsModalTest(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results Table */}
            {loadingResults ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading student results...</div>
            ) : resultsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students have attempted this mock test yet. Share your test link to collect submissions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 font-bold rounded-l-xl">Student</th>
                      <th className="p-3 font-bold">Class / Roster</th>
                      <th className="p-3 font-bold">Score</th>
                      <th className="p-3 font-bold">Accuracy</th>
                      <th className="p-3 font-bold">Time Taken</th>
                      <th className="p-3 font-bold">Attempt #</th>
                      <th className="p-3 font-bold rounded-r-xl">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    {resultsList.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {res.student_name}
                          </div>
                          {res.student_email && (
                            <div className="text-[10px] text-slate-400">{res.student_email}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {res.directory_name || "Direct Link"}
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">
                            {res.score}
                          </span>
                          <span className="text-slate-400"> / {res.max_score}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              res.passed
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {Math.round(res.percentage)}% • {res.passed ? "Passed" : "Needs Work"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {Math.floor(res.time_taken_seconds / 60)}m {res.time_taken_seconds % 60}s
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          #{res.attempt_number || 1}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(res.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 4: PREVIEW TEST QUESTIONS
      ───────────────────────────────────────────────────────────────────────────── */}
      {previewTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {previewTest.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {previewTest.duration_minutes} Mins • {previewQuestions.length} Questions • {previewTest.total_marks} Marks
                </p>
              </div>
              <button
                onClick={() => setPreviewTest(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPreview ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading preview questions...</div>
            ) : previewQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No questions found in this test.</div>
            ) : (
              <div className="space-y-3">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      <span className="text-blue-600 mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                            opt === q.correct_answer
                              ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="w-4 h-4 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-blue-900 dark:text-blue-300 italic pt-1">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
