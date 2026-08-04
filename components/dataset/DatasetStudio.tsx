"use client";

import React, { useEffect, useState } from "react";
import { DatasetRecordItem, DatasetQualityReport } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function DatasetStudio() {
  const [datasets, setDatasets] = useState<DatasetRecordItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleaningReport, setCleaningReport] = useState<DatasetQualityReport | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchDatasets();
  }, []);

  async function fetchDatasets() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/clean");
      const notesRes = await fetch("/api/notes");
      const notesData = await notesRes.json();

      if (Array.isArray(notesData)) {
        const generatedRecord: DatasetRecordItem = {
          id: 1,
          name: "Live Web Knowledge Base",
          description: "All scraped articles and smart extracted schemas",
          format: "json",
          rowCount: notesData.length,
          qualityScore: 98.5,
          dataJson: JSON.stringify(notesData.slice(0, 10)),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setDatasets([generatedRecord]);
        setSelectedDataset(generatedRecord);
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

      const res = await fetch("/api/v1/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedRows,
          options: {
            removeNavigation: true,
            removeAds: true,
            removeDuplicateParagraphs: true,
            removeCookieBanners: true,
            cleanWhitespace: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCleaningReport(data.report);
        toast(`AI Cleaning complete! Quality Score: ${data.report.qualityScore}%`, "success");
      }
    } catch {
      toast("AI Dataset Cleaning failed.", "error");
    } finally {
      setCleanLoading(false);
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
          <button
            onClick={runAiCleaning}
            disabled={cleanLoading || !selectedDataset}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-40 shadow-lg shadow-purple-500/20"
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

      {/* Multi-Format Exporters Bar */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Export Dataset Format
        </h3>

        <div className="flex flex-wrap items-center gap-2.5">
          {["csv", "parquet", "jsonl", "sql", "excel", "json"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => downloadExport(fmt)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 hover:border-indigo-500 shadow-md"
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
          <span className="text-xs text-white/40">Showing raw tabular data structure</span>
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
                {rows.map((row: any, idx: number) => (
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
