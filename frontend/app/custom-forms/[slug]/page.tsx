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
    setSubmitError(null);

    if (!formMeta) return;

    // Validate required fields
    for (const f of formMeta.fields) {
      if (f.required) {
        const val = responses[f.id];
        if (
          val === undefined || 
          val === null || 
          (typeof val === "string" && !val.trim()) || 
          (Array.isArray(val) && val.length === 0)
        ) {
          setSubmitError(`Please answer mandatory field: "${f.label}"`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_V1}/custom-forms/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses })
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
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#716D67]">Loading form...</p>
      </div>
    );
  }

  if (error || !formMeta) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E0D8] shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#242321]">Form Unavailable</h2>
          <p className="text-sm text-[#716D67]">{error || "Form not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#242321]">
      <div className="max-w-2xl w-full mx-auto space-y-5 my-auto">
        
        {/* Brand Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#242321]">Testora Quiz</span>
              <span className="block text-[10px] text-[#716D67] font-medium">Online Custom Form</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {formMeta.is_active ? "Accepting Responses" : "Form Closed"}
          </span>
        </div>

        {submittedSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-10 shadow-sm text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-[#242321]">Response Submitted!</h1>
              <p className="text-sm text-[#716D67]">
                Your response for <strong className="text-[#242321]">{formMeta.title}</strong> has been safely recorded.
              </p>
            </div>
            <p className="text-xs text-[#8C827A]">
              Thank you for taking the time to complete this form.
            </p>
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setResponses({});
              }}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Fill Card */
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-8 shadow-xs space-y-6">
            
            {/* Form Title & Description */}
            <div className="space-y-2 border-b border-[#E5E0D8] pb-5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#242321] tracking-tight">
                {formMeta.title}
              </h1>
              {formMeta.description && (
                <p className="text-xs sm:text-sm text-[#716D67] leading-relaxed">
                  {formMeta.description}
                </p>
              )}
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {!formMeta.is_active ? (
              <div className="p-6 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-600 mx-auto" />
                <p className="text-sm font-bold text-[#242321]">This form is currently closed</p>
                <p className="text-xs text-[#716D67]">The author is no longer accepting new submissions.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {formMeta.fields.map((field, idx) => (
                  <div key={field.id} className="space-y-2 p-3.5 rounded-xl bg-[#FAF8F5]/60 border border-[#E5E0D8]/60">
                    <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                      <span>
                        {idx + 1}. {field.label}
                      </span>
                      {field.required && <span className="text-rose-500 text-[11px] font-bold">*</span>}
                    </label>

                    {field.description && (
                      <p className="text-[11px] text-[#716D67]">{field.description}</p>
                    )}

                    {/* TEXT / EMAIL / PHONE / NUMBER INPUT */}
                    {["text", "email", "phone", "number"].includes(field.field_type) && (
                      <input
                        type={field.field_type === "phone" ? "tel" : field.field_type}
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-[#A8A29E]"
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
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-[#A8A29E]"
                      />
                    )}

                    {/* SELECT DROPDOWN */}
                    {field.field_type === "select" && (
                      <select
                        required={field.required}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all cursor-pointer"
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
                                ? "border-blue-600 bg-blue-50/50 font-semibold text-blue-900"
                                : "border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#242321]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.id}
                              checked={responses[field.id] === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="text-blue-600 focus:ring-blue-600 cursor-pointer"
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
                                  ? "border-blue-600 bg-blue-50/50 font-semibold text-blue-900"
                                  : "border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#242321]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
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
                                  ? "bg-amber-400 border-amber-500 text-amber-950 shadow-xs"
                                  : "bg-white border-[#E5E0D8] text-[#716D67] hover:bg-[#FAF8F5]"
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
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-60"
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

        <div className="text-center text-[11px] text-[#8C827A]">
          Powered by <span className="font-semibold text-[#242321]">TestoraQuiz Custom Forms</span>
        </div>

      </div>
    </div>
  );
}
