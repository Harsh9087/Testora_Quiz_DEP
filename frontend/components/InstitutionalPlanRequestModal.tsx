"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  User,
  Briefcase,
  Globe,
  MapPin,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Layers,
  ShieldCheck,
  Send,
  Loader2,
  Coins
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InstitutionalPlanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVouchers?: number;
}

const AVAILABLE_FEATURES = [
  "AI Question Generation",
  "Printable Exam Papers",
  "Online Assessments",
  "Exam Monitoring / Proctoring",
  "Evaluation & Gradebook",
  "Department-Level Administration",
  "Custom Branding",
  "Faculty Training and Onboarding"
];

export default function InstitutionalPlanRequestModal({
  isOpen,
  onClose,
  defaultVouchers = 10
}: InstitutionalPlanRequestModalProps) {
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    designation: "",
    institution_name: "",
    institution_type: "College",
    website_url: "",
    state: "",
    city: "",
    department_count: 4,
    faculty_count: 50,
    student_count: 1500,
    vouchers_requested: defaultVouchers,
    credits_per_voucher: 10000,
    expected_implementation_date: "",
    selected_features: [
      "AI Question Generation",
      "Printable Exam Papers",
      "Online Assessments",
      "Department-Level Administration"
    ],
    additional_notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    reference_id: string;
    institution_name: string;
    email: string;
    vouchers_requested: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => {
      const exists = prev.selected_features.includes(feature);
      const next = exists
        ? prev.selected_features.filter((f) => f !== feature)
        : [...prev.selected_features, feature];
      return { ...prev, selected_features: next };
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validation
    if (!formData.full_name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg("Please provide a valid official email address.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setErrorMsg("Please provide a valid contact mobile number.");
      return;
    }
    if (!formData.designation.trim()) {
      setErrorMsg("Please specify your designation (e.g. Dean, HOD, Principal).");
      return;
    }
    if (!formData.institution_name.trim()) {
      setErrorMsg("Please enter the college or institution name.");
      return;
    }
    if (!formData.state.trim() || !formData.city.trim()) {
      setErrorMsg("Please provide both State and City.");
      return;
    }
    if (formData.selected_features.length === 0) {
      setErrorMsg("Please select at least one required feature.");
      return;
    }
    if (formData.vouchers_requested < 1) {
      setErrorMsg("Number of faculty vouchers must be at least 1.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch("/institutional-requests", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to submit institutional request");
      }

      setSuccessData({
        reference_id: data.reference_id,
        institution_name: formData.institution_name,
        email: formData.email,
        vouchers_requested: formData.vouchers_requested
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Institutional &amp; College Proposal
                </h3>
                <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Custom Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Apply for institutional onboarding, multi-department administration &amp; faculty vouchers.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
          {successData ? (
            /* Confirmation Screen */
            <div className="py-6 sm:py-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900 shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Status: Pending Review
                </span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Institutional Request Submitted!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Thank you, your application for <strong className="text-slate-900 dark:text-white">{successData.institution_name}</strong> has been received and securely registered.
                </p>
              </div>

              {/* Reference ID Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 max-w-md mx-auto space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Your Unique Reference ID
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-wider">
                    {successData.reference_id}
                  </span>
                  <button
                    onClick={() => handleCopyId(successData.reference_id)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                    title="Copy reference ID"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  Keep this ID for tracking your institutional quote and communications.
                </p>
              </div>

              {/* Next Steps Guidance */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-left space-y-2.5">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Next Steps</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>A confirmation email has been dispatched to <strong>{successData.email}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>Our Academic Solutions Director will evaluate your department count, requested {successData.vouchers_requested} vouchers (10,000 credits each), and feature requirements.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>We will reach out with a tailored institutional quotation and pilot onboarding roadmap within 24–48 business hours.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Offering Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/30 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-800/40 border border-blue-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Institutional Offering Summary
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Custom Super Admin Pricing
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>10,000 Credits</strong> per faculty voucher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Multi-department administrative supervision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Dedicated onboarding &amp; faculty training</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom branding on exam papers &amp; portals</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  * Note: Testora Quiz does not enforce fixed rigid pricing. Pricing proposals are customized based on institution scale, departments, and voucher volume upon Super Admin review.
                </p>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: Contact Person Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    1. Contact Person Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Sharma"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official Institutional Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. dean@college.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dean of Academics / Principal / HOD"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Institution Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    2. Institution Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      College / Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Institute of Technology & Engineering"
                      value={formData.institution_name}
                      onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Institution Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.institution_type}
                      onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="College">College</option>
                      <option value="University">University</option>
                      <option value="Coaching Institute">Coaching Institute / Academy</option>
                      <option value="School">School / Junior College</option>
                      <option value="Other">Other Educational Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      College Website <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://apextech.edu.in"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Number of Departments <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.department_count}
                      onChange={(e) => setFormData({ ...formData, department_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Approx. Faculty Members <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      required
                      value={formData.faculty_count}
                      onChange={(e) => setFormData({ ...formData, faculty_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Approximate Total Students <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500000}
                      required
                      value={formData.student_count}
                      onChange={(e) => setFormData({ ...formData, student_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Requirement Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    3. Requirement Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Required Faculty Vouchers <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      required
                      value={formData.vouchers_requested}
                      onChange={(e) => setFormData({ ...formData, vouchers_requested: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Each voucher enables 1 faculty member to create &amp; conduct exams.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Credits Per Voucher <span className="text-slate-400 font-normal">(Standard)</span>
                    </label>
                    <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="font-bold">10,000 Credits</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        10,000 Attempts
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Standard allocation for semester exams and continuous evaluations.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Implementation Timeline / Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Immediate / Within 30 days / Next Semester"
                      value={formData.expected_implementation_date}
                      onChange={(e) => setFormData({ ...formData, expected_implementation_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Multi-select features */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Required Features &amp; Modules <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_FEATURES.map((feature) => {
                        const checked = formData.selected_features.includes(feature);
                        return (
                          <button
                            type="button"
                            key={feature}
                            onClick={() => handleFeatureToggle(feature)}
                            className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                              checked
                                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300 shadow-xs"
                                : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                                checked
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{feature}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Requirements / Special Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about specific departments, integration needs, or campus assessment goals..."
                      value={formData.additional_notes}
                      onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Proposal...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Institutional Request</span>
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

