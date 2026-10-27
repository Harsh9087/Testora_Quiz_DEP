"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  RefreshCw,
  Users,
  Palette,
  ImageIcon,
  Paintbrush,
  Layers,
  Edit3,
  Star,
  CheckCheck,
  Maximize2,
  Smartphone,
  Monitor,
  Zap,
  Lightbulb,
  Mic,
  MicOff,
  Volume2,
  X
} from "lucide-react";
import { apiFetch, getFrontendBaseUrl } from "../../../../lib/api";
import QRCodeModal from "../../../../components/QRCodeModal";
import { 
  FORM_THEMES, 
  CURATED_HEADER_IMAGES, 
  SAMPLE_QUESTION_IMAGES, 
  getFormTheme, 
  FormTheme 
} from "../../../../lib/customFormThemes";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
  image_url?: string;
  image_caption?: string;
  option_images?: Record<string, string>;
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
  theme?: string;
  header_image?: string | null;
  theme_settings?: Record<string, any> | null;
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
  { value: "radio", label: "Single Choice (Radio with Images)" },
  { value: "checkbox", label: "Multiple Choice (Checkbox with Images)" },
  { value: "rating", label: "Rating Scale (1-5)" },
];

export default function CustomFormsManager({ token }: CustomFormsManagerProps) {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active view: "list" | "builder" | "responses"
  const [activeView, setActiveView] = useState<"list" | "builder" | "responses">("list");

  // Builder state
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [builderTab, setBuilderTab] = useState<"fields" | "theme" | "hero" | "preview">("fields");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const lastSavedPayloadRef = useRef<string>("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  const [builderTheme, setBuilderTheme] = useState<string>("navy_indigo");
  const [builderHeaderImage, setBuilderHeaderImage] = useState<string>("");
  const [customColors, setCustomColors] = useState<{
    primaryColor?: string;
    pageBackground?: string;
    cardBackground?: string;
    buttonBg?: string;
  }>({});

  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>("All");
  const [customHeaderUrlInput, setCustomHeaderUrlInput] = useState("");
  
  // Question Image Editor State (which field index is editing image)
  const [expandedImageFieldIdx, setExpandedImageFieldIdx] = useState<number | null>(null);
  
  // Option Image Modal / Popover state
  const [optionImageModal, setOptionImageModal] = useState<{
    isOpen: boolean;
    fieldIdx: number;
    optionName: string;
    currentUrl: string;
  }>({
    isOpen: false,
    fieldIdx: -1,
    optionName: "",
    currentUrl: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // Submissions state
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<CustomFormSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const res = await apiFetch("/custom-forms", { token: activeToken });
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
    const timer = setTimeout(() => setLoading(false), 3000);
    fetchForms();
    return () => clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Voice Speech-to-Text Input Handler
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      showToast("Voice dictation stopped.", "success");
      return;
    }

    const SpeechRecognition = 
      typeof window !== "undefined" && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      showToast("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.", "error");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        showToast("🎙️ Microphone active! Speak your form prompt now.");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        if (finalTranscript) {
          setAiPrompt((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          showToast("Microphone access denied. Please enable microphone permissions in your browser.", "error");
        } else if (event.error === "no-speech") {
          showToast("No speech detected. Please speak louder into your microphone.", "error");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setIsListening(false);
      showToast("Could not start microphone.", "error");
    }
  };

  // Active theme object
  const activeThemeObj: FormTheme = useMemo(() => {
    return getFormTheme(builderTheme);
  }, [builderTheme]);

  // Unique Theme Categories
  const themeCategories = useMemo(() => {
    const cats = Array.from(new Set(FORM_THEMES.map((t) => t.category)));
    return ["All", ...cats];
  }, []);

  const filteredThemes = useMemo(() => {
    if (themeCategoryFilter === "All") return FORM_THEMES;
    return FORM_THEMES.filter((t) => t.category === themeCategoryFilter);
  }, [themeCategoryFilter]);

  // AI Prompt Improvement
  const handleImprovePrompt = async (focusCategory?: string) => {
    if (!aiPrompt.trim()) {
      showToast("Please enter an initial idea or prompt first before improving", "error");
      return;
    }

    try {
      setIsImprovingPrompt(true);
      const res = await apiFetch("/custom-forms/improve-prompt", {
        token,
        method: "POST",
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(),
          focus: focusCategory || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiPrompt(data.improved_prompt);
        if (data.suggested_title && (!builderTitle || builderTitle === "New Custom Form")) {
          setBuilderTitle(data.suggested_title);
        }
        if (data.suggested_themes && data.suggested_themes.length > 0) {
          setBuilderTheme(data.suggested_themes[0]);
        }
        showToast("Prompt upgraded with comprehensive questions & rating scales!");
      } else {
        showToast("Could not improve prompt. Please try again.", "error");
      }
    } catch {
      showToast("Network error improving prompt", "error");
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  // AI Form Synthesis
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
        showToast("AI synthesized form fields successfully! Customize design or edit questions below.");
      } else {
        showToast("AI generation failed. Please try again.", "error");
      }
    } catch {
      showToast("Network error generating form", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounced Auto-Save Effect: Automatically syncs title, description, questions, theme, hero image, and colors
  useEffect(() => {
    if (!editingFormId || activeView !== "builder" || !token) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!builderTitle.trim()) return;

    const payloadObj = {
      title: builderTitle.trim(),
      description: builderDescription.trim() || undefined,
      prompt: aiPrompt.trim() || undefined,
      fields: builderFields,
      theme: builderTheme,
      header_image: builderHeaderImage.trim() || null,
      theme_settings: Object.keys(customColors).length > 0 ? customColors : null,
    };
    const payloadStr = JSON.stringify(payloadObj);

    if (payloadStr === lastSavedPayloadRef.current) return;

    setAutoSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/custom-forms/${editingFormId}`, {
          token,
          method: "PATCH",
          body: payloadStr,
        });

        if (res.ok) {
          const saved = await res.json();
          lastSavedPayloadRef.current = payloadStr;
          setAutoSaveStatus("saved");
          const now = new Date();
          setLastSavedTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          setForms((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
        } else {
          setAutoSaveStatus("error");
        }
      } catch {
        setAutoSaveStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [builderTitle, builderDescription, aiPrompt, builderFields, builderTheme, builderHeaderImage, customColors, editingFormId, activeView, token]);

  const handleStartNewForm = () => {
    setEditingFormId(null);
    setAiPrompt("");
    setBuilderTitle("New Custom Form");
    setBuilderDescription("Please provide your details below.");
    setBuilderTheme("navy_indigo");
    setBuilderHeaderImage("");
    setCustomColors({});
    setBuilderFields([
      { id: "f_1", label: "Full Name", field_type: "text", required: true, options: [] },
      { id: "f_2", label: "Email Address", field_type: "email", required: true, options: [] },
      { id: "f_3", label: "Feedback / Rating", field_type: "rating", required: true, options: [] },
      { id: "f_4", label: "Comments or Suggestions", field_type: "textarea", required: false, options: [] },
    ]);
    setBuilderTab("fields");
    setActiveView("builder");
    isInitialMount.current = true;
    lastSavedPayloadRef.current = "";
    setAutoSaveStatus("idle");
    setLastSavedTime(null);
  };

  const handleEditForm = (form: CustomForm, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingFormId(form.id);
    setBuilderTitle(form.title || "");
    setBuilderDescription(form.description || "");
    setAiPrompt(form.prompt || "");
    setBuilderFields(form.fields || []);
    setBuilderTheme(form.theme || "navy_indigo");
    setBuilderHeaderImage(form.header_image || "");
    setCustomColors(form.theme_settings || {});
    setBuilderTab("fields");
    setActiveView("builder");

    isInitialMount.current = true;
    lastSavedPayloadRef.current = JSON.stringify({
      title: (form.title || "").trim(),
      description: (form.description || "").trim() || undefined,
      prompt: (form.prompt || "").trim() || undefined,
      fields: form.fields || [],
      theme: form.theme || "navy_indigo",
      header_image: (form.header_image || "").trim() || null,
      theme_settings: form.theme_settings && Object.keys(form.theme_settings).length > 0 ? form.theme_settings : null,
    });
    setAutoSaveStatus("saved");
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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
        const removedOpt = copy[fieldIndex].options![optionIndex];
        copy[fieldIndex].options = copy[fieldIndex].options!.filter((_, i) => i !== optionIndex);
        if (copy[fieldIndex].option_images && removedOpt in copy[fieldIndex].option_images!) {
          const nextOptImages = { ...copy[fieldIndex].option_images };
          delete nextOptImages[removedOpt];
          copy[fieldIndex].option_images = nextOptImages;
        }
      }
      return copy;
    });
  };

  const handleSaveOptionImage = () => {
    if (optionImageModal.fieldIdx < 0 || !optionImageModal.optionName) return;
    const { fieldIdx, optionName, currentUrl } = optionImageModal;
    setBuilderFields((prev) => {
      const copy = [...prev];
      const optImages = { ...(copy[fieldIdx].option_images || {}) };
      if (currentUrl.trim()) {
        optImages[optionName] = currentUrl.trim();
      } else {
        delete optImages[optionName];
      }
      copy[fieldIdx].option_images = optImages;
      return copy;
    });
    setOptionImageModal({ isOpen: false, fieldIdx: -1, optionName: "", currentUrl: "" });
    showToast(`Option image updated for "${optionName}"`);
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
      const payloadData = {
        title: builderTitle.trim(),
        description: builderDescription.trim() || undefined,
        prompt: aiPrompt.trim() || undefined,
        fields: builderFields,
        theme: builderTheme,
        header_image: builderHeaderImage.trim() || null,
        theme_settings: Object.keys(customColors).length > 0 ? customColors : null,
        is_published: publish
      };

      let res;
      if (editingFormId) {
        // Edit existing form
        res = await apiFetch(`/custom-forms/${editingFormId}`, {
          token,
          method: "PATCH",
          body: JSON.stringify(payloadData)
        });
      } else {
        // Create new form
        res = await apiFetch("/custom-forms", {
          token,
          method: "POST",
          body: JSON.stringify(payloadData)
        });
      }

      if (res.ok) {
        const saved = await res.json();
        lastSavedPayloadRef.current = JSON.stringify(payloadData);
        setAutoSaveStatus("saved");
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

        if (editingFormId) {
          setForms((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
        } else {
          setForms((prev) => [saved, ...prev]);
          setEditingFormId(saved.id);
        }

        if (publish) {
          showToast(`Form "${saved.title}" published live successfully!`);
          setActiveView("list");
          const url = `${getFrontendBaseUrl()}/custom-forms/${saved.share_slug}`;
          setQrModalData({
            isOpen: true,
            title: saved.title,
            url: url
          });
        } else {
          showToast(`Form draft saved. Auto-save is now active!`);
        }
      } else {
        showToast("Failed to save form. Please verify your inputs.", "error");
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

      {/* Option Image Modal */}
      {optionImageModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1816] border border-[#E5E0D8] dark:border-[#2E2A27] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#2E2A27] pb-3">
              <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                <span>Option Image: {optionImageModal.optionName}</span>
              </h3>
              <button
                onClick={() => setOptionImageModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#716D67]">Image URL (Google Forms Style):</label>
              <input
                type="url"
                value={optionImageModal.currentUrl}
                onChange={(e) => setOptionImageModal((prev) => ({ ...prev, currentUrl: e.target.value }))}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#2E2A27] bg-[#FAF8F5] dark:bg-[#201D1A] outline-none text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600"
              />
            </div>

            {/* Preview */}
            {optionImageModal.currentUrl && (
              <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <img
                  src={optionImageModal.currentUrl}
                  alt={optionImageModal.optionName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Quick Sample Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-stone-500 font-bold uppercase">Quick Samples:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {SAMPLE_QUESTION_IMAGES.map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setOptionImageModal((prev) => ({ ...prev, currentUrl: sample.url }))}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8] dark:border-[#2E2A27]">
              {optionImageModal.currentUrl ? (
                <button
                  type="button"
                  onClick={() => setOptionImageModal((prev) => ({ ...prev, currentUrl: "" }))}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Remove Image
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOptionImageModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-600 cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOptionImage}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Apply Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: AI FORM BUILDER, CUSTOMIZER & LIVE PREVIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "builder" ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Builder Top Bar */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView("list")}
                className="p-2.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
                title="Back to Forms Roster"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-blue-600" />
                  <span>{editingFormId ? "Edit & Customize Form" : "AI Custom Form Studio"}</span>
                  {editingFormId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                      Editing Mode
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                  20 Curated Themes, Hero Cover Banner, and Google Forms-style Question Images.
                </p>
              </div>
            </div>

            {/* Action Buttons, Auto-save Status & Tabs */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Auto-Save Status Beacon */}
              {editingFormId && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#1C1A18] text-xs font-semibold">
                  {autoSaveStatus === "saving" && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Auto-saving...</span>
                    </span>
                  )}
                  {autoSaveStatus === "saved" && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Saved {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                    </span>
                  )}
                  {autoSaveStatus === "error" && (
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Save error</span>
                    </span>
                  )}
                  {autoSaveStatus === "idle" && (
                    <span className="flex items-center gap-1 text-stone-500">
                      <Check className="h-3 w-3" />
                      <span>Synced</span>
                    </span>
                  )}
                </div>
              )}

              {/* Tab Selector */}
              <div className="flex items-center bg-[#FAF8F5] dark:bg-[#201D1A] p-1 rounded-2xl border border-[#E5E0D8] dark:border-[#292524]">
                <button
                  type="button"
                  onClick={() => setBuilderTab("fields")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    builderTab === "fields"
                      ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs"
                      : "text-[#716D67] hover:text-[#242321]"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Questions ({builderFields.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab("theme")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    builderTab === "theme"
                      ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs"
                      : "text-[#716D67] hover:text-[#242321]"
                  }`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Themes ({FORM_THEMES.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab("hero")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    builderTab === "hero"
                      ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs"
                      : "text-[#716D67] hover:text-[#242321]"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Hero Cover</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab("preview")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    builderTab === "preview"
                      ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs"
                      : "text-[#716D67] hover:text-[#242321]"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Live Preview</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveForm(true)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : editingFormId ? "Save Changes" : "Publish Form"}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: FORM QUESTIONS & PROMPT */}
          {builderTab === "fields" && (
            <div className="space-y-6">
              
              {/* AI Prompt Input Box with "Improve with AI" */}
              <div className="bg-white dark:bg-[#171615] border border-blue-200 dark:border-blue-900/50 rounded-3xl p-5 shadow-xs space-y-3 bg-gradient-to-r from-blue-50/40 via-transparent to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Describe your form in natural language</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Voice Dictation Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isListening
                          ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400/50"
                          : "bg-white dark:bg-[#201D1A] border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
                      }`}
                      title={isListening ? "Click to stop microphone" : "Click to dictate prompt using your voice"}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 text-white" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5 text-blue-600" />
                          <span>Voice Prompt</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-blue-600 font-bold hidden sm:inline">Gemini AI Prompt Engine</span>
                  </div>
                </div>

                {isListening && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-semibold text-[11px] flex-1">
                      Listening... Speak your prompt aloud (e.g. &ldquo;Create a feedback form for college technical workshop with rating and suggestions&rdquo;)
                    </span>
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className="text-[11px] font-bold text-rose-800 dark:text-rose-200 underline cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create a technical workshop feedback form with 5-star ratings, instructor clarity, pacing, and questions with photo attachments..."
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-2xl border border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none transition-all placeholder:text-[#A8A29E]"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                      isListening
                        ? "bg-rose-600 text-white animate-pulse"
                        : "text-stone-400 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                    title={isListening ? "Stop listening" : "Click to speak prompt"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>

                {/* Prompt Enhancement and Improvement Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-[#716D67] font-semibold text-[10px] flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-amber-500" /> Refine Prompt:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleImprovePrompt("rating scales and detailed rubrics")}
                      disabled={isImprovingPrompt}
                      className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      + Add 5-Star Ratings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImprovePrompt("multiple-choice with visual option choices")}
                      disabled={isImprovingPrompt}
                      className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      + Add Image Options
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImprovePrompt("academic course and instructor evaluation")}
                      disabled={isImprovingPrompt}
                      className="px-2.5 py-1 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200/60 transition-colors text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      + Course Survey
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleImprovePrompt()}
                      disabled={isImprovingPrompt || !aiPrompt.trim()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      title="Enriches prompt with questions, types and structure"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>{isImprovingPrompt ? "Enhancing..." : "✨ Improve My Prompt"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>{isGenerating ? "Synthesizing..." : "Generate Form"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Title & Description */}
              <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Form Title
                    </label>
                    <input
                      type="text"
                      value={builderTitle}
                      onChange={(e) => setBuilderTitle(e.target.value)}
                      placeholder="e.g. Spring 2026 Student Workshop Evaluation"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] font-bold text-sm text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                      Active Theme
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={builderTheme}
                        onChange={(e) => setBuilderTheme(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] font-bold text-[#242321] dark:text-[#F5F5F4] cursor-pointer outline-none"
                      >
                        {FORM_THEMES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.category})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setBuilderTab("theme")}
                        className="px-3 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#FAF8F5] text-blue-600 font-bold shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>Customize</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4]">
                    Form Subtitle / Instructions for Respondents
                  </label>
                  <input
                    type="text"
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="Brief guidance for students before submitting"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#716D67] flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span>Form Questions & Fields ({builderFields.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-xs font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {builderFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 shadow-xs space-y-3 transition-all hover:border-slate-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <span className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-[#201D1A] border border-[#E5E0D8] text-xs font-bold flex items-center justify-center text-[#716D67] shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                            placeholder="Question or Field Label"
                            className="px-2.5 py-1 text-xs sm:text-sm font-bold rounded-lg border border-transparent hover:border-[#E5E0D8] focus:border-blue-600 bg-transparent text-[#242321] dark:text-[#F5F5F4] outline-none flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Add/Edit Question Image Toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedImageFieldIdx(expandedImageFieldIdx === idx ? null : idx)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-xl border flex items-center gap-1 transition-colors cursor-pointer ${
                              field.image_url 
                                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" 
                                : "border-[#E5E0D8] dark:border-[#292524] text-[#716D67] hover:bg-[#FAF8F5]"
                            }`}
                            title="Add photo to question stem (like Google Forms)"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>{field.image_url ? "Has Image" : "+ Image"}</span>
                          </button>

                          {/* Field Type Selector */}
                          <select
                            value={field.field_type}
                            onChange={(e) => handleFieldChange(idx, { field_type: e.target.value })}
                            className="px-2.5 py-1 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] text-[#242321] dark:text-[#F5F5F4] cursor-pointer outline-none font-medium"
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

                      {/* Question Image Editor Box (Collapsible Google Forms style) */}
                      {(expandedImageFieldIdx === idx || field.image_url) && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                            <span className="flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                              <span>Question Image Attachment (Google Forms style)</span>
                            </span>
                            {field.image_url && (
                              <button
                                type="button"
                                onClick={() => handleFieldChange(idx, { image_url: undefined, image_caption: undefined })}
                                className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="url"
                              value={field.image_url || ""}
                              onChange={(e) => handleFieldChange(idx, { image_url: e.target.value })}
                              placeholder="Image URL: https://..."
                              className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#1E1C1A] text-[#242321] dark:text-[#F5F5F4] outline-none"
                            />
                            <input
                              type="text"
                              value={field.image_caption || ""}
                              onChange={(e) => handleFieldChange(idx, { image_caption: e.target.value })}
                              placeholder="Optional Caption / Alt"
                              className="px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#1E1C1A] text-[#242321] dark:text-[#F5F5F4] outline-none"
                            />
                          </div>

                          {/* Quick Sample Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-stone-500 font-semibold">Sample Presets:</span>
                            {SAMPLE_QUESTION_IMAGES.map((sample, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleFieldChange(idx, { image_url: sample.url, image_caption: sample.label })}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#201D1A] border border-blue-200 text-blue-800 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>

                          {field.image_url && (
                            <div className="w-full max-h-40 overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900 bg-black/5 flex items-center justify-center">
                              <img
                                src={field.image_url}
                                alt={field.image_caption || field.label}
                                className="h-40 w-auto object-contain mx-auto"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Options editor for choice fields (radio, checkbox, select) */}
                      {["select", "radio", "checkbox"].includes(field.field_type) && (
                        <div className="pl-2 pt-2 border-t border-[#E5E0D8]/60 dark:border-[#292524] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#716D67]">
                              Choice Options & Photo Attachments (Click 🖼️ to add option image):
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {field.options?.map((opt, optIdx) => {
                              const hasOptImg = field.option_images?.[opt];
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs transition-all ${
                                    hasOptImg 
                                      ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800" 
                                      : "bg-[#FAF8F5] dark:bg-[#201D1A] border-[#E5E0D8] dark:border-[#292524]"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {hasOptImg ? (
                                      <img
                                        src={hasOptImg}
                                        alt={opt}
                                        className="w-6 h-6 rounded-md object-cover border border-blue-300 shrink-0"
                                      />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                                    )}
                                    <span className="truncate font-medium">{opt}</span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOptionImageModal({
                                        isOpen: true,
                                        fieldIdx: idx,
                                        optionName: opt,
                                        currentUrl: hasOptImg || ""
                                      })}
                                      className={`p-1 rounded-md text-[10px] font-bold cursor-pointer ${
                                        hasOptImg ? "text-blue-700 bg-blue-100 hover:bg-blue-200" : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/60"
                                      }`}
                                      title="Add or edit option image (Google Forms style)"
                                    >
                                      <ImageIcon className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(idx, optIdx)}
                                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                                      title="Delete Option"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => handleAddOption(idx)}
                              className="p-2 rounded-xl border border-dashed border-[#C84B18]/50 text-[#C84B18] text-xs font-bold hover:bg-[#C84B18]/5 cursor-pointer text-center"
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
                    className="px-5 py-2.5 rounded-2xl border border-dashed border-[#E5E0D8] dark:border-[#292524] hover:border-blue-600 text-xs font-bold text-[#716D67] hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    + Add Another Question
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CURATED THEMES & COLOR CUSTOMIZER (20 Themes in Compact Space) */}
          {builderTab === "theme" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* 20 Customized Form Themes Picker (Compact Design) */}
              <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] dark:border-[#292524] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                      <Palette className="h-4 w-4 text-blue-600" />
                      <span>Curated Themes ({FORM_THEMES.length} Available)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        Selected: {activeThemeObj.name}
                      </span>
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                      Select any of the 20 tailored aesthetic themes with harmonious palettes, cards, and buttons.
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {themeCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setThemeCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        themeCategoryFilter === cat
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-[#FAF8F5] dark:bg-[#201D1A] text-[#716D67] hover:bg-[#F0ECE4] dark:hover:bg-[#262320]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Compact Themes Grid - Takes ~50% less vertical space */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {filteredThemes.map((theme) => {
                    const isSelected = builderTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setBuilderTheme(theme.id);
                          showToast(`Theme set to "${theme.name}"`);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-md scale-[1.01]"
                            : "border-[#E5E0D8] dark:border-[#292524] bg-white dark:bg-[#1E1C1A] hover:border-blue-300 dark:hover:border-blue-700"
                        }`}
                      >
                        {/* Compact Theme Swatch */}
                        <div 
                          className="w-full h-8 rounded-lg relative overflow-hidden flex items-center justify-between px-2 shadow-inner"
                          style={{ background: theme.bannerGradient }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full border border-white/60 shadow" style={{ backgroundColor: theme.primaryColor }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-white/60 shadow" style={{ backgroundColor: theme.secondaryColor }} />
                            <span className="w-2.5 h-2.5 rounded-full border border-white/60 shadow" style={{ backgroundColor: theme.accentColor }} />
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#242321] dark:text-[#F5F5F4] truncate">
                            {theme.name}
                          </h4>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 shrink-0">
                            {theme.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Colors Override */}
              <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#292524] pb-3">
                  <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                    <Paintbrush className="h-4 w-4 text-blue-600" />
                    <span>Custom Color Overrides (Optional)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomColors({});
                      showToast("Reset to theme defaults");
                    }}
                    className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                  >
                    Reset Overrides
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#716D67]">Custom Primary Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.primaryColor || activeThemeObj.primaryColor}
                        onChange={(e) => setCustomColors((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customColors.primaryColor || activeThemeObj.primaryColor}
                        onChange={(e) => setCustomColors((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-28 px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FAF8F5] dark:bg-[#201D1A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#716D67]">Custom Button Gradient/Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.buttonBg || activeThemeObj.secondaryColor}
                        onChange={(e) => setCustomColors((prev) => ({ ...prev, buttonBg: e.target.value }))}
                        className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customColors.buttonBg || activeThemeObj.secondaryColor}
                        onChange={(e) => setCustomColors((prev) => ({ ...prev, buttonBg: e.target.value }))}
                        className="w-28 px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FAF8F5] dark:bg-[#201D1A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#716D67]">Custom Page Background:</label>
                    <input
                      type="text"
                      value={customColors.pageBackground || ""}
                      onChange={(e) => setCustomColors((prev) => ({ ...prev, pageBackground: e.target.value }))}
                      placeholder="e.g. #0B1120 or linear-gradient(...)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FAF8F5] dark:bg-[#201D1A]"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DEDICATED HERO SECTION COVER BANNER */}
          {builderTab === "hero" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Hero Banner Section */}
              <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] dark:border-[#292524] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                      <span>Hero Section Cover Banner</span>
                    </h3>
                    <p className="text-xs text-[#716D67] dark:text-[#A8A29E]">
                      Select a curated campus/tech preset image or paste any custom hero cover URL.
                    </p>
                  </div>
                  {builderHeaderImage && (
                    <button
                      type="button"
                      onClick={() => setBuilderHeaderImage("")}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Hero Image (Use Theme Gradient)
                    </button>
                  )}
                </div>

                {/* Hero Banner Preview */}
                <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                  {builderHeaderImage ? (
                    <>
                      <img
                        src={builderHeaderImage}
                        alt="Hero Cover"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/20 backdrop-blur-md border border-white/30 uppercase tracking-wider">
                          Active Hero Banner
                        </span>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col justify-end p-5 text-white"
                      style={{ background: activeThemeObj.bannerGradient }}
                    >
                      <span className="text-[11px] uppercase font-bold tracking-widest text-white/70">Theme Gradient Banner</span>
                      <h4 className="text-lg font-bold">{builderTitle || "Form Title"}</h4>
                    </div>
                  )}
                </div>

                {/* Custom URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customHeaderUrlInput}
                    onChange={(e) => setCustomHeaderUrlInput(e.target.value)}
                    placeholder="Or paste any custom image URL (Unsplash, Imgur, CDN)..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E5E0D8] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#201D1A] outline-none text-[#242321] dark:text-[#F5F5F4] focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customHeaderUrlInput.trim()) {
                        setBuilderHeaderImage(customHeaderUrlInput.trim());
                        setCustomHeaderUrlInput("");
                        showToast("Hero cover image updated!");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Apply URL
                  </button>
                </div>

                {/* Curated 16 Header Image Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#716D67] uppercase tracking-wider">
                    Curated Presets (16 High-Res Photos):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
                    {CURATED_HEADER_IMAGES.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setBuilderHeaderImage(preset.url);
                          showToast(`Applied preset: ${preset.name}`);
                        }}
                        className={`group relative h-20 rounded-xl overflow-hidden cursor-pointer border transition-all ${
                          builderHeaderImage === preset.url
                            ? "ring-2 ring-blue-600 border-blue-600 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-bold text-white truncate drop-shadow">
                          {preset.name}
                        </span>
                        {builderHeaderImage === preset.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LIVE FORM PREVIEW (Interactive Responsive Sandbox) */}
          {builderTab === "preview" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-2xl p-3 shadow-xs">
                <span className="text-xs font-bold text-[#716D67]">
                  Previewing theme: <strong className="text-blue-600">{activeThemeObj.name}</strong> ({activeThemeObj.category})
                </span>
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#201D1A] p-1 rounded-xl border border-[#E5E0D8] dark:border-[#292524]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewDevice === "desktop" ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs" : "text-[#716D67]"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewDevice === "mobile" ? "bg-white dark:bg-[#2B2724] text-blue-600 shadow-xs" : "text-[#716D67]"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Preview Sandbox Box */}
              <div 
                className={`p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 ${activeThemeObj.pageBackground} transition-colors min-h-[500px] flex justify-center`}
                style={customColors.pageBackground ? { background: customColors.pageBackground } : undefined}
              >
                <div className={`w-full transition-all ${previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
                  
                  <div className={`${activeThemeObj.cardBackground} ${activeThemeObj.cardBorder} rounded-3xl overflow-hidden shadow-2xl space-y-0`}>
                    
                    {/* Hero Section */}
                    {builderHeaderImage ? (
                      <div className="relative w-full h-40 sm:h-48 overflow-hidden border-b border-slate-200/60 dark:border-slate-800/60">
                        <img
                          src={builderHeaderImage}
                          alt="Cover"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4 text-white">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
                            {activeThemeObj.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-full h-20 p-4 flex items-end text-white border-b border-slate-200/40"
                        style={{ background: activeThemeObj.bannerGradient }}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                          {activeThemeObj.name}
                        </span>
                      </div>
                    )}

                    <div className="p-5 sm:p-7 space-y-5">
                      <div className="space-y-1.5 border-b border-slate-200/70 dark:border-slate-800/70 pb-4">
                        <h2 className={`text-xl sm:text-2xl font-extrabold ${activeThemeObj.textColor}`}>
                          {builderTitle || "Untitled Custom Form"}
                        </h2>
                        {builderDescription && (
                          <p className={`text-xs ${activeThemeObj.mutedTextColor}`}>
                            {builderDescription}
                          </p>
                        )}
                      </div>

                      {/* Render questions in preview */}
                      <div className="space-y-4">
                        {builderFields.map((field, idx) => (
                          <div 
                            key={field.id}
                            className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 space-y-2.5"
                          >
                            <label className={`text-xs font-bold ${activeThemeObj.textColor} flex items-center justify-between`}>
                              <span>{idx + 1}. {field.label}</span>
                              {field.required && <span className="text-rose-500 text-[10px] font-bold">* Required</span>}
                            </label>

                            {/* Question Image in Preview */}
                            {field.image_url && (
                              <div className="my-1.5 max-h-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img
                                  src={field.image_url}
                                  alt={field.image_caption || field.label}
                                  className="w-full h-auto max-h-48 object-contain mx-auto"
                                />
                                {field.image_caption && (
                                  <p className="text-[10px] text-center italic text-slate-500 py-1">
                                    {field.image_caption}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Inputs Preview */}
                            {["text", "email", "phone", "number"].includes(field.field_type) && (
                              <input
                                disabled
                                placeholder={field.placeholder || "Your answer..."}
                                className={`w-full px-3 py-2 text-xs rounded-xl border ${activeThemeObj.inputBorder} ${activeThemeObj.inputBg} opacity-80`}
                              />
                            )}

                            {field.field_type === "textarea" && (
                              <textarea
                                disabled
                                rows={2}
                                placeholder={field.placeholder || "Long answer..."}
                                className={`w-full px-3 py-2 text-xs rounded-xl border ${activeThemeObj.inputBorder} ${activeThemeObj.inputBg} opacity-80`}
                              />
                            )}

                            {field.field_type === "select" && (
                              <select disabled className={`w-full px-3 py-2 text-xs rounded-xl border ${activeThemeObj.inputBorder} ${activeThemeObj.inputBg} opacity-80`}>
                                <option>Select an option...</option>
                                {field.options?.map((opt, oIdx) => <option key={oIdx}>{opt}</option>)}
                              </select>
                            )}

                            {field.field_type === "radio" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {field.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className={`p-2.5 rounded-xl border border-slate-200 text-xs ${activeThemeObj.inputBg}`}>
                                    {field.option_images?.[opt] && (
                                      <img src={field.option_images[opt]} alt={opt} className="w-full h-20 object-cover rounded-lg mb-1.5" />
                                    )}
                                    <div className="flex items-center gap-2">
                                      <input type="radio" disabled />
                                      <span>{opt}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {field.field_type === "checkbox" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {field.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className={`p-2.5 rounded-xl border border-slate-200 text-xs ${activeThemeObj.inputBg}`}>
                                    {field.option_images?.[opt] && (
                                      <img src={field.option_images[opt]} alt={opt} className="w-full h-20 object-cover rounded-lg mb-1.5" />
                                    )}
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" disabled />
                                      <span>{opt}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {field.field_type === "rating" && (
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <div key={s} className="p-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled
                        className={`w-full py-3 ${activeThemeObj.buttonGradient} ${activeThemeObj.buttonText} rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg`}
                        style={customColors.buttonBg ? { background: customColors.buttonBg } : undefined}
                      >
                        Submit Response (Preview Mode)
                      </button>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      ) : activeView === "responses" && selectedForm ? (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW 2: CUSTOM FORM RESPONSES & EXCEL EXPORT
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView("list")}
                  className="p-2.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
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
                  onClick={() => handleEditForm(selectedForm)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-xs font-bold text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Form & Theme</span>
                </button>
                <button
                  onClick={() => handleCopyLink(selectedForm.share_slug)}
                  className="px-3 py-2 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-xs font-semibold text-[#242321] dark:text-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => handleExportExcel(selectedForm.id, selectedForm.title)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Table with Dynamic Headers */}
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl shadow-xs overflow-hidden">
            {loadingSubmissions ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-[#716D67]">Loading responses...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-bold text-[#242321] dark:text-[#F5F5F4]">No responses submitted yet</p>
                <p className="text-xs text-[#716D67]">Share your form link or QR code to begin collecting responses.</p>
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
                      <th className="py-3.5 px-4 w-12">#</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Respondent</th>
                      {selectedForm.fields.map((f) => (
                        <th key={f.id} className="py-3.5 px-4 max-w-xs truncate" title={f.label}>
                          {f.label}
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-right">Action</th>
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
                            className="p-1.5 rounded text-[#716D67] hover:text-rose-600 transition-colors cursor-pointer"
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
            VIEW 3: CUSTOM FORMS LIST & DASHBOARD
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Wand2 className="h-5 w-5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#242321] dark:text-[#F5F5F4]">
                  AI-Powered Custom Form Builder
                </h2>
              </div>
              <p className="text-xs text-[#716D67] dark:text-[#A8A29E] mt-1">
                20 Curated Themes, Hero Cover Photos, Google Forms-Style Question Images, and instant Excel exports.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchForms}
                disabled={refreshing}
                className="p-2.5 rounded-xl border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] transition-colors cursor-pointer"
                title="Refresh Forms"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleStartNewForm}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Custom Form</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-[#171615] rounded-3xl border border-[#E5E0D8] dark:border-[#292524]">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#716D67]">Loading custom forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Wand2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#242321] dark:text-[#F5F5F4]">
                  No Custom Forms Created Yet
                </h3>
                <p className="text-xs text-[#716D67] max-w-md mx-auto">
                  Use our AI Form Builder to generate forms from natural language prompts, or customize questions, themes, and cover banners manually.
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
              {forms.map((form) => {
                const formTheme = getFormTheme(form.theme);
                return (
                  <div
                    key={form.id}
                    onClick={() => handleOpenResponses(form)}
                    className="bg-white dark:bg-[#171615] border border-[#E5E0D8] dark:border-[#292524] rounded-3xl overflow-hidden shadow-xs hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    {/* Header Image or Theme Banner Pill */}
                    {form.header_image ? (
                      <div className="h-28 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={form.header_image}
                          alt={form.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 backdrop-blur-md text-white uppercase tracking-wider">
                          {formTheme.name}
                        </span>
                      </div>
                    ) : (
                      <div 
                        className="h-16 w-full p-2.5 flex items-end"
                        style={{ background: formTheme.bannerGradient }}
                      >
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                          {formTheme.name}
                        </span>
                      </div>
                    )}

                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
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
                          {/* Edit Form & Theme */}
                          <button
                            type="button"
                            onClick={(e) => handleEditForm(form, e)}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#292524] hover:bg-[#F7F4EF] text-[#716D67] hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Questions, Theme & Colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

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
                            title="Open Live Form"
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

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
