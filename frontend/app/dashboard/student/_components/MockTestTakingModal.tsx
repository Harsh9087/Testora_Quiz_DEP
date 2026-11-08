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
  Building2
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  domain?: string;
}

interface QuestionReview {
  id: string;
  question: string;
  options: string[];
  selected_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
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
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<MockTestSubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load test details & questions
  useEffect(() => {
    if (!isOpen || !testId) return;

    setLoading(true);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setErrorMsg(null);
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
          handleSubmitTest();
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

  const handleSubmitTest = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-[#263449] bg-slate-50/80 dark:bg-[#15233D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold text-xs shrink-0">
              {companyName.slice(0, 3).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#F1F5F9] truncate">
                {testTitle}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                {companyName} Placement Qualifier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!result && !loading && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                timeLeftSeconds < 180 
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 animate-pulse" 
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Test"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Preparing test questions & options...</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Test Questions Runner */}
          {!loading && !result && questions.length > 0 && currentQ && (
            <div className="space-y-6">
              {/* Question Navigation Palette */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((q, idx) => {
                    const isAnswered = Boolean(answers[q.id]);
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#2563EB] text-white ring-2 ring-blue-400/40"
                            : isAnswered
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <div className="text-sm sm:text-base font-semibold text-[#111827] dark:text-[#F1F5F9] leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((optText, optIdx) => {
                    const letter = optionLetters[optIdx] || String(optIdx + 1);
                    const isSelected = answers[currentQ.id] === letter;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, letter)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/90 dark:bg-blue-950/50 border-[#2563EB] ring-2 ring-blue-500/20 text-[#1E3A8A] dark:text-[#93C5FD]"
                            : "bg-slate-50/50 dark:bg-[#15233D]/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#2563EB] text-white"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm font-medium pt-0.5 leading-normal flex-1">
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Test Completed Scorecard & Solution Review */}
          {result && (
            <div className="space-y-6 animate-fadeIn">
              {/* Scorecard Hero Banner */}
              <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                result.passed
                  ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80"
                  : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80"
              }`}>
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  result.passed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                }`}>
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {result.passed ? "Assessment Passed! 🎓" : "Attempt Completed"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Completed on {result.completed_at}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-lg mx-auto">
                  <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 font-semibold">Your Score</div>
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {result.score} / {result.max_score}
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 font-semibold">Percentage</div>
                    <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                      {result.percentage}%
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 font-semibold">Correct</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {result.correct_count} Qs
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 font-semibold">Benchmark</div>
                    <div className="text-lg font-black text-slate-700 dark:text-slate-300">
                      {result.pass_percentage}% Pass
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution & Explanation Review Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-[#111827] dark:text-[#F1F5F9] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Comprehensive Solutions & Explanations ({result.reviews.length})</span>
                </h4>

                <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {result.reviews.map((rev, rIdx) => (
                    <div key={rev.id} className="pt-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Q{rIdx + 1}. {rev.question}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          rev.is_correct
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : rev.selected_answer
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {rev.is_correct ? "✓ Correct" : rev.selected_answer ? "✗ Incorrect" : "○ Skipped"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="text-slate-500">
                          Your choice: <strong className={rev.is_correct ? "text-emerald-600" : "text-rose-600"}>{rev.selected_answer || "None"}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Correct: <strong>Option {rev.correct_answer}</strong>
                        </span>
                      </div>

                      {rev.explanation && (
                        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300">
                          <strong className="text-blue-700 dark:text-blue-400">Explanation: </strong>
                          {rev.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] dark:border-[#263449] bg-slate-50/80 dark:bg-[#15233D] flex items-center justify-between gap-3 shrink-0">
          {!result ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitTest}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Grading..." : "Submit Test"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentIndex(0);
                  setTimeLeftSeconds(durationMinutes * 60);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
