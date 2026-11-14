"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Award, CheckCircle2, AlertTriangle, Download,
  ExternalLink, Building2, Calendar, FileText, Check, Copy, ArrowLeft, Loader2
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { API_BASE, API_V1, getApiV1 } from "@/lib/api";
import { formatLocalizedDate } from "@/lib/dateUtils";

interface VerifyData {
  is_valid: boolean;
  status: "VALID" | "REVOKED" | "NOT_FOUND";
  certificate_code?: string;
  recipient_name?: string;
  recipient_roll_number?: string;
  exam_name?: string;
  institute_name?: string;
  issue_date?: string;
  score?: number;
  total_marks?: number;
  percentage?: number;
  grade?: string;
  is_revoked?: boolean;
  revocation_reason?: string;
  download_url?: string;
  message?: string;
}

export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const certId = (params?.certId as string) || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (certId) {
      verifyCert();
    }
  }, [certId]);

  const verifyCert = async () => {
    setLoading(true);
    try {
      const apiEndpoint = getApiV1();
      const res = await fetch(`${apiEndpoint}/certificates/verify/${encodeURIComponent(certId)}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setData({
          is_valid: false,
          status: "NOT_FOUND",
          message: "Certificate not found or invalid verification token.",
        });
      }
    } catch {
      setData({
        is_valid: false,
        status: "NOT_FOUND",
        message: "Unable to connect to verification server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C31] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo variant="row" height={32} showBadge={false} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Public Verification Portal</span>
            </span>
            <Link
              href="/"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Cryptographically verifying academic certificate token...
            </p>
          </div>
        ) : !data || data.status === "NOT_FOUND" ? (
          <div className="bg-white dark:bg-[#111C31] border border-rose-200 dark:border-rose-900/40 rounded-3xl p-6 sm:p-10 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Certificate Not Found
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              The certificate token or ID <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">{certId}</code> does not match any accredited certificate on Testora Quiz.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        ) : data.is_revoked || data.status === "REVOKED" ? (
          <div className="bg-white dark:bg-[#111C31] border border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">Certificate Revoked</h2>
                <p className="text-xs mt-0.5">
                  This academic credential was officially revoked by the issuing authority and is no longer valid.
                </p>
                {data.revocation_reason && (
                  <p className="text-xs font-semibold mt-1">Reason: {data.revocation_reason}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Recipient</span>
                  <span className="text-sm font-bold">{data.recipient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Examination</span>
                  <span className="text-sm font-bold">{data.exam_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Issuing Authority</span>
                  <span className="text-sm font-bold">{data.institute_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Credential Code</span>
                  <span className="font-mono font-bold text-sm">{data.certificate_code}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Valid Certificate Verification Card */
          <div className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6 animate-fadeIn">
            {/* Top Verified Seal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Verified &amp; Authentic
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {data.certificate_code}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Official Certificate of Achievement
                  </h1>
                </div>
              </div>

              {/* Copy verification button */}
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied!" : "Share Verification"}</span>
              </button>
            </div>

            {/* Recipient Spotlight */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Awarded To
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {data.recipient_name}
              </div>
              {data.recipient_roll_number && (
                <div className="text-xs font-mono text-slate-500 pt-0.5">
                  Roll / Candidate ID: {data.recipient_roll_number}
                </div>
              )}
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-[#17243A]/50 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Examination / Course
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {data.exam_name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Issuing Organization
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{data.institute_name || "Testora Academy"}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Date of Conferral
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{data.issue_date ? formatLocalizedDate(data.issue_date) : "Official Record"}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Academic Performance
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  {data.percentage !== undefined && data.percentage !== null && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {data.percentage}% Score
                    </span>
                  )}
                  {data.grade && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Grade {data.grade}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Download and Verification Action */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {data.is_valid && !data.is_revoked && (
                <a
                  href={
                    data.download_url
                      ? (data.download_url.startsWith("http") ? data.download_url : `${API_BASE}${data.download_url}`)
                      : `${API_V1}/certificates/download-public/${encodeURIComponent(data.certificate_code || certId)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Vector PDF</span>
                </a>
              )}
            </div>

            {/* Privacy & Authenticity Disclaimer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1 leading-relaxed">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Permanent Cryptographic Guarantee</span>
              </div>
              <p>
                This digital credential was generated by Testora Quiz RAG Assessment Infrastructure and signed cryptographically. Employers, educational institutions, and recruiters can confirm authenticity at any time using this official URL or by scanning the embedded certificate QR code.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 bg-white dark:bg-[#111C31]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AppLogo variant="row" height={22} showBadge={false} />
            <span>&copy; {new Date().getFullYear()} Testora Quiz. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

