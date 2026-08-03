"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { downloadFile } from "@/lib/utils";

interface StructuredExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
}

const PRESET_PROMPTS = [
  { label: "Products", prompt: "Extract all products with name, price, rating, and image URL" },
  { label: "Job Listings", prompt: "Extract all job listings with title, company, salary, and location" },
  { label: "Team Members", prompt: "Extract team members with name, role, email, and photo" },
  { label: "Pricing Plans", prompt: "Extract all pricing plans with tier name, monthly price, and key features" },
  { label: "FAQs", prompt: "Extract all frequently asked questions and answers" },
];

export function StructuredExtractionModal({
  isOpen,
  onClose,
  selectedModel,
}: StructuredExtractionModalProps) {
  const [urlInput, setUrlInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("Extract all products with name, price, rating, and image URL");
  const [isExtracting, setIsExtracting] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);

  const { toast } = useToast();

  async function handleRunExtraction() {
    if (!urlInput.trim()) {
      toast("Please enter a target webpage URL to extract from.", "error");
      return;
    }
    if (!customPrompt.trim()) {
      toast("Please enter a custom extraction instruction.", "error");
      return;
    }

    try {
      setIsExtracting(true);
      setResultData(null);

      const res = await fetch("/api/v1/extract-structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          prompt: customPrompt.trim(),
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Structured extraction failed.", "error");
        return;
      }

      setResultData(data);
      toast(`Extraction complete! Found ${data.itemsCount} items.`, "success");
    } catch {
      toast("Error executing AI structured extraction.", "error");
    } finally {
      setIsExtracting(false);
    }
  }

  function handleCopyJSON() {
    if (!resultData?.data) return;
    navigator.clipboard.writeText(JSON.stringify(resultData.data, null, 2));
    toast("Copied JSON array to clipboard!", "success");
  }

  function handleDownloadJSON() {
    if (!resultData?.data) return;
    downloadFile(
      "extracted-schema.json",
      JSON.stringify(resultData.data, null, 2),
      "application/json"
    );
    toast("Downloaded extracted-schema.json", "info");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Structured Extraction (Prompt-Guided Schema)">
      <div className="space-y-5 text-xs text-slate-200">
        {/* URL Input */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
            Webpage URL to Extract From
          </label>
          <input
            type="url"
            placeholder="https://example.com/products or https://example.com/careers"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50"
          />
        </div>

        {/* Preset Prompt Chips */}
        <div>
          <label className="block text-[11px] font-medium text-white/50 mb-1.5">
            Quick Extraction Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => setCustomPrompt(p.prompt)}
                className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                  customPrompt === p.prompt
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Instruction */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
            Extraction Instruction / Desired Schema
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Extract all products with name, price, rating, image URL"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/50 p-3.5 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50"
          />
        </div>

        <button
          onClick={handleRunExtraction}
          disabled={isExtracting || !urlInput.trim() || !customPrompt.trim()}
          className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition disabled:opacity-40 shadow-lg"
        >
          {isExtracting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Analyzing Webpage with AI...
            </span>
          ) : (
            "Run AI Structured Extraction"
          )}
        </button>

        {/* JSON Results Viewer */}
        {resultData && (
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {resultData.itemsCount} Items Extracted
                </span>
                <span className="text-[11px] text-white/50 truncate max-w-xs">
                  {resultData.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition"
                >
                  Copy JSON
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20 transition"
                >
                  Download .JSON
                </button>
              </div>
            </div>

            <pre className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-3.5 text-[11px] font-mono text-emerald-400">
              {JSON.stringify(resultData.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}
