"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Coins,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  Building2,
  Gift,
  HelpCircle,
  Clock,
  Infinity as InfinityIcon,
  Tag,
  ShieldCheck,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PricingPlanItem {
  id: string;
  plan_code: string;
  name: string;
  plan_type: "FREE_SIGNUP" | "RECHARGE" | "INSTITUTIONAL" | string;
  price_inr: number;
  price_paise: number;
  formatted_price: string;
  price_subtext?: string;
  base_credits: number;
  bonus_credits: number;
  total_credits: number;
  validity_days?: number | null;
  credits_never_expire: boolean;
  badge?: string;
  is_featured: boolean;
  is_recommended: boolean;
  is_active: boolean;
  display_order: number;
  color_accent: string;
  button_label: string;
  button_action: string;
  description?: string;
  features: string[];
  created_at?: string;
  updated_at?: string;
}

function PricingPlansContent() {
  const [plans, setPlans] = useState<PricingPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlanItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState("RECHARGE");
  const [formPriceInr, setFormPriceInr] = useState(100);
  const [formPriceSubtext, setFormPriceSubtext] = useState("");
  const [formBaseCredits, setFormBaseCredits] = useState(1000);
  const [formBonusCredits, setFormBonusCredits] = useState(0);
  const [formValidityDays, setFormValidityDays] = useState<number | "">("");
  const [formCreditsNeverExpire, setFormCreditsNeverExpire] = useState(true);
  const [formBadge, setFormBadge] = useState("");
  const [formButtonLabel, setFormButtonLabel] = useState("Get Started");
  const [formButtonAction, setFormButtonAction] = useState("recharge");
  const [formColorAccent, setFormColorAccent] = useState("indigo");
  const [formIsRecommended, setFormIsRecommended] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formDescription, setFormDescription] = useState("");
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await apiFetch("/admin/pricing-plans");
      if (!res.ok) throw new Error(`Status ${res.status}: Failed to load plans`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load pricing plans" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormCode("");
    setFormType("RECHARGE");
    setFormPriceInr(100);
    setFormPriceSubtext("/ 1,000 Credits");
    setFormBaseCredits(1000);
    setFormBonusCredits(0);
    setFormValidityDays("");
    setFormCreditsNeverExpire(true);
    setFormBadge("");
    setFormButtonLabel("Choose Plan");
    setFormButtonAction("recharge");
    setFormColorAccent("indigo");
    setFormIsRecommended(false);
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormDisplayOrder(plans.length + 1);
    setFormDescription("");
    setFormFeatures([
      "AI Question Generation",
      "Printable Exam Papers",
      "Purchased credits NEVER expire",
      "Instant Razorpay payment"
    ]);
    setNewFeatureText("");
    setModalOpen(true);
  };

  const openEditModal = (plan: PricingPlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormCode(plan.plan_code);
    setFormType(plan.plan_type);
    setFormPriceInr(plan.price_inr);
    setFormPriceSubtext(plan.price_subtext || "");
    setFormBaseCredits(plan.base_credits);
    setFormBonusCredits(plan.bonus_credits);
    setFormValidityDays(plan.validity_days ?? "");
    setFormCreditsNeverExpire(plan.credits_never_expire);
    setFormBadge(plan.badge || "");
    setFormButtonLabel(plan.button_label);
    setFormButtonAction(plan.button_action);
    setFormColorAccent(plan.color_accent || "blue");
    setFormIsRecommended(plan.is_recommended);
    setFormIsFeatured(plan.is_featured);
    setFormIsActive(plan.is_active);
    setFormDisplayOrder(plan.display_order);
    setFormDescription(plan.description || "");
    setFormFeatures(plan.features || []);
    setNewFeatureText("");
    setModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFormFeatures([...formFeatures, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== idx));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Please provide a plan name.");
      return;
    }
    if (!editingPlan && !formCode.trim()) {
      alert("Please provide a unique plan code (e.g. starter_100).");
      return;
    }

    try {
      setSaving(true);
      const totalCredits = Number(formBaseCredits) + Number(formBonusCredits);
      const payload: any = {
        name: formName.trim(),
        plan_type: formType,
        price_inr: Number(formPriceInr),
        price_paise: Number(formPriceInr) * 100,
        formatted_price: formType === "INSTITUTIONAL" ? "Custom" : `₹${formPriceInr}`,
        price_subtext: formPriceSubtext.trim() || undefined,
        base_credits: Number(formBaseCredits),
        bonus_credits: Number(formBonusCredits),
        total_credits: totalCredits,
        validity_days: formCreditsNeverExpire ? null : formValidityDays ? Number(formValidityDays) : 15,
        credits_never_expire: formCreditsNeverExpire,
        badge: formBadge.trim() || null,
        is_featured: formIsFeatured,
        is_recommended: formIsRecommended,
        is_active: formIsActive,
        display_order: Number(formDisplayOrder),
        color_accent: formColorAccent,
        button_label: formButtonLabel.trim(),
        button_action: formButtonAction,
        description: formDescription.trim(),
        features: formFeatures
      };

      if (!editingPlan) {
        payload.plan_code = formCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
        const res = await apiFetch("/admin/pricing-plans", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to create plan");
        }
        setFeedback({ type: "success", text: `Plan '${payload.name}' created successfully!` });
      } else {
        const res = await apiFetch(`/admin/pricing-plans/${editingPlan.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to update plan");
        }
        setFeedback({ type: "success", text: `Plan '${payload.name}' updated and published live!` });
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: PricingPlanItem) => {
    try {
      const res = await apiFetch(`/admin/pricing-plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !plan.is_active })
      });
      if (res.ok) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
        );
        setFeedback({
          type: "success",
          text: `Plan '${plan.name}' is now ${!plan.is_active ? "Active" : "Inactive"}.`
        });
      }
    } catch {
      alert("Failed to toggle plan status.");
    }
  };

  const handleDeletePlan = async (plan: PricingPlanItem) => {
    if (!confirm(`Are you sure you want to deactivate and remove plan '${plan.name}'?`)) return;
    try {
      const res = await apiFetch(`/admin/pricing-plans/${plan.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setFeedback({ type: "success", text: `Plan '${plan.name}' removed.` });
        fetchPlans();
      }
    } catch {
      alert("Failed to delete plan.");
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Reset all plans back to standard Testora Quiz defaults (₹0, ₹100, ₹199, ₹499, and Institutional)?")) return;
    try {
      const res = await apiFetch("/admin/pricing-plans/reset-defaults", {
        method: "POST"
      });
      if (res.ok) {
        setFeedback({ type: "success", text: "Standard pricing plans restored successfully." });
        fetchPlans();
      }
    } catch {
      alert("Failed to reset defaults.");
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (typeFilter !== "ALL" && p.plan_type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.plan_code.toLowerCase().includes(q) ||
          p.formatted_price.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [plans, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pricing Plans Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic educator recharge plans, signup bonus credits, and institutional proposals rendered live on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/#pricing"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View on Homepage</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Plans
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {plans.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Configured in DB</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active Online
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {plans.filter((p) => p.is_active).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Published on website</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Recharge Packs
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {plans.filter((p) => p.plan_type === "RECHARGE").length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">₹100, ₹199, ₹499...</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Gift className="w-3 h-3" />
            Signup Bonus
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {plans.find((p) => p.plan_type === "FREE_SIGNUP")?.total_credits || 200}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Free credits for teachers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Institutional
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            10,000
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Credits / Faculty Voucher</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plans by name, code, price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {["ALL", "RECHARGE", "FREE_SIGNUP", "INSTITUTIONAL"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  typeFilter === t
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {t === "ALL" ? "All Plans" : t === "RECHARGE" ? "Recharges" : t === "FREE_SIGNUP" ? "Free Bonus" : "Institutional"}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Reset standard 5 plans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading pricing plans...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Plan Name &amp; Code</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4">Credits Allocation</th>
                  <th className="py-3 px-4">Validity / Expiry</th>
                  <th className="py-3 px-4">Display Badge</th>
                  <th className="py-3 px-4 text-center">Recommended</th>
                  <th className="py-3 px-4 text-center">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{plan.display_order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {plan.name}
                        </strong>
                        {plan.is_featured && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {plan.plan_code} · {plan.plan_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {plan.formatted_price}
                      </span>
                      {plan.price_subtext && (
                        <span className="block text-[10px] text-slate-400">
                          {plan.price_subtext}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {plan.total_credits.toLocaleString()} Credits
                      </span>
                      {plan.bonus_credits > 0 && (
                        <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          ({plan.base_credits.toLocaleString()} base + {plan.bonus_credits.toLocaleString()} bonus)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {plan.credits_never_expire ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <InfinityIcon className="w-3 h-3 text-purple-500" />
                          <span>Never Expires</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{plan.validity_days || 15} Days</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {plan.badge ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {plan.badge}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {plan.is_recommended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center ${
                          plan.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        title="Toggle Active Status"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            plan.is_active ? "translate-x-4.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit plan configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT / CREATE MODAL WITH LIVE CARD PREVIEW */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingPlan ? `Edit Pricing Plan — ${editingPlan.name}` : "Create New Pricing Plan"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Changes take effect live on the homepage upon saving.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Form (Left) & Live Preview (Right) */}
            <div className="overflow-y-auto px-6 py-5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSavePlan} className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Plan Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starter Recharge"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unique Plan Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingPlan}
                      placeholder="e.g. starter_100"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Plan Category / Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="RECHARGE">Recharge Plan (Paid)</option>
                      <option value="FREE_SIGNUP">Free Signup Bonus (₹0)</option>
                      <option value="INSTITUTIONAL">Institutional / College Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Price in INR (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formPriceInr}
                      onChange={(e) => setFormPriceInr(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Base Credits
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formBaseCredits}
                      onChange={(e) => setFormBaseCredits(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bonus Credits (Extra)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formBonusCredits}
                      onChange={(e) => setFormBonusCredits(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Display Badge (Pill)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10% Extra / Starter"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Choose Starter Plan"
                      value={formButtonLabel}
                      onChange={(e) => setFormButtonLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Color Accent
                    </label>
                    <select
                      value={formColorAccent}
                      onChange={(e) => setFormColorAccent(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blue">Blue</option>
                      <option value="indigo">Indigo</option>
                      <option value="purple">Purple</option>
                      <option value="teal">Teal</option>
                      <option value="emerald">Emerald</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Display Order (Position)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Validity checkbox */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formCreditsNeverExpire}
                      onChange={(e) => setFormCreditsNeverExpire(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Purchased Credits Never Expire</span>
                  </label>
                  {!formCreditsNeverExpire && (
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Validity (Days):</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="15"
                        value={formValidityDays}
                        onChange={(e) => setFormValidityDays(Number(e.target.value))}
                        className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Options row */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsRecommended}
                      onChange={(e) => setFormIsRecommended(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600"
                    />
                    <span>Recommended / Popular Plan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span>Active (Visible on Homepage)</span>
                  </label>
                </div>

                {/* Features list */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Plan Feature Bullets
                  </label>
                  <div className="space-y-1.5">
                    {formFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        <span className="truncate">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add another benefit bullet..."
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Save &amp; Publish Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Card Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Homepage Card Preview</span>
                </div>

                {/* Simulated Card */}
                <div className="w-full max-w-[280px] p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <Coins className="w-5 h-5" />
                    </div>
                    {formBadge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {formBadge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {formName || "Plan Title"}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {formType === "INSTITUTIONAL" ? "Custom" : `₹${formPriceInr}`}
                      </span>
                      {formPriceSubtext && (
                        <span className="text-[11px] text-slate-400">{formPriceSubtext}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10.5px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Credits:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {(Number(formBaseCredits) + Number(formBonusCredits)).toLocaleString()}
                      </strong>
                    </div>
                    {formBonusCredits > 0 && (
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                        <span>Bonus:</span>
                        <span>+{Number(formBonusCredits).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Validity: {formCreditsNeverExpire ? "Never Expires" : `${formValidityDays || 15} Days`}
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    {formFeatures.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs text-center shadow-xs flex items-center justify-center gap-1"
                  >
                    <span>{formButtonLabel || "Get Started"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center max-w-xs">
                  This card updates synchronously with the form and reflects how visitors see it on the website.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPricingPlansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading pricing plans...</div>}>
      <PricingPlansContent />
    </Suspense>
  );
}

