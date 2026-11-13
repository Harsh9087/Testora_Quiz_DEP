"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Building2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Coins,
  Compass,
  Search,
  Tag,
  X,
  AlertCircle,
  HelpCircle,
  Play,
  Copy,
  Eye,
  FileText,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Upload,
  Code2,
  Globe,
  Image as ImageIcon,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Bookmark,
  Link2,
  ExternalLink,
  Zap,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AdminMockTest {
  id: string;
  category_id?: string;
  category: string;
  subcategory?: string;
  test_type_id?: string;
  test_type?: string;
  class_level?: string;
  subject?: string;
  exam_type?: string;
  engineering_branch?: string;
  chapter?: string;
  topic?: string;
  section_name?: string;
  pyq_exam_name?: string;
  pyq_year?: number;
  pyq_shift?: string;
  pyq_source?: string;
  speed_test_target_time_per_q?: number;
  practice_mode_instant_explanation?: boolean;
  difficulty_distribution?: Record<string, number>;
  company_name: string;
  company_slug: string;
  title: string;
  description?: string;
  instructions?: string;
  difficulty: string;
  language: string;
  visibility_target: string;
  target_class?: string;
  target_section?: string;
  status: string; // "published", "draft", "unpublished"
  price_inr: number;
  is_free: boolean;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  marks_per_question: number;
  negative_marking: number;
  passing_marks: number;
  pass_percentage: number;
  attempt_limit: number;
  attempts_count: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

interface MockTestType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  badge_color: string;
  requires_chapter: boolean;
  requires_topic: boolean;
  requires_pyq_metadata: boolean;
  requires_section: boolean;
  is_speed_test: boolean;
  is_practice: boolean;
  is_active: boolean;
  display_order: number;
  tests_count: number;
}

interface MockTestCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_type: string;
  subcategories: string[];
  is_active: boolean;
  display_order: number;
  tests_count: number;
}

interface QuestionSourceDetails {
  source_type: string;
  source_name: string;
  exam_name?: string;
  exam_year?: number;
  exam_session?: string;
  chapter?: string;
  topic?: string;
  book_name?: string;
  book_edition?: string;
  page_or_question_no?: string;
  source_url?: string;
  verification_status: string;
  creator_name?: string;
  reviewer_name?: string;
}

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  question_type?: string;
  difficulty?: string;
  domain?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  marks?: number;
  negative_marks?: number;
  explanation?: string;
  image_url?: string;
  image_caption?: string;
  image_alt?: string;
  diagram_type?: string;
  diagram_position?: "above_question" | "below_question";
  source_details?: QuestionSourceDetails;
  passage?: string;
  numerical_tolerance?: number;
}

interface StatsData {
  total_tests: number;
  published_count: number;
  draft_count: number;
  hidden_count: number;
  total_questions: number;
  total_attempts: number;
}

export default function AdminMockTestsPage() {
  const { token } = useAuthStore();
  const [tests, setTests] = useState<AdminMockTest[]>([]);
  const [categories, setCategories] = useState<MockTestCategory[]>([]);
  const [testTypes, setTestTypes] = useState<MockTestType[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total_tests: 0,
    published_count: 0,
    draft_count: 0,
    hidden_count: 0,
    total_questions: 0,
    total_attempts: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [selectedMarksFilter, setSelectedMarksFilter] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [selectedPricing, setSelectedPricing] = useState("all"); // "all", "free", "paid"
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all"); // "all", "mock_test_library", "placement_tests", "both"

  // Sync Default Tests State
  const [syncingTests, setSyncingTests] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AdminMockTest | null>(null);

  // Test Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("School Examinations");
  const [subcategory, setSubcategory] = useState("");
  const [testTypeId, setTestTypeId] = useState("");
  const [testTypeName, setTestTypeName] = useState("Full-Length Mock Test");
  const [classLevel, setClassLevel] = useState("Class 12");
  const [subject, setSubject] = useState("Mathematics");
  const [examType, setExamType] = useState("School Board");
  const [engineeringBranch, setEngineeringBranch] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [pyqExamName, setPyqExamName] = useState("");
  const [pyqYear, setPyqYear] = useState<number | "">("");
  const [pyqShift, setPyqShift] = useState("");
  const [pyqSource, setPyqSource] = useState("");
  const [speedTargetTime, setSpeedTargetTime] = useState<number | "">("");
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [visibilityTarget, setVisibilityTarget] = useState("all");
  const [targetSection, setTargetSection] = useState<"mock_test_library" | "placement_tests" | "both">("mock_test_library");
  const [statusVal, setStatusVal] = useState("published");
  const [priceInr, setPriceInr] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [marksPreset, setMarksPreset] = useState<"25" | "50" | "100" | "200" | "300" | "custom">("100");
  const [totalMarks, setTotalMarks] = useState(100);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [passingMarks, setPassingMarks] = useState(40);
  const [instructions, setInstructions] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Manage Test Types Modal
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [newTypeBadgeColor, setNewTypeBadgeColor] = useState("blue");
  const [newTypeReqChap, setNewTypeReqChap] = useState(false);
  const [newTypeReqTopic, setNewTypeReqTopic] = useState(false);
  const [newTypeReqPyq, setNewTypeReqPyq] = useState(false);
  const [newTypeReqSection, setNewTypeReqSection] = useState(false);
  const [newTypeIsSpeed, setNewTypeIsSpeed] = useState(false);
  const [newTypeIsPractice, setNewTypeIsPractice] = useState(false);
  const [savingType, setSavingType] = useState(false);

  // Question Management Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [activeQuestionTest, setActiveQuestionTest] = useState<AdminMockTest | null>(null);
  const [testQuestions, setTestQuestions] = useState<QuestionItem[]>([]);
  const [questionModalTab, setQuestionModalTab] = useState<"list" | "add" | "json">("list");
  const [jsonBulkInput, setJsonBulkInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Single Question Form
  const [newQText, setNewQText] = useState("");
  const [newOptA, setNewOptA] = useState("");
  const [newOptB, setNewOptB] = useState("");
  const [newOptC, setNewOptC] = useState("");
  const [newOptD, setNewOptD] = useState("");
  const [newCorrect, setNewCorrect] = useState("A");
  const [newQType, setNewQType] = useState("single_choice");
  const [newQDomain, setNewQDomain] = useState("");
  const [newQMarks, setNewQMarks] = useState(2);
  const [newQNeg, setNewQNeg] = useState(0);
  const [newQExpl, setNewQExpl] = useState("");
  const [newQImageUrl, setNewQImageUrl] = useState("");
  const [newQImageCaption, setNewQImageCaption] = useState("");
  const [newQDiagramType, setNewQDiagramType] = useState("circuit");
  const [newQDiagramPos, setNewQDiagramPos] = useState<"above_question" | "below_question">("above_question");
  const [newQPassage, setNewQPassage] = useState("");
  const [newQTolerance, setNewQTolerance] = useState<number | "">("");
  const [newQSourceType, setNewQSourceType] = useState("official_exam");
  const [newQSourceName, setNewQSourceName] = useState("");
  const [newQExamName, setNewQExamName] = useState("");
  const [newQExamYear, setNewQExamYear] = useState<number | "">("");
  const [newQExamSession, setNewQExamSession] = useState("");
  const [newQVerification, setNewQVerification] = useState("official_verified");
  const [newQReviewer, setNewQReviewer] = useState("Academic Review Board");
  const [savingQuestions, setSavingQuestions] = useState(false);

  // Preview Modal
  const [previewTest, setPreviewTest] = useState<AdminMockTest | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<QuestionItem[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Category Manager Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("school");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatSubs, setNewCatSubs] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchTestTypes = async () => {
    try {
      const res = await apiFetch("/mock-tests/types", { token });
      if (res.ok) {
        const data = await res.json();
        setTestTypes(data);
      }
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch("/mock-tests/categories", { token });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/mock-tests/admin/stats", { token });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/mock-tests/admin/all", { token });
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchCategories();
    fetchTestTypes();
    fetchStats();
  }, [token]);

  // Handle Marks Preset Click
  const handlePresetChange = (preset: "25" | "50" | "100" | "200" | "300" | "custom") => {
    setMarksPreset(preset);
    if (preset === "25") {
      setTotalMarks(25);
      setTotalQuestions(25);
      setMarksPerQuestion(1);
      setNegativeMarking(0);
      setPassingMarks(10);
    } else if (preset === "50") {
      setTotalMarks(50);
      setTotalQuestions(25);
      setMarksPerQuestion(2);
      setNegativeMarking(0);
      setPassingMarks(20);
    } else if (preset === "100") {
      setTotalMarks(100);
      setTotalQuestions(50);
      setMarksPerQuestion(2);
      setNegativeMarking(0.5);
      setPassingMarks(40);
    } else if (preset === "200") {
      setTotalMarks(200);
      setTotalQuestions(50);
      setMarksPerQuestion(4);
      setNegativeMarking(1);
      setPassingMarks(80);
    } else if (preset === "300") {
      setTotalMarks(300);
      setTotalQuestions(75);
      setMarksPerQuestion(4);
      setNegativeMarking(1);
      setPassingMarks(120);
    }
  };

  const handleOpenCreate = () => {
    setEditingTest(null);
    setTitle("");
    setDescription("");
    setCategoryName(categories[0]?.name || "School Examinations");
    setSubcategory("Class 12 - Mathematics");
    setTestTypeId(testTypes[0]?.id || "");
    setTestTypeName(testTypes[0]?.name || "Full-Length Mock Test");
    setClassLevel("Class 12");
    setSubject("Mathematics");
    setExamType("School Board");
    setEngineeringBranch("");
    setChapter("");
    setTopic("");
    setSectionName("");
    setPyqExamName("");
    setPyqYear("");
    setPyqShift("");
    setPyqSource("");
    setSpeedTargetTime("");
    setIsPracticeMode(false);
    setDifficulty("Medium");
    setLanguage("English");
    setVisibilityTarget("all");
    setTargetSection("mock_test_library");
    setStatusVal("published");
    setPriceInr(0);
    setDurationMinutes(60);
    setTotalQuestions(50);
    setMarksPreset("100");
    setTotalMarks(100);
    setMarksPerQuestion(2);
    setNegativeMarking(0.5);
    setPassingMarks(40);
    setInstructions("1. All questions are compulsory. 2. Choose the single best option. 3. Manage your time efficiently.");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (test: AdminMockTest) => {
    setEditingTest(test);
    setTitle(test.title);
    setDescription(test.description || "");
    setCategoryName(test.category || "School Examinations");
    setSubcategory(test.subcategory || "");
    setTestTypeId(test.test_type_id || "");
    setTestTypeName(test.test_type || "Full-Length Mock Test");
    setClassLevel(test.class_level || "Class 12");
    setSubject(test.subject || "Mathematics");
    setExamType(test.exam_type || "School Board");
    setEngineeringBranch(test.engineering_branch || "");
    setChapter(test.chapter || "");
    setTopic(test.topic || "");
    setSectionName(test.section_name || "");
    setPyqExamName(test.pyq_exam_name || "");
    setPyqYear(test.pyq_year || "");
    setPyqShift(test.pyq_shift || "");
    setPyqSource(test.pyq_source || "");
    setSpeedTargetTime(test.speed_test_target_time_per_q || "");
    setIsPracticeMode(Boolean(test.practice_mode_instant_explanation));
    setDifficulty(test.difficulty || "Medium");
    setLanguage(test.language || "English");
    setVisibilityTarget(test.visibility_target || "all");
    const inferredSection =
      (test.target_section as any) ||
      (test.exam_type === "Corporate Placement" ||
      (test.category && test.category.toLowerCase().includes("placement")) ||
      (test.company_slug && !["testora", "testora_national"].includes(test.company_slug.toLowerCase()))
        ? "placement_tests"
        : "mock_test_library");
    setTargetSection(inferredSection);
    setStatusVal(test.status || "published");
    setPriceInr(test.price_inr || 0);
    setDurationMinutes(test.duration_minutes || 60);
    setTotalQuestions(test.total_questions || 50);

    const m = Number(test.total_marks) || 100;
    setTotalMarks(m);
    if (m === 25) setMarksPreset("25");
    else if (m === 50) setMarksPreset("50");
    else if (m === 100) setMarksPreset("100");
    else if (m === 200) setMarksPreset("200");
    else if (m === 300) setMarksPreset("300");
    else setMarksPreset("custom");

    setMarksPerQuestion(Number(test.marks_per_question) || 2);
    setNegativeMarking(Number(test.negative_marking) || 0);
    setPassingMarks(Number(test.passing_marks) || 40);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Test Title is required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: categoryName.trim(),
        subcategory: subcategory.trim() || undefined,
        test_type_id: testTypeId || undefined,
        test_type: testTypeName || undefined,
        class_level: classLevel,
        subject: subject.trim(),
        exam_type: examType,
        engineering_branch: engineeringBranch.trim() || undefined,
        chapter: chapter.trim() || undefined,
        topic: topic.trim() || undefined,
        section_name: sectionName.trim() || undefined,
        pyq_exam_name: pyqExamName.trim() || undefined,
        pyq_year: pyqYear ? Number(pyqYear) : undefined,
        pyq_shift: pyqShift.trim() || undefined,
        pyq_source: pyqSource.trim() || undefined,
        speed_test_target_time_per_q: speedTargetTime ? Number(speedTargetTime) : undefined,
        practice_mode_instant_explanation: isPracticeMode,
        difficulty,
        language,
        visibility_target: visibilityTarget,
        target_section: targetSection,
        status: statusVal,
        price_inr: Number(priceInr) || 0,
        duration_minutes: Number(durationMinutes) || 60,
        total_questions: Number(totalQuestions) || 50,
        total_marks: Number(totalMarks) || 100,
        marks_per_question: Number(marksPerQuestion) || 2,
        negative_marking: Number(negativeMarking) || 0,
        passing_marks: Number(passingMarks) || 40,
        pass_percentage: Math.round(((Number(passingMarks) || 40) / (Number(totalMarks) || 100)) * 100),
        instructions: instructions.trim() || undefined,
        is_active: statusVal === "published"
      };

      const url = editingTest ? `/mock-tests/admin/${editingTest.id}` : "/mock-tests/admin";
      const method = editingTest ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        token,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save mock test.");
      }

      setIsEditModalOpen(false);
      fetchTests();
      fetchStats();
    } catch (err: any) {
      setFormError(err.message || "Save failed.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Actions
  const handleTogglePublish = async (test: AdminMockTest) => {
    const isPub = test.status === "published";
    const endpoint = isPub
      ? `/mock-tests/admin/${test.id}/unpublish`
      : `/mock-tests/admin/${test.id}/publish`;
    try {
      const res = await apiFetch(endpoint, { method: "POST", token });
      if (res.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, status: isPub ? "unpublished" : "published" } : t))
        );
        fetchStats();
      }
    } catch {}
  };

  const handleDuplicate = async (test: AdminMockTest) => {
    try {
      const res = await apiFetch(`/mock-tests/admin/${test.id}/duplicate`, { method: "POST", token });
      if (res.ok) {
        fetchTests();
        fetchStats();
      }
    } catch {}
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this mock test?")) return;
    try {
      const res = await apiFetch(`/mock-tests/admin/${testId}`, { method: "DELETE", token });
      if (res.ok) {
        setTests((prev) => prev.filter((t) => t.id !== testId));
        fetchStats();
      }
    } catch {}
  };

  // Manage Questions Modal Handlers
  const handleOpenQuestions = async (test: AdminMockTest) => {
    setActiveQuestionTest(test);
    setQuestionModalTab("list");
    setJsonError(null);
    setNewQMarks(test.marks_per_question || 2);
    setNewQNeg(test.negative_marking || 0);

    try {
      const res = await apiFetch(`/mock-tests/${test.id}`, { token });
      if (res.ok) {
        const data = await res.json();
        setTestQuestions(data.questions || []);
        setJsonBulkInput(JSON.stringify(data.questions || [], null, 2));
      }
    } catch {}
    setIsQuestionModalOpen(true);
  };

  const handleAddSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) {
      alert("Please provide the question statement.");
      return;
    }

    if (newQType !== "numerical" && (!newOptA.trim() || !newOptB.trim())) {
      alert("Please provide at least options A and B.");
      return;
    }

    const optionsList = newQType === "numerical"
      ? []
      : [newOptA.trim(), newOptB.trim(), newOptC.trim(), newOptD.trim()].filter(Boolean);

    const sourceObj: QuestionSourceDetails | undefined = (newQSourceName.trim() || newQExamName.trim()) ? {
      source_type: newQSourceType,
      source_name: newQSourceName.trim() || newQExamName.trim(),
      exam_name: newQExamName.trim() || undefined,
      exam_year: newQExamYear !== "" ? Number(newQExamYear) : undefined,
      exam_session: newQExamSession.trim() || undefined,
      verification_status: newQVerification,
      reviewer_name: newQReviewer.trim() || undefined
    } : undefined;

    const newQ: QuestionItem = {
      id: `q_${Date.now()}`,
      question: newQText.trim(),
      options: optionsList,
      correct_answer: newCorrect,
      question_type: newQType,
      domain: newQDomain.trim() || undefined,
      marks: Number(newQMarks) || 2,
      negative_marks: Number(newQNeg) || 0,
      explanation: newQExpl.trim() || undefined,
      image_url: newQImageUrl.trim() || undefined,
      image_caption: newQImageCaption.trim() || undefined,
      diagram_type: newQDiagramType,
      diagram_position: newQDiagramPos,
      passage: newQPassage.trim() || undefined,
      numerical_tolerance: newQTolerance !== "" ? Number(newQTolerance) : undefined,
      source_details: sourceObj
    };

    const updated = [...testQuestions, newQ];
    await saveQuestionsToServer(updated);

    // Reset single question form
    setNewQText("");
    setNewOptA("");
    setNewOptB("");
    setNewOptC("");
    setNewOptD("");
    setNewQExpl("");
    setNewQImageUrl("");
    setNewQImageCaption("");
    setNewQPassage("");
    setNewQTolerance("");
    setQuestionModalTab("list");
  };

  const handleDeleteQuestion = async (qIndex: number) => {
    if (!window.confirm("Remove this question?")) return;
    const updated = testQuestions.filter((_, idx) => idx !== qIndex);
    await saveQuestionsToServer(updated);
  };

  const handleApplyJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonBulkInput);
      if (!Array.isArray(parsed)) {
        setJsonError("Input must be a JSON array of question objects.");
        return;
      }
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.question || !Array.isArray(item.options)) {
          setJsonError(`Question #${i + 1} is missing required 'question' string or 'options' array.`);
          return;
        }
      }

      await saveQuestionsToServer(parsed);
      setQuestionModalTab("list");
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const saveQuestionsToServer = async (qs: QuestionItem[]) => {
    if (!activeQuestionTest) return;
    try {
      setSavingQuestions(true);
      const sumMarks = qs.reduce((acc, q) => acc + (q.marks || activeQuestionTest.marks_per_question || 1), 0);
      const res = await apiFetch(`/mock-tests/admin/${activeQuestionTest.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          questions: qs,
          total_questions: qs.length,
          total_marks: sumMarks > 0 ? sumMarks : activeQuestionTest.total_marks
        })
      });
      if (res.ok) {
        setTestQuestions(qs);
        setJsonBulkInput(JSON.stringify(qs, null, 2));
        fetchTests();
        fetchStats();
      }
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSavingQuestions(false);
    }
  };

  // Preview Modal
  const handleOpenPreview = async (test: AdminMockTest) => {
    setPreviewTest(test);
    try {
      const res = await apiFetch(`/mock-tests/${test.id}`, { token });
      if (res.ok) {
        const data = await res.json();
        setPreviewQuestions(data.questions || []);
      }
    } catch {}
    setIsPreviewModalOpen(true);
  };

  // Category Manager
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSavingCategory(true);
      const subList = newCatSubs.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await apiFetch("/mock-tests/categories", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: newCatName.trim(),
          category_type: newCatType,
          description: newCatDesc.trim(),
          subcategories: subList,
          display_order: categories.length + 1
        })
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatDesc("");
        setNewCatSubs("");
        fetchCategories();
        setIsCategoryModalOpen(false);
      }
    } catch {} finally {
      setSavingCategory(false);
    }
  };

  // Test Type Manager
  const handleToggleTypeActive = async (typeItem: MockTestType) => {
    try {
      const res = await apiFetch(`/mock-tests/types/${typeItem.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ is_active: !typeItem.is_active })
      });
      if (res.ok) {
        fetchTestTypes();
      }
    } catch {}
  };

  const handleSaveTestType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      setSavingType(true);
      const slugVal = newTypeSlug.trim() || newTypeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await apiFetch("/mock-tests/types", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: newTypeName.trim(),
          slug: slugVal,
          description: newTypeDesc.trim() || undefined,
          icon: "award",
          badge_color: newTypeBadgeColor,
          requires_chapter: newTypeReqChap,
          requires_topic: newTypeReqTopic,
          requires_pyq_metadata: newTypeReqPyq,
          requires_section: newTypeReqSection,
          is_speed_test: newTypeIsSpeed,
          is_practice: newTypeIsPractice,
          display_order: testTypes.length + 1
        })
      });
      if (res.ok) {
        setNewTypeName("");
        setNewTypeSlug("");
        setNewTypeDesc("");
        fetchTestTypes();
        setIsTypeModalOpen(false);
      }
    } catch {} finally {
      setSavingType(false);
    }
  };

  const handleSyncDefaultTests = async () => {
    try {
      setSyncingTests(true);
      const res = await apiFetch("/mock-tests/admin/seed", {
        method: "POST",
        token
      });
      if (res.ok) {
        setSyncSuccessMsg("Catalogue synced! Default academic & corporate ₹9/₹12 placement mock tests have been verified & loaded.");
        await Promise.all([fetchTests(), fetchStats()]);
        setTimeout(() => setSyncSuccessMsg(null), 6000);
      } else {
        alert("Failed to sync catalogue default tests.");
      }
    } catch (e: any) {
      alert("Sync error: " + (e.message || "Network error"));
    } finally {
      setSyncingTests(false);
    }
  };

  const freeCount = useMemo(() => tests.filter((t) => t.is_free || (t.price_inr || 0) === 0).length, [tests]);
  const paidCount = useMemo(() => tests.filter((t) => !t.is_free && (t.price_inr || 0) > 0).length, [tests]);

  // Filtered List & Pagination
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (selectedPricing === "free" && (!t.is_free && (t.price_inr || 0) > 0)) return false;
      if (selectedPricing === "paid" && (t.is_free || (t.price_inr || 0) === 0)) return false;
      if (selectedSectionFilter !== "all") {
        if (selectedSectionFilter === "mock_test_library") {
          const isLib = t.target_section === "mock_test_library" || t.target_section === "both" || (!t.target_section && t.exam_type !== "Corporate Placement");
          if (!isLib) return false;
        } else if (selectedSectionFilter === "placement_tests") {
          const isPlace = t.target_section === "placement_tests" || t.target_section === "both" || (!t.target_section && t.exam_type === "Corporate Placement");
          if (!isPlace) return false;
        } else if (selectedSectionFilter === "both") {
          if (t.target_section !== "both") return false;
        }
      }
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (selectedTestType !== "all" && t.test_type !== selectedTestType && t.test_type_id !== selectedTestType) return false;
      if (selectedMarksFilter !== "all") {
        const m = Number(t.total_marks) || 0;
        if (selectedMarksFilter === "25" && m !== 25) return false;
        if (selectedMarksFilter === "50" && m !== 50) return false;
        if (selectedMarksFilter === "100" && m !== 100) return false;
        if (selectedMarksFilter === "200" && m !== 200) return false;
        if (selectedMarksFilter === "300" && m !== 300) return false;
        if (selectedMarksFilter === "custom" && [25, 50, 100, 200, 300].includes(m)) return false;
      }
      if (selectedClass !== "all" && t.class_level !== selectedClass) return false;
      if (selectedSubject !== "all" && t.subject !== selectedSubject) return false;
      if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
      if (selectedVisibility !== "all" && t.visibility_target !== selectedVisibility) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inSubj = (t.subject || "").toLowerCase().includes(q);
        const inCat = (t.category || "").toLowerCase().includes(q);
        const inDesc = (t.description || "").toLowerCase().includes(q);
        if (!inTitle && !inSubj && !inCat && !inDesc) return false;
      }
      return true;
    });
  }, [tests, selectedPricing, selectedSectionFilter, selectedCategory, selectedTestType, selectedMarksFilter, selectedClass, selectedSubject, selectedStatus, selectedVisibility, searchQuery]);

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage) || 1;
  const paginatedTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Distinct subjects and classes for dropdowns
  const availableClasses = useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      if (t.class_level) s.add(t.class_level);
    });
    return Array.from(s);
  }, [tests]);

  const availableSubjects = useMemo(() => {
    const s = new Set<string>();
    tests.forEach((t) => {
      if (t.subject) s.add(t.subject);
    });
    return Array.from(s);
  }, [tests]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Central Mock Test Catalogue & Super Admin Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Mock Test Library & Examination System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Create, configure marks (50, 100, custom), manage questions, and control audience visibility (Students, Teachers, All) across School, Engineering, and Competitive exams.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleSyncDefaultTests}
            disabled={syncingTests}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200/80 dark:border-emerald-800 disabled:opacity-50"
            title="Seed & verify all default Academic and Corporate ₹9/₹12 Placement Tests"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncingTests ? "animate-spin" : ""}`} />
            <span>{syncingTests ? "Syncing Tests..." : "Sync Default Tests"}</span>
          </button>

          <button
            onClick={() => setIsTypeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200/80 dark:border-indigo-800"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manage Test Types</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Mock Test</span>
          </button>
        </div>
      </div>

      {/* Sync Success Alert */}
      {syncSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Tests</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total_tests || tests.length}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Published</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.published_count}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-emerald-200/80 dark:border-emerald-800 shadow-2xs bg-emerald-50/20">
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">100% Free</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{freeCount}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-amber-200/80 dark:border-amber-800 shadow-2xs bg-amber-50/20">
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">Paid (₹9/₹12)</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{paidCount}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Drafts</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.draft_count}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hidden</div>
          <div className="text-xl font-black text-slate-500 dark:text-slate-400 mt-0.5">{stats.hidden_count}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Questions</div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.total_questions}</div>
        </div>
        <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Attempts</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.total_attempts}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by test title, subject, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Pricing Tier Dropdown */}
          <select
            value={selectedPricing}
            onChange={(e) => {
              setSelectedPricing(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold"
          >
            <option value="all">All Pricing</option>
            <option value="free">100% Free Only (₹0)</option>
            <option value="paid">Paid Tests Only (₹9 / ₹12)</option>
          </select>

          {/* Target Section Filter */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => {
              setSelectedSectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold"
          >
            <option value="all">All Sections (Arena)</option>
            <option value="mock_test_library">🎓 Mock Test Library Only</option>
            <option value="placement_tests">🏢 Placement Tests Only</option>
            <option value="both">🌐 Both Sections</option>
          </select>

          {/* Test Type Dropdown */}
          <select
            value={selectedTestType}
            onChange={(e) => {
              setSelectedTestType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Test Types</option>
            {testTypes.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Marks Scheme Dropdown */}
          <select
            value={selectedMarksFilter}
            onChange={(e) => {
              setSelectedMarksFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Marks Schemes</option>
            <option value="25">25 Marks</option>
            <option value="50">50 Marks</option>
            <option value="100">100 Marks</option>
            <option value="200">200 Marks</option>
            <option value="300">300 Marks (JEE Main)</option>
            <option value="custom">Custom Marks</option>
          </select>

          {/* Class Dropdown */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Subject Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="unpublished">Unpublished</option>
          </select>

          {/* Visibility Dropdown */}
          <select
            value={selectedVisibility}
            onChange={(e) => {
              setSelectedVisibility(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="all">All Audiences</option>
            <option value="students_only">Students Only</option>
            <option value="teachers_only">Teachers Only</option>
            <option value="all">Students & Teachers</option>
          </select>
        </div>
      </div>

      {/* Tests Table / Responsive List */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#15233D] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Fee / Access</th>
                <th className="py-3 px-4">Category & Subcategory</th>
                <th className="py-3 px-4">Class / Exam</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Marks & Scheme</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Loading mock test catalogue...
                  </td>
                </tr>
              ) : paginatedTests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No mock tests match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Test Title */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs">
                      <div className="font-semibold line-clamp-1">{t.title}</div>
                      <div className="text-[10px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                        {t.subject || "General"} • {t.difficulty}
                      </div>
                    </td>

                    {/* Fee / Access */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.is_free || (t.price_inr || 0) === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/80 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% Free</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-[10px] border border-amber-200/80 dark:border-amber-800">
                          <span className="text-amber-600 text-xs font-black">₹</span>
                          <span>₹{t.price_inr} Paid</span>
                        </span>
                      )}
                    </td>

                    {/* Category & Section */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium text-[11px]">
                          {t.category}
                        </span>
                        {t.target_section === "placement_tests" || (!t.target_section && t.exam_type === "Corporate Placement") ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
                            🏢 Placement Arena
                          </span>
                        ) : t.target_section === "both" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60">
                            🌐 Both Sections
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300/60">
                            🎓 Mock Library
                          </span>
                        )}
                      </div>
                      {t.subcategory && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.subcategory}</div>
                      )}
                    </td>

                    {/* Class / Exam */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      <div>{t.class_level || "Standard"}</div>
                      <div className="text-[10px] text-slate-400">{t.exam_type || "General"}</div>
                    </td>

                    {/* Questions */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {t.total_questions} Qs
                    </td>

                    {/* Total Marks */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">{t.total_marks} Marks</span>
                      <div className="text-[10px] text-slate-400">
                        {t.marks_per_question}m / q {t.negative_marking > 0 ? `(-${t.negative_marking})` : ""}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {t.duration_minutes} mins
                    </td>

                    {/* Audience Visibility */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.visibility_target === "students_only"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                            : t.visibility_target === "teachers_only"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {t.visibility_target === "students_only"
                          ? "Students Only"
                          : t.visibility_target === "teachers_only"
                          ? "Teachers Only"
                          : "All Users"}
                      </span>
                    </td>

                    {/* Publication Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(t)}
                        title="Click to toggle publish status"
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          t.status === "published"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : t.status === "draft"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        <button
                          onClick={() => handleOpenPreview(t)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                          title="Preview Test Paper"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Manage Questions */}
                        <button
                          onClick={() => handleOpenQuestions(t)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          title="Manage Questions & JSON"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Test Details */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Test Settings"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(t)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                          title="Duplicate Test"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTest(t.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {currentPage} of {totalPages} ({filteredTests.length} total tests)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE / EDIT MOCK TEST MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>{editingTest ? "Edit Mock Test Configuration" : "Create New Central Mock Test"}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 12 Mathematics – Full Syllabus Grand Mock"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Syllabus Covered
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of syllabus, chapters, and topics covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Dynamic Test Type Selector & Scope Fields */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Test Type Classification (Super Admin Managed)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTypeModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Manage Test Types
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Test Type *
                    </label>
                    <select
                      value={testTypeId || testTypeName}
                      onChange={(e) => {
                        const sel = testTypes.find((tt) => tt.id === e.target.value || tt.name === e.target.value);
                        if (sel) {
                          setTestTypeId(sel.id);
                          setTestTypeName(sel.name);
                        } else {
                          setTestTypeName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111C31] border border-indigo-200 dark:border-indigo-900/80 rounded-xl text-slate-900 dark:text-white font-bold"
                    >
                      {testTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center">
                    {testTypes.find((tt) => tt.id === testTypeId || tt.name === testTypeName)?.description ||
                      "Structured test format with standardized questions and grading rules."}
                  </div>
                </div>

                {/* Scope Fields based on selected test type */}
                <div className="space-y-2.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        Specific Chapter Name (For Chapter-Wise / Topic-Wise)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Electrostatics & Capacitance"
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        Specific Topic Name (For Topic-Wise Tests)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gauss's Law Applications"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        PYQ Exam Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. JEE Main, NEET"
                        value={pyqExamName}
                        onChange={(e) => setPyqExamName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        PYQ Exam Year
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        value={pyqYear}
                        onChange={(e) => setPyqYear(e.target.value ? Number(e.target.value) : "")}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        Shift / Session
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Session 1 - Shift 2"
                        value={pyqShift}
                        onChange={(e) => setPyqShift(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        PYQ Source / Paper
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Official NTA Question Paper"
                        value={pyqSource}
                        onChange={(e) => setPyqSource(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        Speed Test Target Seconds / Q
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 45 seconds"
                        value={speedTargetTime}
                        onChange={(e) => setSpeedTargetTime(e.target.value ? Number(e.target.value) : "")}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        Section Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Section A: Physical Chemistry"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="admin_practice_instant"
                      checked={isPracticeMode}
                      onChange={(e) => setIsPracticeMode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="admin_practice_instant" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      Enable Practice Mode: Instant step-by-step solution after student response
                    </label>
                  </div>
                </div>
              </div>

              {/* Classification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Standard
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class 11, Class 12, Engineering"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Mathematics, Chemistry, CSE"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Examination Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. School Board, JEE Main, Engineering Branch"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Engineering Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, IT, Mechanical, Civil, ECE"
                    value={engineeringBranch}
                    onChange={(e) => setEngineeringBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Marks & Examination Scheme Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Independent Marks & Examination Configuration</span>
                  </span>

                  {/* Marks Presets Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handlePresetChange("25")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "25"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      25M
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("50")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "50"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      50M
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("100")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "100"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      100M
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("200")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "200"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      200M
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("300")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "300"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                      title="JEE Main Standard (75 Qs, +4/-1)"
                    >
                      300M (JEE)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("custom")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                        marksPreset === "custom"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-600 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      Custom Scheme
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Total Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalMarks}
                      onChange={(e) => {
                        setTotalMarks(Number(e.target.value));
                        setMarksPreset("custom");
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Marks / Question
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={marksPerQuestion}
                      onChange={(e) => {
                        setMarksPerQuestion(Number(e.target.value));
                        setMarksPreset("custom");
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Negative Marking
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="0.0 or 0.5"
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Pricing & Monetization Tier Selection */}
                <div className="p-3 bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Pricing & Access Tier *
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      Current Fee: <b className={priceInr > 0 ? "text-amber-600" : "text-emerald-600"}>{priceInr > 0 ? `₹${priceInr} INR (Paid)` : "100% Free"}</b>
                    </span>
                  </div>

                  {/* Preset Pricing Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriceInr(0)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        priceInr === 0
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Free Access (₹0)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriceInr(9)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        priceInr === 9
                          ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300"
                      }`}
                    >
                      <span className="font-black">₹9</span>
                      <span>Placement Mock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriceInr(12)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                        priceInr === 12
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                          : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      <span className="font-black">₹12</span>
                      <span>Premium Mock</span>
                    </button>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Custom ₹"
                        value={priceInr === 0 || priceInr === 9 || priceInr === 12 ? "" : priceInr}
                        onChange={(e) => setPriceInr(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal">
                    {priceInr === 0
                      ? "✨ 100% Free Practice Mock — Instant access for all students in Mock Test Library."
                      : `⚡ Paid Assessment (₹${priceInr}) — Students unlock this corporate test through Razorpay in the Campus Placement Arena.`}
                  </p>
                </div>
              </div>

              {/* Target Display Arena / Section Selector (Mock Test Library vs Placement Tests vs Both) */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>Target Display Section / Arena *</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    Active Target:{" "}
                    <b className="text-blue-600 dark:text-blue-400">
                      {targetSection === "both"
                        ? "Both Sections (Global)"
                        : targetSection === "placement_tests"
                        ? "Placement Tests Arena"
                        : "Mock Test Library"}
                    </b>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetSection("mock_test_library")}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                      targetSection === "mock_test_library"
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/40"
                        : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>Mock Test Library</span>
                    </div>
                    <span className={`text-[10px] font-medium leading-tight ${targetSection === "mock_test_library" ? "text-blue-100" : "text-slate-400"}`}>
                      School Boards, Class 11/12, JEE Main, NEET & Foundation
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetSection("placement_tests")}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                      targetSection === "placement_tests"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/40"
                        : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Placement Tests</span>
                    </div>
                    <span className={`text-[10px] font-medium leading-tight ${targetSection === "placement_tests" ? "text-emerald-100" : "text-slate-400"}`}>
                      Corporate campus recruitment (TCS, Infosys, Wipro, Paid ₹9/₹12)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetSection("both")}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                      targetSection === "both"
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400/40"
                        : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      <span>Both Sections</span>
                    </div>
                    <span className={`text-[10px] font-medium leading-tight ${targetSection === "both" ? "text-indigo-100" : "text-slate-400"}`}>
                      Visible in both Mock Test Library & Campus Placement Arena
                    </span>
                  </button>
                </div>
              </div>

              {/* Visibility and Publication Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audience Visibility *
                  </label>
                  <select
                    value={visibilityTarget}
                    onChange={(e) => setVisibilityTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="all">Students & Teachers (All Users)</option>
                    <option value="students_only">Students Only</option>
                    <option value="teachers_only">Teachers Only (Hidden from Students)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="published">Published (Live & Accessible)</option>
                    <option value="draft">Draft (Admin Only)</option>
                    <option value="unpublished">Unpublished (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Official guidelines, marking instructions, or formulas allowed..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingTest ? "Update Mock Test" : "Create Mock Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          QUESTION MANAGEMENT MODAL (MANUAL BUILDER + JSON BULK IMPORTER)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isQuestionModalOpen && activeQuestionTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Question Management: {activeQuestionTest.title}</span>
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Questions in Test: <b className="text-slate-900 dark:text-white">{testQuestions.length}</b> / {activeQuestionTest.total_questions} configured</span>
                  <span>•</span>
                  <span>Current Total Marks: <b className="text-slate-900 dark:text-white">
                    {testQuestions.reduce((acc, q) => acc + (q.marks || activeQuestionTest.marks_per_question || 1), 0)}
                  </b> / {activeQuestionTest.total_marks} configured</span>
                </div>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation warning if question count or marks mismatch */}
            {testQuestions.length !== activeQuestionTest.total_questions && (
              <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Notice: Test is configured for <b>{activeQuestionTest.total_questions}</b> questions, but currently contains <b>{testQuestions.length}</b> questions. Add or import questions to match.
                </span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#15233D]/50 text-xs">
              <button
                onClick={() => setQuestionModalTab("list")}
                className={`pb-2.5 font-bold cursor-pointer transition-colors border-b-2 ${
                  questionModalTab === "list"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Question Bank ({testQuestions.length})
              </button>
              <button
                onClick={() => setQuestionModalTab("add")}
                className={`pb-2.5 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1 ${
                  questionModalTab === "add"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Single Question</span>
              </button>
              <button
                onClick={() => setQuestionModalTab("json")}
                className={`pb-2.5 font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-1 ${
                  questionModalTab === "json"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Bulk Import / Export</span>
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* TAB 1: QUESTIONS LIST */}
              {questionModalTab === "list" && (
                <div className="space-y-3">
                  {testQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <HelpCircle className="w-8 h-8 mx-auto opacity-50" />
                      <p>No questions added to this test yet.</p>
                      <button
                        onClick={() => setQuestionModalTab("add")}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                      >
                        Add First Question
                      </button>
                    </div>
                  ) : (
                    testQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            <span className="text-blue-600 font-bold mr-1.5">Q{idx + 1}.</span>
                            {q.question}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {q.question_type && (
                              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono text-[10px] font-bold">
                                {q.question_type.replace('_', ' ')}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                              {q.marks || 1}m {q.negative_marks ? `(-${q.negative_marks})` : ""}
                            </span>
                            <button
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Diagram Thumbnail if present */}
                        {q.image_url && (
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 text-xs">
                            <img src={q.image_url} alt="Diagram" className="h-10 w-16 object-contain rounded border border-blue-200" />
                            <div className="text-[11px] text-blue-900 dark:text-blue-200">
                              <span className="font-bold uppercase tracking-wider text-[9px] block text-blue-600">{q.diagram_type || "Diagram"}</span>
                              <span className="truncate">{q.image_caption || "Image Attached"}</span>
                            </div>
                          </div>
                        )}

                        {/* Source Attribution Badge if present */}
                        {q.source_details?.source_name && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Source: {q.source_details.source_name} {q.source_details.exam_year ? `(${q.source_details.exam_year})` : ""} • {q.source_details.verification_status || 'Verified'}</span>
                          </div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          {q.options.map((opt, oIdx) => {
                            const optLetter = String.fromCharCode(65 + oIdx);
                            const isCorrect = q.correct_answer === optLetter;
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold"
                                    : "bg-white dark:bg-[#111C31] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <span className="font-bold">{optLetter}.</span>
                                <span>{opt}</span>
                                {isCorrect && <Check className="w-3 h-3 ml-auto text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                            <b>Explanation:</b> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: ADD SINGLE QUESTION */}
              {questionModalTab === "add" && (
                <form onSubmit={handleAddSingleQuestion} className="space-y-3.5 max-w-2xl mx-auto">
                  {/* Question Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Question Type
                      </label>
                      <select
                        value={newQType}
                        onChange={(e) => {
                          const vt = e.target.value;
                          setNewQType(vt);
                          if (vt === "assertion_reason") {
                            setNewOptA("Both Assertion and Reason are true and Reason is the correct explanation of Assertion.");
                            setNewOptB("Both Assertion and Reason are true but Reason is NOT the correct explanation of Assertion.");
                            setNewOptC("Assertion is true but Reason is false.");
                            setNewOptD("Assertion is false but Reason is true.");
                          } else if (vt === "true_false") {
                            setNewOptA("True");
                            setNewOptB("False");
                            setNewOptC("");
                            setNewOptD("");
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold"
                      >
                        <option value="single_choice">Single Correct MCQ</option>
                        <option value="multiple_choice">Multiple Correct MCQ</option>
                        <option value="true_false">True / False</option>
                        <option value="numerical">Numerical Answer (Float / Integer)</option>
                        <option value="assertion_reason">Assertion - Reason</option>
                        <option value="comprehension">Comprehension / Passage</option>
                        <option value="diagram_based">Diagram-Based Question</option>
                      </select>
                    </div>

                    {newQType === "numerical" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Numerical Tolerance (±)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 0.05"
                          value={newQTolerance}
                          onChange={(e) => setNewQTolerance(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Optional Passage */}
                  {newQType === "comprehension" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Passage / Context Statement
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter the reading comprehension passage or case study..."
                        value={newQPassage}
                        onChange={(e) => setNewQPassage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Question Stem Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Question Text * (KaTeX/LaTeX Math Supported)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter the complete question statement..."
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Diagram & Media Attachment Section */}
                  <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Diagram & Media Attachment (Ray Optics, Circuits, Reactions, Graphs)</span>
                      </span>
                      {newQImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewQImageUrl("")}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove Diagram
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="url"
                          placeholder="Image URL: https://images.unsplash.com/... or https://..."
                          value={newQImageUrl}
                          onChange={(e) => setNewQImageUrl(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-blue-200 dark:border-blue-900 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <select
                          value={newQDiagramType}
                          onChange={(e) => setNewQDiagramType(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-blue-200 dark:border-blue-900 rounded-xl text-slate-900 dark:text-white"
                        >
                          <option value="circuit">Electric Circuit</option>
                          <option value="ray_optics">Ray Optics / Lens</option>
                          <option value="geometry">Geometry / Trigonometry</option>
                          <option value="graph">Function / Calculus Graph</option>
                          <option value="reaction">Chemical Reaction Mechanism</option>
                          <option value="engineering">Engineering Diagram</option>
                          <option value="table">Data / Truth Table</option>
                          <option value="general">General Illustration</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Caption / Figure label (e.g. Figure 1.2: RLC Circuit)"
                        value={newQImageCaption}
                        onChange={(e) => setNewQImageCaption(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-blue-200 dark:border-blue-900 rounded-xl text-slate-900 dark:text-white"
                      />
                      <select
                        value={newQDiagramPos}
                        onChange={(e) => setNewQDiagramPos(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-blue-200 dark:border-blue-900 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="above_question">Position: Above Question Stem</option>
                        <option value="below_question">Position: Below Question Stem</option>
                      </select>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                      <span className="text-slate-500 font-bold uppercase">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewQImageUrl("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80");
                          setNewQDiagramType("circuit");
                          setNewQImageCaption("Figure A: Schematic Circuit Diagram");
                        }}
                        className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 cursor-pointer"
                      >
                        ⚡ Electric Circuit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewQImageUrl("https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80");
                          setNewQDiagramType("graph");
                          setNewQImageCaption("Figure B: Quadratic Curve & Coordinates");
                        }}
                        className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 cursor-pointer"
                      >
                        📈 Calculus Graph
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewQImageUrl("https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80");
                          setNewQDiagramType("reaction");
                          setNewQImageCaption("Figure C: Organic Reaction Mechanism");
                        }}
                        className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 cursor-pointer"
                      >
                        ⚗️ Chemistry Reaction
                      </button>
                    </div>

                    {/* Live Diagram Preview */}
                    {newQImageUrl && (
                      <div className="w-full max-h-48 overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900 bg-black/5 flex items-center justify-center p-2">
                        <img src={newQImageUrl} alt="Preview" className="max-h-44 w-auto object-contain rounded-lg" />
                      </div>
                    )}
                  </div>

                  {/* Question Source Attribution & Authenticity Section */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Question Source Attribution &amp; Authenticity Tracking</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Source Type</label>
                        <select
                          value={newQSourceType}
                          onChange={(e) => setNewQSourceType(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-indigo-200 dark:border-indigo-900 rounded-xl text-slate-900 dark:text-white"
                        >
                          <option value="official_exam">Official Examination Paper</option>
                          <option value="official_portal">Official Examination Portal</option>
                          <option value="ncert_textbook">NCERT Textbook</option>
                          <option value="state_board">State Board Textbook</option>
                          <option value="university">University Syllabus / Paper</option>
                          <option value="verified_book">Verified Reference Book</option>
                          <option value="teacher_created">Teacher Created</option>
                          <option value="institution_created">Institution Created</option>
                          <option value="testora_original">Original Testora Question</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Source / Exam Name</label>
                        <input
                          type="text"
                          placeholder="e.g. JEE Main 2024 / NCERT Physics"
                          value={newQSourceName}
                          onChange={(e) => setNewQSourceName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-indigo-200 dark:border-indigo-900 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Verification Status</label>
                        <select
                          value={newQVerification}
                          onChange={(e) => setNewQVerification(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-indigo-200 dark:border-indigo-900 rounded-xl text-slate-900 dark:text-white"
                        >
                          <option value="official_verified">Official Verified</option>
                          <option value="ncert_verified">NCERT Verified</option>
                          <option value="academic_reviewed">Academic Reviewed</option>
                          <option value="teacher_created">Teacher Created</option>
                          <option value="testora_original">Testora Original</option>
                          <option value="unverified">Unverified</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Options (for choice questions) */}
                  {newQType !== "numerical" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Option A *
                        </label>
                        <input
                          type="text"
                          value={newOptA}
                          onChange={(e) => setNewOptA(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                          required={newQType !== "numerical"}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Option B *
                        </label>
                        <input
                          type="text"
                          value={newOptB}
                          onChange={(e) => setNewOptB(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                          required={newQType !== "numerical"}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Option C
                        </label>
                        <input
                          type="text"
                          value={newOptC}
                          onChange={(e) => setNewOptC(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Option D
                        </label>
                        <input
                          type="text"
                          value={newOptD}
                          onChange={(e) => setNewOptD(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Correct Answer *
                      </label>
                      {newQType === "numerical" ? (
                        <input
                          type="text"
                          placeholder="e.g. 14.5"
                          value={newCorrect}
                          onChange={(e) => setNewCorrect(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                          required
                        />
                      ) : (
                        <select
                          value={newCorrect}
                          onChange={(e) => setNewCorrect(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold"
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={newQMarks}
                        onChange={(e) => setNewQMarks(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Negative Marks
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={newQNeg}
                        onChange={(e) => setNewQNeg(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Topic / Domain
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus"
                        value={newQDomain}
                        onChange={(e) => setNewQDomain(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Detailed Solution / Explanation
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Step-by-step educational rationale for the correct answer..."
                      value={newQExpl}
                      onChange={(e) => setNewQExpl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionModalTab("list")}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingQuestions}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    >
                      {savingQuestions ? "Adding..." : "Add Question to Test"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: JSON BULK IMPORTER */}
              {questionModalTab === "json" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Paste or edit a JSON array of questions.</span>
                    <span className="font-mono text-[10px]">
                      Format: [&#123; id, question, options, correct_answer, marks, negative_marks, explanation &#125;]
                    </span>
                  </div>

                  {jsonError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{jsonError}</span>
                    </div>
                  )}

                  <textarea
                    rows={14}
                    value={jsonBulkInput}
                    onChange={(e) => setJsonBulkInput(e.target.value)}
                    className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none"
                    placeholder="[ { 'id': 'q1', 'question': '...', 'options': ['A', 'B', 'C', 'D'], 'correct_answer': 'A' } ]"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionModalTab("list")}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingQuestions}
                      onClick={handleApplyJson}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    >
                      {savingQuestions ? "Validating & Saving..." : "Apply & Save All Questions"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PREVIEW TEST MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {isPreviewModalOpen && previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Preview: {previewTest.title}</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {previewTest.category} • {previewTest.total_questions} Questions • {previewTest.total_marks} Total Marks • {previewTest.duration_minutes} Mins
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {previewTest.instructions && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                  <div className="font-bold mb-1">Instructions to Candidates:</div>
                  <p>{previewTest.instructions}</p>
                </div>
              )}

              <div className="space-y-3">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white flex items-start justify-between">
                      <span>
                        <b className="text-blue-600 mr-1.5">Q{idx + 1}.</b> {q.question}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        +{q.marks || 1}m {q.negative_marks ? `(-${q.negative_marks})` : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="px-2.5 py-1.5 rounded-lg border bg-white dark:bg-[#111C31] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <b>{String.fromCharCode(65 + oIdx)}.</b> {opt}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-[11px]">
                      <b>Correct Answer:</b> Option {q.correct_answer}
                      {q.explanation && (
                        <div className="mt-0.5 text-slate-600 dark:text-slate-400">
                          <b>Solution:</b> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TEST TYPE MANAGEMENT MODAL (SUPER ADMIN DYNAMIC CONFIGURATION)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>Dynamic Test Type Classification System</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Activate, deactivate, configure scope rules, or create new test types dynamically.
                </div>
              </div>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Add New Type Form */}
              <form onSubmit={handleSaveTestType} className="p-4 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-xs text-slate-900 dark:text-white">Create New Test Type</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Type Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Concept Mastery Sprint"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Badge Color
                    </label>
                    <select
                      value={newTypeBadgeColor}
                      onChange={(e) => setNewTypeBadgeColor(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="blue">Blue</option>
                      <option value="indigo">Indigo</option>
                      <option value="purple">Purple</option>
                      <option value="emerald">Emerald</option>
                      <option value="amber">Amber</option>
                      <option value="rose">Rose</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of the test structure and purpose"
                    value={newTypeDesc}
                    onChange={(e) => setNewTypeDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeReqChap}
                      onChange={(e) => setNewTypeReqChap(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Requires Chapter</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeReqTopic}
                      onChange={(e) => setNewTypeReqTopic(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Requires Topic</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeReqPyq}
                      onChange={(e) => setNewTypeReqPyq(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>PYQ Metadata</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeReqSection}
                      onChange={(e) => setNewTypeReqSection(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Requires Section</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeIsSpeed}
                      onChange={(e) => setNewTypeIsSpeed(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Speed Test Mode</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeIsPractice}
                      onChange={(e) => setNewTypeIsPractice(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Practice Mode</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingType}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    {savingType ? "Adding..." : "Add Test Type"}
                  </button>
                </div>
              </form>

              {/* Existing Test Types List */}
              <div className="space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white">Active Test Types ({testTypes.length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {testTypes.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({t.slug})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Tests in system: <b>{t.tests_count}</b>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleTypeActive(t)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          t.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {t.is_active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Category Modal Ends */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Dynamic Categories & Subcategories Manager</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Add Category Form */}
              <form onSubmit={handleSaveCategory} className="p-4 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-xs text-slate-900 dark:text-white">Add New Category</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Medical Entrance Examinations"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Category Type
                    </label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="school">School Examinations</option>
                      <option value="engineering_entrance">Engineering Entrance</option>
                      <option value="engineering_branch">Engineering Branch</option>
                      <option value="competitive">Competitive Examinations</option>
                      <option value="corporate">Corporate Placement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Subcategories (One per line)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. NEET - Physics&#10;NEET - Chemistry&#10;NEET - Biology"
                    value={newCatSubs}
                    onChange={(e) => setNewCatSubs(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    {savingCategory ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white">Active Categories ({categories.length})</div>
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Type: {c.category_type} • Tests: {c.tests_count} • Subcategories: {c.subcategories.length}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
