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
  ArrowRight,
  ShieldCheck,
  Send,
  Building2
} from "lucide-react";
import { API_V1 } from "../../../lib/api";
import ThemeToggle from "../../../components/ThemeToggle";
import AppLogo from "../../../components/AppLogo";

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
      } catch {
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
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setSubmitError(err.detail || "A student with this email or roll number has already registered.");
        } else {
          setSubmitError(err.detail || "Failed to submit registration. Please try again.");
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-10 h-10 border-3 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#64748B] dark:text-[#A3B1C6]">Loading student registration form...</p>
      </div>
    );
  }

  if (metaError || !formMeta) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#111C31] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#263449] shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] dark:text-[#F1F5F9]">Form Unavailable</h2>
          <p className="text-sm text-[#64748B] dark:text-[#A3B1C6]">{metaError || "Registration form not found."}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md transition-all"
          >
            Go to TestoraQuiz Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col justify-center p-3 sm:p-5 text-[#111827] dark:text-[#F1F5F9] transition-colors">
      <div className="max-w-2xl w-full mx-auto space-y-3.5 my-auto">
        
        {/* Brand Banner */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] dark:border-[#263449]">
          <div className="flex items-center gap-2.5">
            <AppLogo variant="row" height={28} />
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {formMeta.is_active ? "Registration Open" : "Form Closed"}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {submittedSuccess ? (
          /* Submission Success View */
          <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6 sm:p-10 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-[#111827] dark:text-[#F1F5F9]">Registration Submitted!</h1>
              <p className="text-sm text-[#64748B] dark:text-[#A3B1C6]">
                Thank you, <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">{fullName}</span>. Your details have been successfully recorded for:
              </p>
              <div className="inline-block mt-1 px-3 py-1 bg-[#EFF6FF] dark:bg-[#172B4D] border border-[#2563EB]/30 rounded-lg text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                {formMeta.title}
              </div>
            </div>

            {/* Submitted Summary Box */}
            <div className="bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] dark:text-[#A3B1C6] block">Roll Number:</span>
                <span className="font-bold text-[#111827] dark:text-[#F1F5F9]">{rollNumber}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#A3B1C6] block">Email:</span>
                <span className="font-bold text-[#111827] dark:text-[#F1F5F9] truncate block">{email}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#A3B1C6] block">Section:</span>
                <span className="font-bold text-[#111827] dark:text-[#F1F5F9]">{section}</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-[#A3B1C6] block">Branch / Dept:</span>
                <span className="font-bold text-[#111827] dark:text-[#F1F5F9]">{branch}</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
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
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Content Card */
          <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-4 sm:p-6 shadow-xl space-y-3.5">
            
            {/* Form Title & Description Header */}
            <div className="space-y-1 border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-[#F1F5F9] tracking-tight">
                {formMeta.title}
              </h1>
              {formMeta.description && (
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6] leading-relaxed">
                  {formMeta.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-[#64748B] dark:text-[#A3B1C6]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>Predefined 6-field student record format</span>
              </div>
            </div>

            {/* Error Notification */}
            {submitError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {!formMeta.is_active ? (
              <div className="p-6 bg-[#F8FAFC] dark:bg-[#17243A] border border-[#E2E8F0] dark:border-[#263449] rounded-xl text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">Submissions Closed</p>
                <p className="text-xs text-[#64748B] dark:text-[#A3B1C6]">
                  The instructor has paused or closed registration for this form. Please contact your faculty.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Row 1: Full Name & Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* 1. Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Full Name
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">Mandatory *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>

                  {/* 2. Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Email Address
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">Mandatory *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>

                {/* Row 2: Roll Number & Contact Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* 3. Roll Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Roll Number / Student ID
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS-2026-042"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all uppercase placeholder:normal-case placeholder:text-[#94A3B8]"
                    />
                  </div>

                  {/* 4. Contact Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Contact Number
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>

                {/* Row 3: Section & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* 5. Section */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Bookmark className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Section / Division
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Section C"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>

                  {/* 6. Branch */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827] dark:text-[#F1F5F9] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                        Branch / Department
                      </span>
                      <span className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AIML / Computer Science"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#17243A] text-[#111827] dark:text-[#F1F5F9] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-60"
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
                  <p className="text-[11px] text-[#64748B] dark:text-[#A3B1C6] text-center mt-2">
                    No login required. Your information is securely sent directly to your course instructor.
                  </p>
                </div>

              </form>
            )}

          </div>
        )}

        <div className="text-center text-[11px] text-[#64748B] dark:text-[#A3B1C6] space-y-1">
          <p>Powered by <span className="font-semibold text-[#111827] dark:text-[#F1F5F9]">TestoraQuiz</span> — Automated Examination & Student Management</p>
        </div>

      </div>
    </div>
  );
}
