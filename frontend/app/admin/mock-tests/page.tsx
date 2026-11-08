"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Building2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Coins,
  Search,
  Tag,
  X,
  AlertCircle,
  HelpCircle,
  Play
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AdminMockTest {
  id: string;
  company_name: string;
  company_slug: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  price_inr: number;
  is_free: boolean;
  duration_minutes: number;
  total_questions: number;
  pass_percentage: number;
  attempts_count: number;
  is_active: boolean;
}

export default function AdminMockTestsPage() {
  const { token } = useAuthStore();
  const [tests, setTests] = useState<AdminMockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AdminMockTest | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Aptitude & Cognitive");
  const [difficulty, setDifficulty] = useState("Medium");
  const [priceInr, setPriceInr] = useState(9);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passPercentage, setPassPercentage] = useState(50);
  const [questionsRaw, setQuestionsRaw] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }, [token]);

  const handleOpenCreate = () => {
    setEditingTest(null);
    setCompanyName("TCS");
    setTitle("");
    setDescription("");
    setCategory("Aptitude & Cognitive");
    setDifficulty("Medium");
    setPriceInr(9);
    setDurationMinutes(30);
    setPassPercentage(50);
    setQuestionsRaw(
      JSON.stringify(
        [
          {
            id: "q1",
            question: "Sample Aptitude Problem: Find the value of X when 2X + 10 = 30.",
            options: ["5", "10", "15", "20"],
            correct_answer: "B",
            explanation: "2X = 30 - 10 = 20 -> X = 10."
          }
        ],
        null,
        2
      )
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !title.trim()) {
      setFormError("Company Name and Title are required.");
      return;
    }

    let parsedQuestions: any[] = [];
    if (questionsRaw.trim()) {
      try {
        parsedQuestions = JSON.parse(questionsRaw);
        if (!Array.isArray(parsedQuestions)) {
          setFormError("Questions must be a JSON array of question objects.");
          return;
        }
      } catch (err: any) {
        setFormError(`Invalid JSON syntax in questions: ${err.message}`);
        return;
      }
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        company_name: companyName.trim(),
        company_slug: companyName.toLowerCase().trim().replace(/[^a-z0-9]/g, "_"),
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        price_inr: Number(priceInr) || 0,
        duration_minutes: Number(durationMinutes) || 30,
        total_questions: parsedQuestions.length || 10,
        pass_percentage: Number(passPercentage) || 50,
        questions: parsedQuestions,
        is_active: true
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
        throw new Error(err.detail || "Failed to save placement test.");
      }

      setIsModalOpen(false);
      fetchTests();
    } catch (err: any) {
      setFormError(err.message || "Save failed.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm("Are you sure you want to remove this placement test?")) return;
    try {
      const res = await apiFetch(`/mock-tests/admin/${testId}`, {
        method: "DELETE",
        token
      });
      if (res.ok) {
        setTests((prev) => prev.filter((t) => t.id !== testId));
      }
    } catch {}
  };

  const handleToggleActive = async (test: AdminMockTest) => {
    try {
      const res = await apiFetch(`/mock-tests/admin/${test.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ is_active: !test.is_active })
      });
      if (res.ok) {
        setTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, is_active: !t.is_active } : t))
        );
      }
    } catch {}
  };

  const filteredTests = tests.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.company_name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold mb-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Corporate Placement Modules</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Company Placement & Mock Tests Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, price (Free, ₹9, ₹12), and manage corporate recruitment tests for TCS, Infosys, HCLTech, Wipro, etc.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Placement Test</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-semibold">Total Tests</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{tests.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-semibold">Free Mocks</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {tests.filter((t) => t.is_free).length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-semibold">Paid Mocks (₹9 / ₹12)</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {tests.filter((t) => !t.is_free).length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-[#111C31] rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-semibold">Total Attempts</div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {tests.reduce((acc, t) => acc + (t.attempts_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter tests by title, company, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#15233D] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Fee (INR)</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading placement tests...
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No placement tests found. Click "Add New Placement Test" to create one.
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[11px]">
                        {test.company_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {test.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {test.category}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {test.is_free ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          ₹{test.price_inr}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {test.duration_minutes} mins
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {test.total_questions} Qs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(test)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          test.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {test.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete test"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Add Corporate Placement Test</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TCS, Infosys, HCLTech, Wipro"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Per Test Fee (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for free, or 9, 12, etc."
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Set 0 for 100% Free Access; 9 or 12 for paid Razorpay checkout.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TCS NQT 2026 - Numerical & Reasoning Qualifier"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aptitude & Cognitive"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Percentage
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of syllabus, test patterns, or job roles covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#15233D] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Questions JSON Array
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Format: [&#123; id, question, options, correct_answer, explanation &#125;]</span>
                </div>
                <textarea
                  rows={7}
                  value={questionsRaw}
                  onChange={(e) => setQuestionsRaw(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none"
                  placeholder="Paste questions JSON here..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save Placement Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
