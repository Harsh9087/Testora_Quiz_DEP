"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Ticket,
  Plus,
  Download,
  Ban,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  Search,
  X,
  FileSpreadsheet
} from "lucide-react";
import { apiFetch, API_V1 } from "@/lib/api";

interface CouponItem {
  id: string;
  campaign_id: string;
  code: string;
  credits: number;
  status: string;
  redeemed_by_user_id?: string;
  redeemed_at?: string;
  revoked_at?: string;
  created_at: string;
}

interface CampaignItem {
  id: string;
  name: string;
  description?: string;
  code_prefix: string;
  credits_per_coupon: number;
  credit_type: string;
  bonus_expiry_days?: number;
  total_coupons: number;
  redeemed_count: number;
  revoked_count: number;
  expires_at?: string;
  is_active: boolean;
  allowed_roles: string;
  max_redemptions_per_user: number;
  created_at: string;
  coupons?: CouponItem[];
}

export default function AdminCouponsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create Campaign Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrefix, setFormPrefix] = useState("TESTORA-");
  const [formCredits, setFormCredits] = useState("10000");
  const [formType, setFormType] = useState<"PAID" | "BONUS">("PAID");
  const [formBonusDays, setFormBonusDays] = useState("30");
  const [formTotal, setFormTotal] = useState("25");
  const [formRoles, setFormRoles] = useState("teacher");
  const [formExpiry, setFormExpiry] = useState("");

  // Inspect Campaign Drawer
  const [inspectCampaign, setInspectCampaign] = useState<CampaignItem | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/admin/coupons/campaigns");
      if (!res.ok) throw new Error("Failed to load coupon campaigns.");
      const data = await res.json();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Apply FDP 25 vouchers preset
  const applyFDPPreset = () => {
    setFormName("Faculty Development Program (FDP) 2026");
    setFormDesc("Exclusive institutional faculty sponsorship vouchers");
    setFormPrefix("FDP-");
    setFormCredits("10000");
    setFormType("PAID");
    setFormTotal("25");
    setFormRoles("teacher");
    // Default 30 days expiry
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    setFormExpiry(exp.toISOString().slice(0, 10));
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Please provide a campaign name.");
      return;
    }
    const creditsNum = parseInt(formCredits, 10);
    const totalNum = parseInt(formTotal, 10);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      alert("Credits per voucher must be greater than zero.");
      return;
    }
    if (isNaN(totalNum) || totalNum <= 0) {
      alert("Total vouchers must be greater than zero.");
      return;
    }

    try {
      setCreating(true);
      const payload: any = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        code_prefix: formPrefix.trim().toUpperCase() || "TESTORA-",
        credits_per_coupon: creditsNum,
        credit_type: formType,
        total_coupons: totalNum,
        allowed_roles: formRoles.trim().toLowerCase() || "teacher",
        max_redemptions_per_user: 1
      };
      if (formType === "BONUS") {
        payload.bonus_expiry_days = parseInt(formBonusDays, 10) || 30;
      }
      if (formExpiry) {
        payload.expires_at = new Date(formExpiry).toISOString();
      }

      const res = await apiFetch("/admin/coupons/campaigns", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create campaign");

      setActionSuccess(`Successfully generated campaign '${data.name}' with ${data.total_coupons} unique voucher codes!`);
      setCreateModalOpen(false);
      fetchCampaigns();
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openInspect = async (campaign: CampaignItem) => {
    try {
      setInspectCampaign(campaign);
      setLoadingCoupons(true);
      const res = await apiFetch(`/admin/coupons/campaigns/${campaign.id}`);
      if (res.ok) {
        const full = await res.json();
        setInspectCampaign(full);
      }
    } catch {
      // keep current
    } finally {
      setLoadingCoupons(false);
    }
  };

  const exportCSV = async (campaignId: string) => {
    try {
      const res = await apiFetch(`/admin/coupons/campaigns/${campaignId}/export-csv`);
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupons_${campaignId.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Failed to download CSV");
    }
  };

  const revokeCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to revoke this campaign? All unused voucher codes will be immediately cancelled.")) {
      return;
    }
    try {
      const res = await apiFetch(`/admin/coupons/campaigns/${campaignId}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Revocation failed");
      setActionSuccess(data.message);
      fetchCampaigns();
      if (inspectCampaign?.id === campaignId) {
        openInspect({ ...inspectCampaign, is_active: false });
      }
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const revokeSingleCoupon = async (couponId: string) => {
    if (!confirm("Revoke this specific voucher code?")) return;
    try {
      const res = await apiFetch(`/admin/coupons/${couponId}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Revocation failed");
      if (inspectCampaign) {
        openInspect(inspectCampaign);
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Coupons & Voucher Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create institutional campaigns, generate bulk non-guessable codes, export CSV rosters, and monitor real-time redemptions.
          </p>
        </div>

        <button
          onClick={() => {
            applyFDPPreset();
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Voucher Campaign</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Credits / Unit</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Vouchers Progress</th>
                <th className="py-3 px-4">Status / Expiry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <Ticket className="w-8 h-8 mx-auto opacity-30 text-blue-500" />
                    <div>No coupon campaigns created yet. Click "New Voucher Campaign" to issue codes.</div>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const percentRedeemed = Math.round((camp.redeemed_count / camp.total_coupons) * 100);
                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{camp.name}</div>
                        {camp.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{camp.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {camp.code_prefix}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                        {camp.credits_per_coupon.toLocaleString()} credits
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            camp.credit_type === "PAID"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {camp.credit_type === "PAID" ? "Regular" : "Bonus"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${percentRedeemed}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {camp.redeemed_count}/{camp.total_coupons} ({percentRedeemed}%)
                          </span>
                        </div>
                        {camp.revoked_count > 0 && (
                          <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                            {camp.revoked_count} revoked
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>
                          {camp.is_active ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Revoked / Inactive</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {camp.expires_at ? `Expires: ${new Date(camp.expires_at).toLocaleDateString()}` : "Never expires"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openInspect(camp)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                        >
                          View Codes
                        </button>
                        <button
                          onClick={() => exportCSV(camp.id)}
                          title="Download CSV of voucher codes"
                          className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {camp.is_active && (
                          <button
                            onClick={() => revokeCampaign(camp.id)}
                            title="Revoke remaining unused vouchers"
                            className="p-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Campaign Codes Drawer */}
      {inspectCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{inspectCampaign.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {inspectCampaign.credits_per_coupon.toLocaleString()} credits per voucher • Prefix: {inspectCampaign.code_prefix}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportCSV(inspectCampaign.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900 hover:bg-blue-100"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => setInspectCampaign(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingCoupons ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading codes...</div>
              ) : !inspectCampaign.coupons || inspectCampaign.coupons.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No codes found.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {inspectCampaign.coupons.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c.code)}
                            title="Copy Code"
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedCode === c.code && (
                            <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.status === "REDEEMED" && c.redeemed_at && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Redeemed on {new Date(c.redeemed_at).toLocaleDateString()}
                            </span>
                          )}
                          {c.status === "REVOKED" && (
                            <span className="text-rose-500 font-semibold">Cancelled by Admin</span>
                          )}
                          {c.status === "UNUSED" && (
                            <span className="text-slate-500">Unused — Ready for redemption</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            c.status === "UNUSED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : c.status === "REDEEMED"
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {c.status}
                        </span>

                        {c.status === "UNUSED" && (
                          <button
                            onClick={() => revokeSingleCoupon(c.id)}
                            title="Revoke this voucher"
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Issue New Voucher Campaign</span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Button */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Approved Preset: FDP Program</span>
                </div>
                <div className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                  25 Vouchers • 10,000 Credits each • Prefix FDP-
                </div>
              </div>
              <button
                type="button"
                onClick={applyFDPPreset}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Preset
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Campaign Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Faculty Enablement Workshop 2026"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Sponsoring 25 faculty members with 10,000 evaluation credits"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    value={formPrefix}
                    onChange={(e) => setFormPrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. FDP- or PROMO-"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Vouchers Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credits Per Voucher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCredits}
                    onChange={(e) => setFormCredits(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none"
                  >
                    <option value="PAID">Regular Paid (Non-expiring)</option>
                    <option value="BONUS">Promotional Bonus (Expiring)</option>
                  </select>
                </div>
              </div>

              {formType === "BONUS" && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Bonus Validity (Days after redemption)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formBonusDays}
                    onChange={(e) => setFormBonusDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Allowed Role
                  </label>
                  <input
                    type="text"
                    value={formRoles}
                    onChange={(e) => setFormRoles(e.target.value)}
                    placeholder="teacher"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Campaign Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                >
                  {creating ? "Generating Vouchers..." : "Generate Vouchers"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
