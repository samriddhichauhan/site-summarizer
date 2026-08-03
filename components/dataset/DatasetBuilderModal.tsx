"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Collection } from "@/types/collection";
import { useToast } from "../ui/Toast";

interface DatasetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onRefreshData: () => void;
}

export function DatasetBuilderModal({
  isOpen,
  onClose,
  collections,
  onRefreshData,
}: DatasetBuilderModalProps) {
  const [urlsInput, setUrlsInput] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const { toast } = useToast();

  async function handleRunBatchScrape() {
    const rawUrls = urlsInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (rawUrls.length === 0) {
      toast("Please enter at least one URL.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      setProgressStatus(`Extracting & building dataset from ${rawUrls.length} websites...`);

      const res = await fetch("/api/v1/batch-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: rawUrls,
          collectionId: selectedCollectionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Batch extraction failed.", "error");
        return;
      }

      toast(
        `Dataset updated! Successfully processed ${data.successfullyProcessed} of ${data.totalRequested} URLs.`,
        "success"
      );

      setUrlsInput("");
      onRefreshData();
    } catch {
      toast("Error executing batch dataset extraction.", "error");
    } finally {
      setIsProcessing(false);
      setProgressStatus("");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Dataset Builder & Bulk Exporter">
      <div className="space-y-5 text-xs text-slate-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
            Batch Website Scraping (Paste URLs, 1 per line)
          </label>
          <textarea
            rows={5}
            placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            disabled={isProcessing}
            className="w-full rounded-2xl border border-white/10 bg-black/50 p-3.5 text-xs text-white placeholder:text-white/25 outline-none font-mono focus:border-indigo-500/50"
          />
        </div>

        {collections.length > 0 && (
          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1">
              Assign Dataset to Folder (Optional)
            </label>
            <select
              value={selectedCollectionId || ""}
              onChange={(e) =>
                setSelectedCollectionId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="h-10 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white outline-none cursor-pointer"
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
          </div>
        )}

        <button
          onClick={handleRunBatchScrape}
          disabled={isProcessing || !urlsInput.trim()}
          className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition disabled:opacity-40 shadow-lg"
        >
          {isProcessing ? progressStatus || "Extracting..." : "Run Batch Extraction"}
        </button>

        {/* Multi-Format Export Buttons Section */}
        <div className="border-t border-white/10 pt-4 space-y-2.5">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider">
            Export Complete Knowledge Base (6 ML Formats)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a
              href="/api/v1/export?format=csv"
              download
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              CSV Dataset
            </a>
            <a
              href="/api/v1/export?format=excel"
              download
              className="flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
            >
              Excel (.xlsx)
            </a>
            <a
              href="/api/v1/export?format=sql"
              download
              className="flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition"
            >
              SQL (.sql)
            </a>
            <a
              href="/api/v1/export?format=parquet"
              download
              className="flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/40 transition"
            >
              Parquet (ML)
            </a>
            <a
              href="/api/v1/export?format=jsonl"
              download
              className="flex items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/40 transition"
            >
              JSONL (LLM)
            </a>
            <a
              href="/api/v1/export?format=json"
              download
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Raw JSON
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
