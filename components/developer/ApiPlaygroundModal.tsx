"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface ApiPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiPlaygroundModal({ isOpen, onClose }: ApiPlaygroundModalProps) {
  const [endpoint, setEndpoint] = useState("/api/v1/scrape");
  const [method, setMethod] = useState("POST");
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        url: "https://news.ycombinator.com",
        useDynamicBrowser: false,
        screenshot: false,
      },
      null,
      2
    )
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  if (!isOpen) return null;

  async function sendRequest() {
    try {
      setLoading(true);
      setResponseStatus(null);
      setResponseData(null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey.trim()) {
        headers["x-api-key"] = apiKey.trim();
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (method !== "GET" && requestBody.trim()) {
        options.body = requestBody.trim();
      }

      const res = await fetch(endpoint, options);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(JSON.stringify(json, null, 2));
      toast(`API Response: ${res.status}`, res.ok ? "success" : "error");
    } catch (err: any) {
      toast("API Request Failed: " + err?.message, "error");
      setResponseData(JSON.stringify({ error: err?.message }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  const generatedCurl = `curl -X ${method} "${typeof window !== "undefined" ? window.location.origin : ""}${endpoint}" \\
  -H "Content-Type: application/json" \\
  ${apiKey ? `-H "x-api-key: ${apiKey}" \\` : ""}${method !== "GET" ? `  -d '${requestBody.replace(/\n/g, "")}'` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Developer Studio
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">Interactive REST API Playground</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Playground Controls */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2 overflow-y-auto pr-1">
          {/* Left Column: Request Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">API Endpoint & Method</label>
              <div className="flex items-center gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-bold text-indigo-400 outline-none"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <select
                  value={endpoint}
                  onChange={(e) => {
                    setEndpoint(e.target.value);
                    if (e.target.value === "/api/v1/extract-structured") {
                      setRequestBody(JSON.stringify({ url: "https://example.com", prompt: "Extract product titles and prices" }, null, 2));
                    } else if (e.target.value === "/api/v1/clean") {
                      setRequestBody(JSON.stringify({ text: "Hello   world!\n\nHello   world!\n\nPrivacy Policy" }, null, 2));
                    } else if (e.target.value === "/api/v1/embed") {
                      setRequestBody(JSON.stringify({ text: "Artificial Intelligence Web Scraper" }, null, 2));
                    }
                  }}
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white font-mono outline-none"
                >
                  <option value="/api/v1/scrape">/api/v1/scrape</option>
                  <option value="/api/v1/crawl">/api/v1/crawl</option>
                  <option value="/api/v1/extract-structured">/api/v1/extract-structured</option>
                  <option value="/api/v1/clean">/api/v1/clean</option>
                  <option value="/api/v1/embed">/api/v1/embed</option>
                  <option value="/api/v1/export">/api/v1/export</option>
                  <option value="/api/v1/keys">/api/v1/keys</option>
                  <option value="/api/v1/workflows">/api/v1/workflows</option>
                  <option value="/api/v1/monitor">/api/v1/monitor</option>
                  <option value="/api/v1/integrations">/api/v1/integrations</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">x-api-key (Optional)</label>
              <input
                type="text"
                placeholder="df_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 font-mono text-xs text-indigo-300 outline-none"
              />
            </div>

            {method !== "GET" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">JSON Request Body</label>
                <textarea
                  rows={8}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-xs text-emerald-300 outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              onClick={sendRequest}
              disabled={loading}
              className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition shadow-lg disabled:opacity-50"
            >
              {loading ? "Executing API Request..." : "Send REST Request"}
            </button>

            {/* Generated cURL snippet */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/50">Generated cURL Command</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCurl);
                    toast("cURL command copied to clipboard!", "info");
                  }}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Copy cURL
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/80 p-3 font-mono text-[10px] text-indigo-300">
                {generatedCurl}
              </pre>
            </div>
          </div>

          {/* Right Column: Response Output */}
          <div className="flex flex-col space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white">API Response Output</span>
              {responseStatus && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    responseStatus < 300
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  HTTP {responseStatus}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-emerald-400 bg-black/60 p-3 rounded-xl">
              {responseData ? (
                <pre>{responseData}</pre>
              ) : (
                <span className="text-white/30 italic">Response data will appear here after request execution...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
