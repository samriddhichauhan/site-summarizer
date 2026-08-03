"use client";

import React, { useState } from "react";
import { Note } from "@/types/note";

interface ReaderModeProps {
  note: Note;
  onClose: () => void;
}

export function ReaderMode({ note, onClose }: ReaderModeProps) {
  const [fontSize, setFontSize] = useState<number>(18);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0c10] text-slate-100 p-6 md:p-12 animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-10 mx-auto max-w-3xl flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            Exit Reader Mode
          </button>
          <span className="text-xs text-white/40 hidden sm:inline">|</span>
          <span className="text-xs text-white/60 truncate max-w-xs font-medium hidden sm:inline">
            {note.title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-white/40">Font:</span>
          <button
            onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize((prev) => Math.min(26, prev + 2))}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            A+
          </button>
        </div>
      </div>

      {/* Reader Content Body */}
      <article className="mx-auto max-w-3xl space-y-6">
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
              {note.domainName || "Web Article"}
            </span>
            <span className="text-xs text-white/40">• {note.readingTime} min read</span>
            <span className="text-xs text-white/40">• {note.wordCount} words</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            {note.title}
          </h1>

          {note.author && (
            <p className="mt-3 text-sm text-white/50">By {note.author}</p>
          )}

          {note.url && (
            <a
              href={note.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              Visit Original Source -&gt;
            </a>
          )}
        </div>

        {/* TLDR highlight box */}
        {note.tldr && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 text-indigo-200">
            <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-400 mb-1">
              TL;DR
            </h4>
            <p className="text-sm leading-relaxed">{note.tldr}</p>
          </div>
        )}

        {/* Article Full Content */}
        <div
          className="whitespace-pre-wrap leading-relaxed text-slate-300/90 tracking-normal font-sans"
          style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
        >
          {note.content}
        </div>
      </article>
    </div>
  );
}
