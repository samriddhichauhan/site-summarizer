"use client";

import React, { useEffect, useState } from "react";
import { WorkflowPipelineItem } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function WorkflowBuilder() {
  const [pipelines, setPipelines] = useState<WorkflowPipelineItem[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
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
        const list = data.pipelines || [];
        setPipelines(list);
        if (list.length > 0) {
          setSelectedPipelineId((prev) => {
            if (prev && list.some((p: any) => p.id === prev)) return prev;
            return list[0].id;
          });
        } else {
          setSelectedPipelineId(null);
        }
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
        setPipelineName("Standard Web Data Pipeline");
        await fetchPipelines();
      }
    } catch {
      toast("Failed to create pipeline.", "error");
    }
  }

  async function runPipeline() {
    if (!selectedPipelineId || !targetUrl.trim()) return;

    try {
      setExecuting(true);
      setExecutionLogs([]);
      setExecutionOutput(null);

      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          pipelineId: selectedPipelineId,
          url: targetUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionLogs(data.logs || []);
        setExecutionOutput(data.output);
        toast("Pipeline executed successfully!", "success");
        await fetchPipelines();
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

  async function deletePipeline(id: number) {
    if (!confirm("Are you sure you want to permanently delete this pipeline?")) return;

    try {
      const res = await fetch(`/api/v1/workflows?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast("Pipeline deleted successfully.", "success");
        await fetchPipelines();
      } else {
        toast(data.message || "Failed to delete pipeline.", "error");
      }
    } catch {
      toast("Error deleting pipeline.", "error");
    }
  }

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const nodes = selectedPipeline && selectedPipeline.nodesJson 
    ? JSON.parse(selectedPipeline.nodesJson) 
    : [];

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
            Connect data collection steps into an automated DAG pipeline: URL {"->"} Scrape {"->"} Clean {"->"} Summarize {"->"} Export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Pipeline Name"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={createPipeline}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 text-xs font-bold text-white transition cursor-pointer"
          >
            Create Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Selection & Management */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Pipeline Repository
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <label className="text-xs text-white/60 font-medium">Select Pipeline:</label>
            <select
              value={selectedPipelineId || ""}
              onChange={(e) => setSelectedPipelineId(e.target.value ? Number(e.target.value) : null)}
              className="h-10 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none cursor-pointer"
            >
              {pipelines.length > 0 ? (
                pipelines.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.name} (Steps: {p.nodesJson ? JSON.parse(p.nodesJson).length : 0})
                  </option>
                ))
              ) : (
                <option value="" className="bg-slate-900">No pipelines created yet</option>
              )}
            </select>
          </div>

          {selectedPipelineId && (
            <button
              onClick={() => deletePipeline(selectedPipelineId)}
              className="h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
            >
              Delete Pipeline
            </button>
          )}
        </div>

        {selectedPipeline && selectedPipeline.description && (
          <p className="text-xs text-white/60 pl-2">
            Description: {selectedPipeline.description}
          </p>
        )}
      </div>

      {/* Visual Pipeline DAG Flow Simulation */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
          Active Pipeline DAG Visualizer
        </h3>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 justify-start">
          {nodes.length > 0 ? (
            nodes.map((node: any, idx: number) => {
              let colorClasses = "border-indigo-500/40 bg-indigo-500/10 text-indigo-400";
              if (node.type === "clean") colorClasses = "border-purple-500/40 bg-purple-500/10 text-purple-400";
              else if (node.type === "summarize") colorClasses = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
              else if (node.type === "export") colorClasses = "border-blue-500/40 bg-blue-500/10 text-blue-400";

              return (
                <React.Fragment key={node.id}>
                  {idx > 0 && <span className="text-indigo-400 font-bold text-sm mx-1">→</span>}
                  <div className={`flex h-14 w-40 flex-col items-center justify-center rounded-xl border text-center ${colorClasses}`}>
                    <span className="text-[10px] font-bold uppercase">Step {idx + 1}: {node.type}</span>
                    <span className="text-xs font-bold text-white truncate max-w-[150px] px-1">{node.name}</span>
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <p className="text-xs text-white/40 italic p-4 text-center w-full">Select or create a pipeline to visualize its flow.</p>
          )}
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
            onClick={runPipeline}
            disabled={executing || !targetUrl.trim() || !selectedPipelineId}
            className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {executing ? "Executing Workflow..." : "Run Pipeline Workflow"}
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

      {/* Execution History */}
      {selectedPipeline && (selectedPipeline as any).executions && (selectedPipeline as any).executions.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Recent Pipeline Executions (Up to 3)
          </h3>
          <div className="space-y-3">
            {(selectedPipeline as any).executions.map((exec: any) => {
              const dateStr = new Date(exec.startedAt).toLocaleString();
              let statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
              if (exec.status === "failed") statusColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
              else if (exec.status === "running") statusColor = "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";

              return (
                <div key={exec.id} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white/50">ID: #{exec.id} | Started: {dateStr}</span>
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>
                      {exec.status}
                    </span>
                  </div>
                  {exec.logsJson && (
                    <div className="text-[11px] font-mono text-white/70 max-h-24 overflow-y-auto bg-black/40 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                      {JSON.parse(exec.logsJson).join("\n")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
