"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ClipboardList, 
  Plus, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  FileSpreadsheet, 
  UserPlus, 
  Trash2, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  ArrowLeft, 
  Share2, 
  MoreVertical,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  FolderPlus
} from "lucide-react";
import { apiFetch, API_BASE, getFrontendBaseUrl } from "../../../../lib/api";
import QRCodeModal from "../../../../components/QRCodeModal";

interface RegistrationForm {
  id: string;
  title: string;
  description: string | null;
  share_slug: string;
  is_active: boolean;
  submission_count: number;
  created_at: string;
}

interface StudentSubmission {
  id: string;
  form_id: string;
  full_name: string;
  email: string;
  roll_number: string;
  contact_number: string;
  section: string;
  branch: string;
  status: string;
  imported_directory_id: string | null;
  created_at: string;
}

interface StudentDirectory {
  id: string;
  name: string;
  student_count: number;
}

interface FormsRegistrationManagerProps {
  token: string | null;
}

export default function FormsRegistrationManager({ token }: FormsRegistrationManagerProps) {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [directories, setDirectories] = useState<StudentDirectory[]>([]);

  // Active Selected Form View (null means viewing all forms list)
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

  // Create Form Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: "",
    url: ""
  });

  // Import to Directory Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetMode, setImportTargetMode] = useState<"new" | "existing">("new");
  const [targetDirectoryId, setTargetDirectoryId] = useState("");
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Fetch all forms
  const fetchForms = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch("/registration-forms", { token });
      if (res.ok) {
        const data = await res.json();
        setForms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch registration forms", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch directories for import options
  const fetchDirectories = async () => {
    try {
      const res = await apiFetch("/student-directories", { token });
      if (res.ok) {
        const data = await res.json();
        setDirectories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch directories", err);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchDirectories();
  }, [token]);

  // Fetch submissions for a specific form
  const handleOpenFormDetails = async (form: RegistrationForm) => {
    setSelectedForm(form);
    setLoadingSubmissions(true);
    setSelectedSubmissionIds([]);
    try {
      const res = await apiFetch(`/registration-forms/${form.id}`, { token });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        showToast("Failed to load submissions for this form", "error");
      }
    } catch {
      showToast("Network error loading submissions", "error");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      showToast("Please enter a Form Name", "error");
      return;
    }

    try {
      setIsCreating(true);
      const res = await apiFetch("/registration-forms", {
        token,
        method: "POST",
        body: JSON.stringify({
          title: newFormTitle.trim(),
          description: newFormDescription.trim() || undefined
        })
      });

      if (res.ok) {
        const newForm = await res.json();
        setForms((prev) => [newForm, ...prev]);
        setIsCreateModalOpen(false);
        setNewFormTitle("");
        setNewFormDescription("");
        showToast(`Registration form "${newForm.title}" created successfully!`);
        // Open QR modal right away to facilitate immediate sharing
        const formUrl = `${getFrontendBaseUrl()}/forms/${newForm.share_slug}`;
        setQrModalData({
          isOpen: true,
          title: newForm.title,
          url: formUrl
        });
      } else {
        showToast("Failed to create registration form", "error");
      }
    } catch {
      showToast("Network error creating form", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFormActive = async (form: RegistrationForm, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextState = !form.is_active;
    try {
      const res = await apiFetch(`/registration-forms/${form.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ is_active: nextState })
      });
      if (res.ok) {
        const updated = await res.json();
        setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, is_active: nextState } : f)));
        if (selectedForm && selectedForm.id === form.id) {
          setSelectedForm((prev) => prev ? { ...prev, is_active: nextState } : null);
        }
        showToast(`Form submissions ${nextState ? "opened" : "paused"}`);
      }
    } catch {
      showToast("Error updating form status", "error");
    }
  };

  const handleDeleteForm = async (form: RegistrationForm, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to delete form "${form.title}" and its submissions?`)) return;

    try {
      const res = await apiFetch(`/registration-forms/${form.id}`, {
        token,
        method: "DELETE"
      });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== form.id));
        if (selectedForm && selectedForm.id === form.id) {
          setSelectedForm(null);
        }
        showToast("Registration form deleted");
      } else {
        showToast("Failed to delete form", "error");
      }
    } catch {
      showToast("Network error deleting form", "error");
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!selectedForm) return;
    if (!confirm("Are you sure you want to remove this student response?")) return;

    try {
      const res = await apiFetch(`/registration-forms/${selectedForm.id}/submissions/${submissionId}`, {
        token,
        method: "DELETE"
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
        setSelectedSubmissionIds((prev) => prev.filter((id) => id !== submissionId));
        setForms((prev) => prev.map((f) => f.id === selectedForm.id ? { ...f, submission_count: Math.max(0, f.submission_count - 1) } : f));
        showToast("Submission deleted");
      }
    } catch {
      showToast("Failed to delete submission", "error");
    }
  };

  const handleCopyLink = (slug: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${getFrontendBaseUrl()}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    showToast("Shareable link copied to clipboard!");
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleOpenQRModal = (form: RegistrationForm, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${getFrontendBaseUrl()}/forms/${form.share_slug}`;
    setQrModalData({
      isOpen: true,
      title: form.title,
      url: url
    });
  };

  const handleExportExcel = async (formId: string, formTitle: string) => {
    try {
      showToast("Generating Excel file compatible with roster template...", "success");
      const res = await apiFetch(`/registration-forms/${formId}/export-excel`, { token });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_roster.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast("Excel spreadsheet downloaded successfully!");
      } else {
        showToast("Failed to export Excel file", "error");
      }
    } catch {
      showToast("Network error exporting Excel", "error");
    }
  };

  const handleOpenImportModal = () => {
    if (!selectedForm) return;
    setNewDirectoryName(selectedForm.title);
    setImportTargetMode("new");
    setTargetDirectoryId(directories[0]?.id || "");
    setImportResult(null);
    setIsImportModalOpen(true);
  };

  const handleExecuteImport = async () => {
    if (!selectedForm) return;

    if (importTargetMode === "existing" && !targetDirectoryId) {
      showToast("Please choose a target Student Directory", "error");
      return;
    }
    if (importTargetMode === "new" && !newDirectoryName.trim()) {
      showToast("Please enter a name for the new directory", "error");
      return;
    }

    try {
      setIsImporting(true);
      const payload = {
        target_mode: importTargetMode,
        directory_id: importTargetMode === "existing" ? targetDirectoryId : undefined,
        new_directory_name: importTargetMode === "new" ? newDirectoryName.trim() : undefined,
        submission_ids: selectedSubmissionIds.length > 0 ? selectedSubmissionIds : undefined
      };

      const res = await apiFetch(`/registration-forms/${selectedForm.id}/import-to-directory`, {
        token,
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        fetchDirectories();
        // Update local submission statuses to "imported"
        setSubmissions((prev) =>
          prev.map((s) => {
            if (selectedSubmissionIds.length === 0 || selectedSubmissionIds.includes(s.id)) {
              return { ...s, status: "imported" };
            }
            return s;
          })
        );
        showToast(`Imported ${data.imported_count} students to Directory "${data.directory_name}"!`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to import students to directory", "error");
      }
    } catch {
      showToast("Network error during directory import", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q) ||
        s.contact_number.includes(q)
    );
  }, [submissions, searchQuery]);

  // Detect duplicates in submissions (by email or roll_number)
  const duplicateCounts = useMemo(() => {
    const rolls: Record<string, number> = {};
    const emails: Record<string, number> = {};
    submissions.forEach((s) => {
      const r = s.roll_number.toUpperCase().trim();
      const e = s.email.toLowerCase().trim();
      rolls[r] = (rolls[r] || 0) + 1;
      emails[e] = (emails[e] || 0) + 1;
    });
    return { rolls, emails };
  }, [submissions]);

  // Checkbox select all / none
  const handleToggleSelectAll = () => {
    if (selectedSubmissionIds.length === filteredSubmissions.length) {
      setSelectedSubmissionIds([]);
    } else {
      setSelectedSubmissionIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedSubmissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in duration-200 ${
          toast.type === "success" 
            ? "bg-[#242321] text-white border border-[#3E3A36]" 
            : "bg-rose-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        url={qrModalData.url}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: FORM RESPONSES & DIRECTORY IMPORT MANAGEMENT
         ══════════════════════════════════════════════════════════════════════ */}
      {selectedForm ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Top Navigation & Actions Bar */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedForm(null)}
                  className="p-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-[#716D67] transition-colors cursor-pointer"
                  title="Back to All Forms"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#242321] dark:text-[#F5F5F4]">
                      {selectedForm.title}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedForm.is_active 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    }`}>
                      {selectedForm.is_active ? "Active" : "Closed"}
                    </span>
                  </div>
                  {selectedForm.description && (
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-0.5">
                      {selectedForm.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Main Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyLink(selectedForm.share_slug)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-xs font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSlug === selectedForm.share_slug ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSlug === selectedForm.share_slug ? "Copied" : "Copy Link"}</span>
                </button>

                <button
                  onClick={() => handleOpenQRModal(selectedForm)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-xs font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Show QR</span>
                </button>

                <button
                  onClick={() => handleExportExcel(selectedForm.id, selectedForm.title)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export to standard Testora Roster Excel"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={handleOpenImportModal}
                  disabled={submissions.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C84B18] hover:bg-[#B33F10] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Import to Directory {selectedSubmissionIds.length > 0 ? `(${selectedSubmissionIds.length})` : ""}</span>
                </button>
              </div>

            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E5E0D8] dark:border-[#292524]">
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1C1A] rounded-xl border border-[#E5E0D8]/60 dark:border-[#292524]">
                <div className="text-[10px] text-[#716D67] uppercase font-bold tracking-wider">Total Submissions</div>
                <div className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] mt-0.5">{submissions.length}</div>
              </div>

              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1C1A] rounded-xl border border-[#E5E0D8]/60 dark:border-[#292524]">
                <div className="text-[10px] text-[#716D67] uppercase font-bold tracking-wider">Sections Represented</div>
                <div className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] mt-0.5">
                  {new Set(submissions.map((s) => s.section.toLowerCase().trim()).filter(Boolean)).size}
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1C1A] rounded-xl border border-[#E5E0D8]/60 dark:border-[#292524]">
                <div className="text-[10px] text-[#716D67] uppercase font-bold tracking-wider">Branches / Depts</div>
                <div className="text-xl font-bold text-[#242321] dark:text-[#F5F5F4] mt-0.5">
                  {new Set(submissions.map((s) => s.branch.toLowerCase().trim()).filter(Boolean)).size}
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1C1A] rounded-xl border border-[#E5E0D8]/60 dark:border-[#292524]">
                <div className="text-[10px] text-[#716D67] uppercase font-bold tracking-wider">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleToggleFormActive(selectedForm)}
                    className="text-xs font-bold text-[#C84B18] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {selectedForm.is_active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-zinc-400" />}
                    <span>{selectedForm.is_active ? "Accepting" : "Paused"}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Submissions Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8A29E]" />
              <input
                type="text"
                placeholder="Search by name, roll, email, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#171615] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-[#716D67]">
              <span>Showing <strong>{filteredSubmissions.length}</strong> of {submissions.length} students</span>
              {selectedSubmissionIds.length > 0 && (
                <span className="font-semibold text-[#C84B18]">
                  • {selectedSubmissionIds.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Submissions Table Card */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-xs overflow-hidden">
            {loadingSubmissions ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-[#716D67]">Loading student submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C84B18]/10 text-[#C84B18] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                  {searchQuery ? "No matching student responses found" : "No responses collected yet"}
                </h4>
                <p className="text-xs text-[#716D67] max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "Share the form link or QR code with your students via WhatsApp, Email, or classroom board."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => handleCopyLink(selectedForm.share_slug)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#C84B18] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#B33F10] transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Shareable Link</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] dark:bg-[#1E1C1A] border-b border-[#E5E0D8] dark:border-[#292524] text-[#716D67] dark:text-[#A8A29E] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-[#E5E0D8] text-[#C84B18] focus:ring-[#C84B18] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                    {filteredSubmissions.map((sub) => {
                      const isRollDup = duplicateCounts.rolls[sub.roll_number.toUpperCase().trim()] > 1;
                      const isEmailDup = duplicateCounts.emails[sub.email.toLowerCase().trim()] > 1;
                      const isSelected = selectedSubmissionIds.includes(sub.id);

                      return (
                        <tr 
                          key={sub.id} 
                          className={`hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1E1C1A]/50 transition-colors ${
                            isSelected ? "bg-[#C84B18]/5 dark:bg-[#C84B18]/10" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(sub.id)}
                              className="rounded border-[#E5E0D8] text-[#C84B18] focus:ring-[#C84B18] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-bold text-[#242321] dark:text-[#F5F5F4]">
                            {sub.full_name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-[#242321] dark:text-[#F5F5F4]">
                              {sub.roll_number}
                            </span>
                            {isRollDup && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Duplicate Roll
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#716D67] dark:text-[#A8A29E]">
                            <span>{sub.email}</span>
                            {isEmailDup && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Duplicate Email
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#716D67] dark:text-[#A8A29E]">
                            {sub.contact_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524]">
                              {sub.section}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524]">
                              {sub.branch}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === "imported"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {sub.status === "imported" ? "Imported to Directory" : "Submitted"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1 rounded-lg text-[#716D67] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW 2: FORMS DIRECTORY / LIST VIEW
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#C84B18]/10 text-[#C84B18] dark:text-[#EA580C]">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Student Data Collection Forms
                </h2>
              </div>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1">
                Collect student roster information via shareable online forms without requiring students to create accounts, and import directly into Student Directories.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchForms}
                disabled={refreshing}
                className="p-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-[#716D67] transition-colors cursor-pointer"
                title="Refresh Forms"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#C84B18] hover:bg-[#B33F10] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Registration Form</span>
              </button>
            </div>
          </div>

          {/* Forms Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-[#171615] rounded-2xl border border-[#E5E0D8] dark:border-[#292524]">
              <div className="w-8 h-8 border-2 border-[#C84B18] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#716D67]">Loading student registration forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C84B18]/10 text-[#C84B18] flex items-center justify-center mx-auto">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">
                  No Student Data Collection Forms Created Yet
                </h3>
                <p className="text-xs text-[#716D67] max-w-md mx-auto">
                  Create a form with a single click by entering just the name (e.g. "Section C AIML"). A shareable link and QR code will be generated instantly with the 6 mandatory student fields.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84B18] hover:bg-[#B33F10] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Registration Form</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => handleOpenFormDetails(form)}
                  className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#C84B18] dark:hover:border-[#EA580C] transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] group-hover:text-[#C84B18] transition-colors line-clamp-1">
                        {form.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        form.is_active 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                      }`}>
                        {form.is_active ? "Active" : "Closed"}
                      </span>
                    </div>

                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] line-clamp-2 min-h-[32px]">
                      {form.description || "6-field student directory registration form"}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[#716D67]">
                      <span className="flex items-center gap-1 font-semibold text-[#242321] dark:text-[#F5F5F4]">
                        <Users className="h-3.5 w-3.5 text-[#C84B18]" />
                        {form.submission_count} responses
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#A8A29E]" />
                        {new Date(form.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(form.share_slug, e)}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer"
                        title="Copy Shareable Link"
                      >
                        {copiedSlug === form.share_slug ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenQRModal(form, e)}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer"
                        title="Show QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>

                      <a
                        href={`${getFrontendBaseUrl()}/forms/${form.share_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] dark:hover:bg-[#201D1A] text-[#716D67] hover:text-[#C84B18] transition-colors"
                        title="Open Form in New Tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFormActive(form, e)}
                        className="text-[11px] font-semibold text-[#716D67] hover:text-[#242321] transition-colors cursor-pointer"
                        title={form.is_active ? "Close Submissions" : "Open Submissions"}
                      >
                        {form.is_active ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteForm(form, e)}
                        className="p-1.5 rounded-lg text-[#716D67] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Form"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE REGISTRATION FORM (Only Form Name Required)
         ══════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#292524]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#C84B18]/10 text-[#C84B18]">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Create Student Registration Form
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#716D67] hover:bg-[#F7F4EF] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Form Name <span className="text-[#C84B18]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Section C AIML or CS-2026 Batch"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                />
                <p className="text-[10px] text-[#716D67]">
                  Faculty only enters the form name. Predefined fields are automatically included.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Optional Description / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please fill in your official college roll number and email."
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                />
              </div>

              {/* 6 Predefined Fields Banner */}
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E1C1A] border border-[#E5E0D8] dark:border-[#292524] rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>6 Predefined Mandatory Fields (Standard Roster)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#716D67] dark:text-[#A8A29E]">
                  <div>✓ Full Name</div>
                  <div>✓ Email Address</div>
                  <div>✓ Roll Number</div>
                  <div>✓ Contact Number</div>
                  <div>✓ Section</div>
                  <div>✓ Branch</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newFormTitle.trim()}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#C84B18] hover:bg-[#B33F10] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Generating Link..." : "Create & Get Link"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: IMPORT TO STUDENT DIRECTORY
         ══════════════════════════════════════════════════════════════════════ */}
      {isImportModalOpen && selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#292524]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#C84B18]/10 text-[#C84B18]">
                  <UserPlus className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                  Import Submissions to Student Directory
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#716D67] hover:bg-[#F7F4EF] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {importResult ? (
              /* Success / Result Summary View */
              <div className="space-y-4 py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">
                    Directory Import Completed!
                  </h4>
                  <p className="text-xs text-[#716D67]">
                    Target Directory: <strong className="text-[#242321] dark:text-[#F5F5F4]">{importResult.directory_name}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <div className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">{importResult.imported_count}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold">Successfully Added</div>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <div className="text-zinc-700 dark:text-zinc-300 font-bold text-lg">{importResult.skipped_duplicate_count}</div>
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Duplicates Skipped</div>
                  </div>
                </div>

                {importResult.messages && importResult.messages.length > 0 && (
                  <div className="max-h-32 overflow-y-auto p-2.5 bg-[#FAF8F5] dark:bg-[#1E1C1A] rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-[10px] space-y-1 text-[#716D67]">
                    {importResult.messages.map((m: string, idx: number) => (
                      <div key={idx}>• {m}</div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#C84B18] text-white text-xs font-bold shadow-xs hover:bg-[#B33F10] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Configuration View */
              <div className="space-y-4">
                
                <div className="text-xs text-[#716D67]">
                  Target students: <strong>{selectedSubmissionIds.length > 0 ? `${selectedSubmissionIds.length} selected students` : `All ${submissions.length} submitted students`}</strong>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                    Destination Directory
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportTargetMode("new")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        importTargetMode === "new"
                          ? "border-[#C84B18] bg-[#C84B18]/5 text-[#C84B18] font-bold"
                          : "border-[#E5E0D8] dark:border-[#292524] text-[#716D67]"
                      }`}
                    >
                      <FolderPlus className="h-4 w-4 mb-1" />
                      <div className="text-xs">Create New Directory</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportTargetMode("existing")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        importTargetMode === "existing"
                          ? "border-[#C84B18] bg-[#C84B18]/5 text-[#C84B18] font-bold"
                          : "border-[#E5E0D8] dark:border-[#292524] text-[#716D67]"
                      }`}
                    >
                      <Users className="h-4 w-4 mb-1" />
                      <div className="text-xs">Add to Existing Directory</div>
                    </button>
                  </div>
                </div>

                {importTargetMode === "new" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                      New Directory Name
                    </label>
                    <input
                      type="text"
                      value={newDirectoryName}
                      onChange={(e) => setNewDirectoryName(e.target.value)}
                      placeholder="e.g. Section C AIML"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Select Directory
                    </label>
                    <select
                      value={targetDirectoryId}
                      onChange={(e) => setTargetDirectoryId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-[#C84B18] outline-none cursor-pointer"
                    >
                      {directories.length === 0 ? (
                        <option value="">No existing directories found</option>
                      ) : (
                        directories.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.student_count} students)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Automatic Duplicate Verification</span>
                  </div>
                  <p>
                    The system will automatically cross-check roll numbers and emails. Any records that already exist in the target directory will be safely skipped.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] text-[#716D67] hover:bg-[#F7F4EF] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#C84B18] hover:bg-[#B33F10] text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <span>Confirm Import</span>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
