"use client";

import React, { useState } from "react";
import { Note } from "@/types/note";
import { generatePDF, generateMarkdown, downloadFile, parseJsonArray } from "@/lib/utils";
import { useToast } from "../ui/Toast";
import { ChatPanel } from "../chat/ChatPanel";

interface WorkspaceProps {
  note: Note | null;
  loading: boolean;
  selectedModel: string;
  onOpenReaderMode: () => void;
  onEditNote: () => void;
}

export function Workspace({
  note,
  loading,
  selectedModel,
  onOpenReaderMode,
  onEditNote,
}: WorkspaceProps) {
  const [viewMode, setViewMode] = useState<"summary" | "content" | "chat">("summary");
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
          <div className="h-8 w-3/4 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-xl bg-white/5 animate-pulse" />
          <div className="h-4 w-5/6 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-4 w-4/6 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-white/40">
          AI is analyzing website content and generating structured summary...
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[11px] font-bold text-white/40 uppercase mb-4">
          Empty
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Summary Workspace</h3>
        <p className="mt-2 max-w-md text-sm text-white/50 leading-relaxed">
          Paste any website URL in the left sidebar to extract clean article text, generate a structured AI summary, and chat interactively with the article.
        </p>
      </div>
    );
  }

  const takeaways = parseJsonArray(note.takeaways);
  const keywords = parseJsonArray(note.keywords);

  function handleCopySummary() {
    try {
      navigator.clipboard.writeText(note?.summary || note?.tldr || "");
      toast("Summary copied to clipboard!", "success");
    } catch {
      toast("Failed to copy summary.", "error");
    }
  }

  function handleExportPDF() {
    try {
      generatePDF(note!);
      toast("PDF downloaded successfully!", "success");
    } catch (err) {
      toast("PDF export failed.", "error");
    }
  }

  function handleDownloadMarkdown() {
    try {
      const md = generateMarkdown(note!);
      const safeTitle = (note!.title || "summary")
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, "-");
      downloadFile(`${safeTitle}.md`, md, "text/markdown");
      toast("Markdown file downloaded!", "success");
    } catch {
      toast("Markdown download failed.", "error");
    }
  }

  function handleExportJSON() {
    try {
      const jsonStr = JSON.stringify(note, null, 2);
      const safeTitle = (note!.title || "note")
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, "-");
      downloadFile(`${safeTitle}.json`, jsonStr, "application/json");
      toast("JSON exported!", "success");
    } catch {
      toast("JSON export failed.", "error");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note!.title,
          text: note!.tldr || note!.summary.slice(0, 100),
          url: note!.url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(note!.url);
      toast("Article URL copied to clipboard!", "info");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[550px]">
      <div>
        {/* Article Header & Title */}
        <div className="mb-6 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                {note.domainName || "Web"}
              </span>
              <span className="text-xs text-white/40">
                {note.readingTime} min read ({note.wordCount} words)
              </span>
              {note.difficulty && (
                <span className="text-xs font-medium text-amber-400">
                  • {note.difficulty}
                </span>
              )}
            </div>

            <button
              onClick={onOpenReaderMode}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              Distraction-Free Reader Mode
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
            {note.title}
          </h2>

          <div className="mt-2 flex items-center justify-between">
            {note.url && (
              <a
                href={note.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Open Original Page -&gt;
              </a>
            )}

            <button
              onClick={onEditNote}
              className="text-xs text-white/50 hover:text-white transition"
            >
              Edit Note
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Actions Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("summary")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                viewMode === "summary"
                  ? "bg-white text-black shadow-lg"
                  : "border border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              Structured Summary
            </button>
            <button
              onClick={() => setViewMode("content")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                viewMode === "content"
                  ? "bg-white text-black shadow-lg"
                  : "border border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              Full Article Content
            </button>
            <button
              onClick={() => setViewMode("chat")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                viewMode === "chat"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "border border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              AI Chat
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
              title="Copy Summary text"
            >
              Copy
            </button>
            <button
              onClick={handleExportPDF}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              PDF
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              .MD
            </button>
            <button
              onClick={handleExportJSON}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              .JSON
            </button>
            <button
              onClick={handleShare}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              Share
            </button>
          </div>
        </div>

        {/* Content Body View */}
        {viewMode === "chat" ? (
          <ChatPanel note={note} selectedModel={selectedModel} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 min-h-[300px]">
            {viewMode === "summary" ? (
              <div className="space-y-6">
                {/* TLDR Box */}
                {note.tldr && (
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                      TL;DR
                    </span>
                    <p className="mt-1 text-sm font-medium text-indigo-100 leading-relaxed">
                      {note.tldr}
                    </p>
                  </div>
                )}

                {/* Summary Markdown Text */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 font-sans">
                  {note.summary}
                </div>

                {/* Takeaways Section */}
                {takeaways.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-2">
                      Actionable Takeaways
                    </h4>
                    <ul className="space-y-1.5 text-xs text-white/80">
                      {takeaways.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords Tag Pills */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-4">
                    <span className="text-xs text-white/40 font-medium mr-1">Tags:</span>
                    {keywords.map((k, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-white/70"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-sans max-h-[500px] overflow-y-auto pr-2">
                {note.content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
