"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  GraduationCap, 
  User, 
  Mail, 
  Hash, 
  Phone, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2
} from "lucide-react";
import { API_BASE, API_V1 } from "../../../lib/api";

interface FormMeta {
  title: string;
  description: string | null;
  share_slug: string;
  is_active: boolean;
  created_at: string;
}

export default function StudentRegistrationPublicPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // 6 Predefined Mandatory Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [section, setSection] = useState("");
  const [branch, setBranch] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        setMetaError(null);
        const res = await fetch(`${API_V1}/registration-forms/public/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setFormMeta(data);
        } else if (res.status === 404) {
          setMetaError("This student registration form does not exist or has expired.");
        } else {
          setMetaError("Unable to load registration form. Please check your link.");
        }
      } catch (err: any) {
        setMetaError("Network error loading registration form.");
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Basic Validations
    if (!fullName.trim() || !email.trim() || !rollNumber.trim() || !contactNumber.trim() || !section.trim() || !branch.trim()) {
      setSubmitError("All 6 fields are mandatory. Please fill in all information.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    if (contactNumber.trim().replace(/[^0-9]/g, "").length < 7) {
      setSubmitError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_V1}/registration-forms/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          roll_number: rollNumber.trim().toUpperCase(),
          contact_number: contactNumber.trim(),
          section: section.trim(),
          branch: branch.trim()
        })
      });

      if (res.ok) {
        setSubmittedSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setSubmitError(data.detail || "You have already registered with this Roll Number or Email.");
        } else if (res.status === 400) {
          setSubmitError(data.detail || "This form is currently closed for submissions.");
        } else {
          setSubmitError(data.detail || "Failed to submit registration. Please try again.");
        }
      }
    } catch {
      setSubmitError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#C84B18] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#716D67]">Loading student registration form...</p>
      </div>
    );
  }

  if (metaError || !formMeta) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E0D8] shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#242321]">Form Unavailable</h2>
          <p className="text-sm text-[#716D67]">{metaError || "Registration form not found."}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-[#C84B18] bg-[#C84B18]/10 rounded-xl hover:bg-[#C84B18]/15 transition-all"
          >
            Go to TestoraQuiz Home
          </a>
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9C3810] via-[#C84B18] to-[#E05D24] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#242321]">Testora Quiz</span>
              <span className="block text-[10px] text-[#716D67] font-medium">Student Directory Registration</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {formMeta.is_active ? "Registration Open" : "Form Closed"}
          </span>
        </div>

        {submittedSuccess ? (
          /* Submission Success View */
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-10 shadow-sm text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-[#242321]">Registration Submitted!</h1>
              <p className="text-sm text-[#716D67]">
                Thank you, <span className="font-semibold text-[#242321]">{fullName}</span>. Your details have been successfully recorded for:
              </p>
              <div className="inline-block mt-1 px-3 py-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs font-bold text-[#C84B18]">
                {formMeta.title}
              </div>
            </div>

            {/* Submitted Summary Box */}
            <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#716D67] block">Roll Number:</span>
                <span className="font-bold text-[#242321]">{rollNumber}</span>
              </div>
              <div>
                <span className="text-[#716D67] block">Email:</span>
                <span className="font-bold text-[#242321] truncate block">{email}</span>
              </div>
              <div>
                <span className="text-[#716D67] block">Section:</span>
                <span className="font-bold text-[#242321]">{section}</span>
              </div>
              <div>
                <span className="text-[#716D67] block">Branch / Dept:</span>
                <span className="font-bold text-[#242321]">{branch}</span>
              </div>
            </div>

            <p className="text-xs text-[#716D67]">
              Your instructor can now automatically import your profile into the course roster. You do not need to do anything further.
            </p>

            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setFullName("");
                setEmail("");
                setRollNumber("");
                setContactNumber("");
              }}
              className="text-xs font-semibold text-[#C84B18] hover:underline cursor-pointer"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Content Card */
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-8 shadow-xs space-y-6">
            
            {/* Form Title & Description Header */}
            <div className="space-y-2 border-b border-[#E5E0D8] pb-5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#242321] tracking-tight">
                {formMeta.title}
              </h1>
              {formMeta.description && (
                <p className="text-xs sm:text-sm text-[#716D67] leading-relaxed">
                  {formMeta.description}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8C827A]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C84B18]" />
                <span>Predefined 6-field student record format</span>
              </div>
            </div>

            {/* Error Notification */}
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {!formMeta.is_active ? (
              <div className="p-6 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-600 mx-auto" />
                <p className="text-sm font-bold text-[#242321]">Submissions Closed</p>
                <p className="text-xs text-[#716D67]">
                  The instructor has paused or closed registration for this form. Please contact your faculty.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#C84B18]" />
                      Full Name
                    </span>
                    <span className="text-[10px] text-[#C84B18] font-bold">Mandatory *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                  />
                </div>

                {/* 2. Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#C84B18]" />
                      Email Address
                    </span>
                    <span className="text-[10px] text-[#C84B18] font-bold">Mandatory *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                  />
                </div>

                {/* Grid: Roll Number & Contact Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 3. Roll Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-[#C84B18]" />
                        Roll Number / Student ID
                      </span>
                      <span className="text-[10px] text-[#C84B18] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS-2026-042"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all uppercase placeholder:normal-case placeholder:text-[#A8A29E]"
                    />
                  </div>

                  {/* 4. Contact Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#C84B18]" />
                        Contact Number
                      </span>
                      <span className="text-[10px] text-[#C84B18] font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                    />
                  </div>
                </div>

                {/* Grid: Section & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 5. Section */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Bookmark className="h-3.5 w-3.5 text-[#C84B18]" />
                        Section / Division
                      </span>
                      <span className="text-[10px] text-[#C84B18] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Section C"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                    />
                  </div>

                  {/* 6. Branch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#242321] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#C84B18]" />
                        Branch / Department
                      </span>
                      <span className="text-[10px] text-[#C84B18] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AIML / Computer Science"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E0D8] focus:border-[#C84B18] focus:ring-1 focus:ring-[#C84B18] outline-none transition-all placeholder:text-[#A8A29E]"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-[#C84B18] hover:bg-[#B33F10] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Your Information...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#8C827A] text-center mt-2">
                    No login required. Your information is securely sent directly to your course instructor.
                  </p>
                </div>

              </form>
            )}

          </div>
        )}

        <div className="text-center text-[11px] text-[#8C827A] space-y-1">
          <p>Powered by <span className="font-semibold text-[#242321]">TestoraQuiz</span> — Automated Examination & Student Management</p>
        </div>

      </div>
    </div>
  );
}
