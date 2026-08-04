"use client";

import React, { useEffect, useState } from "react";
import { WorkflowPipelineItem } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function WorkflowBuilder() {
  const [pipelines, setPipelines] = useState<WorkflowPipelineItem[]>([]);
  const [pipelineName, setPipelineName] = useState("Standard Web Data Pipeline");
  const [targetUrl, setTargetUrl] = useState("https://news.ycombinator.com");
  const [executing, setExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [executionOutput, setExecutionOutput] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchPipelines();
  }, []);

  async function fetchPipelines() {
    try {
      const res = await fetch("/api/v1/workflows");
      const data = await res.json();
      if (data.success) {
        setPipelines(data.pipelines || []);
      }
    } catch {
      //
    }
  }

  async function createPipeline() {
    try {
      const nodes = [
        { id: "1", type: "scrape", name: "Web Scraper Node" },
        { id: "2", type: "clean", name: "AI Dataset Cleaning Node" },
        { id: "3", type: "summarize", name: "Ollama AI Summarization Node" },
        { id: "4", type: "export", name: "Multi-Format Export Node" },
      ];

      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipelineName,
          description: "Scrape -> Clean -> Summarize -> Export pipeline",
          nodes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(`Pipeline "${pipelineName}" created!`, "success");
        await fetchPipelines();
      }
    } catch {
      toast("Failed to create pipeline.", "error");
    }
  }

  async function runPipeline(pipelineId: number) {
    if (!targetUrl.trim()) return;

    try {
      setExecuting(true);
      setExecutionLogs([]);
      setExecutionOutput(null);

      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          pipelineId,
          url: targetUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionLogs(data.logs || []);
        setExecutionOutput(data.output);
        toast("Pipeline executed successfully!", "success");
      } else {
        setExecutionLogs(data.logs || []);
        toast(data.error || "Pipeline execution failed.", "error");
      }
    } catch {
      toast("Error running pipeline execution.", "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Workflow Builder Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Pipeline Orchestration
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Visual Workflow Pipeline Builder</h2>
          <p className="text-xs text-white/50">
            Connect data collection steps into an automated DAG pipeline: URL → Scrape → Clean → Summarize → Export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Pipeline Name"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none"
          />
          <button
            onClick={createPipeline}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 text-xs font-bold text-white transition"
          >
            Create Pipeline
          </button>
        </div>
      </div>

      {/* Visual Pipeline DAG Flow Simulation */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
          Active Pipeline DAG Visualizer
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex h-14 w-36 flex-col items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-indigo-400">Step 1</span>
            <span className="text-xs font-bold text-white">🌐 URL Scraper</span>
          </div>

          <span className="text-indigo-400 font-bold text-sm">➔</span>

          <div className="flex h-14 w-36 flex-col items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-purple-400">Step 2</span>
            <span className="text-xs font-bold text-white">🧹 AI Data Clean</span>
          </div>

          <span className="text-purple-400 font-bold text-sm">➔</span>

          <div className="flex h-14 w-36 flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-400">Step 3</span>
            <span className="text-xs font-bold text-white">🤖 AI Summarize</span>
          </div>

          <span className="text-emerald-400 font-bold text-sm">➔</span>

          <div className="flex h-14 w-36 flex-col items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-400">Step 4</span>
            <span className="text-xs font-bold text-white">📥 Multi Export</span>
          </div>
        </div>

        {/* Target URL Execution Form */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="url"
            placeholder="Target URL for pipeline execution (e.g. https://example.com)"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="h-11 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white placeholder:text-white/30 outline-none"
          />

          <button
            onClick={() => runPipeline(pipelines[0]?.id || 1)}
            disabled={executing || !targetUrl.trim()}
            className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 text-xs font-bold text-white transition disabled:opacity-40"
          >
            {executing ? "Executing Workflow..." : "▶ Run Pipeline Workflow"}
          </button>
        </div>
      </div>

      {/* Execution Logs Terminal & Output Payload */}
      {executionLogs.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-5 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Execution Logs Terminal
            </h4>
            <div className="max-h-[250px] overflow-y-auto space-y-1 font-mono text-xs text-emerald-400">
              {executionLogs.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          </div>

          {executionOutput && (
            <div className="rounded-3xl border border-white/10 bg-black/60 p-5 space-y-2">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Pipeline Final Output Payload
              </h4>
              <pre className="max-h-[250px] overflow-y-auto font-mono text-xs text-white/80">
                {JSON.stringify(executionOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
