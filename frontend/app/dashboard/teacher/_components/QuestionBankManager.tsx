"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, RefreshCw, X, ChevronDown, Layers } from "lucide-react";
import { apiFetch } from "../../../../lib/api";
import { useAuthStore } from "../../../../store/authStore";
import { useToast } from "../../../../components/Toast";
import MathText from "../../../../components/MathText";

export default function QuestionBankManager() {
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [showAddBankModal, setShowAddBankModal] = useState(false);

  // Form states for creating bank question
  const [newBankText, setNewBankText] = useState("");
  const [newBankType, setNewBankType] = useState("MCQ");
  const [newBankDiff, setNewBankDiff] = useState("medium");
  const [newBankOptions, setNewBankOptions] = useState(["", "", "", ""]);
  const [newBankCorrect, setNewBankCorrect] = useState("");

  const fetchBankQuestions = async (isManual = false) => {
    if (!token) return;
    setLoadingBank(true);
    try {
      let url = "/kb/questions/bank";
      const params = new URLSearchParams();
      if (bankSearch) params.append("search", bankSearch);
      if (bankDifficulty) params.append("difficulty", bankDifficulty);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiFetch(url, { token });
      if (res.ok) {
        const data = await res.json();
        setBankQuestions(Array.isArray(data) ? data : []);
        if (isManual) {
          showToast("Question Bank refreshed", "success");
        }
      } else {
        if (isManual) {
          showToast("Could not refresh question bank", "error");
        }
      }
    } catch (err) {
      console.warn("Question bank fetch notice:", err);
      if (isManual) {
        showToast("Network error while fetching question bank", "error");
      }
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBankQuestions();
    }
  }, [token]);

  const handleCreateBankQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        question_text: newBankText,
        question_type: newBankType,
        difficulty: newBankDiff,
        correct_answer: newBankCorrect,
      };
      if (newBankType === "MCQ") {
        payload.options_json = JSON.stringify(newBankOptions.filter((o) => o.trim() !== ""));
      }

      const res = await apiFetch("/kb/questions/bank", {
        token,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Question added to Question Bank!", "success");
        setShowAddBankModal(false);
        setNewBankText("");
        setNewBankCorrect("");
        setNewBankOptions(["", "", "", ""]);
        fetchBankQuestions();
      } else {
        showToast("Failed to add question to bank", "error");
      }
    } catch {
      showToast("Network error while adding question", "error");
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl shadow-sm transition-all overflow-hidden">
      
      {/* ─── DROPDOWN ACCORDION HEADER ─── */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]/50 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#111827] dark:text-[#F1F5F9]">
                Question Bank Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {bankQuestions.length} Questions
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] mt-0.5">
              Browse, filter, and manage reusable questions across curriculum topics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddBankModal(true);
            }}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>

          <div className={`p-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] transition-transform duration-200 ${isExpanded ? "rotate-180 bg-[#F1F5F9] dark:bg-[#17243A]" : ""}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* ─── DROPDOWN BODY CONTENT ─── */}
      {isExpanded && (
        <div className="p-5 pt-0 space-y-5 border-t border-[#E2E8F0] dark:border-[#263449] animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 sm:pt-4">
            <input
              type="text"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBankQuestions()}
              placeholder="Search question text..."
              className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
            />

            <select
              value={bankDifficulty}
              onChange={(e) => {
                setBankDifficulty(e.target.value);
                fetchBankQuestions();
              }}
              className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <button
              onClick={() => fetchBankQuestions(true)}
              className="px-4 py-2 bg-[#F1F5F9] dark:bg-[#17243A] hover:bg-[#E2E8F0] dark:hover:bg-[#263449] text-[#111827] dark:text-[#F1F5F9] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingBank ? "animate-spin" : ""}`} />
              <span>Filter Library</span>
            </button>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {bankQuestions.length === 0 ? (
              <div className="bg-[#F8FAFC]/50 dark:bg-[#17243A]/50 border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-8 text-center text-xs text-[#64748B] dark:text-[#A3B1C6]">
                No questions found in bank matching your filters. Add questions using the button above.
              </div>
            ) : (
              bankQuestions.map((q, idx) => {
                let optionsList: string[] = [];
                try {
                  optionsList = q.options_json ? JSON.parse(q.options_json) : [];
                } catch {}

                return (
                  <div
                    key={q.id || idx}
                    className="bg-[#FFFFFF] dark:bg-[#17243A]/40 border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-semibold uppercase tracking-wider">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {q.subject_name || "General"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            {q.difficulty || "medium"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                            {q.question_type}
                          </span>
                          {q.topic && <span className="text-[#64748B] dark:text-[#A3B1C6] font-normal">Topic: {q.topic}</span>}
                        </div>
                        <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9] pt-1">
                          <MathText text={`${idx + 1}. ${q.question_text}`} />
                        </h3>
                      </div>
                    </div>

                    {/* Options list if MCQ */}
                    {optionsList.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {optionsList.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`px-3 py-1.5 rounded-lg text-xs border ${
                              opt === q.correct_answer || String.fromCharCode(65 + oIdx) === q.correct_answer
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold"
                                : "bg-[#F8FAFC] dark:bg-[#17243A] border-[#E2E8F0] dark:border-[#263449] text-[#111827] dark:text-[#F1F5F9]"
                            }`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            <MathText text={opt} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Bank Question Modal */}
      {showAddBankModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
          onClick={() => setShowAddBankModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl max-w-lg w-full mx-3 sm:mx-auto p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#263449] pb-3 shrink-0">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">Add Custom Question to Bank</h3>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="text-[#64748B] hover:text-[#111827] dark:hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBankQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#111827] dark:text-[#F1F5F9]">Question Text</label>
                <textarea
                  required
                  value={newBankText}
                  onChange={(e) => setNewBankText(e.target.value)}
                  placeholder="Enter question wording..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[#111827] dark:text-[#F1F5F9]">Type</label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="True_False">True / False</option>
                    <option value="Subjective">Subjective / Written</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#111827] dark:text-[#F1F5F9]">Difficulty</label>
                  <select
                    value={newBankDiff}
                    onChange={(e) => setNewBankDiff(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {newBankType === "MCQ" && (
                <div className="space-y-2">
                  <label className="block font-semibold text-[#111827] dark:text-[#F1F5F9]">Options</label>
                  {newBankOptions.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...newBankOptions];
                        copy[oIdx] = e.target.value;
                        setNewBankOptions(copy);
                      }}
                      className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-[#111827] dark:text-[#F1F5F9]">Correct Answer</label>
                <input
                  type="text"
                  required
                  value={newBankCorrect}
                  onChange={(e) => setNewBankCorrect(e.target.value)}
                  placeholder="e.g. Option text or A/B/C/D"
                  className="w-full bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-lg p-2 text-xs text-[#111827] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] hover:bg-[#F1F5F9] dark:hover:bg-[#17243A] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
