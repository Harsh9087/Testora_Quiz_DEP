"use client";

import React, { useState, useEffect } from "react";
import {
  X,
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
  Building2,
  Sparkles,
  FileQuestion,
  Lightbulb,
  CheckCheck,
  AlertTriangle
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  question_type?: string;
  domain?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  image_url?: string;
  image_caption?: string;
  image_alt?: string;
  diagram_type?: string;
  diagram_position?: "above_question" | "below_question";
  media_attachments?: any[];
  source_details?: {
    source_type?: string;
    source_name?: string;
    exam_name?: string;
    exam_year?: number;
    verification_status?: string;
  };
  passage?: string;
  numerical_tolerance?: number;
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
  image_url?: string;
  image_caption?: string;
  source_details?: any;
}

interface MockTestSubmitResult {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  pass_percentage: number;
  completed_at: string;
  reviews: QuestionReview[];
}

interface MockTestTakingModalProps {
  testId: string;
  testTitle: string;
  companyName: string;
  durationMinutes: number;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function MockTestTakingModal({
  testId,
  testTitle,
  companyName,
  durationMinutes,
  isOpen,
  onClose,
  onCompleted,
}: MockTestTakingModalProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<MockTestSubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect" | "skipped">("all");
  const [zoomDiagramUrl, setZoomDiagramUrl] = useState<string | null>(null);

  // Load test details & questions
  useEffect(() => {
    if (!isOpen || !testId) return;

    setLoading(true);
    setResult(null);
    setAnswers({});
    setMarkedForReview({});
    setCurrentIndex(0);
    setErrorMsg(null);
    setShowMobilePalette(false);
    setShowConfirmSubmit(false);
    setTimeLeftSeconds(durationMinutes * 60);

    const loadTest = async () => {
      try {
        const res = await apiFetch(`/mock-tests/${testId}`, { token });
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          } else {
            setErrorMsg("No questions available for this test yet.");
          }
        } else {
          setErrorMsg("Could not load test questions. Please ensure access is unlocked.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Network error loading test.");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [isOpen, testId, token, durationMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || result || loading || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, result, loading, timeLeftSeconds]);

  if (!isOpen) return null;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (questionId: string, optionLetter: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleClearResponse = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleToggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSafeClose = () => {
    if (!result && questions.length > 0 && Object.keys(answers).length > 0) {
      const confirmExit = window.confirm(
        "You have an assessment in progress. Are you sure you want to exit? Your answers will not be scored until submitted."
      );
      if (!confirmExit) return;
    }
    onClose();
  };

  const executeFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmSubmit(false);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`/mock-tests/${testId}/submit`, {
        method: "POST",
        token,
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit answers.");
      }

      const resData = await res.json();
      setResult(resData);
      if (onCompleted) onCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit test.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const optionLetters = ["A", "B", "C", "D", "E"];
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  // Analytical stats for Result Screen
  const accuracy = result && (result.correct_count + result.incorrect_count > 0)
    ? Math.round((result.correct_count / (result.correct_count + result.incorrect_count)) * 100)
    : 0;

  const subjectBreakdown = result && result.reviews ? (() => {
    const map: Record<string, { total: number; correct: number }> = {};
    result.reviews.forEach((r, idx) => {
      const q = questions[idx];
      const subj = q?.domain || q?.subject || "General";
      if (!map[subj]) map[subj] = { total: 0, correct: 0 };
      map[subj].total += 1;
      if (r.is_correct) map[subj].correct += 1;
    });
    return Object.entries(map).map(([subj, data]) => ({
      subject: subj,
      total: data.total,
      correct: data.correct,
      percentage: Math.round((data.correct / data.total) * 100),
    }));
  })() : [];
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={handleSafeClose}
    >
      <div 
        className="w-full max-w-6xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════ TOP HEADER BAR ═══════ */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#E2E8F0] dark:border-[#263449] bg-slate-50/95 dark:bg-[#15233D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              {companyName.slice(0, 3).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9] truncate">
                {testTitle}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] flex items-center gap-1.5 truncate">
                <span>{companyName} Practice Examination</span>
                <span>•</span>
                <span>{questions.length} Questions</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!result && !loading && (
              <>
                {/* Mobile Palette Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMobilePalette(true)}
                  className="lg:hidden px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111C31] flex items-center gap-1 cursor-pointer"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-blue-600" />
                  <span>Palette ({answeredCount}/{questions.length})</span>
                </button>

                {/* Countdown Timer */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-extrabold border transition-all ${
                  timeLeftSeconds < 120 
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 animate-pulse ring-2 ring-rose-400/30" 
                    : timeLeftSeconds < 300
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleSafeClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Test"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════ CONTENT BODY ═══════ */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {loading && (
            <div className="w-full py-24 text-center space-y-3.5 flex-1">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading standardized examination questions...</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 m-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ═══════ ACTIVE TEST RUNNER (DESKTOP SPLIT / MOBILE SINGLE) ═══════ */}
          {!loading && !result && questions.length > 0 && currentQ && (
            <>
              {/* Center / Main Examination Column */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  
                  {/* Question Meta Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        Question {currentIndex + 1} of {questions.length}
                      </span>

                      {currentQ.question_type && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
                          {currentQ.question_type.replace('_', ' ')}
                        </span>
                      )}

                      {currentQ.domain && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {currentQ.domain}
                        </span>
                      )}

                      {currentQ.source_details?.source_name && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          <span>{currentQ.source_details.source_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {markedForReview[currentQ.id] && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50">
                          Marked for Review
                        </span>
                      )}
                      {answers[currentQ.id] && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Answered</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Optional Passage/Context */}
                  {currentQ.passage && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      <strong className="block not-italic text-[10px] uppercase font-bold text-slate-500 mb-1">Passage / Reference Material:</strong>
                      {currentQ.passage}
                    </div>
                  )}

                  {/* Diagram (Above question if applicable) */}
                  {currentQ.image_url && currentQ.diagram_position !== "below_question" && (
                    <div className="relative group max-w-xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 text-center">
                      <div className="flex items-center justify-between pb-1.5 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{currentQ.diagram_type ? `${currentQ.diagram_type.replace('_', ' ')} Diagram` : "Diagram / Figure"}</span>
                        <button
                          type="button"
                          onClick={() => setZoomDiagramUrl(currentQ.image_url!)}
                          className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Click to Enlarge
                        </button>
                      </div>
                      <img
                        src={currentQ.image_url}
                        alt={currentQ.image_caption || currentQ.image_alt || "Question Diagram"}
                        onClick={() => setZoomDiagramUrl(currentQ.image_url!)}
                        className="max-h-64 sm:max-h-80 w-auto mx-auto object-contain rounded-xl cursor-zoom-in"
                      />
                      {currentQ.image_caption && (
                        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 italic mt-1.5 px-2">
                          {currentQ.image_caption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Question Stem */}
                  <div className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F1F5F9] leading-relaxed">
                    {currentQ.question}
                  </div>

                  {/* Diagram (Below question if applicable) */}
                  {currentQ.image_url && currentQ.diagram_position === "below_question" && (
                    <div className="relative group max-w-xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 text-center">
                      <div className="flex items-center justify-between pb-1.5 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{currentQ.diagram_type ? `${currentQ.diagram_type.replace('_', ' ')} Diagram` : "Diagram / Figure"}</span>
                        <button
                          type="button"
                          onClick={() => setZoomDiagramUrl(currentQ.image_url!)}
                          className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Click to Enlarge
                        </button>
                      </div>
                      <img
                        src={currentQ.image_url}
                        alt={currentQ.image_caption || currentQ.image_alt || "Question Diagram"}
                        onClick={() => setZoomDiagramUrl(currentQ.image_url!)}
                        className="max-h-64 sm:max-h-80 w-auto mx-auto object-contain rounded-xl cursor-zoom-in"
                      />
                      {currentQ.image_caption && (
                        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 italic mt-1.5 px-2">
                          {currentQ.image_caption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Answer Options OR Numerical Input */}
                  {currentQ.question_type === "numerical" ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                      <label className="text-xs font-bold text-blue-950 dark:text-blue-300 block">
                        Numerical Answer Value (e.g. 14.5 or 300):
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                          type="number"
                          step="any"
                          value={answers[currentQ.id] || ""}
                          onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                          placeholder="Enter numerical answer..."
                          className="px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-[#111C31] text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72"
                        />
                        {answers[currentQ.id] && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>Numerical Recorded ({answers[currentQ.id]})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-2">
                      {currentQ.options.map((optText, optIdx) => {
                        const letter = optionLetters[optIdx] || String(optIdx + 1);
                        const isSelected = answers[currentQ.id] === letter;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(currentQ.id, letter)}
                            className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 ring-2 ring-blue-500/20 text-[#1E3A8A] dark:text-[#93C5FD] shadow-xs"
                                : "bg-slate-50/60 dark:bg-[#15233D]/60 border-slate-200 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-800 text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}>
                              {letter}
                            </span>

                            <span className="text-xs sm:text-sm font-semibold pt-1 leading-normal flex-1">
                              {optText}
                            </span>

                            {isSelected && (
                              <span className="p-1 rounded-full bg-blue-600 text-white shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Question Runner Control Toolbar (Section 4) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {answers[currentQ.id] && (
                      <button
                        type="button"
                        onClick={() => handleClearResponse(currentQ.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Clear chosen response"
                      >
                        Clear Response
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMarkForReview(currentQ.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        markedForReview[currentQ.id]
                          ? "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {markedForReview[currentQ.id] ? "Flagged for Review" : "Mark for Review"}
                    </button>

                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Save &amp; Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirmSubmit(true)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Submit Final Test</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Question Palette Sidebar (Section 4) */}
              <div className="hidden lg:flex flex-col w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#15233D]/60 p-4 justify-between">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Question Palette
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click any number to jump directly
                    </p>
                  </div>

                  {/* Status Badges Legend */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-500" />
                      <span>Answered ({answeredCount})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-purple-500" />
                      <span>Review ({markedCount})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-white dark:bg-[#111C31] border border-slate-300 dark:border-slate-700" />
                      <span>Unanswered ({unansweredCount})</span>
                    </span>
                  </div>

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-5 gap-1.5 max-h-[46vh] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const isAns = Boolean(answers[q.id]);
                      const isMarked = Boolean(markedForReview[q.id]);
                      const isCur = idx === currentIndex;

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                            isCur
                              ? "ring-2 ring-blue-500 ring-offset-1 z-10 font-black shadow-xs scale-105"
                              : ""
                          } ${
                            isAns && isMarked
                              ? "bg-purple-600 text-white"
                              : isAns
                              ? "bg-emerald-600 text-white"
                              : isMarked
                              ? "bg-purple-100 text-purple-900 border border-purple-400 dark:bg-purple-950 dark:text-purple-200"
                              : "bg-white dark:bg-[#111C31] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-400"
                          }`}
                        >
                          {idx + 1}
                          {isAns && isMarked && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit Test ({answeredCount}/{questions.length})</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══════ COMPREHENSIVE RESULT & ANALYSIS (SECTION 5) ═══════ */}
          {result && (
            <div className="w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* Scorecard Hero Banner */}
              <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border text-center space-y-4 relative overflow-hidden ${
                result.passed
                  ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-[#111C31] dark:to-[#111C31] border-emerald-300 dark:border-emerald-800"
                  : "bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-950/40 dark:via-[#111C31] dark:to-[#111C31] border-amber-300 dark:border-amber-800"
              }`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-sm ${
                  result.passed
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-white"
                }`}>
                  <Award className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {result.passed ? "Assessment Qualified! 🎓" : "Attempt Completed"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {result.passed
                      ? `Congratulations! You scored above the ${result.pass_percentage}% benchmark for ${companyName}.`
                      : `You scored ${result.percentage}%. The qualification cutoff benchmark is ${result.pass_percentage}%. Review the solutions below and retake to improve!`}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-0.5">
                    Submission recorded on {result.completed_at}
                  </p>
                </div>

                {/* 5 Analytical Summary Metric Cards (Section 5) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 max-w-2xl mx-auto text-left">
                  <div className="p-3 bg-white dark:bg-[#15233D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Score</div>
                    <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {result.score} / {result.max_score}
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#15233D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Percentage</div>
                    <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      {result.percentage}%
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#15233D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</div>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {accuracy}%
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#15233D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Correct / Wrong</div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                      <span className="text-emerald-600">{result.correct_count}</span> / <span className="text-rose-600">{result.incorrect_count}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#15233D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unattempted</div>
                    <div className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
                      {result.unanswered_count} Qs
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject / Domain Breakdown (Section 5) */}
              {subjectBreakdown.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Subject / Domain Performance Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subjectBreakdown.map((sb) => (
                      <div key={sb.subject} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111C31] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span className="truncate">{sb.subject}</span>
                          <span>{sb.correct}/{sb.total}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${sb.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block text-right font-mono">
                          {sb.percentage}% Mastery
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solutions & Explanations with Filter Pills */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-sm sm:text-base text-[#111827] dark:text-[#F1F5F9]">
                      Solutions &amp; Step-by-Step Rationales ({result.reviews.length})
                    </h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setReviewFilter("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reviewFilter === "all"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      All ({result.reviews.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("correct")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reviewFilter === "correct"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                      }`}
                    >
                      Correct ({result.correct_count})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("incorrect")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reviewFilter === "incorrect"
                          ? "bg-rose-600 text-white"
                          : "text-rose-700 dark:text-rose-400 hover:text-rose-800"
                      }`}
                    >
                      Incorrect ({result.incorrect_count})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("skipped")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reviewFilter === "skipped"
                          ? "bg-slate-700 text-white"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Skipped ({result.unanswered_count})
                    </button>
                  </div>
                </div>

                {/* Questions Solution Cards */}
                <div className="space-y-4">
                  {result.reviews
                    .filter((rev) => {
                      if (reviewFilter === "correct") return rev.is_correct;
                      if (reviewFilter === "incorrect") return !rev.is_correct && Boolean(rev.selected_answer);
                      if (reviewFilter === "skipped") return !rev.selected_answer;
                      return true;
                    })
                    .map((rev, rIdx) => (
                      <div
                        key={rev.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug">
                            Q{rIdx + 1}. {rev.question}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                            rev.is_correct
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                              : rev.selected_answer
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                          }`}>
                            {rev.is_correct ? "✓ Correct" : rev.selected_answer ? "✗ Incorrect" : "○ Skipped"}
                          </span>
                        </div>

                        {/* Review Diagram if present */}
                        {rev.image_url && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2 text-center max-w-sm">
                            <img
                              src={rev.image_url}
                              alt={rev.image_caption || "Question Diagram"}
                              onClick={() => setZoomDiagramUrl(rev.image_url!)}
                              className="max-h-48 w-auto mx-auto object-contain rounded-lg cursor-zoom-in"
                            />
                            {rev.image_caption && (
                              <p className="text-[10px] text-slate-500 mt-1 italic">{rev.image_caption}</p>
                            )}
                          </div>
                        )}

                        {/* Review Source Attribution */}
                        {rev.source_details?.source_name && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Source: <strong>{rev.source_details.source_name}</strong> {rev.source_details.exam_year ? `(${rev.source_details.exam_year})` : ""}</span>
                          </div>
                        )}

                        {/* Options breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {rev.options.map((opt, oIdx) => {
                            const letter = optionLetters[oIdx] || String(oIdx + 1);
                            const isUserChoice = rev.selected_answer === letter;
                            const isCorrectOpt = rev.correct_answer === letter;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                  isCorrectOpt
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold"
                                    : isUserChoice
                                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200"
                                    : "bg-slate-50 dark:bg-[#111C31] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  isCorrectOpt
                                    ? "bg-emerald-600 text-white"
                                    : isUserChoice
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}>
                                  {letter}
                                </span>
                                <span className="truncate flex-1">{opt}</span>
                                {isCorrectOpt && <span className="text-[10px] text-emerald-600 font-black shrink-0">Correct</span>}
                                {isUserChoice && !isCorrectOpt && <span className="text-[10px] text-rose-600 font-black shrink-0">Your Choice</span>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Callout */}
                        {rev.explanation && (
                          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Verified Examination Rationale</span>
                            </div>
                            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                              {rev.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════ FOOTER ACTIONS BAR (AFTER TEST SUBMITTED) ═══════ */}
        {result && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-[#E2E8F0] dark:border-[#263449] bg-slate-50/95 dark:bg-[#15233D] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setMarkedForReview({});
                setCurrentIndex(0);
                setTimeLeftSeconds(durationMinutes * 60);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Practice Paper</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Done &amp; Return to Library
            </button>
          </div>
        )}
      </div>

      {/* ═══════ MOBILE QUESTION PALETTE MODAL / DRAWER (SECTION 4) ═══════ */}
      {showMobilePalette && !result && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setShowMobilePalette(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-[#111C31] rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-blue-600" />
                <span>Question Palette ({answeredCount}/{questions.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAns = Boolean(answers[q.id]);
                const isMarked = Boolean(markedForReview[q.id]);
                const isCur = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobilePalette(false);
                    }}
                    className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                      isCur
                        ? "ring-2 ring-blue-500 scale-105 z-10"
                        : ""
                    } ${
                      isAns && isMarked
                        ? "bg-purple-600 text-white"
                        : isAns
                        ? "bg-emerald-600 text-white"
                        : isMarked
                        ? "bg-purple-100 text-purple-900 border border-purple-400 dark:bg-purple-950 dark:text-purple-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close Palette
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobilePalette(false);
                  setShowConfirmSubmit(true);
                }}
                className="w-1/2 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SUBMISSION CONFIRMATION DIALOG (SECTION 4) ═══════ */}
      {showConfirmSubmit && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowConfirmSubmit(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Ready to Submit Your Assessment?
              </h3>
              <p className="text-xs text-slate-500">
                Review your response summary before final evaluation:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-slate-50 dark:bg-[#15233D] border border-slate-200/80 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Answered</span>
                <span className="text-base font-black text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unanswered</span>
                <span className="text-base font-black text-slate-500">{unansweredCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Flagged</span>
                <span className="text-base font-black text-purple-600">{markedCount}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={executeFinalSubmit}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Scoring..." : "Yes, Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ FULL-RESOLUTION DIAGRAM ZOOM MODAL ═══════ */}
      {zoomDiagramUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomDiagramUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#111C31] rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomDiagramUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer shadow-md"
              title="Close Diagram"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">High-Resolution Diagram Inspection</div>
            <div className="overflow-auto max-h-[80vh] w-full flex items-center justify-center">
              <img
                src={zoomDiagramUrl}
                alt="High-resolution diagram"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
