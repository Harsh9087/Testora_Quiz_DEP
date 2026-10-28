"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Server,
  Layers,
  FileSpreadsheet,
  Users,
  Coins,
  Ticket,
  ScrollText,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DiagnosticsData {
  status: string;
  environment: string;
  database: {
    type: string;
    size_mb: number;
    table_counts: Record<string, number>;
  };
  storage: {
    uploads_dir: string;
    size_mb: number;
  };
  ai_engine: {
    status: string;
  };
}

export default function AdminSystemPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/admin/system/diagnostics");
      if (!res.ok) {
        throw new Error("Failed to load system diagnostics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Platform Diagnostics & Infrastructure
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry on database size, disk storage usage, table volume, and AI service health.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Querying infrastructure telemetry...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System State</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{data.status}</span>
              </div>
              <div className="text-xs text-slate-500">
                Environment: <strong className="text-slate-700 dark:text-slate-300 font-mono">{data.environment}</strong>
              </div>
            </div>

            {/* Database Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Storage</span>
                <Database className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {data.database.size_mb} MB
              </div>
              <div className="text-xs text-slate-500">
                Engine: <strong className="text-slate-700 dark:text-slate-300 uppercase font-mono">{data.database.type}</strong>
              </div>
            </div>

            {/* AI Engine Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Question Pipeline</span>
                <Cpu className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white capitalize">
                {data.ai_engine.status}
              </div>
              <div className="text-xs text-slate-500">
                Provider: <strong className="text-slate-700 dark:text-slate-300">Google Gemini Pro</strong>
              </div>
            </div>
          </div>

          {/* Database Table Metrics */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Database Table Record Densities
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Total Tables Monitored: {Object.keys(data.database.table_counts).length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(data.database.table_counts).map(([tbl, count]) => (
                <div
                  key={tbl}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono text-slate-400 uppercase">{tbl.replace(/_/g, " ")}</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disk Storage Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <HardDrive className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                File Storage & Upload Artifacts
              </h2>
            </div>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1">
                <span>Uploads Directory Location:</span>
                <code className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {data.storage.uploads_dir}
                </code>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Media & PDF Size:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{data.storage.size_mb} MB</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
