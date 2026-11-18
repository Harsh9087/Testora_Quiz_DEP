'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Check,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  ExternalLink,
  Laptop,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPwaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // Download & Installation Progress States
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [isNotificationMinimized, setIsNotificationMinimized] = useState(false);
  const downloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check standalone mode and platform on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker for PWA installability & offline caching
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] SW register error:', err);
        });
      });
    }

    // 2. Check if already running in standalone display mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return isStandaloneMedia || isNavigatorStandalone || isAndroidApp;
    };

    const standaloneMode = checkStandalone();
    setIsStandalone(standaloneMode);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // 4. Capture native browser beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Auto-show after brief delay if not dismissed recently
      const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
      const alreadyInstalled = localStorage.getItem('testora_app_installed') === 'true';

      const dismissedRecently = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 5 * 24 * 60 * 60 * 1000;

      if (!standaloneMode && !alreadyInstalled && !dismissedRecently) {
        setTimeout(() => setIsOpen(true), 3500);
      }
    };

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsOpen(false);
      setIsDownloading(false);
      setIsDownloadComplete(true);
      setShowNotificationBanner(false);
      localStorage.setItem('testora_app_installed', 'true');
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    // 6. Listen for manual trigger from navbar or buttons
    const handleManualOpen = () => {
      setShowIosGuide(false);
      setIsOpen(true);
    };

    // 7. Listen for explicit start-app-download event
    const handleStartDownloadEvent = () => {
      startAppDownload();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-install-pwa', handleManualOpen);
    window.addEventListener('start-app-download', handleStartDownloadEvent);

    // Auto-prompt on iOS Safari if first visit and not standalone
    if (isIosDevice && !standaloneMode) {
      const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
      const alreadyInstalled = localStorage.getItem('testora_app_installed') === 'true';
      const dismissedRecently = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 5 * 24 * 60 * 60 * 1000;

      if (!alreadyInstalled && !dismissedRecently) {
        setTimeout(() => setIsOpen(true), 4000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-install-pwa', handleManualOpen);
      window.removeEventListener('start-app-download', handleStartDownloadEvent);
      if (downloadTimerRef.current) {
        clearInterval(downloadTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setShowIosGuide(false);
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
  }, []);

  // Helper text for progressive download percentage
  const getDownloadStatusText = (pct: number) => {
    const mbLoaded = ((pct / 100) * 18.5).toFixed(1);
    if (pct < 25) return `Fetching core application runtime (${mbLoaded} / 18.5 MB)`;
    if (pct < 55) return `Downloading offline examination engine (${mbLoaded} / 18.5 MB)`;
    if (pct < 85) return `Pre-caching assets & security modules (${mbLoaded} / 18.5 MB)`;
    if (pct < 100) return `Finalizing package verification (${mbLoaded} / 18.5 MB)`;
    return `Download complete (18.5 MB) • Ready to install`;
  };

  // Start app downloading process with smooth 1% - 100% progress
  const startAppDownload = () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setIsDownloadComplete(false);
    setShowNotificationBanner(true);
    setIsNotificationMinimized(false);
    setDownloadProgress(1);

    // Pre-cache core assets in Service Worker cache storage
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.open('testora-pwa-v1.6.0').then((cache) => {
        cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico',
          '/icon-192.png',
          '/icon-512.png',
          '/apple-touch-icon.png'
        ]).catch(() => {});
      }).catch(() => {});
    }

    let currentPct = 1;
    if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);

    downloadTimerRef.current = setInterval(() => {
      let increment = 0;
      if (currentPct < 25) {
        increment = Math.floor(Math.random() * 4) + 2; // 2 - 5%
      } else if (currentPct < 70) {
        increment = Math.floor(Math.random() * 5) + 3; // 3 - 7%
      } else if (currentPct < 95) {
        increment = Math.floor(Math.random() * 3) + 2; // 2 - 4%
      } else {
        increment = 1; // 1%
      }

      currentPct += increment;

      if (currentPct >= 100) {
        currentPct = 100;
        if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
        setDownloadProgress(100);
        setIsDownloading(false);
        setIsDownloadComplete(true);

        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([80, 40, 80]);
          } catch {}
        }

        // Auto-trigger native install prompt after download if prompt is captured
        if (deferredPrompt) {
          setTimeout(async () => {
            try {
              await deferredPrompt.prompt();
              const choice = await deferredPrompt.userChoice;
              if (choice.outcome === 'accepted') {
                setIsOpen(false);
                setDeferredPrompt(null);
                localStorage.setItem('testora_app_installed', 'true');
                setInstalledSuccess(true);
                setShowNotificationBanner(false);
                setTimeout(() => setInstalledSuccess(false), 5000);
              }
            } catch (err) {
              console.warn('[PWA] Prompt trigger error:', err);
            }
          }, 800);
        }
      } else {
        setDownloadProgress(currentPct);
      }
    }, 110);
  };

  const handleTriggerNativeInstall = async () => {
    // 1. Android / Chrome / Chromium native installation prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsOpen(false);
          setDeferredPrompt(null);
          localStorage.setItem('testora_app_installed', 'true');
          setInstalledSuccess(true);
          setShowNotificationBanner(false);
          setTimeout(() => setInstalledSuccess(false), 5000);
        } else {
          handleDismiss();
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      return;
    }

    // 2. iOS Safari Step-by-Step Guide
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    // 3. Fallback for Desktop / non-supported browsers
    setShowIosGuide(true);
  };

  const handleInstallClick = () => {
    if (isDownloadComplete) {
      handleTriggerNativeInstall();
    } else {
      startAppDownload();
    }
  };

  return (
    <>
      {/* ═══════ 1. TOP-OF-WEBSITE ONE-LINE GLOWING DOWNLOAD PROGRESS BAR ═══════ */}
      {(isDownloading || (isDownloadComplete && showNotificationBanner)) && (
        <div className="fixed top-0 left-0 right-0 h-[3.5px] z-[99999] bg-slate-900/60 pointer-events-none">
          <div
            className={`h-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(37,99,235,0.8)] ${
              isDownloadComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 w-full'
                : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}

      {/* ═══════ 2. MOBILE & WEBSITE LIVE DOWNLOAD NOTIFICATION CARD (ANDROID / DYNAMIC ISLAND STYLE) ═══════ */}
      {showNotificationBanner && (!isStandalone || isDownloading || isDownloadComplete) && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-auto sm:right-4 z-[9998] sm:w-[410px] rounded-2xl bg-[#081021]/95 text-slate-100 border border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl ring-1 ring-white/10 animate-in slide-in-from-top-3 duration-300 overflow-hidden"
        >
          {/* Header Row */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-xl bg-[#0F1C38] border border-blue-500/40 p-1 flex items-center justify-center shrink-0 shadow-sm">
                <Image
                  src="/icon-192.png"
                  alt="Testora Quiz"
                  width={28}
                  height={28}
                  className="rounded-lg object-contain"
                />
                {isDownloading && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-white tracking-tight truncate">
                    Testora Quiz App
                  </span>
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isDownloadComplete
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {isDownloadComplete ? '100% Ready' : `${downloadProgress}%`}
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-xs text-slate-400 truncate mt-0.5">
                  {getDownloadStatusText(downloadProgress)}
                </p>
              </div>
            </div>

            {/* Quick Action / Minimize / Dismiss */}
            <div className="flex items-center gap-1 shrink-0">
              {isDownloadComplete ? (
                <button
                  type="button"
                  onClick={handleTriggerNativeInstall}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsNotificationMinimized(!isNotificationMinimized)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isNotificationMinimized ? 'Expand notification' : 'Minimize notification'}
                >
                  {isNotificationMinimized ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowNotificationBanner(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar (Always visible) */}
          <div className="px-3 sm:px-3.5 pb-2.5">
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-150 ease-out ${
                  isDownloadComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400'
                }`}
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>

          {/* Expanded Detail Panel */}
          {!isNotificationMinimized && (
            <div className="px-3 sm:px-3.5 pb-3 pt-0.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Smartphone className="w-3 h-3 text-blue-400" />
                <span>PWA Standalone App</span>
              </span>
              <span>
                {((downloadProgress / 100) * 18.5).toFixed(1)} MB of 18.5 MB
              </span>
            </div>
          )}
        </aside>
      )}

      {/* ═══════ 3. SUCCESS NOTIFICATION BANNER AFTER COMPLETED INSTALLATION ═══════ */}
      {installedSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1528] text-white px-5 py-3 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Testora Quiz Installed!</div>
            <div className="text-[11px] text-slate-300">Open from your Home Screen anytime.</div>
          </div>
        </div>
      )}

      {/* ═══════ 4. MAIN PWA INSTALL / DOWNLOAD MODAL BACKDROP ═══════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-[#090F1E] border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden text-white animate-in zoom-in-95 duration-200"
          >
            {/* Header: Dark navy with app branding */}
            <div className="bg-[#0E1A34] px-5 py-4 border-b border-slate-700/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0A1224] p-1 border border-slate-700/60 shadow-inner flex items-center justify-center shrink-0">
                  <Image
                    src="/icon-192.png"
                    alt="Testora Quiz"
                    width={36}
                    height={36}
                    className="rounded-lg object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Testora Quiz</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Free • Fast • Works Offline
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {showIosGuide ? (
                /* iOS Safari Step-by-Step Installation Instructions */
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>iPhone / iPad Setup</span>
                    </div>
                    <h4 className="text-sm font-bold text-white pt-1">
                      Install via Safari &ldquo;Add to Home Screen&rdquo;
                    </h4>
                  </div>

                  <div className="space-y-3 bg-[#0E1A34] p-4 rounded-2xl border border-slate-700/60 text-xs">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <span className="text-slate-200">Tap the </span>
                        <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          <Share className="w-3 h-3 text-blue-400" /> Share
                        </strong>
                        <span className="text-slate-200"> button in Safari toolbar.</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <span className="text-slate-200">Scroll down and select </span>
                        <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
                        </strong>
                        <span className="text-slate-200">.</span>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <span className="text-slate-200">Tap </span>
                        <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          Add
                        </strong>
                        <span className="text-slate-200"> in the top-right corner to complete.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowIosGuide(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Got It
                    </button>
                  </div>
                </div>
              ) : isDownloading || isDownloadComplete ? (
                /* LIVE DOWNLOAD PROGRESS VIEW */
                <div className="space-y-5 py-1">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                      {isDownloadComplete ? (
                        <Check className="w-7 h-7 text-white stroke-[2.5]" />
                      ) : (
                        <Download className="w-7 h-7 text-white animate-bounce" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {isDownloadComplete ? 'Testora Quiz App Ready!' : 'Downloading Testora Quiz App'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        {getDownloadStatusText(downloadProgress)}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                      <span>{isDownloadComplete ? 'Completed' : 'Downloading Package'}</span>
                      <span className="text-blue-400 font-bold text-sm">{downloadProgress}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 p-0.5 border border-slate-700/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ease-out ${
                          isDownloadComplete
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400'
                        }`}
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>v1.6.0 PWA Engine</span>
                      <span>{((downloadProgress / 100) * 18.5).toFixed(1)} MB / 18.5 MB</span>
                    </div>
                  </div>

                  {/* Checklist of what's cached */}
                  <div className="space-y-2 bg-[#0E1A34] p-3.5 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          downloadProgress >= 25
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {downloadProgress >= 25 ? <Check className="w-3 h-3" /> : '1'}
                      </div>
                      <span
                        className={
                          downloadProgress >= 25
                            ? 'text-slate-200 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Core App Shell &amp; Runtime
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          downloadProgress >= 65
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {downloadProgress >= 65 ? <Check className="w-3 h-3" /> : '2'}
                      </div>
                      <span
                        className={
                          downloadProgress >= 65
                            ? 'text-slate-200 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Offline Exam Engine &amp; Auto-Save
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          downloadProgress >= 100
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {downloadProgress >= 100 ? <Check className="w-3 h-3" /> : '3'}
                      </div>
                      <span
                        className={
                          downloadProgress >= 100
                            ? 'text-slate-200 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Home Screen Launcher Ready
                      </span>
                    </div>
                  </div>

                  {/* Buttons in Progress View */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Keep in Background
                    </button>

                    {isDownloadComplete ? (
                      <button
                        type="button"
                        onClick={handleTriggerNativeInstall}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install to Device</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-blue-400 font-bold px-3 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Downloading {downloadProgress}%...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* INITIAL PROMPT VIEW */
                <>
                  {/* Lead text */}
                  <p className="text-xs sm:text-[13px] text-slate-200 font-medium leading-relaxed">
                    Get the best Testora Quiz experience! Install our app for:
                  </p>

                  {/* 3 Value Propositions */}
                  <div className="space-y-3 py-1">
                    <div className="flex items-start gap-3 text-xs sm:text-[13px] text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span>Quick access from your home screen</span>
                    </div>

                    <div className="flex items-start gap-3 text-xs sm:text-[13px] text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span>Faster loading and app-like experience</span>
                    </div>

                    <div className="flex items-start gap-3 text-xs sm:text-[13px] text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span>Offline access to supported pages</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                    >
                      Maybe Later
                    </button>

                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download &amp; Install</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
