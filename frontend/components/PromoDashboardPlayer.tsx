"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Award,
  Video,
  Cpu,
  Layers,
  Lock,
  Volume2,
  VolumeX,
  Film
} from "lucide-react";

export default function PromoDashboardPlayer() {
  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
  const [forcePreview, setForcePreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 15 seconds
  const [scoreCount, setScoreCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", listener);
      return () => mediaQuery.removeEventListener?.("change", listener);
    }
  }, []);

  // Robust check: tests if real MP4 video exists and is accessible
  useEffect(() => {
    let isMounted = true;
    fetch("/videos/hero-section-video.mp4", { method: "HEAD" })
      .then((res) => {
        if (!isMounted) return;
        const contentType = res.headers.get("content-type") || "";
        // Ensure it is 200 OK and not a 404 HTML fallback page
        if (res.ok && !contentType.includes("text/html")) {
          setVideoAvailable(true);
        } else {
          fetch("/videos/testora-promo.mp4", { method: "HEAD" })
            .then((r2) => {
              if (!isMounted) return;
              if (r2.ok && !r2.headers.get("content-type")?.includes("text/html")) {
                setVideoAvailable(true);
              } else {
                setVideoAvailable(false);
              }
            })
            .catch(() => {
              if (isMounted) setVideoAvailable(false);
            });
        }
      })
      .catch(() => {
        if (isMounted) setVideoAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 15-second simulation timer loop
  useEffect(() => {
    if (videoAvailable && !forcePreview) return;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 15) {
          return 0; // loop back after 15s
        }
        return Number((prev + 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, videoAvailable, forcePreview]);

  // Score counter animation linked to progress
  useEffect(() => {
    const targetScore = 88;
    if (prefersReducedMotion) {
      setScoreCount(targetScore);
      return;
    }
    const ratio = Math.min(progress / 3, 1); // ramps up over first 3 seconds
    setScoreCount(Math.round(ratio * targetScore));
  }, [progress, prefersReducedMotion]);

  const handleReset = () => {
    setProgress(0);
    setScoreCount(0);
    setIsPlaying(true);
  };

  // If a real MP4 video file is placed by the user, render pure full-frame video player (no timeline, no floating symbols, repeated looping)
  if (videoAvailable && !forcePreview) {
    return (
      <div className="relative w-full aspect-video bg-black overflow-hidden select-none">
        <video
          ref={videoRef}
          src="/videos/hero-section-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoAvailable(false)}
          className="w-full h-full object-cover block"
        >
          <source src="/videos/hero-section-video.mp4" type="video/mp4" />
          <source src="/videos/hero%20setion%20video%20.mp4" type="video/mp4" />
          <source src="/videos/testora-promo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Circular Score Gauge Values (radius: 46, circumference: ~289)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = prefersReducedMotion
    ? circumference - (88 / 100) * circumference
    : circumference - (scoreCount / 100) * circumference;

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#070D1B] dark:via-[#0B152B] dark:to-[#050914] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 select-none group ring-1 ring-slate-900/5 dark:ring-white/10 transition-colors duration-300">

      {/* Background Ambient Glows & Grid Pattern */}
      <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#94A3B8_1px,transparent_1px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:opacity-15 pointer-events-none" />

      {/* FLOATING UI CARD 1: TOP RIGHT GEMINI AI BADGE */}
      <div className="absolute top-14 right-5 z-20 hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-200 dark:border-blue-500/30 shadow-lg shadow-blue-500/10 dark:shadow-2xl transition-all duration-300 hover:border-blue-400/60">
        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-transparent">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Gemini Pro AI</div>
          <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <span>25 Items Synthesized</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">(2.3s)</span>
          </div>
        </div>
      </div>

      {/* FLOATING UI CARD 2: BOTTOM LEFT PROCTOR RADAR BADGE */}
      <div className="absolute bottom-16 left-5 z-20 hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/10 dark:shadow-2xl transition-all duration-300 hover:border-emerald-400/60">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-transparent">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Proctor Radar Active</div>
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">0 Tab Violations Recorded</div>
        </div>
      </div>

      {/* TOP HUD BAR */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-slate-800/80 text-xs">
        {/* Left: Window Controls & Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/85 shadow-xs shadow-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/85 shadow-xs shadow-amber-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/85 shadow-xs shadow-emerald-500/40" />
          </div>
          <span className="ml-2 font-mono text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-bold tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Testora Quiz</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal hidden sm:inline">Exam Analytics Dashboard</span>
          </span>
        </div>

        {/* Center: Official Tagline */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/50 text-[10px] text-blue-700 dark:text-blue-300 font-semibold tracking-wide">
          <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>&ldquo;Smarter Assessments. Better Outcomes.&rdquo;</span>
        </div>

        {/* Right: Simulation Timer & Status */}
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs">
          {videoAvailable && forcePreview && (
            <button
              type="button"
              onClick={() => setForcePreview(false)}
              className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-600/30 hover:bg-blue-200 dark:hover:bg-blue-600/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 text-[9px] font-bold transition-colors cursor-pointer"
            >
              Play Video
            </button>
          )}
          <span className="text-slate-600 dark:text-slate-400">
            {progress < 10 ? `00:0${Math.floor(progress)}` : `00:${Math.floor(progress)}`} / 00:15
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Live Product Demo</span>
          </span>
        </div>
      </div>

      {/* DASHBOARD BODY (16:9 Optimized Content Grid) */}
      <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-5 items-center my-auto">

        {/* COLUMN 1: CIRCULAR SCORE & ACCURACY BREAKDOWN (4 Cols) */}
        <div className="col-span-12 sm:col-span-5 md:col-span-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 flex flex-col items-center justify-between space-y-3 shadow-lg shadow-blue-950/5 dark:shadow-black/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 self-start flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Candidate Score</span>
          </div>

          {/* Animated Circular Score Ring */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 108 108">
              {/* Background Track */}
              <circle
                cx="54"
                cy="54"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Gradient Ring */}
              <circle
                cx="54"
                cy="54"
                r={radius}
                className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-300 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Score Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {scoreCount}%
              </span>
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Grade A+
              </span>
            </div>
          </div>

          {/* 3-Pill Response Counter (Correct, Incorrect, Skipped) */}
          <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
            <div className="p-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Correct</span>
              </div>
              <strong className="text-slate-900 dark:text-white text-xs font-mono font-bold">22</strong>
            </div>

            <div className="p-1.5 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200/90 dark:border-red-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] text-red-700 dark:text-red-400 font-semibold">
                <XCircle className="w-2.5 h-2.5" />
                <span>Wrong</span>
              </div>
              <strong className="text-slate-900 dark:text-white text-xs font-mono font-bold">2</strong>
            </div>

            <div className="p-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] text-amber-700 dark:text-amber-400 font-semibold">
                <MinusCircle className="w-2.5 h-2.5" />
                <span>Skipped</span>
              </div>
              <strong className="text-slate-900 dark:text-white text-xs font-mono font-bold">1</strong>
            </div>
          </div>
        </div>

        {/* COLUMN 2: TOPIC ACCURACY & PERFORMANCE TREND GRAPH (8 Cols) */}
        <div className="col-span-12 sm:col-span-7 md:col-span-8 space-y-3">

          {/* Top Half: Topic-Wise Accuracy Progress Bars */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-lg shadow-blue-950/5 dark:shadow-black/40">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              <span>Topic-Wise Cognitive Mastery</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">Bloom Standard</span>
            </div>

            <div className="space-y-2">
              {/* Topic 1 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Data Structures &amp; BST Traversal</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">94%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-500 dark:to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: prefersReducedMotion ? "94%" : `${Math.min(94, (progress / 4) * 94)}%`
                    }}
                  />
                </div>
              </div>

              {/* Topic 2 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Algorithmic Complexity &amp; Amortized Bounds</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">86%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-500 dark:to-blue-400 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: prefersReducedMotion ? "86%" : `${Math.min(86, (progress / 4) * 86)}%`
                    }}
                  />
                </div>
              </div>

              {/* Topic 3 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Concurrency &amp; Operating System Deadlocks</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">90%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-500 dark:to-indigo-400 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: prefersReducedMotion ? "90%" : `${Math.min(90, (progress / 4) * 90)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Half: Animated Performance Trend Line Graph */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4 shadow-lg shadow-blue-950/5 dark:shadow-black/40">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Percentile Growth</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Candidate trajectory across past 5 assessment blueprints
              </div>
              <div className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                +22% Improvement
              </div>
            </div>

            {/* Simulated Trend SVG Graph */}
            <div className="relative w-36 sm:w-48 h-14 flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 160 50">
                <defs>
                  <linearGradient id="trendGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendGradientDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area Fill - Light vs Dark */}
                <path
                  d="M0,45 L20,38 L60,32 L100,24 L140,12 L160,8 L160,50 L0,50 Z"
                  className="fill-[url(#trendGradientLight)] dark:fill-[url(#trendGradientDark)]"
                />
                {/* Trend Stroke */}
                <path
                  d="M0,45 L20,38 L60,32 L100,24 L140,12 L160,8"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="stroke-blue-600 dark:stroke-sky-400"
                />
                {/* Data Points */}
                <circle cx="20" cy="38" r="3" className="fill-blue-600 dark:fill-sky-400" />
                <circle cx="60" cy="32" r="3" className="fill-blue-600 dark:fill-sky-400" />
                <circle cx="100" cy="24" r="3" className="fill-blue-600 dark:fill-sky-400" />
                <circle cx="140" cy="12" r="3" className="fill-blue-600 dark:fill-sky-400" />
                <circle cx="160" cy="8" r="4" className={`fill-emerald-500 dark:fill-emerald-400 ${prefersReducedMotion ? "" : "animate-ping"}`} />
                <circle cx="160" cy="8" r="4" className="fill-emerald-600 dark:fill-emerald-400" />
              </svg>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM CONTROLS & TIMELINE SCRUBBER */}
      <div className="relative z-10 pt-2 border-t border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            aria-label={isPlaying ? "Pause Simulation" : "Play Simulation"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent transition-colors cursor-pointer"
            title="Replay from 00:00"
            aria-label="Replay from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {videoAvailable && (
            <button
              type="button"
              onClick={() => setForcePreview(false)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Return to Video Walkthrough"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Watch Video</span>
            </button>
          )}
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            Analytics Simulation
          </span>
        </div>

        {/* 15s Progress Timeline Scrubber */}
        <div className="flex-1 max-w-xs mx-4 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 dark:from-blue-500 dark:via-indigo-400 dark:to-emerald-400 transition-all duration-100"
            style={{ width: `${(progress / 15) * 100}%` }}
          />
        </div>

        {/* Tagline pill */}
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:flex items-center gap-1">
          <span>Active Video:</span>
          <code className="text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 px-1.5 py-0.5 rounded text-[9px]">
            /videos/hero-section-video.mp4
          </code>
        </div>
      </div>

    </div>
  );
}
