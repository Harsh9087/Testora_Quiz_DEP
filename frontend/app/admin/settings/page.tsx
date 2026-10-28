"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sliders,
  Save,
  RefreshCw,
  Gift,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SettingItem {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local edit state
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/admin/settings");
      if (!res.ok) {
        throw new Error("Failed to load platform settings");
      }
      const data: SettingItem[] = await res.json();
      setSettings(data);
      const valMap: Record<string, string> = {};
      data.forEach((s) => {
        valMap[s.key] = s.value;
      });
      setFormValues(valMap);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdate = async (key: string) => {
    const newVal = formValues[key];
    if (newVal === undefined) return;

    try {
      setSavingKey(key);
      setError(null);
      const res = await apiFetch(`/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value: newVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to update ${key}`);
      }
      setSuccessMsg(`Setting '${key}' saved successfully.`);
      fetchSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Global Platform Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic system settings governing default credit quotas, promotional grace periods, and testing parameters.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading settings...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card: Teacher Signup Bonus Credits */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    New Teacher Signup Bonus Quota
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Setting key: <code className="font-mono text-purple-600 dark:text-purple-400">signup_bonus_credits</code>
                  </div>
                </div>
              </div>

              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                Default: 200
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              The number of promotional test credits awarded to newly registered faculty members or teachers upon email verification or Google sign-in. Replaced the former hardcoded 500.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative w-48">
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={formValues["signup_bonus_credits"] || ""}
                  onChange={(e) =>
                    setFormValues({ ...formValues, signup_bonus_credits: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={() => handleUpdate("signup_bonus_credits")}
                disabled={savingKey === "signup_bonus_credits"}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {savingKey === "signup_bonus_credits" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Card: Bonus Credits Validity Days */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Signup Bonus Validity Period
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Setting key: <code className="font-mono text-blue-600 dark:text-blue-400">signup_bonus_validity_days</code>
                  </div>
                </div>
              </div>

              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                Default: 15 Days
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              The number of calendar days after signup before promotional bonus credits expire. Paid credits purchased via Razorpay never expire.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative w-48">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formValues["signup_bonus_validity_days"] || ""}
                  onChange={(e) =>
                    setFormValues({ ...formValues, signup_bonus_validity_days: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => handleUpdate("signup_bonus_validity_days")}
                disabled={savingKey === "signup_bonus_validity_days"}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {savingKey === "signup_bonus_validity_days" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
