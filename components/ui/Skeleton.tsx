"use client";

import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 border border-white/5 ${className}`}
    />
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-12 w-full" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
