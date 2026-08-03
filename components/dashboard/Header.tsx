"use client";

import React, { useEffect, useState } from "react";
import { OllamaModel } from "@/types/ai";

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenCollections: () => void;
  onOpenDatasetBuilder: () => void;
  onOpenCrawler: () => void;
  onOpenStructuredExtraction: () => void;
}

export function Header({
  selectedModel,
  onModelChange,
  onOpenCollections,
  onOpenDatasetBuilder,
  onOpenCrawler,
  onOpenStructuredExtraction,
}: HeaderProps) {
  const [models, setModels] = useState<OllamaModel[]>([]);

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        if (!selectedModel) {
          onModelChange(data.models[0].name);
        }
      }
    } catch {
      // Fallback
    }
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          PIPELINE
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 uppercase border border-indigo-500/20">
              AI Web Data Pipeline
            </span>
            <span className="text-[11px] tracking-wide text-white/40">
              Firecrawl • BrightData • Diffbot • Ollama
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Web Data Collection & AI Engineering Platform
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Custom AI Extraction Button */}
        <button
          onClick={onOpenStructuredExtraction}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600 hover:text-white shadow-lg shadow-emerald-500/10"
        >
          Custom AI Extraction
        </button>

        {/* Crawl Entire Website Button */}
        <button
          onClick={onOpenCrawler}
          className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-600/20 px-3.5 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-600 hover:text-white shadow-lg shadow-purple-500/10"
        >
          Crawl Entire Website
        </button>

        {/* Dataset Builder Button */}
        <button
          onClick={onOpenDatasetBuilder}
          className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-500/10"
        >
          Dataset Builder & ML Export
        </button>

        {/* Collection Folders Button */}
        <button
          onClick={onOpenCollections}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Manage Folders
        </button>

        {/* Model Selector */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80">
          <span className="text-white/40">AI Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-transparent text-white font-medium outline-none cursor-pointer"
          >
            {models.length > 0 ? (
              models.map((m) => (
                <option key={m.name} value={m.name} className="bg-slate-900 text-white">
                  {m.name}
                </option>
              ))
            ) : (
              <option value="phi:latest" className="bg-slate-900 text-white">
                phi:latest (default)
              </option>
            )}
          </select>
        </div>

        {/* Ready Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Pipeline Ready
        </div>
      </div>
    </header>
  );
}
