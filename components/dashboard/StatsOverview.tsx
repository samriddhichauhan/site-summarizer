"use client";

import React from "react";

interface StatsProps {
  stats: {
    totalNotes: number;
    favoritesCount: number;
    collectionsCount: number;
    totalReadingTime: number;
    totalWords: number;
  } | null;
}

export function StatsOverview({ stats }: StatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Saved Articles
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white">
          {stats.totalNotes}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">
          Favorites
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-amber-400">
          {stats.favoritesCount}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/70">
          Time Saved
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-300">
          ~{stats.totalReadingTime} mins
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Folders
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white">
          {stats.collectionsCount}
        </p>
      </div>
    </div>
  );
}
