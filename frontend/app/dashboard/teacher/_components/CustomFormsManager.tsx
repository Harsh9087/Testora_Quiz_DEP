"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Wand2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  FileSpreadsheet, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Settings2, 
  MoveUp, 
  MoveDown, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  Calendar,
  Send,
  HelpCircle,
  Users
} from "lucide-react";
import { apiFetch, getFrontendBaseUrl } from "../../../../lib/api";
import QRCodeModal from "../../../../components/QRCodeModal";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface CustomForm {
  id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  fields: FormField[];
  share_slug: string;
  is_published: boolean;
  is_active: boolean;
  submission_count: number;
  created_at: string;
}

interface CustomFormSubmission {
  id: string;
  form_id: string;
  responses: Record<string, any>;
  respondent_identifier: string | null;
  created_at: string;
  status: string;
}

interface CustomFormsManagerProps {
  token: string | null;
}

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Paragraph" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown Select" },
  { value: "radio", label: "Single Choice (Radio)" },
  { value: "checkbox", label: "Multiple Choice (Checkbox)" },
  { value: "rating", label: "Rating Scale (1-5)" },
];

export default function CustomFormsManager({ token }: CustomFormsManagerProps) {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active view: "list" | "builder" | "responses"
  const [activeView, setActiveView] = useState<"list" | "builder" | "responses">("list");

  // Builder state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Submissions state
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<CustomFormSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: "",
    url: ""
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch("/custom-forms", { token });
      if (res.ok) {
        const data = await res.json();
        setForms(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast("Error loading custom forms", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [token]);

  // AI Prompt Generation
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      showToast("Please describe the form you want to create", "error");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await apiFetch("/custom-forms/generate", {
        token,
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setBuilderTitle(data.title || "Custom Form");
        setBuilderDescription(data.description || "");
        setBuilderFields(data.fields || []);
        showToast("AI generated form structure successfully! Review and edit below.");
      } else {
        showToast("AI generation failed. Please try again.", "error");
      }
    } catch {
      showToast("Network error generating form", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartNewForm = () => {
    setAiPrompt("");
    setBuilderTitle("New Custom Form");
    setBuilderDescription("Please provide your details below.");
    setBuilderFields([
      { id: "f_1", label: "Full Name", field_type: "text", required: true, options: [] },
      { id: "f_2", label: "Email Address", field_type: "email", required: true, options: [] },
      { id: "f_3", label: "Feedback / Comments", field_type: "textarea", required: false, options: [] },
    ]);
    setActiveView("builder");
  };

  const handleAddField = () => {
    const newId = `f_${Date.now()}`;
    setBuilderFields((prev) => [
      ...prev,
      {
        id: newId,
        label: `Question ${prev.length + 1}`,
        field_type: "text",
        required: true,
        options: []
      }
    ]);
  };

  const handleRemoveField = (idx: number) => {
    setBuilderFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === builderFields.length - 1)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const nextFields = [...builderFields];
    const temp = nextFields[index];
    nextFields[index] = nextFields[targetIndex];
    nextFields[targetIndex] = temp;
    setBuilderFields(nextFields);
  };

  const handleFieldChange = (index: number, updates: Partial<FormField>) => {
    setBuilderFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleAddOption = (fieldIndex: number) => {
    setBuilderFields((prev) => {
      const copy = [...prev];
      const opts = copy[fieldIndex].options ? [...copy[fieldIndex].options!] : [];
      opts.push(`Option ${opts.length + 1}`);
      copy[fieldIndex].options = opts;
      return copy;
    });
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    setBuilderFields((prev) => {
      const copy = [...prev];
      if (copy[fieldIndex].options) {
        copy[fieldIndex].options = copy[fieldIndex].options!.filter((_, i) => i !== optionIndex);
      }
      return copy;
    });
  };

  const handleSaveForm = async (publish: boolean) => {
    if (!builderTitle.trim()) {
      showToast("Please enter a Form Title", "error");
      return;
    }
    if (builderFields.length === 0) {
      showToast("Please include at least one field in your form", "error");
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiFetch("/custom-forms", {
        token,
        method: "POST",
        body: JSON.stringify({
          title: builderTitle.trim(),
          description: builderDescription.trim() || undefined,
          prompt: aiPrompt.trim() || undefined,
          fields: builderFields,
          is_published: publish
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setForms((prev) => [saved, ...prev]);
        setActiveView("list");
        showToast(`Form "${saved.title}" ${publish ? "published" : "saved"} successfully!`);
        if (publish) {
          const url = `${getFrontendBaseUrl()}/custom-forms/${saved.share_slug}`;
          setQrModalData({
            isOpen: true,
            title: saved.title,
            url: url
          });
        }
      } else {
        showToast("Failed to save form", "error");
      }
    } catch {
      showToast("Network error saving form", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResponses = async (form: CustomForm) => {
    setSelectedForm(form);
    setActiveView("responses");
    setLoadingSubmissions(true);
    try {
      const res = await apiFetch(`/custom-forms/${form.id}`, { token });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      showToast("Error loading form responses", "error");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCopyLink = (slug: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${getFrontendBaseUrl()}/custom-forms/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    showToast("Shareable custom form link copied!");
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleExportExcel = async (formId: string, formTitle: string) => {
    try {
      showToast("Generating dynamic responses Excel...", "success");
      const res = await apiFetch(`/custom-forms/${formId}/export-excel`, { token });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_responses.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast("Excel spreadsheet downloaded successfully!");
      }
    } catch {
      showToast("Network error exporting Excel", "error");
    }
  };

  const handleDeleteForm = async (form: CustomForm, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to delete form "${form.title}" and its submissions?`)) return;
    try {
      const res = await apiFetch(`/custom-forms/${form.id}`, {
        token,
        method: "DELETE"
      });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== form.id));
        showToast("Form deleted");
      }
    } catch {
      showToast("Error deleting form", "error");
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    if (!selectedForm) return;
    if (!confirm("Are you sure you want to remove this submission?")) return;
    try {
      const res = await apiFetch(`/custom-forms/${selectedForm.id}/submissions/${subId}`, {
        token,
        method: "DELETE"
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subId));
        setForms((prev) => prev.map((f) => f.id === selectedForm.id ? { ...f, submission_count: Math.max(0, f.submission_count - 1) } : f));
        showToast("Submission deleted");
      }
    } catch {
      showToast("Error deleting submission", "error");
    }
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
          VIEW 1: AI FORM BUILDER & EDITOR
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "builder" ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Builder Header */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView("list")}
                className="p-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-blue-600" />
                  <span>AI Custom Form Studio</span>
                </h2>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                  Synthesize fields with Gemini or customize questions manually.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveForm(true)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Publish & Generate Link"}</span>
              </button>
            </div>
          </div>

          {/* AI Prompt Input Box */}
          <div className="bg-white dark:bg-[#171615] border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 shadow-xs space-y-3 bg-gradient-to-r from-blue-50/40 via-transparent to-transparent">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Describe your form in natural language</span>
              </label>
              <span className="text-[10px] text-blue-600 font-bold">Powered by Gemini AI</span>
            </div>

            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create a student workshop feedback form with instructor rating, content clarity, pacing, and suggestions for future topics..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none transition-all placeholder:text-[#A8A29E]"
            />

            {/* Quick Prompt Ideas */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-[#716D67] font-semibold text-[10px]">Prompt Ideas:</span>
              <button
                type="button"
                onClick={() => setAiPrompt("Create a student feedback form for a one-day technical workshop with workshop rating, questions about the instructor, content feedback, and suggestions for improvement.")}
                className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] cursor-pointer"
              >
                ⚡ Workshop Feedback
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt("Create an event registration form with participant name, email, phone number, college name, event track selection, and dietary preferences.")}
                className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] cursor-pointer"
              >
                ⚡ Event Registration
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt("Create a course evaluation survey with student name (optional), difficulty rating from 1 to 5, key strengths of the course, and recommended improvements.")}
                className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] cursor-pointer"
              >
                ⚡ Course Evaluation Survey
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>{isGenerating ? "Synthesizing Form..." : "Generate Form with AI"}</span>
            </button>
          </div>

          {/* Form Meta Inputs */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                Form Title
              </label>
              <input
                type="text"
                value={builderTitle}
                onChange={(e) => setBuilderTitle(e.target.value)}
                placeholder="Form Title"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] font-bold text-sm text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                Form Description / Subtitle
              </label>
              <input
                type="text"
                value={builderDescription}
                onChange={(e) => setBuilderDescription(e.target.value)}
                placeholder="Brief instructions for respondents"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Fields List & Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#716D67]">
                Form Questions & Fields ({builderFields.length})
              </h3>
              <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {builderFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] text-[11px] font-bold flex items-center justify-center text-[#716D67]">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                        placeholder="Question or Field Label"
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-transparent hover:border-[#E5E0D8] focus:border-blue-600 bg-transparent text-[#242321] dark:text-[#F5F5F4] outline-none w-72"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Field Type Selector */}
                      <select
                        value={field.field_type}
                        onChange={(e) => handleFieldChange(idx, { field_type: e.target.value })}
                        className="px-2.5 py-1 text-xs rounded-lg border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] cursor-pointer outline-none"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      {/* Required Toggle */}
                      <label className="flex items-center gap-1.5 text-xs text-[#716D67] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(idx, { required: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                        <span>Required</span>
                      </label>

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-[#716D67] hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, "down")}
                        disabled={idx === builderFields.length - 1}
                        className="p-1 rounded text-[#716D67] hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remove Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options editor for choice fields */}
                  {["select", "radio", "checkbox"].includes(field.field_type) && (
                    <div className="pl-7 pt-2 border-t border-[#E5E0D8]/60 dark:border-[#292524] space-y-2">
                      <div className="text-[11px] font-semibold text-[#716D67]">Choice Options:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {field.options?.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] dark:border-[#292524] rounded-lg text-xs"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx, optIdx)}
                              className="text-[#716D67] hover:text-rose-600 ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(idx)}
                          className="px-2.5 py-1 rounded-lg border border-dashed border-[#C84B18]/50 text-[#C84B18] text-xs font-bold hover:bg-[#C84B18]/5 cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleAddField}
                className="px-4 py-2 rounded-xl border border-dashed border-[#E5E0D8] dark:border-[#292524] hover:border-[#C84B18] text-xs font-bold text-[#716D67] hover:text-[#C84B18] transition-colors cursor-pointer"
              >
                + Add Another Question
              </button>
            </div>
          </div>

        </div>
      ) : activeView === "responses" && selectedForm ? (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW 2: CUSTOM FORM RESPONSES
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView("list")}
                  className="p-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">
                    {selectedForm.title}
                  </h2>
                  <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                    {submissions.length} Total Respondent Submissions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(selectedForm.share_slug)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-xs font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => handleExportExcel(selectedForm.id, selectedForm.title)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Table with Dynamic Headers */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl shadow-xs overflow-hidden">
            {loadingSubmissions ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-[#716D67]">Loading responses...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">No responses submitted yet</p>
                <p className="text-xs text-[#716D67]">Share your form link to begin collecting responses.</p>
                <button
                  onClick={() => handleCopyLink(selectedForm.share_slug)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Copy Shareable Link
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] dark:bg-[#1E1C1A] border-b border-[#E5E0D8] dark:border-[#292524] text-[#716D67] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Respondent</th>
                      {selectedForm.fields.map((f) => (
                        <th key={f.id} className="py-3 px-4 max-w-xs truncate" title={f.label}>
                          {f.label}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#292524]">
                    {submissions.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-3 px-4 text-[#716D67]">{idx + 1}</td>
                        <td className="py-3 px-4 text-[#716D67] whitespace-nowrap">
                          {new Date(sub.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#242321] dark:text-[#F5F5F4]">
                          {sub.respondent_identifier || "Anonymous"}
                        </td>
                        {selectedForm.fields.map((f) => {
                          const val = sub.responses?.[f.id];
                          const displayVal = Array.isArray(val) ? val.join(", ") : String(val ?? "—");
                          return (
                            <td key={f.id} className="py-3 px-4 text-[#242321] dark:text-[#F5F5F4] max-w-xs truncate" title={displayVal}>
                              {displayVal}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="p-1 rounded text-[#716D67] hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Response"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW 3: CUSTOM FORMS LIST
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Wand2 className="h-5 w-5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#242321] dark:text-[#F5F5F4]">
                  AI-Powered Custom Form Builder
                </h2>
              </div>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1">
                Create surveys, workshop evaluations, and event registrations with simple AI prompts or manual custom fields.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchForms}
                disabled={refreshing}
                className="p-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
                title="Refresh Forms"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleStartNewForm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Custom Form</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-[#171615] rounded-2xl border border-[#E5E0D8] dark:border-[#292524]">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#716D67]">Loading custom forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Wand2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">
                  No Custom Forms Created Yet
                </h3>
                <p className="text-xs text-[#716D67] max-w-md mx-auto">
                  Use our AI Form Builder to generate forms from natural language prompts for workshops, feedback, hackathons, and surveys.
                </p>
              </div>
              <button
                onClick={handleStartNewForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Build a Form with AI</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => handleOpenResponses(form)}
                  className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#242321] dark:text-[#F5F5F4] group-hover:text-blue-600 transition-colors line-clamp-1">
                        {form.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        form.is_published 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {form.is_published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E] line-clamp-2 min-h-[32px]">
                      {form.description || "Custom AI form"}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[#716D67]">
                      <span className="flex items-center gap-1 font-semibold text-[#242321] dark:text-[#F5F5F4]">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        {form.submission_count} responses
                      </span>
                      <span>•</span>
                      <span>{form.fields.length} questions</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8] dark:border-[#292524]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(form.share_slug, e)}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] hover:text-blue-600 transition-colors cursor-pointer"
                        title="Copy Shareable Link"
                      >
                        {copiedSlug === form.share_slug ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${getFrontendBaseUrl()}/custom-forms/${form.share_slug}`;
                          setQrModalData({ isOpen: true, title: form.title, url });
                        }}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] hover:text-blue-600 transition-colors cursor-pointer"
                        title="Show QR Code"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>

                      <a
                        href={`${getFrontendBaseUrl()}/custom-forms/${form.share_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] hover:text-blue-600 transition-colors"
                        title="Open in New Tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteForm(form, e)}
                      className="p-1.5 rounded-lg text-[#716D67] hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Form"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
