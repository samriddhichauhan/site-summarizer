"use client";

import React, { useEffect, useState } from "react";
import { DatasetRecordItem, DatasetQualityReport } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

interface DatasetStudioProps {
  onOpenDatasetBuilder?: () => void;
}

export function DatasetStudio({ onOpenDatasetBuilder }: DatasetStudioProps) {
  const [datasets, setDatasets] = useState<DatasetRecordItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleaningReport, setCleaningReport] = useState<DatasetQualityReport | null>(null);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [saveAfterClean, setSaveAfterClean] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchDatasets();
  }, []);

  async function fetchDatasets() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/clean");
      const data = await res.json();
      const savedDatasets: DatasetRecordItem[] = data.success && Array.isArray(data.datasets) ? data.datasets : [];

      const notesRes = await fetch("/api/notes");
      const notesData = await notesRes.json();

      if (Array.isArray(notesData)) {
        const liveRecord: DatasetRecordItem = {
          id: -1,
          name: "Live Web Knowledge Base (Default)",
          description: "All currently scraped articles and extracted smart metadata",
          format: "json",
          rowCount: notesData.length,
          qualityScore: 98.5,
          dataJson: JSON.stringify(notesData),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const allDatasets = [liveRecord, ...savedDatasets];
        setDatasets(allDatasets);
        
        setSelectedDataset((prev) => {
          if (prev && allDatasets.some((d) => d.id === prev.id)) {
            return allDatasets.find((d) => d.id === prev.id) || liveRecord;
          }
          return liveRecord;
        });
      } else {
        setDatasets(savedDatasets);
        if (savedDatasets.length > 0) {
          setSelectedDataset(savedDatasets[0]);
        }
      }
    } catch {
      toast("Failed to load dataset records.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function runAiCleaning() {
    if (!selectedDataset) return;
    try {
      setCleanLoading(true);
      const parsedRows = JSON.parse(selectedDataset.dataJson);

      const bodyPayload: any = {
        rows: parsedRows,
        options: {
          removeNavigation: true,
          removeAds: true,
          removeDuplicateParagraphs: true,
          removeCookieBanners: true,
          cleanWhitespace: true,
        },
      };

      if (saveAfterClean) {
        if (!newDatasetName.trim()) {
          toast("Please enter a name for the cleaned dataset.", "error");
          return;
        }
        bodyPayload.saveDataset = true;
        bodyPayload.datasetName = newDatasetName.trim();
      }

      const res = await fetch("/api/v1/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        setCleaningReport(data.report);
        toast(`AI Cleaning complete! Quality Score: ${data.report.qualityScore}%`, "success");
        setNewDatasetName("");
        await fetchDatasets();
      } else {
        toast(data.message || "AI Dataset Cleaning failed.", "error");
      }
    } catch {
      toast("AI Dataset Cleaning failed.", "error");
    } finally {
      setCleanLoading(false);
    }
  }

  async function deleteDataset(id: number) {
    if (id === -1) {
      toast("Cannot delete the dynamic live knowledge base.", "error");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this saved dataset?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/clean?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast("Dataset deleted successfully.", "success");
        await fetchDatasets();
      } else {
        toast(data.message || "Failed to delete dataset.", "error");
      }
    } catch {
      toast("Error deleting dataset.", "error");
    } finally {
      setLoading(false);
    }
  }

  function downloadExport(format: string) {
    window.open(`/api/v1/export?format=${format}`, "_blank");
    toast(`Exporting dataset as ${format.toUpperCase()}...`, "info");
  }

  const rows = selectedDataset ? JSON.parse(selectedDataset.dataJson) : [];
  const previewKeys = rows.length > 0 ? Object.keys(rows[0]).slice(0, 6) : [];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Dataset Engineering
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Dataset Studio & AI Data Cleaner</h2>
          <p className="text-xs text-white/50">
            Clean, deduplicate, compute Quality Scores, and export to Parquet, JSONL, SQL, CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDatasetBuilder && (
            <button
              onClick={onOpenDatasetBuilder}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 cursor-pointer"
            >
              📥 Ingest Batch URLs
            </button>
          )}
          <button
            onClick={runAiCleaning}
            disabled={cleanLoading || !selectedDataset}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-40 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            {cleanLoading ? "Cleaning Dataset..." : "Run AI Cleaning & Quality Check"}
          </button>
        </div>
      </div>

      {/* Quality Score Report Banner */}
      {cleaningReport && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-sm">
                {cleaningReport.qualityScore}%
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Dataset Quality Score</h4>
                <p className="text-xs text-emerald-300">
                  {cleaningReport.validRows} valid rows | {cleaningReport.duplicatesRemoved} duplicates removed
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 pl-2 text-xs text-white/80">
            {cleaningReport.suggestions.map((s, idx) => (
              <p key={idx}>• {s}</p>
            ))}
          </div>
        </div>
      )}

      {/* Dataset Repository Bar */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Dataset Repository
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <label className="text-xs text-white/60 font-medium">Select Dataset:</label>
            <select
              value={selectedDataset?.id || ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = datasets.find((d) => d.id === id);
                if (found) setSelectedDataset(found);
              }}
              className="h-10 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none cursor-pointer"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.name} ({d.rowCount} rows) {d.id === -1 ? "- Live Notes" : `- Quality: ${d.qualityScore}%`}
                </option>
              ))}
            </select>
          </div>

          {selectedDataset && selectedDataset.id !== -1 && (
            <button
              onClick={() => deleteDataset(selectedDataset.id)}
              className="h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
            >
              Delete Saved Dataset
            </button>
          )}
        </div>

        {/* Clean dataset naming and options */}
        <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-black/20 p-4 border border-white/5">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-white/50 mb-1.5">
              New Dataset Name (when cleaning)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleaned Fine-Tuning Set"
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="saveAfterClean"
              checked={saveAfterClean}
              onChange={(e) => setSaveAfterClean(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-black/40 accent-indigo-600"
            />
            <label htmlFor="saveAfterClean" className="text-xs text-white/80 cursor-pointer select-none">
              Save cleaned version to database
            </label>
          </div>
        </div>
      </div>

      {/* Multi-Format Exporters Bar */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Export Dataset Format
        </h3>

        <div className="flex flex-wrap items-center gap-2.5">
          {["csv", "parquet", "jsonl", "sql", "excel", "json"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => downloadExport(fmt)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 hover:border-indigo-500 shadow-md cursor-pointer"
            >
              Export {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Data Grid Preview */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Live Dataset Preview ({rows.length} rows)</h3>
          <span className="text-xs text-white/40">Showing raw tabular data structure (first 30 rows)</span>
        </div>

        {rows.length > 0 ? (
          <div className="max-h-[400px] overflow-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 text-indigo-300 font-bold uppercase text-[10px]">
                <tr className="border-b border-white/10">
                  {previewKeys.map((k) => (
                    <th key={k} className="p-3">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {rows.slice(0, 30).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    {previewKeys.map((k) => (
                      <td key={k} className="p-3 max-w-[240px] truncate">
                        {typeof row[k] === "object" ? JSON.stringify(row[k]) : String(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
            No dataset rows found to preview.
          </div>
        )}
      </div>
    </div>
  );
}

