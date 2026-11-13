"use client";

import { useState, useEffect } from "react";
import { 
  X, Award, Download, Send, CheckCircle2, AlertCircle, Clock, 
  ExternalLink, Copy, Check, RefreshCw, FileArchive, Search, ShieldCheck, Mail
} from "lucide-react";
import { apiFetch, API_BASE } from "../../../../lib/api";
import { useToast } from "../../../../components/Toast";

interface CertificateManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examName: string;
  token: string | null;
  onOpenDesigner?: () => void;
}

export default function CertificateManagementDrawer({
  isOpen,
  onClose,
  examId,
  examName,
  token,
  onOpenDesigner,
}: CertificateManagementDrawerProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [generatingNow, setGeneratingNow] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (isOpen && examId) {
      loadStatus();
    }
  }, [isOpen, examId]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/certificates/exam/${examId}/status`, { token });
      if (res.ok) {
        setData(await res.json());
      } else {
        showToast("Could not load certificates status.", "error");
      }
    } catch {
      showToast("Network error loading certificates.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNow = async () => {
    setGeneratingNow(true);
    try {
      const res = await apiFetch(`/certificates/exam/${examId}/generate-now`, {
        token,
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        showToast(`Generation completed! ${result.generated_count} new certificates issued.`, "success");
        loadStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Generation failed. Verify exam results are published.", "error");
      }
    } catch {
      showToast("Network error generating certificates.", "error");
    } finally {
      setGeneratingNow(false);
    }
  };

  const handleBulkDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await apiFetch(`/certificates/exam/${examId}/bulk-download`, { token });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Certificates_${examName.replace(/\s+/g, "_")}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast("Certificates ZIP archive downloaded!", "success");
      } else {
        showToast("No certificates available to bundle into ZIP.", "error");
      }
    } catch {
      showToast("Error downloading ZIP archive.", "error");
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadSingle = async (certId: string, certCode: string) => {
    try {
      const res = await apiFetch(`/certificates/download/${certId}`, { token });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${certCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        showToast("Could not download certificate PDF.", "error");
      }
    } catch {
      showToast("Error downloading certificate.", "error");
    }
  };

  const handleResendEmail = async (certId: string) => {
    setResendingId(certId);
    try {
      const res = await apiFetch(`/certificates/${certId}/resend-email`, {
        token,
        method: "POST",
      });
      if (res.ok) {
        showToast("Certificate delivery email resent successfully!", "success");
        loadStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Could not resend email.", "error");
      }
    } catch {
      showToast("Network error while resending email.", "error");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyVerificationLink = (tokenStr: string, idStr: string) => {
    const link = `https://testoraquiz.com/verify-certificate/${tokenStr}`;
    navigator.clipboard.writeText(link);
    setCopiedId(idStr);
    showToast("Verification link copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  const certificatesList: any[] = data?.certificates || [];
  const filteredCerts = certificatesList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.recipient_name?.toLowerCase().includes(q) ||
      c.recipient_email?.toLowerCase().includes(q) ||
      c.certificate_code?.toLowerCase().includes(q) ||
      c.recipient_roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C31] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60 dark:bg-[#17243A]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Examination Certificates Management
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {data?.template_id || "Testora Default"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md sm:max-w-xl">
                {examName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh certificate roster"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metric Cards Summary */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#111C31]">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#17243A] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Eligible Students</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {data?.eligible_count ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Qualified {data?.passing_criteria_type === "PERCENTAGE" ? `≥ ${data?.passing_criteria_value}%` : `≥ ${data?.passing_criteria_value} pts`}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Generated</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
              {data?.certificates_generated ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              PDFs stored & verifiable
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Emails Sent</div>
            <div className="text-xl sm:text-2xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
              {data?.emails_sent ?? 0}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
              Direct inbox delivery
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending / Retry</div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
              {(data?.emails_pending ?? 0) + (data?.emails_failed ?? 0)}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              {data?.emails_failed ?? 0} failed dispatches
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30 dark:bg-[#111C31]">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, roll, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17243A] text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {onOpenDesigner && (
              <button
                type="button"
                onClick={onOpenDesigner}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Edit Design
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateNow}
              disabled={generatingNow}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingNow ? "animate-spin" : ""}`} />
              <span>{generatingNow ? "Issuing..." : "Issue / Sync Certificates"}</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDownloadZip}
              disabled={downloadingZip || certificatesList.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileArchive className="h-3.5 w-3.5" />
              <span>{downloadingZip ? "Archiving..." : "Download All as ZIP"}</span>
            </button>
          </div>
        </div>

        {/* Certificate Roster Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredCerts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Award className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchQuery ? "No certificates matching search." : "No qualified student certificates issued yet."}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Certificates are automatically issued when students qualify the exam and results are published. Tap &ldquo;Issue / Sync Certificates&rdquo; above to run generation now.
              </p>
            </div>
          ) : (
            filteredCerts.map((cert) => (
              <div 
                key={cert.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-[#17243A] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {cert.recipient_name}
                      </span>
                      {cert.recipient_roll_number && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-mono">
                          {cert.recipient_roll_number}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 truncate">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{cert.certificate_code}</span>
                      <span>•</span>
                      <span>Score: {cert.score_snapshot} / {cert.total_marks_snapshot} ({cert.percentage_snapshot}%)</span>
                      <span>•</span>
                      <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Email Delivery Badge */}
                  {cert.email_status === "SENT" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Delivered</span>
                    </span>
                  ) : cert.email_status === "FAILED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-800" title={cert.email_error || "Email failed"}>
                      <AlertCircle className="h-3 w-3" />
                      <span>Failed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{cert.email_status === "NO_EMAIL" ? "No Email" : "Pending"}</span>
                    </span>
                  )}

                  {/* Copy Public Link */}
                  <button
                    type="button"
                    onClick={() => handleCopyVerificationLink(cert.verification_token, cert.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Copy QR Verification Link"
                  >
                    {copiedId === cert.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  {/* Resend Email */}
                  {cert.recipient_email && (
                    <button
                      type="button"
                      onClick={() => handleResendEmail(cert.id)}
                      disabled={resendingId === cert.id}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                      title="Resend Certificate Email to Student"
                    >
                      <Mail className={`h-3.5 w-3.5 ${resendingId === cert.id ? "animate-spin" : ""}`} />
                    </button>
                  )}

                  {/* Download Individual PDF */}
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(cert.id, cert.certificate_code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

