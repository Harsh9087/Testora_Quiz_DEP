"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MessageSquare,
  Lightbulb,
  Bug,
  Star,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Loader2,
  Upload,
  ImageIcon,
  Sparkles,
  User,
  Mail,
  GraduationCap,
  Building2,
  Layers,
  ChevronDown
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export type FeedbackType = "general" | "feature" | "bug" | "rating";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
}

const FEEDBACK_TYPES: {
  id: FeedbackType;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  btnBg: string;
  titlePlaceholder: string;
  messagePlaceholder: string;
}[] = [
  {
    id: "general",
    label: "Share Experience",
    category: "General Feedback",
    icon: MessageSquare,
    accentColor: "blue",
    badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
    titlePlaceholder: "e.g., Overall impression of the assessment studio",
    messagePlaceholder: "Tell us what you like about Testora Quiz and what we can do to make it better for you..."
  },
  {
    id: "feature",
    label: "Suggest a Feature",
    category: "Feature Request",
    icon: Lightbulb,
    accentColor: "orange",
    badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    btnBg: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
    titlePlaceholder: "e.g., Audio question playback for language exams",
    messagePlaceholder: "Describe your idea for a new feature or workflow. How would it help you or your students?"
  },
  {
    id: "bug",
    label: "Report an Issue",
    category: "Bug Report",
    icon: Bug,
    accentColor: "red",
    badgeBg: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    btnBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
    titlePlaceholder: "e.g., Formula rendering glitch on mobile browsers",
    messagePlaceholder: "What happened? Please share steps to reproduce the issue, device/browser details, or error messages..."
  },
  {
    id: "rating",
    label: "Rate Experience",
    category: "UI/UX Suggestion",
    icon: Star,
    accentColor: "emerald",
    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    titlePlaceholder: "e.g., Intuitive AI test creation experience",
    messagePlaceholder: "Share a few sentences explaining your rating and what stood out most during your usage..."
  }
];

const USER_ROLES = [
  { id: "Teacher", label: "Teacher / Professor", icon: GraduationCap },
  { id: "Student", label: "Student / Candidate", icon: User },
  { id: "College or Institution", label: "College / Dean / Admin", icon: Building2 },
  { id: "Other", label: "Other Professional", icon: Layers }
];

const RATING_LABELS: Record<number, string> = {
  1: "1 - Needs significant improvement",
  2: "2 - Below expectations",
  3: "3 - Good — Meets expectations",
  4: "4 - Very Good — Highly capable and smooth",
  5: "5 - Excellent — Outstanding assessment platform!"
};

export default function FeedbackModal({
  isOpen,
  onClose,
  initialType = "general"
}: FeedbackModalProps) {
  const { fullName, role } = useAuthStore();
  const [activeType, setActiveType] = useState<FeedbackType>(initialType);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Teacher");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("Normal");

  // Screenshot Upload
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync initial type when opening
  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      setSuccessCode(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialType]);

  // Autofill user information if logged in
  useEffect(() => {
    if (fullName) setName(fullName);
    if (typeof window !== "undefined") {
      const savedEmail =
        localStorage.getItem("email") ||
        localStorage.getItem("userEmail") ||
        localStorage.getItem("eduquiz_remember_email");
      if (savedEmail) setEmail(savedEmail);
    }
    if (role === "student") setUserType("Student");
    else if (role === "teacher") setUserType("Teacher");
    else if (role === "super_admin" || role === "inst_admin") setUserType("College or Institution");
  }, [fullName, role]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, message, subject]);

  if (!isOpen) return null;

  // Warn before closing if user typed message
  const handleAttemptClose = () => {
    if (!successCode && (message.trim().length > 10 || subject.trim().length > 5)) {
      const confirmDiscard = window.confirm(
        "You have entered feedback. Are you sure you want to discard your draft and close?"
      );
      if (!confirmDiscard) return;
    }
    onClose();
  };

  // Screenshot handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrorMsg("Please upload a valid image (PNG, JPG, JPEG, or WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size exceeds maximum limit of 5 MB.");
        return;
      }

      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));

      // Asynchronously upload to backend
      try {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await apiFetch("/feedback/upload-screenshot", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          setScreenshotUrl(uploadJson.url);
        }
      } catch (err) {
        console.warn("Screenshot background upload failed; will retry on submit.", err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!subject.trim()) {
      setErrorMsg("Please provide a short feedback subject or title.");
      return;
    }
    if (message.trim().length < 3) {
      setErrorMsg("Please provide more details in your feedback message (minimum 3 characters).");
      return;
    }

    setSubmitting(true);

    try {
      let finalScreenshotUrl = screenshotUrl;

      // Upload screenshot if selected and not yet uploaded
      if (screenshotFile && !finalScreenshotUrl) {
        const formData = new FormData();
        formData.append("file", screenshotFile);
        const uploadRes = await apiFetch("/feedback/upload-screenshot", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          finalScreenshotUrl = uploadJson.url;
        }
      }

      const activeConfig = FEEDBACK_TYPES.find((t) => t.id === activeType)!;

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        user_type: userType,
        category: activeConfig.category,
        submission_type:
          activeType === "general"
            ? "EXPERIENCE"
            : activeType === "feature"
            ? "FEATURE"
            : activeType === "bug"
            ? "BUG"
            : "RATING",
        rating: rating,
        subject: subject.trim(),
        message: message.trim(),
        severity: activeType === "bug" ? severity : undefined,
        screenshot_url: finalScreenshotUrl || undefined
      };

      const res = await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.detail || "Submission failed. Please check your network and try again.");
      }

      setSuccessCode(resData.feedback_code || "FB-CONFIRMED");

      // Reset fields
      setSubject("");
      setMessage("");
      handleRemoveScreenshot();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeConfig = FEEDBACK_TYPES.find((t) => t.id === activeType) || FEEDBACK_TYPES[0];
  const ActiveIcon = activeConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleAttemptClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                activeType === "general"
                  ? "bg-blue-600 shadow-blue-500/20"
                  : activeType === "feature"
                  ? "bg-amber-500 shadow-amber-500/20"
                  : activeType === "bug"
                  ? "bg-rose-600 shadow-rose-500/20"
                  : "bg-emerald-600 shadow-emerald-500/20"
              }`}
            >
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {activeConfig.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help us make Testora Quiz smarter, safer, and easier to use.
              </p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close popup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Segmented Tabs */}
        {!successCode && (
          <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B132B] px-3 sm:px-6 pt-2 overflow-x-auto no-scrollbar shrink-0">
            {FEEDBACK_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = activeType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveType(t.id);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? t.id === "general"
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : t.id === "feature"
                        ? "border-amber-500 text-amber-600 dark:text-amber-400"
                        : t.id === "bug"
                        ? "border-rose-600 text-rose-600 dark:text-rose-400"
                        : "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5 flex-1 space-y-4">
          {successCode ? (
            /* Success Confirmation Screen */
            <div className="py-6 sm:py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900/60 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Feedback Successfully Registered!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Thank you for taking the time to help us improve. Our team will review your submission promptly.
                </p>
              </div>

              {/* Reference ID card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Unique Feedback Reference ID
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                    {successCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(successCode)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Copy Reference Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  You can quote this code in support queries or follow-ups.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. jane@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* User Type & Rating / Severity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    User Role
                  </label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {activeType === "bug" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Issue Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Low">Low — Minor cosmetic issue</option>
                      <option value="Normal">Normal — Standard functional problem</option>
                      <option value="High">High — Key feature not working</option>
                      <option value="Critical">Critical — Assessment blocker</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= (hoverRating ?? rating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 dark:text-slate-700"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1.5 truncate">
                        {RATING_LABELS[hoverRating ?? rating]?.split("—")[1] || "Selected"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeConfig.titlePlaceholder}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Detailed Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Feedback Details <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {message.length} chars (min 3)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder={activeConfig.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Screenshot Attachment (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Screenshot or Screen Capture
                </label>
                {screenshotPreview ? (
                  <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-1 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="h-20 w-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-md transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center text-white text-[10px] gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="feedback-screenshot-input"
                    />
                    <label
                      htmlFor="feedback-screenshot-input"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Attach image (PNG, JPG, WEBP &lt;= 5MB)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-[0.98] ${
                    submitting ? "opacity-70 cursor-not-allowed" : ""
                  } ${activeConfig.btnBg}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
