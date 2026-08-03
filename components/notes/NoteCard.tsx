"use client";

import React from "react";
import { Note } from "@/types/note";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
}

export function NoteCard({
  note,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite,
  onEdit,
}: NoteCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
              {note.domainName || "Web"}
            </span>
            {note.readingTime && (
              <span className="text-[10px] text-white/40">
                {note.readingTime} min read
              </span>
            )}
            {note.difficulty && (
              <span
                className={`text-[10px] font-medium ${
                  note.difficulty === "Advanced"
                    ? "text-rose-400"
                    : note.difficulty === "Intermediate"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                • {note.difficulty}
              </span>
            )}
          </div>

          <h3 className="truncate font-semibold text-sm text-white group-hover:text-indigo-300 transition">
            {note.title || note.url}
          </h3>
        </div>

        {/* Favorite Bookmark */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border transition ${
            note.isFavorite
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/60"
          }`}
          title={note.isFavorite ? "Remove Favorite" : "Add to Favorites"}
        >
          {note.isFavorite ? "Fav" : "Save"}
        </button>
      </div>

      {/* TLDR / Summary Preview */}
      <p className="mt-2 line-clamp-2 text-xs text-white/55 leading-relaxed">
        {note.tldr || note.summary.replace(/^#.*\n/gm, "").slice(0, 140)}
      </p>

      {/* Footer Info & Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
        <div className="flex items-center gap-2 text-white/40">
          {note.collection && (
            <span className="flex items-center gap-1 font-medium text-indigo-400">
              {note.collection.name}
            </span>
          )}
          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-white/50 hover:text-white transition text-xs font-medium"
            title="Edit Note"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-rose-400 hover:text-rose-300 transition font-bold text-xs"
            title="Delete Note"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
