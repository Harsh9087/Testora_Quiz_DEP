"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  X,
  UploadCloud,
  Coins,
  Sparkles,
  Loader2,
  Building2,
  Code2,
  Monitor,
  Cloud,
  FolderOpen,
  FileText,
  AlertCircle
} from "lucide-react";
import { apiFetch, getApiV1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AdminMaterial {
  id: string;
  title: string;
  description?: string;
  category: string;
  category_display: string;
  file_url: string;
  file_type: string;
  file_size_mb: number;
  pages_count: number;
  is_paid: boolean;
  credit_cost: number;
  badge_text?: string;
  badge_color?: string;
  is_published: boolean;
  downloads_count: number;
  views_count: number;
  created_at?: string;
}

const CATEGORY_OPTIONS = [
  { slug: "company_notes", name: "Company Notes (TCS, Wipro & More)" },
  { slug: "dsa", name: "DSA & Problem Solving" },
  { slug: "web_development", name: "Web Development" },
  { slug: "cloud_computing", name: "Cloud Computing" },
  { slug: "all", name: "General / Other Study Materials" },
];

export default function AdminStudyMaterialsPage() {
  const { token } = useAuthStore();
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("company_notes");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileType, setFormFileType] = useState("pdf");
  const [formFileSize, setFormFileSize] = useState(2.5);
  const [formPages, setFormPages] = useState(25);
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formCreditCost, setFormCreditCost] = useState(49);
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formBadgeColor, setFormBadgeColor] = useState("purple");
  const [formIsPublished, setFormIsPublished] = useState(true);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (paidFilter === "free") params.append("is_paid", "false");
      if (paidFilter === "paid") params.append("is_paid", "true");
      if (search.trim()) params.append("search", search.trim());

      const res = await apiFetch(`/study-materials/?${params.toString()}`, { token });
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [categoryFilter, paidFilter, search]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("company_notes");
    setFormFileUrl("");
    setFormFileType("pdf");
    setFormFileSize(2.5);
    setFormPages(25);
    setFormIsPaid(false);
    setFormCreditCost(49);
    setFormBadgeText("NEW");
    setFormBadgeColor("purple");
    setFormIsPublished(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (mat: AdminMaterial) => {
    setEditingId(mat.id);
    setFormTitle(mat.title);
    setFormDescription(mat.description || "");
    setFormCategory(mat.category);
    setFormFileUrl(mat.file_url || "");
    setFormFileType(mat.file_type || "pdf");
    setFormFileSize(mat.file_size_mb || 2.5);
    setFormPages(mat.pages_count || 25);
    setFormIsPaid(mat.is_paid);
    setFormCreditCost(mat.credit_cost || 49);
    setFormBadgeText(mat.badge_text || "");
    setFormBadgeColor(mat.badge_color || "purple");
    setFormIsPublished(mat.is_published);
    setFormError(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setFormError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${getApiV1()}/study-materials/upload-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setFormFileUrl(data.file_url);
        setFormFileSize(data.file_size_mb);
        setFormFileType(data.file_type);
        if (!formTitle) {
          setFormTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase());
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || "Failed to upload document file.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error uploading file.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formFileUrl.trim()) {
      setFormError("Please upload a file or provide a valid PDF/Document URL.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        file_url: formFileUrl.trim(),
        file_type: formFileType.toLowerCase(),
        file_size_mb: parseFloat(String(formFileSize)) || 1.5,
        pages_count: parseInt(String(formPages)) || 10,
        is_paid: formIsPaid,
        credit_cost: formIsPaid ? parseInt(String(formCreditCost)) || 0 : 0,
        badge_text: formBadgeText.trim() || (formIsPaid ? "PREMIUM" : "FREE"),
        badge_color: formBadgeColor,
        is_published: formIsPublished
      };

      const url = editingId ? `/study-materials/${editingId}` : `/study-materials/`;
      const method = editingId ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        token,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setModalOpen(false);
        fetchMaterials();
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || "Failed to save study material.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'?`)) return;

    try {
      const res = await apiFetch(`/study-materials/${id}`, {
        method: "DELETE",
        token
      });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (mat: AdminMaterial) => {
    try {
      const res = await apiFetch(`/study-materials/${mat.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ is_published: !mat.is_published }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === mat.id ? { ...m, is_published: !m.is_published } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            SUPER ADMIN REPOSITORY
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Study Materials &amp; Notes Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, upload and monetize study materials. Set free or paid credit prices for students.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Study Material</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="free">100% Free</option>
            <option value="paid">Credit-Locked (Paid)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : materials.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-10 h-10 text-purple-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No study materials found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Click "+ Add Study Material" to create your first document notes!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Title &amp; Category</th>
                  <th className="py-3 px-4">Price / Monetization</th>
                  <th className="py-3 px-4">File Specs</th>
                  <th className="py-3 px-4">Downloads</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {mat.title}
                      </div>
                      <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                        {mat.category_display}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {mat.is_paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300">
                          <Coins className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {mat.credit_cost} Credits
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                          Free (0 Credits)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div>{mat.file_type.toUpperCase()} • {mat.file_size_mb || 2.5} MB</div>
                      <div className="text-[10px]">{mat.pages_count || 10} Pages</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {mat.downloads_count} downloads
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(mat)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          mat.is_published
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300"
                        }`}
                      >
                        {mat.is_published ? "Published" : "Draft"}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(mat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mat.id, mat.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ CREATE / EDIT MODAL ═══════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Study Material" : "Add New Study Material"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. TCS NQT 2025 All-in-One Placement Study Kit"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief synopsis of what questions or topics are covered..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Monetization: Free vs Paid */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Paid Study Material?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Charge students wallet credits to unlock this note.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsPaid}
                    onChange={(e) => setFormIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {formIsPaid && (
                  <div className="pt-2 border-t border-purple-200/80 dark:border-purple-900/60 flex items-center gap-3">
                    <label className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Credit Cost:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={formCreditCost}
                      onChange={(e) => setFormCreditCost(parseInt(e.target.value) || 0)}
                      className="w-28 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-purple-600 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500">
                      Credits (e.g. 49 or 99 credits)
                    </span>
                  </div>
                )}
              </div>

              {/* File Upload / Link */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Document / PDF File *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                  {uploadingFile && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Or direct URL path:
                  </span>
                  <input
                    type="text"
                    required
                    value={formFileUrl}
                    onChange={(e) => setFormFileUrl(e.target.value)}
                    placeholder="e.g. /static/study_materials/tcs_prep.pdf or https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Extra details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    placeholder="e.g. NEW, HOT, FREE"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Publish Immediately?
                  </label>
                  <select
                    value={formIsPublished ? "true" : "false"}
                    onChange={(e) => setFormIsPublished(e.target.value === "true")}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="true">Published (Live)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update Notes" : "Create Study Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

