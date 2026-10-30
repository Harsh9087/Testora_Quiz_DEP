'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Laptop
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
      localStorage.setItem('testora_app_installed', 'true');
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    // 6. Listen for manual trigger from navbar or buttons
    const handleManualOpen = () => {
      setShowIosGuide(false);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-install-pwa', handleManualOpen);

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
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setShowIosGuide(false);
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
  }, []);

  const handleInstallClick = async () => {
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
          setTimeout(() => setInstalledSuccess(false), 4000);
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

  // Do not render anything if already installed and standalone, unless manually triggered
  if (isStandalone && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Success Notification Banner after installation */}
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

      {/* Main PWA Install Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* Modal Container: Dark navy background with thin blue-grey border */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-[#090F1E] border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden text-white animate-in zoom-in-95 duration-200"
          >
            {/* Header: Slightly lighter dark navy with border */}
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
                    Free • Fast • Works Offline*
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
              {!showIosGuide ? (
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
                      <span>Install App</span>
                    </button>
                  </div>
                </>
              ) : (
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
              )}
            </div>

          </div>

        </div>
      )}
    </>
  );
}

