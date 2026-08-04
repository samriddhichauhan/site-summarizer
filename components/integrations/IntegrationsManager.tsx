"use client";

import React, { useEffect, useState } from "react";
import { IntegrationConfigItem } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function IntegrationsManager() {
  const [integrations, setIntegrations] = useState<IntegrationConfigItem[]>([]);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("webhook");
  const [webhookUrl, setWebhookUrl] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      const res = await fetch("/api/v1/integrations");
      const data = await res.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      }
    } catch {
      //
    }
  }

  async function addIntegration() {
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/v1/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          provider,
          config: { webhookUrl: webhookUrl.trim() },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(`Integration "${name}" added!`, "success");
        setName("");
        setWebhookUrl("");
        await fetchIntegrations();
      }
    } catch {
      toast("Failed to add integration.", "error");
    }
  }

  async function testIntegration(id: number) {
    try {
      const res = await fetch("/api/v1/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          integrationId: id,
          data: { sample: "DataForge AI Web Data Sync Test" },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(data.message || "Test payload dispatched!", "success");
      }
    } catch {
      toast("Failed to dispatch test payload.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Connector Form */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Export Connectors
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Third-Party Platform Integrations</h2>
          <p className="text-xs text-white/50">
            Automatically dispatch scraped web data to Webhooks, Slack, Notion, Airtable, Google Sheets, Postgres, or MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Connector Name (e.g. Slack Engineering Alert)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 flex-1 min-w-[240px] rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none"
          />

          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs font-bold text-white outline-none"
          >
            <option value="webhook" className="bg-slate-900">Custom Webhook HTTP</option>
            <option value="slack" className="bg-slate-900">Slack Webhook</option>
            <option value="notion" className="bg-slate-900">Notion Database</option>
            <option value="airtable" className="bg-slate-900">Airtable API</option>
            <option value="googlesheets" className="bg-slate-900">Google Sheets</option>
            <option value="postgres" className="bg-slate-900">PostgreSQL DB</option>
            <option value="mongodb" className="bg-slate-900">MongoDB Atlas</option>
          </select>

          <input
            type="text"
            placeholder="Webhook / Endpoint URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="h-11 flex-1 min-w-[240px] rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white font-mono outline-none"
          />

          <button
            onClick={addIntegration}
            disabled={!name.trim()}
            className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white transition disabled:opacity-40"
          >
            Add Connector
          </button>
        </div>
      </div>

      {/* Configured Connectors List */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Configured Platform Connectors ({integrations.length})</h3>

        {integrations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase">
                    {item.provider}
                  </span>
                </div>

                <button
                  onClick={() => testIntegration(item.id)}
                  className="w-full rounded-xl bg-indigo-600/20 border border-indigo-500/30 p-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                >
                  Test Webhook Dispatch
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
            No active platform connectors added yet.
          </div>
        )}
      </div>
    </div>
  );
}
