"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const prevRouteRef = useRef(`${pathname}?${searchParams.toString()}`);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animFrameRef.current) clearTimeout(animFrameRef.current);

    setVisible(true);
    setLoading(true);
    setProgress(15);

    // Rapid increment to give instant feedback
    animFrameRef.current = setTimeout(() => {
      setProgress((p) => Math.max(p, 45));
      animFrameRef.current = setTimeout(() => {
        setProgress((p) => Math.max(p, 75));
        animFrameRef.current = setTimeout(() => {
          setProgress((p) => Math.max(p, 88));
        }, 150);
      }, 100);
    }, 40);
  };

  const finishProgress = () => {
    if (animFrameRef.current) clearTimeout(animFrameRef.current);
    setProgress(100);
    setLoading(false);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  };

  // Route change detector
  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams.toString()}`;
    if (prevRouteRef.current !== currentRoute) {
      prevRouteRef.current = currentRoute;
      finishProgress();
    }
  }, [pathname, searchParams]);

  // Global click interception for instant click response
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href, window.location.href);
          const isSameOrigin = url.origin === window.location.origin;
          const isSamePath = url.pathname === window.location.pathname && url.search === window.location.search;
          const isHashOnly = url.pathname === window.location.pathname && url.hash !== "" && url.search === window.location.search;
          const isBlank = anchor.target === "_blank";

          if (isSameOrigin && !isSamePath && !isHashOnly && !isBlank && !anchor.hasAttribute("download")) {
            startProgress();
          }
        } catch {}
      }

      // Also trigger on fast-nav buttons or router push targets
      const navTrigger = target.closest("[data-fast-nav='true']");
      if (navTrigger) {
        startProgress();
      }
    };

    // Custom programmatic event listener: window.dispatchEvent(new Event('route-nav-start'))
    const handleCustomStart = () => startProgress();
    const handleCustomFinish = () => finishProgress();

    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    window.addEventListener("route-nav-start", handleCustomStart);
    window.addEventListener("route-nav-finish", handleCustomFinish);

    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
      window.removeEventListener("route-nav-start", handleCustomStart);
      window.removeEventListener("route-nav-finish", handleCustomFinish);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.7)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          transitionProperty: "width, opacity",
          transitionDuration: progress === 100 ? "150ms" : "180ms",
        }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}

