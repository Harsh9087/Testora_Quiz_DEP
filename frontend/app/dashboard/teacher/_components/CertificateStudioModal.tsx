"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, Award, Check, RefreshCw, Palette, FileText, Image as ImageIcon, 
  Upload, ShieldCheck, Download, Eye, Sparkles, Building2, UserCheck, 
  Stamp, HelpCircle, AlertCircle, Coins, ExternalLink, ZoomIn
} from "lucide-react";
import { apiFetch, API_BASE } from "../../../../lib/api";
import { useToast } from "../../../../components/Toast";
import AppLogo from "../../../../components/AppLogo";

interface CertificateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string;
  examName?: string;
  instituteName?: string;
  passingMarks?: number;
  totalMarks?: number;
  token: string | null;
  onSaved?: (config: any) => void;
}

const TEMPLATES = [
  {
    id: "classic_academic",
    name: "Classic Academic",
    tagline: "Ivory, Academic Maroon & Collegiate Gold",
    bgClass: "bg-[#FFFDF8]",
    borderClass: "border-[#4A0404]",
    innerBorderClass: "border-[#B8860B]",
    accentColor: "#B8860B",
    primaryColor: "#4A0404",
    textColor: "text-[#4A0404]",
  },
  {
    id: "modern_professional",
    name: "Modern Professional",
    tagline: "Testora Navy, White & Restrained Gold",
    bgClass: "bg-white",
    borderClass: "border-[#0F172A]",
    innerBorderClass: "border-[#D97706]",
    accentColor: "#D97706",
    primaryColor: "#0F172A",
    textColor: "text-[#0F172A]",
  },
  {
    id: "minimal_blue",
    name: "Minimal Blue",
    tagline: "Cobalt Blue, Sapphire & Subtle Azure",
    bgClass: "bg-[#F8FAFC]",
    borderClass: "border-[#0B192C]",
    innerBorderClass: "border-[#0284C7]",
    accentColor: "#0284C7",
    primaryColor: "#0B192C",
    textColor: "text-[#0B192C]",
  },
  {
    id: "achievement_award",
    name: "Achievement Award",
    tagline: "Forest Emerald & Pure Gold Ribbon",
    bgClass: "bg-[#FCFDFB]",
    borderClass: "border-[#064E3B]",
    innerBorderClass: "border-[#D97706]",
    accentColor: "#D97706",
    primaryColor: "#064E3B",
    textColor: "text-[#064E3B]",
  }
];

export default function CertificateStudioModal({
  isOpen,
  onClose,
  examId,
  examName = "Mid-Term Academic Examination",
  instituteName = "",
  passingMarks = 40,
  totalMarks = 100,
  token,
  onSaved,
}: CertificateStudioModalProps) {
  const { showToast } = useToast();

  // Active Editor Tab
  const [activeTab, setActiveTab] = useState<"template" | "content" | "branding" | "signatories" | "criteria">("template");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingSample, setDownloadingSample] = useState(false);

  // Form State
  const [isEnabled, setIsEnabled] = useState(true);
  const [templateId, setTemplateId] = useState("modern_professional");
  const [certTitle, setCertTitle] = useState("Certificate of Excellence");
  const [certSubtitle, setCertSubtitle] = useState("This is to certify that");
  const [customText, setCustomText] = useState("");
  const [instName, setInstName] = useState(instituteName || "");
  const [instLogoUrl, setInstLogoUrl] = useState("");
  const [signatoryName, setSignatoryName] = useState("Academic Director");
  const [signatoryDesig, setSignatoryDesig] = useState("Head of Examination");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [stampUrl, setStampUrl] = useState("");
  const [secSignatoryName, setSecSignatoryName] = useState("");
  const [secSignatoryDesig, setSecSignatoryDesig] = useState("");
  const [secSignatureUrl, setSecSignatureUrl] = useState("");
  const [showMarks, setShowMarks] = useState(false);
  const [showPercentage, setShowPercentage] = useState(true);
  const [showGrade, setShowGrade] = useState(false);
  const [passingType, setPassingType] = useState("PERCENTAGE");
  const [passingVal, setPassingVal] = useState(40.0);
  const [footerMsg, setFooterMsg] = useState("Verified & Issued securely via Testora Quiz Examination Platform");

  // Mobile preview expansion
  const [mobilePreviewZoom, setMobilePreviewZoom] = useState(false);

  // Load existing configuration from backend if examId exists
  useEffect(() => {
    if (isOpen && examId && token) {
      loadConfig();
    }
  }, [isOpen, examId, token]);

  const loadConfig = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/certificates/exam/${examId}/config`, { token });
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.is_enabled ?? true);
        const loadedTid = data.template_id || "modern_professional";
        setTemplateId(loadedTid === "testora_default" ? "modern_professional" : loadedTid);
        setCertTitle(data.certificate_title || "Certificate of Excellence");
        setCertSubtitle(data.certificate_subtitle || "This is to certify that");
        setCustomText(data.custom_text || "");
        setInstName(data.institute_name || instituteName || "");
        setInstLogoUrl(data.institute_logo_url || "");
        setSignatoryName(data.signatory_name || "Academic Director");
        setSignatoryDesig(data.signatory_designation || "Head of Examination");
        setSignatureUrl(data.signature_url || "");
        setStampUrl(data.stamp_url || "");
        setSecSignatoryName(data.secondary_signatory_name || "");
        setSecSignatoryDesig(data.secondary_signatory_designation || "");
        setSecSignatureUrl(data.secondary_signature_url || "");
        setShowMarks(Boolean(data.show_marks));
        setShowPercentage(data.show_percentage !== undefined ? Boolean(data.show_percentage) : true);
        setShowGrade(Boolean(data.show_grade));
        setPassingType(data.passing_criteria_type || "PERCENTAGE");
        setPassingVal(data.passing_criteria_value || 40.0);
        setFooterMsg(data.footer_message || "Verified & Issued securely via Testora Quiz Examination Platform");
      }
    } catch {
      showToast("Could not load certificate configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    setTemplateId("testora_default");
    setCertTitle("Certificate of Excellence");
    setCertSubtitle("This is to certify that");
    setCustomText("");
    setInstName(instituteName || "");
    setInstLogoUrl("");
    setSignatoryName("Academic Director");
    setSignatoryDesig("Head of Examination");
    setSignatureUrl("");
    setStampUrl("");
    setSecSignatoryName("");
    setSecSignatoryDesig("");
    setSecSignatureUrl("");
    setShowMarks(false);
    setShowPercentage(true);
    setShowGrade(false);
    setPassingType("PERCENTAGE");
    setPassingVal(40.0);
    setFooterMsg("Verified & Issued securely via Testora Quiz Examination Platform");
    showToast("Reset to official Testora Quiz default certificate design.", "info");
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const payload = {
      is_enabled: isEnabled,
      template_id: templateId,
      passing_criteria_type: passingType,
      passing_criteria_value: Number(passingVal),
      certificate_title: certTitle,
      certificate_subtitle: certSubtitle,
      custom_text: customText || null,
      footer_message: footerMsg,
      institute_name: instName || null,
      institute_logo_url: instLogoUrl || null,
      signatory_name: signatoryName || null,
      signatory_designation: signatoryDesig || null,
      signature_url: signatureUrl || null,
      stamp_url: stampUrl || null,
      secondary_signatory_name: secSignatoryName || null,
      secondary_signatory_designation: secSignatoryDesig || null,
      secondary_signature_url: secSignatureUrl || null,
      show_marks: showMarks,
      show_percentage: showPercentage,
      show_grade: showGrade,
    };

    try {
      if (examId) {
        const res = await apiFetch(`/certificates/exam/${examId}/config`, {
          token,
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const savedData = await res.json();
          showToast("Certificate settings applied to examination successfully!", "success");
          if (onSaved) onSaved(savedData);
          onClose();
        } else {
          showToast("Failed to save certificate configuration.", "error");
        }
      } else {
        // Return config to parent wizard
        if (onSaved) onSaved(payload);
        showToast("Certificate configuration updated for this assessment.", "success");
        onClose();
      }
    } catch {
      showToast("Network error while saving certificate configuration.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSamplePDF = async () => {
    setDownloadingSample(true);
    try {
      const payload = {
        template_id: templateId,
        certificate_title: certTitle,
        certificate_subtitle: certSubtitle,
        custom_text: customText || undefined,
        institute_name: instName || undefined,
        institute_logo_url: instLogoUrl || undefined,
        signatory_name: signatoryName || undefined,
        signatory_designation: signatoryDesig || undefined,
        secondary_signatory_name: secSignatoryName || undefined,
        secondary_signatory_designation: secSignatoryDesig || undefined,
        show_marks: showMarks,
        show_percentage: showPercentage,
        show_grade: showGrade,
        footer_message: footerMsg,
        sample_student_name: "Aarav Sharma",
        sample_exam_name: examName,
        sample_score: 88.0,
        sample_total_marks: Number(totalMarks) || 100.0,
        sample_percentage: 88.0,
        sample_grade: "A+"
      };

      const res = await apiFetch("/certificates/preview-sample", {
        token,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Sample_Certificate_${templateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast("Sample certificate PDF downloaded successfully!", "success");
      } else {
        showToast("Could not generate sample PDF.", "error");
      }
    } catch {
      showToast("Network error generating sample PDF.", "error");
    } finally {
      setDownloadingSample(false);
    }
  };

  if (!isOpen) return null;

  const currentTheme = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-[#111C31]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Passing Certificate Studio & Designer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Ready-to-Use
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Testora Quiz branded certificate automatically generated and delivered to students who pass.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Two-Panel Layout) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* ══════════════════════════════════════════════════════
              LEFT PANEL: REAL-TIME LANDSCAPE A4 CERTIFICATE PREVIEW
             ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100/70 dark:bg-[#070D1A] flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 relative">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span>Live Certificate Preview (Landscape A4)</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadSamplePDF}
                disabled={downloadingSample}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>{downloadingSample ? "Generating..." : "Download Sample PDF"}</span>
              </button>
            </div>

            {/* Certificate A4 Frame Container */}
            <div className="w-full max-w-[620px] aspect-[1.414/1] bg-white rounded-xl shadow-xl border-4 border-slate-900 relative p-4 sm:p-6 flex flex-col justify-between select-none overflow-hidden text-slate-900 transition-all">
              
              {/* Inner Gold Frame */}
              <div 
                className="absolute inset-1.5 sm:inset-2.5 border-2 rounded-lg pointer-events-none"
                style={{ borderColor: currentTheme.accentColor }}
              />
              <div className="absolute inset-2 sm:inset-3 border border-slate-300 rounded pointer-events-none" />

              {/* Top Header Bar: Testora Quiz Logo & Institute Name */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/40 relative z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-black text-xs sm:text-sm tracking-tight text-slate-900">
                    <span className="text-blue-700">TESTORA</span>
                    <span className="text-amber-600">QUIZ</span>
                  </div>
                  <span className="hidden xs:inline-block px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 font-bold text-[8px] uppercase tracking-wider">
                    Verified
                  </span>
                </div>

                <div className="text-right truncate max-w-[200px]">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase truncate">
                    {instName || "Accredited Examination Centre"}
                  </div>
                  <div className="text-[8px] text-slate-500">Official Educational Provider</div>
                </div>
              </div>

              {/* Certificate Heading & Title */}
              <div className="text-center my-auto py-1 sm:py-2 relative z-10 space-y-1">
                <h3 
                  className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wider"
                  style={{ color: currentTheme.primaryColor }}
                >
                  {certTitle}
                </h3>
                <div 
                  className="w-24 h-0.5 mx-auto rounded-full" 
                  style={{ backgroundColor: currentTheme.accentColor }} 
                />
                <p className="text-[9px] sm:text-[11px] italic text-slate-500 pt-0.5">
                  {certSubtitle}
                </p>

                {/* Recipient Student Name */}
                <div className="py-1">
                  <div 
                    className="text-base sm:text-2xl font-black tracking-tight"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    Aarav Sharma
                  </div>
                  <div className="w-48 h-0.5 mx-auto bg-amber-500/40 mt-0.5" />
                  <div className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">
                    Roll Number: STU-2026-PREVIEW
                  </div>
                </div>

                {/* Presentation Statement */}
                <p className="text-[9px] sm:text-[11px] text-slate-600 max-w-md mx-auto leading-tight">
                  has successfully appeared and passed the examination with meritorious performance in
                </p>
                <p 
                  className="text-xs sm:text-sm font-black truncate max-w-md mx-auto"
                  style={{ color: currentTheme.primaryColor }}
                >
                  &ldquo;{examName}&rdquo;
                </p>

                {/* Performance Badge */}
                {(showPercentage || showMarks || showGrade) && (
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-50 border border-amber-500/40 text-[9px] sm:text-[10px] font-bold text-slate-800 mt-1 shadow-2xs">
                    {showMarks && <span>Score: 88 / {totalMarks}</span>}
                    {showMarks && (showPercentage || showGrade) && <span>•</span>}
                    {showPercentage && <span>88.0%</span>}
                    {showPercentage && showGrade && <span>•</span>}
                    {showGrade && <span className="text-emerald-700">Grade: A+</span>}
                  </div>
                )}
              </div>

              {/* Bottom Signatures & QR Section */}
              <div className="relative z-10 pt-2 border-t border-amber-500/40 flex items-end justify-between gap-2 shrink-0 text-left">
                {/* Primary Signatory */}
                <div className="text-center w-28 sm:w-36">
                  <div className="h-6 flex items-center justify-center italic text-xs font-bold text-slate-700 font-serif">
                    {signatoryName}
                  </div>
                  <div className="w-full border-t border-slate-300 mt-0.5 pt-0.5">
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-800 truncate">{signatoryName}</div>
                    <div className="text-[7px] sm:text-[8px] text-slate-500 truncate">{signatoryDesig}</div>
                  </div>
                </div>

                {/* Center Official Gold Seal */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 text-center"
                    style={{ borderColor: currentTheme.accentColor }}
                  >
                    <span className="text-[6px] font-bold uppercase" style={{ color: currentTheme.accentColor }}>Official</span>
                    <span className="text-[8px] font-black uppercase text-amber-700">Verified</span>
                    <span className="text-[6px] font-bold uppercase text-slate-600">Testora</span>
                  </div>
                </div>

                {/* Verification QR Mock & Secondary Signatory */}
                <div className="text-right w-28 sm:w-36">
                  <div className="text-[8px] font-mono font-bold text-slate-700">TQ-CERT-2026-PREVIEW</div>
                  <div className="text-[7px] text-slate-400">Scan QR to verify authenticity</div>
                  <div className="text-[7px] text-slate-400">{new Date().toLocaleDateString()}</div>
                </div>
              </div>

            </div>

            {/* Note on Fixed Testora Branding */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 max-w-md text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Official Testora Quiz cryptographic verification is permanently embedded. Institute customization is added seamlessly alongside it.</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT PANEL: CERTIFICATE CONFIGURATION CONTROLS
             ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between space-y-4 overflow-y-auto">
            
            <div className="space-y-4">
              {/* Enable / Disable Master Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Enable Certificate for Qualified Students</div>
                  <div className="text-[11px] text-slate-500">Automatically deliver to students who qualify</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("template")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "template"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Templates ({TEMPLATES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "content"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Headings & Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("branding")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "branding"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Institute Branding
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signatories")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "signatories"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Signatures & Stamp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("criteria")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "criteria"
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Passing Criteria
                </button>
              </div>

              {/* ── TAB 1: TEMPLATE SELECTION ── */}
              {activeTab === "template" && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Certificate Style
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TEMPLATES.map((tmpl) => {
                      const isSelected = templateId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => setTemplateId(tmpl.id)}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-600/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {tmpl.name}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{tmpl.tagline}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span 
                              className="w-3 h-3 rounded-full border border-black/10" 
                              style={{ backgroundColor: tmpl.primaryColor }} 
                            />
                            <span 
                              className="w-3 h-3 rounded-full border border-black/10" 
                              style={{ backgroundColor: tmpl.accentColor }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TAB 2: CONTENT & HEADINGS ── */}
              {activeTab === "content" && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Certificate Heading
                    </label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      placeholder="e.g. Certificate of Excellence"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Certificate Subtitle
                    </label>
                    <input
                      type="text"
                      value={certSubtitle}
                      onChange={(e) => setCertSubtitle(e.target.value)}
                      placeholder="e.g. This is to certify that"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Citation Statement (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. for exemplary academic performance and mastery in curriculum competencies."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-600 resize-none"
                    />
                  </div>

                  {/* Performance Badges Toggles */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Performance Display Badges</span>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPercentage}
                          onChange={(e) => setShowPercentage(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium text-[11px]">Percentage</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showMarks}
                          onChange={(e) => setShowMarks(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium text-[11px]">Score / Marks</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showGrade}
                          onChange={(e) => setShowGrade(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium text-[11px]">Letter Grade</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: INSTITUTE BRANDING ── */}
              {activeTab === "branding" && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Institute / Organization Name
                    </label>
                    <input
                      type="text"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      placeholder="e.g. St. Xavier High School / Apex Coaching Institute"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rendered on the top right header as the accrediting educational provider.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Institute Stamp / Seal Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={stampUrl}
                      onChange={(e) => setStampUrl(e.target.value)}
                      placeholder="e.g. Verified Educational Stamp"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* ── TAB 4: SIGNATORIES ── */}
              {activeTab === "signatories" && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Primary Signatory</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500">Signatory Full Name</label>
                        <input
                          type="text"
                          value={signatoryName}
                          onChange={(e) => setSignatoryName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh Sharma"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Designation / Role</label>
                        <input
                          type="text"
                          value={signatoryDesig}
                          onChange={(e) => setSignatoryDesig(e.target.value)}
                          placeholder="e.g. Principal & Director"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Secondary Signatory (Optional)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500">Name</label>
                        <input
                          type="text"
                          value={secSignatoryName}
                          onChange={(e) => setSecSignatoryName(e.target.value)}
                          placeholder="e.g. Prof. Meera Nair"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Designation</label>
                        <input
                          type="text"
                          value={secSignatoryDesig}
                          onChange={(e) => setSecSignatoryDesig(e.target.value)}
                          placeholder="e.g. Course Coordinator"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: PASSING CRITERIA & CREDITS ── */}
              {activeTab === "criteria" && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-slate-800 dark:text-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Passing Qualification Rule</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Only students who score at or above this threshold on their official finalized submission will receive passing certificates. Failing or absent students will not receive certificates.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold block mb-1">Passing Threshold (%)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={passingVal}
                          onChange={(e) => setPassingVal(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-bold block mb-1">Exam Passing Marks</label>
                        <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          {passingMarks} / {totalMarks}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credit Estimation Box */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Coins className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-blue-950 dark:text-blue-200">
                          Credit Pricing: 1 Credit per Issued Certificate
                        </div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-300">
                          Credits are deducted ONLY when a qualified student successfully receives their certificate.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Apply & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

