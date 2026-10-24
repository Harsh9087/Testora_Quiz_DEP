"use client";

import { useEffect, useState } from "react";
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
  FileText
} from "lucide-react";
import { API_V1 } from "../../../lib/api";
import ThemeToggle from "../../../components/ThemeToggle";
import AppLogo from "../../../components/AppLogo";

interface FormField {
  id: string;
  label: string;
  field_type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
}

interface CustomFormMeta {
  title: string;
  description: string | null;
  fields: FormField[];
  share_slug: string;
  is_active: boolean;
  is_published: boolean;
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-10 h-10 border-3 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#64748B] dark:text-[#A3B1C6]">Loading form...</p>
      </div>
    );
  }

  if (error || !formMeta) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#111C31] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#263449] shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">Form Unavailable</h2>
          <p className="text-sm text-[#64748B] dark:text-[#A3B1C6]">{error || "Form not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#111827] dark:text-[#F1F5F9] transition-colors">
      <div className="max-w-2xl w-full mx-auto space-y-5 my-auto">
        
        {/* Brand Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#263449]">
          <div className="flex items-center gap-2.5">
            <AppLogo variant="row" height={30} />
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EFF6FF] dark:bg-[#172B4D] text-[#2563EB] dark:text-[#60A5FA] border border-[#2563EB]/30">
              {formMeta.is_active ? "Accepting Responses" : "Form Closed"}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {submittedSuccess ? (
          /* Success Screen */
          <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 sm:p-10 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-[#111827] dark:text-[#F1F5F9]">Response Submitted!</h1>
              <p className="text-sm text-[#64748B] dark:text-[#A3B1C6]">
                Your response for <strong className="text-[#111827] dark:text-[#F1F5F9]">{formMeta.title}</strong> has been safely recorded.
              </p>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
              Thank you for taking the time to complete this form.
            </p>
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setResponses({});
              }}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Fill Card */
          <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-5 sm:p-8 shadow-xl space-y-6">
            
            {/* Form Title & Description */}
            <div className="space-y-2 border-b border-[#E2E8F0] dark:border-[#263449] pb-5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-[#F1F5F9] tracking-tight">
                {formMeta.title}
              </h1>
              {formMeta.description && (
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
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
              <div className="p-6 bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">This form is currently closed</p>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">The author is no longer accepting new submissions.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {formMeta.fields.map((field, idx) => (
                  <div key={field.id} className="space-y-2 p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449]">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span>
                        {idx + 1}. {field.label}
                      </span>
                      {field.required && <span className="text-rose-500 text-[11px] font-bold">*</span>}
                    </label>

                    {field.description && (
                      <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6]">{field.description}</p>
                    )}

                    {/* TEXT / EMAIL / PHONE / NUMBER INPUT */}
                    {["text", "email", "phone", "number"].includes(field.field_type) && (
                      <input
                        type={field.field_type === "phone" ? "tel" : field.field_type}
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
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
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                      />
                    )}

                    {/* SELECT DROPDOWN */}
                    {field.field_type === "select" && (
                      <select
                        required={field.required}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all cursor-pointer"
                      >
                        <option value="">{field.placeholder || "Select an option..."}</option>
                        {field.options?.map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* RADIO BUTTONS */}
                    {field.field_type === "radio" && (
                      <div className="space-y-1.5 pt-1">
                        {field.options?.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                              responses[field.id] === opt
                                ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#EFF6FF] dark:bg-[#172B4D] font-semibold text-[#1E3A8A] dark:text-[#60A5FA]"
                                : "border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.id}
                              checked={responses[field.id] === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* CHECKBOXES (MULTI-SELECT) */}
                    {field.field_type === "checkbox" && (
                      <div className="space-y-1.5 pt-1">
                        {field.options?.map((opt, optIdx) => {
                          const isChecked = Array.isArray(responses[field.id]) && responses[field.id].includes(opt);
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                                isChecked
                                  ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#EFF6FF] dark:bg-[#172B4D] font-semibold text-[#1E3A8A] dark:text-[#60A5FA]"
                                  : "border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                className="rounded text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                              />
                              <span>{opt}</span>
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
                              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                selected
                                  ? "bg-amber-400 border-amber-500 text-amber-950 shadow-sm"
                                  : "bg-white dark:bg-[#111C31] border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#A3B1C6] hover:bg-[#F8FAFC] dark:hover:bg-[#17243A]"
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
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-60"
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
        )}

        <div className="text-center text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
          Powered by <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">TestoraQuiz Custom Forms</span>
        </div>

      </div>
    </div>
  );
}
