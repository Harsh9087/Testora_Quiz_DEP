'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WifiOff, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function OfflineFallbackPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false);

  useEffect(() => {
    setOnlineStatus(typeof navigator !== 'undefined' ? navigator.onLine : false);

    const handleOnline = () => {
      setOnlineStatus(true);
      window.location.reload();
    };
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        window.location.reload();
      } else {
        setIsChecking(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070D1B] text-slate-900 dark:text-white flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background Dot Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1px,transparent_1px)] dark:bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-20 pointer-events-none" />

      <div className="relative max-w-md w-full bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        
        {/* App Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 p-2 shadow-inner flex items-center justify-center">
            <Image
              src="/icon-192.png"
              alt="Testora Quiz Logo"
              width={48}
              height={48}
              className="rounded-xl object-contain"
            />
          </div>
        </div>

        {/* Offline Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
          <WifiOff className="w-7 h-7" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-[#0B1B3D] dark:text-white">
            You&apos;re Offline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            It looks like you lost your internet connection. Testora Quiz will automatically reconnect as soon as your network is back.
          </p>
        </div>

        {/* Notice on Exams & Proctoring */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-left flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
            Live proctoring radar, exam submissions, and AI question synthesis require an active internet connection for academic integrity.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Connection...' : 'Retry Connection'}</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>

        {/* Network Status indicator */}
        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span>Status: {onlineStatus ? 'Online (Restored)' : 'Offline (Disconnected)'}</span>
        </div>

      </div>
    </div>
  );
}

