"use client";

import React, { useState, useRef } from "react";

interface MovableBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  text?: string;
  iconColorClass?: string;
  initialPos: { top?: string; bottom?: string; left?: string; right?: string };
  animationClass?: string;
}

export default function MovableBadge({
  icon: Icon,
  text,
  iconColorClass = "text-blue-600 dark:text-blue-400",
  initialPos,
  animationClass = "animate-float-slow",
}: MovableBadgeProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: offset.x,
      initialOffsetY: offset.y,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setOffset({
      x: startRef.current.initialOffsetX + dx,
      y: startRef.current.initialOffsetY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        ...initialPos,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      className={`absolute z-30 select-none bg-white/95 dark:bg-[#111C31]/95 border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-2.5 py-1.5 shadow-md hover:shadow-lg flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#111827] dark:text-[#F1F5F9] backdrop-blur-xs transition-shadow duration-150 active:scale-105 ${
        !isDragging ? animationClass : "scale-105 shadow-xl ring-2 ring-blue-500/40"
      }`}
      title="Click & drag badge anywhere"
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColorClass}`} />
      {text && <span className="whitespace-nowrap">{text}</span>}
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
    </div>
  );
}
