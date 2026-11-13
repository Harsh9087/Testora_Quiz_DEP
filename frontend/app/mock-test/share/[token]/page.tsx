"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Check,
  ShieldCheck,
  Share2,
  Copy,
  Sparkles,
  ExternalLink,
  Lock,
  User,
  LogIn,
  AlertTriangle,
  GraduationCap,
  FileQuestion,
  Lightbulb,
  CheckCheck,
  ChevronRight,
  Send,
  Flag,
  Calendar,
  Layers,
  Timer
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface PublicMockTestDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  subject?: string;
  class_level?: string;
  difficulty: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  negative_marking: number;
  instructions?: string;
  share_access_type: "assigned_only" | "anyone_with_link";
  login_required: boolean;
  is_link_active: boolean;
  start_time?: string;
  end_time?: string;
  attempt_limit: number;
  results_visibility: "immediate" | "after_release";
  are_results_released: boolean;
  creator_name?: string;
  creator_role?: string;
  can_attempt: boolean;
  ineligibility_reason?: string;
  attempts_count?: number;
}

interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  question_type?: string;
  domain?: string;
  marks?: number;
  negative_marks?: number;
  passage?: string;
}

interface QuestionReview {
  id: string;
  question: string;
  options: string[];
  selected_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  question_type?: string;
}

interface SubmitResponse {
  success: boolean;
  message?: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  are_results_released: boolean;
  results_visibility: string;
  reviews: QuestionReview[];
}

export default function SharedMockTestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { fullName, token: authToken } = useAuthStore();

  const [loadingTest, setLoadingTest] = useState(true);
  const [test, setTest] = useState<PublicMockTestDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guest details if login not required
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Exam taking state
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [startingExam, setStartingExam] = useState(false);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review filters on results screen
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect" | "skipped">("all");

  // Fetch test briefing
  const fetchTestBriefing = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingTest(true);
      setErrorMsg(null);
      const res = await apiFetch(`/mock-tests/share/${token}`, {
        token: authToken || undefined,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || "Unable to load this mock test. Link may be invalid or expired.");
        return;
      }

      const data: PublicMockTestDetail = await res.json();
      setTest(data);
      setTimeLeftSeconds(data.duration_minutes * 60);

      // Restore cached answers if any
      try {
        const cached = localStorage.getItem(`testora_shared_mock_${token}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            setAnswers(parsed);
          }
        }
      } catch {}
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to connect to the examination server.");
    } finally {
      setLoadingTest(false);
    }
  }, [token, authToken]);

  useEffect(() => {
    fetchTestBriefing();
  }, [fetchTestBriefing]);

  // Autosave answers to localStorage
  useEffect(() => {
    if (isExamStarted && token && Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(`testora_shared_mock_${token}`, JSON.stringify(answers));
      } catch {}
    }
  }, [answers, isExamStarted, token]);

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || submitResult) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time expires
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, submitResult]);

  const handleStartExam = async () => {
    if (!test) return;

    if (test.login_required && !authToken) {
      router.push(`/login?redirect=/mock-test/share/${token}`);
      return;
    }

    if (!authToken && (!guestName.trim() || !guestEmail.trim())) {
      alert("Please provide your Name and Email so your instructor can identify your submission.");
      return;
    }

    try {
      setStartingExam(true);
      const res = await apiFetch(`/mock-tests/share/${token}/start`, {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({
          student_name: authToken ? (fullName || "Student") : guestName.trim(),
          student_email: authToken ? "" : guestEmail.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Unable to start exam attempt.");
        return;
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setTimeLeftSeconds((data.duration_minutes || test.duration_minutes) * 60);
      setIsExamStarted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to start test attempt.");
    } finally {
      setStartingExam(false);
    }
  };

  const handleSelectOption = (questionId: string, optionText: string) => {
    setAnswers((prev) => {
      if (prev[questionId] === optionText) {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      }
      return { ...prev, [questionId]: optionText };
    });
  };

  const handleToggleReview = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!test || submitting) return;

    try {
      setSubmitting(true);
      setShowConfirmSubmit(false);

      const elapsed = Math.max(1, test.duration_minutes * 60 - timeLeftSeconds);

      const res = await apiFetch(`/mock-tests/share/${token}/submit`, {
        method: "POST",
        token: authToken || undefined,
        body: JSON.stringify({
          answers,
          time_taken_seconds: elapsed,
          student_name: authToken ? (fullName || "Student") : guestName.trim(),
          student_email: authToken ? "" : guestEmail.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Error submitting test responses.");
        return;
      }

      const data: SubmitResponse = await res.json();
      setSubmitResult(data);
      try {
        localStorage.removeItem(`testora_shared_mock_${token}`);
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to submit responses.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!test || typeof window === "undefined") return;
    const shareUrl = window.location.href;
    const message = `Hello! Your Mock Test is ready.\n\nTest: ${test.title}\nDuration: ${test.duration_minutes} mins\nStart your test here: ${shareUrl}\n\nBest of luck!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Helper formatting for timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (loadingTest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Loading Mock Test...
        </h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to Testora Examination Portal</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ERROR / INVALID LINK STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (errorMsg || !test) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Mock Test Unavailable
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {errorMsg || "The requested mock test link does not exist or has been revoked."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
            >
              Log In to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. RESULT SCREEN (POST SUBMISSION)
  // ─────────────────────────────────────────────────────────────────────────────
  if (submitResult) {
    const filteredReviews = submitResult.reviews?.filter((r) => {
      if (reviewFilter === "correct") return r.is_correct;
      if (reviewFilter === "incorrect") return !r.is_correct && !!r.selected_answer;
      if (reviewFilter === "skipped") return !r.selected_answer;
      return true;
    }) || [];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              T
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {test.title}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Examination Completed • Performance Report
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Share Link"}</span>
            </button>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
            >
              Home
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
          {/* If results withheld by instructor */}
          {!submitResult.are_results_released && test.results_visibility === "after_release" ? (
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 text-center shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Test Submitted Successfully!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your answers have been securely recorded. The instructor has configured this mock test to release scores and detailed answer keys after review.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  Time Taken: {Math.floor(submitResult.time_taken_seconds / 60)}m {submitResult.time_taken_seconds % 60}s
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  Status: Recorded
                </span>
              </div>
            </div>
          ) : (
            /* Full Performance Report */
            <>
              {/* Scorecard Hero */}
              <div className="bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Award className="w-3.5 h-3.5" />
                      <span>{submitResult.passed ? "Test Passed" : "Attempt Finished"}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Your Score: <span className="text-blue-600 dark:text-blue-400">{submitResult.score}</span>
                      <span className="text-slate-400 text-xl font-medium"> / {submitResult.max_score}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Overall Accuracy: <strong className="text-slate-800 dark:text-slate-200 font-bold">{submitResult.percentage.toFixed(1)}%</strong> • Completed in {Math.floor(submitResult.time_taken_seconds / 60)}m {submitResult.time_taken_seconds % 60}s
                    </p>
                  </div>

                  {/* Circular Percentage Badge */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border-4 border-blue-500 shadow-md">
                    <div className="text-center">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {Math.round(submitResult.percentage)}%
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {submitResult.passed ? "Passed" : "Score"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-2xl p-3 text-center">
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {submitResult.correct_count}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Correct
                    </div>
                  </div>
                  <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 rounded-2xl p-3 text-center">
                    <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                      {submitResult.incorrect_count}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-rose-800 dark:text-rose-300 mt-0.5">
                      Incorrect
                    </div>
                  </div>
                  <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-center">
                    <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                      {submitResult.unanswered_count}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      Skipped
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Review Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-blue-600" />
                    <span>Detailed Question Review</span>
                  </h3>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    {(["all", "correct", "incorrect", "skipped"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setReviewFilter(mode)}
                        className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                          reviewFilter === mode
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Cards */}
                <div className="space-y-3.5">
                  {filteredReviews.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.is_correct
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : item.selected_answer
                                ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {item.is_correct ? "Correct" : item.selected_answer ? "Incorrect" : "Skipped"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {item.question}
                      </p>

                      {/* Options Review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {item.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = opt === item.correct_answer;
                          const isSelected = opt === item.selected_answer;

                          let cardStyle = "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                          if (isCorrect) {
                            cardStyle = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 font-bold";
                          } else if (isSelected && !isCorrect) {
                            cardStyle = "bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-600 text-rose-800 dark:text-rose-200 line-through";
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-white/70 dark:bg-black/30 flex items-center justify-center text-[10px] font-black shrink-0">
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shrink-0">
                                  Correct
                                </span>
                              )}
                              {isSelected && !isCorrect && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold">Explanation: </strong>
                            {item.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              Explore More Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LIVE EXAMINATION RUNNER HUD
  // ─────────────────────────────────────────────────────────────────────────────
  if (isExamStarted && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isAnswered = !!answers[currentQ?.id];
    const isMarked = !!markedForReview[currentQ?.id];

    const answeredCount = Object.keys(answers).length;
    const markedCount = Object.keys(markedForReview).filter((k) => markedForReview[k]).length;
    const unansweredCount = questions.length - answeredCount;

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col select-none">
        {/* Sticky Exam Top Bar */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                T
              </span>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {test.title}
                </h1>
                <p className="text-[10px] text-slate-500 truncate">
                  Question {currentIndex + 1} of {questions.length} • {test.subject || "General"}
                </p>
              </div>
            </div>

            {/* Timer & Submit */}
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-black ${
                  timeLeftSeconds < 300
                    ? "bg-rose-50 dark:bg-rose-950/80 border-rose-300 text-rose-600 dark:text-rose-400 animate-pulse"
                    : "bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Examination Viewport */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Question Display Column (3 cols on desktop) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-5">
              {/* Question Header & Meta */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black">
                    Q{currentIndex + 1}
                  </span>
                  {currentQ?.domain && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {currentQ.domain}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    +{currentQ?.marks || 4} Marks
                  </span>
                  {test.negative_marking > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                      -{test.negative_marking} Neg
                    </span>
                  )}
                </div>
              </div>

              {/* Passage if any */}
              {currentQ?.passage && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic">
                  {currentQ.passage}
                </div>
              )}

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ?.question}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ?.options?.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = answers[currentQ.id] === opt;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-sm"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {letter}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-semibold ${
                            isSelected ? "text-blue-950 dark:text-blue-100 font-bold" : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {opt}
                        </span>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleReview(currentQ.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isMarked
                        ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isMarked ? "Marked for Review" : "Mark for Review"}</span>
                  </button>

                  {isAnswered && (
                    <button
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, answers[currentQ.id])}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar (1 col on desktop) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Question Palette
              </h3>

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Review ({markedCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
              </div>

              {/* Question Number Badges Grid */}
              <div className="grid grid-cols-5 gap-1.5 pt-2 max-h-64 overflow-y-auto">
                {questions.map((q, qIdx) => {
                  const isCurrent = qIdx === currentIndex;
                  const answered = !!answers[q.id];
                  const marked = !!markedForReview[q.id];

                  let pillColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                  if (answered && marked) {
                    pillColor = "bg-amber-500 text-white";
                  } else if (marked) {
                    pillColor = "bg-purple-600 text-white";
                  } else if (answered) {
                    pillColor = "bg-emerald-600 text-white";
                  }

                  return (
                    <button
                      key={q.id || qIdx}
                      type="button"
                      onClick={() => setCurrentIndex(qIdx)}
                      className={`h-8 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center relative ${pillColor} ${
                        isCurrent ? "ring-2 ring-blue-500 ring-offset-2 scale-105 z-10" : "hover:opacity-80"
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Final Submit Trigger */}
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Confirm Submission?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you ready to submit your test? You will not be able to change your answers after submission.
                </p>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div>
                  <div className="text-emerald-600 text-base font-black">{answeredCount}</div>
                  <div className="text-slate-500 text-[10px]">Answered</div>
                </div>
                <div>
                  <div className="text-purple-600 text-base font-black">{markedCount}</div>
                  <div className="text-slate-500 text-[10px]">Marked</div>
                </div>
                <div>
                  <div className="text-slate-500 text-base font-black">{unansweredCount}</div>
                  <div className="text-slate-500 text-[10px]">Skipped</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitExam(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? "Submitting..." : "Yes, Submit Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TEST BRIEFING / LANDING SCREEN (START MOCK TEST)
  // ─────────────────────────────────────────────────────────────────────────────
  const isExpired = test.end_time && new Date(test.end_time) < new Date();
  const isScheduledLater = test.start_time && new Date(test.start_time) > new Date();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080E1E] text-slate-900 dark:text-slate-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Pill */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              T
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Testora <span className="text-blue-600">Quiz</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Main Briefing Card */}
        <div className="bg-white dark:bg-[#0D1830] border-2 border-blue-500/30 rounded-3xl p-6 sm:p-9 shadow-xl space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-black uppercase tracking-wider">
                {test.category || "Mock Test"}
              </span>
              {test.subject && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  {test.subject}
                </span>
              )}
              {test.class_level && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                  {test.class_level}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                100% Free
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {test.title}
            </h1>

            {test.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {test.description}
              </p>
            )}

            {test.creator_name && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                Instructor / Creator: <span className="text-slate-800 dark:text-slate-200 font-bold">{test.creator_name}</span>
              </p>
            )}
          </div>

          {/* Test Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Duration</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {test.duration_minutes} Mins
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <FileQuestion className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Questions</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {test.total_questions} Questions
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Marks</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {test.total_marks} Marks
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Passing Marks</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {test.passing_marks} Marks
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Exam Instructions</span>
            </h3>
            <p className="text-xs text-blue-950/80 dark:text-blue-200/80 leading-relaxed whitespace-pre-line">
              {test.instructions ||
                "1. Each question carries marks as indicated. Negative marking applies if configured.\n2. Do not refresh or close the tab while attempting the test.\n3. The test will auto-submit when the countdown timer reaches zero.\n4. Ensure a stable internet connection."}
            </p>
          </div>

          {/* Guest identification if no login required and not logged in */}
          {!authToken && !test.login_required && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Candidate Identification
              </h4>
              <p className="text-[11px] text-slate-500">
                Enter your details so your teacher can track your score on their dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Your Full Name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Your Email Address *"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Eligibility or Ineligibility Banners */}
          {isExpired ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
              This mock test closed on {new Date(test.end_time!).toLocaleString()}. No further attempts are accepted.
            </div>
          ) : isScheduledLater ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold text-center">
              This mock test is scheduled to start on {new Date(test.start_time!).toLocaleString()}. Please return then.
            </div>
          ) : test.login_required && !authToken ? (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 space-y-3 text-center">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                Instructor requires student authentication to attempt this test.
              </p>
              <Link
                href={`/login?redirect=/mock-test/share/${token}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In with Student Account</span>
              </Link>
            </div>
          ) : test.can_attempt === false ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
              {test.ineligibility_reason || "You are not eligible to attempt this mock test."}
            </div>
          ) : (
            /* Start Test Action */
            <div className="pt-2">
              <button
                type="button"
                disabled={startingExam}
                onClick={handleStartExam}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{startingExam ? "Preparing Examination..." : "Start Mock Test Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
