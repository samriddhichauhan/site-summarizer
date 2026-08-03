"use client";

import React from "react";
import { Collection } from "@/types/collection";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCollectionId: number | null;
  onCollectionChange: (id: number | null) => void;
  collections: Collection[];
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedCollectionId,
  onCollectionChange,
  collections,
  onlyFavorites,
  onToggleFavorites,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="mb-4 space-y-3">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search articles by title, content, or tag..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/50 focus:bg-black/60"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-2.5 text-xs text-white/40 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Favorites Filter Toggle */}
          <button
            onClick={onToggleFavorites}
            className={`rounded-xl border px-3 py-1.5 font-medium transition ${
              onlyFavorites
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Favorites Only
          </button>

          {/* Collection Select */}
          {collections.length > 0 && (
            <select
              value={selectedCollectionId || ""}
              onChange={(e) =>
                onCollectionChange(e.target.value ? Number(e.target.value) : null)
              }
              className="h-8 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white/80 outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">
                All Folders
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-white/40">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-8 rounded-xl border border-white/10 bg-black/40 px-2.5 text-xs text-white/80 outline-none cursor-pointer"
          >
            <option value="newest" className="bg-slate-900">
              Newest First
            </option>
            <option value="oldest" className="bg-slate-900">
              Oldest First
            </option>
            <option value="title" className="bg-slate-900">
              Title (A-Z)
            </option>
            <option value="readingTime" className="bg-slate-900">
              Reading Time
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
