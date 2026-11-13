"use client";

import { useEffect, useState } from "react";
import {
  Award, ShieldCheck, AlertTriangle, Download, Search,
  RefreshCw, CheckCircle2, XCircle, Mail, ExternalLink, Loader2, Ban
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/Toast";
import { formatLocalizedDate } from "@/lib/dateUtils";

export default function AdminCertificatesPage() {
  const { token } = useAuthStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokeModalCert, setRevokeModalCert] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (token) {
      loadOverview();
    }
  }, [token]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/certificates/admin/overview", { token });
      if (res.ok) {
        setData(await res.json());
      } else {
        showToast("Failed to load certificate economics overview", "error");
      }
    } catch {
      showToast("Network error connecting to certificate audit service", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeModalCert) return;
    if (!revokeReason.trim()) {
      showToast("Please provide a formal justification for certificate revocation.", "error");
      return;
    }
    setRevoking(true);
    try {
      const res = await apiFetch(`/certificates/admin/revoke/${revokeModalCert.id}`, {
        token,
        method: "POST",
        body: JSON.stringify({ revocation_reason: revokeReason.trim() }),
      });
      if (res.ok) {
        showToast(`Certificate ${revokeModalCert.certificate_code} has been revoked.`, "success");
        setRevokeModalCert(null);
        setRevokeReason("");
        loadOverview();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Revocation failed", "error");
      }
    } catch {
      showToast("Network error while revoking certificate", "error");
    } finally {
      setRevoking(false);
    }
  };

  const certList = data?.recent_certificates || [];
  const filteredCerts = certList.filter((c: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.recipient_name || "").toLowerCase().includes(q) ||
      (c.certificate_code || "").toLowerCase().includes(q) ||
      (c.exam_name_snapshot || "").toLowerCase().includes(q) ||
      (c.recipient_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Certificates &amp; Accreditation Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global governance of issued academic certificates, cryptographic validation, delivery status, and revocation logs.
          </p>
        </div>

        <button
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Certificates Issued
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.total_certificates_issued ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">Deducted 1 credit per cert</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Emails Delivered
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {data?.total_emails_sent ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Direct inbox delivery
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Email Delivery Failures
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {data?.total_emails_failed ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">Retryable via Drawer</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Revoked Certificates
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {data?.total_revoked ?? 0}
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Permanently flagged</span>
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="bg-white dark:bg-[#111C31] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Search Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, certificate code, or exam..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-slate-500">
            Showing {filteredCerts.length} recent issued certificates
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code &amp; Token</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Exam Title</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Score / Grade</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-600" />
                    Loading certificates audit trail...
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No issued certificates match your search query.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <div>{c.certificate_code}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                        {c.verification_token}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{c.recipient_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{c.recipient_email || "No email"}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate font-medium">
                      {c.exam_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {c.issue_date ? formatLocalizedDate(c.issue_date) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {c.percentage_snapshot !== null ? `${c.percentage_snapshot}%` : "—"}
                      {c.grade_snapshot ? ` (Gr: ${c.grade_snapshot})` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {c.email_status === "SENT" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sent</span>
                        </span>
                      ) : c.email_status === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_revoked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Revoked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Valid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`${API_V1}/certificates/download/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`/verify-certificate/${c.verification_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Public Seal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {!c.is_revoked && (
                          <button
                            onClick={() => {
                              setRevokeModalCert(c);
                              setRevokeReason("");
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Revoke Certificate"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Modal */}
      {revokeModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111C31] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Revoke Academic Certificate
                </h3>
                <p className="text-xs text-slate-500">
                  {revokeModalCert.certificate_code} • {revokeModalCert.recipient_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Revoking marks this credential permanently invalid on public verification pages. This action is audited with your administrator identity.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Formal Reason for Revocation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Integrity violation during proctoring, administrative error, or retracted qualification..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokeModalCert(null)}
                disabled={revoking}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revoking || !revokeReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                <span>Confirm Revocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

