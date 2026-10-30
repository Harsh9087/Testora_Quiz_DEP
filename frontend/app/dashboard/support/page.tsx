"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  LifeBuoy, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Headphones
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SupportTicketItem {
  id: string;
  ticket_code: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  reference_code?: string;
  created_at: string;
}

interface SupportInfo {
  company_name: string;
  tagline: string;
  support_email: string;
  admin_email: string;
  phone_helpline: string;
  whatsapp_helpline: string;
  office_hours: string;
  sla_response_time: string;
  emergency_desk: string;
  headquarters: string;
}

export default function SupportPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null);
  const [myTickets, setMyTickets] = useState<SupportTicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Technical Support",
    priority: "Medium",
    reference_code: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    ticket_code: string;
    email: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // FAQ Search & Accordion State
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Active Tab: "new-ticket" or "my-tickets" or "faqs"
  const [activeTab, setActiveTab] = useState<"new-ticket" | "my-tickets" | "faqs">("new-ticket");

  useEffect(() => {
    // 1. Fetch user profile from localStorage or /auth/me
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      apiFetch("/auth/me", { token })
        .then(async (res) => {
          if (res.ok) {
            const userData = await res.json();
            if (userData && (userData.email || userData.name)) {
              setUser({
                name: userData.name || userData.full_name || "Rohit Shahare",
                email: userData.email || "shaharerohit47@gmail.com"
              });
              setFormData((prev) => ({
                ...prev,
                name: userData.name || userData.full_name || prev.name || "Rohit Shahare",
                email: userData.email || prev.email || "shaharerohit47@gmail.com"
              }));
            }
          }
        })
        .catch(() => {
          // Fallback to defaults
          setUser({ name: "Rohit Shahare", email: "shaharerohit47@gmail.com" });
          setFormData((prev) => ({
            ...prev,
            name: prev.name || "Rohit Shahare",
            email: prev.email || "shaharerohit47@gmail.com"
          }));
        });

      // 2. Load user's previous tickets
      loadMyTickets(token);
    } else {
      setUser({ name: "Rohit Shahare", email: "shaharerohit47@gmail.com" });
      setFormData((prev) => ({
        ...prev,
        name: prev.name || "Rohit Shahare",
        email: prev.email || "shaharerohit47@gmail.com"
      }));
    }

    // 3. Load company support info
    apiFetch("/support/info")
      .then(async (res) => {
        if (res.ok) {
          const info = await res.json();
          if (info) setSupportInfo(info);
        }
      })
      .catch(() => {
        setSupportInfo({
          company_name: "DPRAMP Tech Solutions",
          tagline: "AI-Powered Assessment & Educational Infrastructure",
          support_email: "support@dpramp.com",
          admin_email: "shaharerohit47@gmail.com",
          phone_helpline: "+91 91722 00000",
          whatsapp_helpline: "+91 91722 00000",
          office_hours: "Monday to Saturday, 9:00 AM – 8:00 PM IST",
          sla_response_time: "Average response within 2–4 hours",
          emergency_desk: "24/7 dedicated support for live proctoring & examination disruptions",
          headquarters: "Nagpur & Pune, Maharashtra, India"
        });
      });
  }, []);

  const loadMyTickets = async (authToken?: string | null) => {
    const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await apiFetch("/support/tickets", { token });
      if (res.ok) {
        const tickets = await res.json();
        if (Array.isArray(tickets)) {
          setMyTickets(tickets);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all required fields (Name, Email, Subject, Message).");
      return;
    }

    setSubmitting(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await apiFetch("/support/ticket", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setSubmitSuccess({
          ticket_code: data.ticket_code,
          email: formData.email,
          message: data.message
        });
        // Clear message fields but preserve name and email
        setFormData((prev) => ({
          ...prev,
          subject: "",
          reference_code: "",
          message: ""
        }));
        // Reload tickets list
        if (token) loadMyTickets(token);
      } else {
        setErrorMessage(data?.detail || "Could not submit ticket. Please try again or email support@dpramp.com directly.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Connection error. Please verify your internet or contact support@dpramp.com.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicketCode = () => {
    if (submitSuccess?.ticket_code) {
      navigator.clipboard.writeText(submitSuccess.ticket_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const faqs = [
    {
      q: "Where will I receive updates on my support ticket?",
      a: "A receipt confirmation is automatically dispatched to your registered email address (e.g. shaharerohit47@gmail.com) immediately after submission. All replies and engineering updates from DPRAMP Tech Solutions will be sent directly to that inbox."
    },
    {
      q: "How fast does DPRAMP Tech Solutions respond?",
      a: "Our standard response SLA is between 2 to 4 business hours (Monday – Saturday, 9:00 AM – 8:00 PM IST). For urgent proctoring disruptions during scheduled active examinations, our incident escalation desk responds with highest priority."
    },
    {
      q: "What should I do if an exam proctoring session freezes?",
      a: "Choose 'Live Proctoring & Exams' in the category dropdown with priority set to 'Critical / Urgent', and paste the exam code (e.g., ex-aiml2-2571). Our technical operations team will inspect the live session telemetry immediately."
    },
    {
      q: "How do credit balances and invoice queries work?",
      a: "Select 'Credits & Billing' and include any payment reference or order ID. Credits are credited instantly upon payment confirmation, and tax invoices are emailed to your registered address."
    },
    {
      q: "Can I directly email or chat with DPRAMP Tech Solutions?",
      a: "Yes! You can email us anytime at support@dpramp.com or contact our WhatsApp helpline at +91 91722 00000 for direct technical assistance."
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9] transition-colors pb-16">
      
      {/* 1. HERO BRANDING BANNER (DPRAMP TECH SOLUTIONS) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white border-b border-blue-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                DPRAMP Tech Solutions • Customer Care & Support
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Help & Technical Support Desk
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
                Need help with assessments, AI synthesis, student rosters, or live proctoring? Submit a ticket and get direct assistance from DPRAMP Tech Solutions engineers.
              </p>
            </div>

            {/* Live Uptime Pill */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl shrink-0">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Systems Operational</div>
                <div className="text-[11px] text-blue-200">99.98% Platform Uptime • Fast Email SLA</div>
              </div>
            </div>
          </div>

          {/* Quick-Contact Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-300">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-blue-200 block">Official Support Email:</span>
                <a href="mailto:support@dpramp.com" className="font-semibold text-white hover:underline">
                  support@dpramp.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-blue-200 block">Operating Hours:</span>
                <span className="font-semibold text-white">Mon – Sat: 9:00 AM – 8:00 PM IST</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-300">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-blue-200 block">Automated Dispatch:</span>
                <span className="font-semibold text-white">Confirmation sent to your registered email</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("new-ticket")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs transition-colors border-b-2 cursor-pointer ${
              activeTab === "new-ticket"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Submit New Ticket
          </button>

          <button
            onClick={() => setActiveTab("my-tickets")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs transition-colors border-b-2 cursor-pointer ${
              activeTab === "my-tickets"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            My Tickets
            {myTickets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {myTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs transition-colors border-b-2 cursor-pointer ${
              activeTab === "faqs"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base & FAQs
          </button>
        </div>

        {/* TAB 1: SUBMIT NEW TICKET */}
        {activeTab === "new-ticket" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Column (2 Cols) */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                
                {/* Registered Email Delivery Notice Banner */}
                <div className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 flex items-start gap-3.5">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong className="font-semibold block text-blue-950 dark:text-blue-100 mb-0.5">
                      Direct Email Confirmation Delivered to You:
                    </strong>
                    When you submit this ticket, an automated confirmation receipt with your unique ticket reference code will be dispatched to your registered email (<strong className="font-semibold">{formData.email || "shaharerohit47@gmail.com"}</strong>) and copied to DPRAMP Tech Solutions customer engineering desk.
                  </div>
                </div>

                {/* Success Message Alert */}
                {submitSuccess && (
                  <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                          Ticket Successfully Logged!
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">
                          Your ticket reference is{" "}
                          <span className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-100">
                            {submitSuccess.ticket_code}
                          </span>
                          . Confirmation has been emailed to <strong>{submitSuccess.email}</strong>.
                        </p>
                        
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={copyTicketCode}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedCode ? "Copied Reference!" : "Copy Ticket ID"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSubmitSuccess(null)}
                            className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                          >
                            Submit Another Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="text-xs text-rose-800 dark:text-rose-200">{errorMessage}</span>
                  </div>
                )}

                {/* The Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rohit Shahare"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>

                    {/* Registered Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Registered Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. shaharerohit47@gmail.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                        Confirmation & replies will arrive at this address.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Issue Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="Technical Support">Technical Support</option>
                        <option value="Live Proctoring & Exams">Live Proctoring & Exams</option>
                        <option value="Credits & Billing">Credits & Billing</option>
                        <option value="Question Bank & AI Studio">Question Bank & AI Studio</option>
                        <option value="Student Roster & Cohorts">Student Roster & Cohorts</option>
                        <option value="Account & Security">Account & Security</option>
                        <option value="Feature Suggestion">Feature Suggestion</option>
                        <option value="Other / General">Other / General</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="Low">Low — General inquiry</option>
                        <option value="Medium">Medium — Standard request</option>
                        <option value="High">High — Important workflow</option>
                        <option value="Critical">Critical — Live exam interrupted</option>
                      </select>
                    </div>

                    {/* Reference / Exam Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Exam / Ref Code <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.reference_code}
                        onChange={(e) => setFormData({ ...formData, reference_code: e.target.value })}
                        placeholder="e.g. ex-aiml2-2571"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject / Summary <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of the problem or question"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Detailed Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please include details such as candidate roll numbers, steps to reproduce, error text, or specific assessment details..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Powered by <strong>DPRAMP Tech Solutions</strong> support gateway
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Logging Ticket...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Submit Support Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Cards (1 Col) */}
            <div className="space-y-6">
              
              {/* Company Info Card */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">DPRAMP Tech Solutions</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise EdTech Operations</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Desk Email</span>
                      <a href="mailto:support@dpramp.com" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        support@dpramp.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Customer Helpline</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">+91 91722 00000</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Hours of Operation</span>
                      <span>Mon – Sat, 9:00 AM – 8:00 PM IST</span>
                    </div>
                  </div>
                </div>

                <hr className="my-5 border-slate-100 dark:border-slate-800" />

                <a
                  href="mailto:support@dpramp.com?subject=Inquiry%20from%20TestoraQuiz%20User"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  Direct Email to Support
                </a>
              </div>

              {/* Emergency Hotline Card */}
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  Live Exam Emergency
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  Exam Session Interrupted?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  If your students are actively sitting for an examination and experiencing network disconnection or camera sync failure, mark your priority as <strong>Critical</strong>.
                </p>
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 px-3 py-2 rounded-xl">
                  🚨 Priority live incident handling active 24/7
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: MY TICKETS */}
        {activeTab === "my-tickets" && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Support Tickets</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track tickets logged for {user?.email || "your registered account"}
                </p>
              </div>

              <button
                onClick={() => loadMyTickets()}
                disabled={loadingTickets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loadingTickets ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                Loading your support history...
              </div>
            ) : myTickets.length === 0 ? (
              <div className="py-12 text-center">
                <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Support Tickets Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When you submit a support ticket to DPRAMP Tech Solutions, it will be listed here with live status updates.
                </p>
                <button
                  onClick={() => setActiveTab("new-ticket")}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Your First Ticket
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myTickets.map((t) => (
                  <div key={t.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                          {t.ticket_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {t.subject}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.priority === "Critical" 
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : t.priority === "High"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {t.priority}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.status === "Open"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : t.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                      {t.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Category: <strong>{t.category}</strong></span>
                      {t.reference_code && (
                        <span>Ref: <strong className="font-mono">{t.reference_code}</strong></span>
                      )}
                      <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KNOWLEDGE BASE & FAQS */}
        {activeTab === "faqs" && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="max-w-2xl mb-8">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Find quick answers to common questions about DPRAMP Tech Solutions and Testora Quiz operations.
              </p>

              {/* Search input */}
              <div className="relative mt-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Accordion */}
            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
