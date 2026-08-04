"use client";

import React, { useEffect, useState } from "react";
import { MonitoredSiteItem } from "@/types/platform";
import { useToast } from "@/components/ui/Toast";

export function SiteMonitorManager() {
  const [sites, setSites] = useState<MonitoredSiteItem[]>([]);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/monitor");
      const data = await res.json();
      if (data.success) {
        setSites(data.sites || []);
      }
    } catch {
      toast("Failed to load monitored sites.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function addSite() {
    if (!url.trim()) return;

    try {
      const res = await fetch("/api/v1/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), name: name.trim() || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        toast(`Monitoring started for ${url}!`, "success");
        setUrl("");
        setName("");
        await fetchSites();
      }
    } catch {
      toast("Failed to start site monitoring.", "error");
    }
  }

  async function checkSite(siteId: number) {
    try {
      toast("Scraping site and computing content hash diff...", "info");
      const res = await fetch("/api/v1/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", siteId }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.data?.hasChanges) {
          toast(`⚡ Content update detected! Changes count: ${data.data.site.changesCount + 1}`, "info");
        } else {
          toast("No content changes detected.", "success");
        }
        await fetchSites();
      }
    } catch {
      toast("Error checking site changes.", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Site Form */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Change Detection Engine
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Website Change Monitoring</h2>
          <p className="text-xs text-white/50">
            Track added, modified, or deleted content across web pages over time with historical snapshots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="url"
            placeholder="https://example.com/pricing"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-11 flex-1 min-w-[260px] rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none"
          />

          <input
            type="text"
            placeholder="Label (e.g. Competitor Pricing Page)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-64 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none"
          />

          <button
            onClick={addSite}
            disabled={!url.trim()}
            className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white transition disabled:opacity-40"
          >
            Start Monitoring
          </button>
        </div>
      </div>

      {/* Monitored Sites List */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Monitored Webpages ({sites.length})</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-white/40">Loading monitored sites...</div>
        ) : sites.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sites.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.name}</h4>
                    <span className="font-mono text-[10px] text-white/40">{s.url}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.status === "alert"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-2">
                  <span>Changes: {s.changesCount}</span>
                  <span>
                    Last Checked: {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleTimeString() : "Never"}
                  </span>
                </div>

                <button
                  onClick={() => checkSite(s.id)}
                  className="w-full rounded-xl bg-white/5 hover:bg-white/10 p-2 text-xs font-semibold text-white/80 transition"
                >
                  ⚡ Check For Changes Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
            No websites monitored yet.
          </div>
        )}
      </div>
    </div>
  );
}
