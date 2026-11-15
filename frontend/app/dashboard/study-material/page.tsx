"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { StudyMaterialContent } from "./_components/StudyMaterialContent";

export default function StudyMaterialPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
          <p className="text-xs">Loading study materials...</p>
        </div>
      }
    >
      <StudyMaterialContent />
    </Suspense>
  );
}
