"use client";

import React, { useEffect, useState } from "react";
import { OllamaModel } from "@/types/ai";

export type ActiveTabType =
  | "overview"
  | "scraper"
  | "crawler"
  | "datasets"
  | "workflows"
  | "monitoring"
  | "developer"
  | "integrations"
  | "assistant";

interface HeaderProps {
  activeTab: ActiveTabType;
  onTabChange: (tab: ActiveTabType) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenCollections: () => void;
  onOpenPlayground: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  selectedModel,
  onModelChange,
  onOpenCollections,
  onOpenPlayground,
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

  const tabs: { id: ActiveTabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "scraper", label: "Web Scraper" },
    { id: "crawler", label: "Domain Crawler" },
    { id: "datasets", label: "Dataset Studio" },
    { id: "workflows", label: "Workflows" },
    { id: "monitoring", label: "Site Monitor" },
    { id: "developer", label: "Developer API" },
    { id: "integrations", label: "Integrations" },
    { id: "assistant", label: "AI Assistant" },
  ];

  return (
    <header className="mb-6 space-y-4 border-b border-white/10 pb-5">
      {/* Top Bar: Brand & Model & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-purple-600 font-extrabold text-white text-base shadow-[0_0_25px_rgba(99,102,241,0.4)]">
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-400 uppercase border border-indigo-500/20">
                DataForge AI
              </span>
              <span className="text-[11px] tracking-wide text-white/50">
                AI-Powered Web Data Collection & Dataset Generation Platform
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Enterprise Web Scraping & Developer API Hub
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* API Playground Button */}
          <button
            onClick={onOpenPlayground}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-500/10"
          >
            API Playground
          </button>

          {/* Manage Folders Button */}
          <button
            onClick={onOpenCollections}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Folders
          </button>

          {/* Model Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80">
            <span className="text-white/40">Ollama:</span>
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
                  phi:latest
                </option>
              )}
            </select>
          </div>

          {/* System Online Badge */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex flex-wrap gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
