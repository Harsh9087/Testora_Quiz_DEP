"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Star, 
  Check, 
  HelpCircle,
  ShieldCheck,
  FileText,
  ImageIcon
} from "lucide-react";
import { API_V1 } from "../../../lib/api";
import ThemeToggle from "../../../components/ThemeToggle";
import AppLogo from "../../../components/AppLogo";
import { getFormTheme } from "../../../lib/customFormThemes";

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

interface CustomFormMeta {
  title: string;
  description: string | null;
  fields: FormField[];
  share_slug: string;
  is_active: boolean;
  is_published: boolean;
  theme?: string;
  header_image?: string | null;
  theme_settings?: Record<string, any> | null;
  created_at: string;
}

export default function PublicCustomFormPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [formMeta, setFormMeta] = useState<CustomFormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responses state: { field_id: value }
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_V1}/custom-forms/public/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setFormMeta(data);
          // Initialize checkbox states as empty lists
          const initialResponses: Record<string, any> = {};
          data.fields?.forEach((f: FormField) => {
            if (f.field_type === "checkbox") {
              initialResponses[f.id] = [];
            }
          });
          setResponses(initialResponses);
        } else if (res.status === 404) {
          setError("Custom form not found or has expired.");
        } else if (res.status === 403) {
          setError("This form is still in draft mode and not published yet.");
        } else {
          setError("Unable to load form.");
        }
      } catch {
        setError("Network error loading form.");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [slug]);

  const theme = useMemo(() => {
    return getFormTheme(formMeta?.theme);
  }, [formMeta?.theme]);

  const customColors = formMeta?.theme_settings;

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    setResponses((prev) => {
      const current = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      if (current.includes(option)) {
        return { ...prev, [fieldId]: current.filter((item) => item !== option) };
      } else {
        return { ...prev, [fieldId]: [...current, option] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMeta) return;
    setSubmitError(null);

    // Validate required fields
    for (const f of formMeta.fields) {
      if (f.required) {
        const val = responses[f.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          setSubmitError(`Please fill in required field: "${f.label}"`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_V1}/custom-forms/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          device_info: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      });

      if (res.ok) {
        setSubmittedSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.detail || "Failed to submit response.");
      }
    } catch {
      setSubmitError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBackground} flex flex-col items-center justify-center p-4 transition-colors`}>
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading form...</p>
      </div>
    );
  }

  if (error || !formMeta) {
    return (
      <div className={`min-h-screen ${theme.pageBackground} flex items-center justify-center p-4 transition-colors`}>
        <div className="max-w-md w-full bg-white dark:bg-[#111C31] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Form Unavailable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || "Form not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${theme.pageBackground} flex flex-col justify-between p-3 sm:p-6 lg:p-8 transition-colors`}
      style={customColors?.pageBackground ? { background: customColors.pageBackground } : undefined}
    >
      <div className="max-w-3xl w-full mx-auto space-y-5 my-auto">
        
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2.5">
            <AppLogo variant="row" height={28} />
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${theme.badgeBg} ${theme.badgeText}`}>
              <span className={`w-2 h-2 rounded-full ${formMeta.is_active ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {formMeta.is_active ? "Accepting Responses" : "Form Closed"}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {submittedSuccess ? (
          /* Success Screen */
          <div className={`${theme.cardBackground} ${theme.cardBorder} rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-5 animate-in fade-in duration-300`}>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className={`text-2xl font-extrabold ${theme.textColor}`}>Response Submitted!</h1>
              <p className={`text-sm ${theme.mutedTextColor}`}>
                Your response for <strong className={theme.textColor}>{formMeta.title}</strong> has been safely recorded.
              </p>
            </div>
            <p className={`text-xs ${theme.mutedTextColor}`}>
              Thank you for taking the time to complete this form.
            </p>
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setResponses({});
              }}
              className={`text-xs font-semibold ${theme.accentText} hover:underline cursor-pointer`}
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Fill Container */
          <div className={`${theme.cardBackground} ${theme.cardBorder} rounded-3xl overflow-hidden shadow-2xl space-y-0`}>
            
            {/* HERO SECTION / COVER IMAGE */}
            {formMeta.header_image ? (
              <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden border-b border-slate-200/60 dark:border-slate-800/60">
                <img
                  src={formMeta.header_image}
                  alt={formMeta.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/20 backdrop-blur-md border border-white/30 uppercase tracking-wider">
                    {theme.name}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-24 sm:h-28 relative border-b border-slate-200/40 dark:border-slate-800/40 flex items-end p-4"
                style={{ background: theme.bannerGradient }}
              >
                <div className="text-white/80 text-[10px] uppercase font-bold tracking-widest">
                  {theme.category} • {theme.name}
                </div>
              </div>
            )}

            {/* Form Title & Subtitle Card Header */}
            <div className="p-5 sm:p-8 space-y-6">
              
              <div className="space-y-2 border-b border-slate-200/70 dark:border-slate-800/70 pb-5">
                <h1 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${theme.textColor} tracking-tight`}>
                  {formMeta.title}
                </h1>
                {formMeta.description && (
                  <p className={`text-xs sm:text-sm ${theme.mutedTextColor} leading-relaxed`}>
                    {formMeta.description}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{submitError}</span>
                </div>
              )}

              {!formMeta.is_active ? (
                <div className="p-6 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                  <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className={`text-sm font-bold ${theme.textColor}`}>This form is currently closed</p>
                  <p className={`text-xs ${theme.mutedTextColor}`}>The author is no longer accepting new submissions.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {formMeta.fields.map((field, idx) => (
                    <div 
                      key={field.id} 
                      className={`space-y-3 p-4 sm:p-5 rounded-2xl border transition-all ${
                        field.required ? "border-slate-200 dark:border-slate-800/80" : "border-slate-200/60 dark:border-slate-800/50"
                      } bg-white/60 dark:bg-slate-900/30 backdrop-blur-xs`}
                    >
                      {/* Question Label */}
                      <label className={`text-xs sm:text-sm font-bold ${theme.textColor} flex items-center justify-between gap-2`}>
                        <span>
                          {idx + 1}. {field.label}
                        </span>
                        {field.required && (
                          <span className="text-rose-500 text-[11px] font-bold shrink-0">* Required</span>
                        )}
                      </label>

                      {/* Optional Question Hint Description */}
                      {field.description && (
                        <p className={`text-[11px] ${theme.mutedTextColor}`}>{field.description}</p>
                      )}

                      {/* QUESTION IMAGE (Google Forms style) */}
                      {field.image_url && (
                        <div className="my-2 space-y-1.5">
                          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 w-full bg-slate-50 dark:bg-slate-900/50">
                            <img
                              src={field.image_url}
                              alt={field.image_caption || field.label}
                              className="w-full h-auto max-h-72 object-contain mx-auto"
                            />
                          </div>
                          {field.image_caption && (
                            <p className="text-[10px] text-center italic text-slate-500 dark:text-slate-400">
                              {field.image_caption}
                            </p>
                          )}
                        </div>
                      )}

                      {/* TEXT / EMAIL / PHONE / NUMBER INPUT */}
                      {["text", "email", "phone", "number"].includes(field.field_type) && (
                        <input
                          type={field.field_type === "phone" ? "tel" : field.field_type}
                          required={field.required}
                          placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
                          value={responses[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.textColor} ${theme.inputFocusRing} outline-none transition-all placeholder:text-slate-400`}
                        />
                      )}

                      {/* TEXTAREA INPUT */}
                      {field.field_type === "textarea" && (
                        <textarea
                          rows={3}
                          required={field.required}
                          placeholder={field.placeholder || "Type your detailed response..."}
                          value={responses[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.textColor} ${theme.inputFocusRing} outline-none transition-all placeholder:text-slate-400`}
                        />
                      )}

                      {/* SELECT DROPDOWN */}
                      {field.field_type === "select" && (
                        <select
                          required={field.required}
                          value={responses[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.textColor} ${theme.inputFocusRing} outline-none transition-all cursor-pointer`}
                        >
                          <option value="">{field.placeholder || "Select an option..."}</option>
                          {field.options?.map((opt, optIdx) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* RADIO BUTTONS (With Google Forms Option Images) */}
                      {field.field_type === "radio" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {field.options?.map((opt, optIdx) => {
                            const isSelected = responses[field.id] === opt;
                            const optImg = field.option_images?.[opt];
                            return (
                              <label
                                key={optIdx}
                                className={`flex flex-col p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                                  isSelected
                                    ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.badgeBg} font-semibold ${theme.textColor}`
                                    : `border-slate-200 dark:border-slate-800 ${theme.inputBg} hover:border-slate-300 dark:hover:border-slate-700 ${theme.textColor}`
                                }`}
                              >
                                {optImg && (
                                  <div className="w-full h-24 mb-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                    <img
                                      src={optImg}
                                      alt={opt}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    checked={isSelected}
                                    onChange={() => handleInputChange(field.id, opt)}
                                    className="text-blue-600 focus:ring-blue-600 cursor-pointer"
                                  />
                                  <span className="flex-1">{opt}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* CHECKBOXES (MULTI-SELECT with Google Forms Option Images) */}
                      {field.field_type === "checkbox" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {field.options?.map((opt, optIdx) => {
                            const isChecked = Array.isArray(responses[field.id]) && responses[field.id].includes(opt);
                            const optImg = field.option_images?.[opt];
                            return (
                              <label
                                key={optIdx}
                                className={`flex flex-col p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                                  isChecked
                                    ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.badgeBg} font-semibold ${theme.textColor}`
                                    : `border-slate-200 dark:border-slate-800 ${theme.inputBg} hover:border-slate-300 dark:hover:border-slate-700 ${theme.textColor}`
                                }`}
                              >
                                {optImg && (
                                  <div className="w-full h-24 mb-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                    <img
                                      src={optImg}
                                      alt={opt}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleCheckboxToggle(field.id, opt)}
                                    className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                                  />
                                  <span className="flex-1">{opt}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* RATING SCALE (1 TO 5 STARS / NUMBERS) */}
                      {field.field_type === "rating" && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const selected = Number(responses[field.id]) >= starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => handleInputChange(field.id, starVal)}
                                className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                  selected
                                    ? "bg-amber-400 border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-400/30 scale-105"
                                    : `${theme.inputBg} ${theme.inputBorder} ${theme.mutedTextColor} hover:border-slate-400`
                                }`}
                              >
                                <Star className={`h-4 w-4 ${selected ? "fill-amber-950" : ""}`} />
                                <span>{starVal}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 px-6 ${theme.buttonGradient} ${theme.buttonText} rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]`}
                    style={customColors?.buttonBg ? { background: customColors.buttonBg, color: customColors.buttonText || '#fff' } : undefined}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Response...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Form Response</span>
                      </>
                    )}
                  </button>

                </form>
              )}

            </div>
          </div>
        )}

        <div className={`text-center text-[11px] ${theme.mutedTextColor} pt-2`}>
          Powered by <span className={`font-semibold ${theme.textColor}`}>TestoraQuiz Custom Forms</span>
        </div>

      </div>
    </div>
  );
}
