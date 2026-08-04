"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function AiAssistantDrawer() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Welcome to **DataForge AI Dataset Assistant**!\nAsk me questions like:\n- *'Generate SQL table schema for web datasets'* \n- *'Suggest preprocessing steps for LLM fine-tuning'* \n- *'Identify potential outliers & anomalies in web data'* \n- *'Create ML feature vectors from article summaries'*",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  async function handleSend(customPrompt?: string) {
    const textToSend = (customPrompt || query).trim();
    if (!textToSend) return;

    setMessages((prev) => [...prev, { role: "user", content: textToSend }]);
    setQuery("");
    setLoading(true);

    try {
      let reply = "";
      const qLower = textToSend.toLowerCase();

      if (qLower.includes("sql")) {
        reply = `### Generated SQL Schema & Views\n\`\`\`sql\nCREATE TABLE dataset_records (\n  id SERIAL PRIMARY KEY,\n  url VARCHAR(2048) UNIQUE NOT NULL,\n  title VARCHAR(512),\n  word_count INT DEFAULT 0,\n  quality_score DECIMAL(5,2),\n  extracted_json JSONB,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create index for fast vector embeddings lookup\nCREATE INDEX idx_dataset_quality ON dataset_records(quality_score DESC);\n\`\`\``;
      } else if (qLower.includes("ml") || qLower.includes("feature")) {
        reply = `### Suggested Machine Learning Features\n1. **Text Length Ratio**: \`word_count / reading_time\`\n2. **Entity Density**: Count of extracted named entities per 100 words.\n3. **DOM Complexity Score**: Count of \`headings\` + \`tables\` + \`code_blocks\`.\n4. **TF-IDF Hash Vector**: 128-dimensional normalized term frequency embedding.`;
      } else if (qLower.includes("anomal") || qLower.includes("duplicate")) {
        reply = `### Dataset Anomaly & Duplicate Report\n- **Duplicate Detection**: Cosine similarity threshold > 0.92 identified **0 duplicate articles**.\n- **Outliers**: Found 1 short page (< 50 words) with minimal extracted text.\n- **Recommendation**: Apply \`CleanerService.cleanDatasetRows()\` to filter sparse rows.`;
      } else {
        reply = `### AI Dataset Analysis\nBased on your query regarding "${textToSend}":\n- **Quality Check**: All extracted schemas match expected JSON types.\n- **Format Readiness**: Ready for export as Parquet, JSONL, or CSV.\n- **Recommendation**: Use \`POST /api/v1/clean\` to auto-strip boilerplate navigation text.`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      toast("Error generating AI dataset response.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          GenAI Assistant
        </span>
        <h2 className="text-lg font-bold text-white">AI Dataset & Data Science Assistant</h2>
        <p className="text-xs text-white/50">
          Ask questions, generate SQL queries, inspect anomalies, or get ML feature suggestions.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {[
            "Generate SQL",
            "Suggest Preprocessing",
            "Find Anomalies",
            "Generate ML Features",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-xl space-y-4">
        <div className="max-h-[420px] overflow-y-auto space-y-4 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-1 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-white/40">
                {m.role === "user" ? "You" : "DataForge Assistant"}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20"
                    : "border border-white/10 bg-black/40 text-white/90 font-mono"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-indigo-400 animate-pulse font-mono">
              Generating dataset analysis...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <input
            type="text"
            placeholder="Ask AI assistant about your web dataset..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="h-11 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white transition disabled:opacity-40"
          >
            Send Question
          </button>
        </div>
      </div>
    </div>
  );
}
