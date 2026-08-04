"use client";

import React, { useEffect, useState } from "react";
import { ApiKeyItem, ApiLogItem } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
        setLogs(data.recentLogs || []);
      }
    } catch {
      toast("Failed to load API keys.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!keyName.trim()) return;

    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName, rateLimit }),
      });
      const data = await res.json();

      if (data.success && data.apiKey) {
        setCreatedRawKey(data.apiKey.rawKey);
        setKeyName("");
        toast("Developer API Key generated successfully!", "success");
        await fetchKeys();
      } else {
        toast(data.message || "Failed to generate API key.", "error");
      }
    } catch {
      toast("Error creating API key.", "error");
    }
  }

  async function revokeKey(id: number) {
    try {
      const res = await fetch(`/api/v1/keys?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast("API Key revoked.", "info");
        await fetchKeys();
      }
    } catch {
      toast("Failed to revoke API key.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate API Key Card */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Developer Security
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Generate Developer API Key</h2>
          <p className="text-xs text-white/50">
            Use API keys to authenticate REST requests to <code className="text-indigo-300">/api/v1/*</code> endpoints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Key Description (e.g. Production Backend Agent)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="h-11 flex-1 min-w-[240px] rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
            <span className="text-white/40">Rate Limit:</span>
            <select
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              <option value={30} className="bg-slate-900">30 req/min</option>
              <option value={60} className="bg-slate-900">60 req/min</option>
              <option value={120} className="bg-slate-900">120 req/min</option>
              <option value={300} className="bg-slate-900">300 req/min</option>
            </select>
          </div>

          <button
            onClick={createKey}
            disabled={!keyName.trim()}
            className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white transition disabled:opacity-40"
          >
            Create API Key
          </button>
        </div>

        {createdRawKey && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                🎉 Copy Your API Key Now (Only shown once):
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdRawKey);
                  toast("Copied API Key to clipboard!", "success");
                }}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white"
              >
                Copy Key
              </button>
            </div>
            <code className="block select-all rounded-xl bg-black/60 p-2.5 font-mono text-xs text-emerald-300">
              {createdRawKey}
            </code>
          </div>
        )}
      </div>

      {/* Active Keys Table */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Active Developer Keys ({keys.length})</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-white/40">Loading keys...</div>
        ) : keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Key Prefix</th>
                  <th className="pb-3">Rate Limit</th>
                  <th className="pb-3">Requests</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-semibold text-white">{k.name}</td>
                    <td className="py-3 font-mono text-indigo-300">{k.key.slice(0, 15)}...</td>
                    <td className="py-3">{k.rateLimit} req/min</td>
                    <td className="py-3 font-mono text-emerald-400">{k.totalRequests}</td>
                    <td className="py-3 text-white/50">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {k.isActive ? (
                        <button
                          onClick={() => revokeKey(k.id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500 hover:text-white transition"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/30">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
            No developer API keys generated yet.
          </div>
        )}
      </div>

      {/* Recent API Request History Logs */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Recent API Request Logs ({logs.length})</h3>

        {logs.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      log.statusCode < 300
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {log.statusCode}
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{log.method}</span>
                  <span className="font-mono text-white/70">{log.endpoint}</span>
                </div>

                <div className="flex items-center gap-4 text-white/40">
                  <span>{log.responseTimeMs} ms</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
            No API request logs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
