"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import { Collection } from "@/types/collection";
import { CrawlJobStatus } from "@/lib/crawler";
import { useToast } from "../ui/Toast";

interface DomainCrawlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onRefreshData: () => void;
}

export function DomainCrawlerModal({
  isOpen,
  onClose,
  collections,
  onRefreshData,
}: DomainCrawlerModalProps) {
  const [seedUrl, setSeedUrl] = useState("");
  const [maxPages, setMaxPages] = useState<number>(50);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<CrawlJobStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { toast } = useToast();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeJobId) {
      pollTimerRef.current = setInterval(pollJobStatus, 1200);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeJobId]);

  async function pollJobStatus() {
    if (!activeJobId) return;

    try {
      const res = await fetch(`/api/v1/crawl/${activeJobId}`);
      const data = await res.json();
      if (data.success && data.job) {
        setJobStatus(data.job);
        onRefreshData();

        if (data.job.status === "completed" || data.job.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setActiveJobId(null);
          toast(
            data.job.status === "completed"
              ? `Domain crawl complete! Indexed ${data.job.visitedCount} pages from ${data.job.domain}.`
              : `Domain crawl stopped.`,
            data.job.status === "completed" ? "success" : "info"
          );
        }
      }
    } catch {
      //
    }
  }

  async function handleStartCrawl() {
    if (!seedUrl.trim()) {
      toast("Please enter a domain or seed URL.", "error");
      return;
    }

    try {
      setIsStarting(true);
      const res = await fetch("/api/v1/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: seedUrl.trim(),
          maxPages,
          collectionId: selectedCollectionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Failed to launch domain crawler.", "error");
        return;
      }

      toast(data.message, "success");
      setJobStatus(data.job);
      setActiveJobId(data.job.jobId);
    } catch {
      toast("Error starting domain crawler.", "error");
    } finally {
      setIsStarting(false);
    }
  }

  const isCrawling = jobStatus?.status === "crawling";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crawl Entire Website (Deep Domain Web Crawler)">
      <div className="space-y-5 text-xs text-slate-200">
        {/* Domain Input Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
              Target Website Domain or Seed URL
            </label>
            <input
              type="text"
              placeholder="https://example.com or website.com"
              value={seedUrl}
              onChange={(e) => setSeedUrl(e.target.value)}
              disabled={isCrawling}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1">
                Max Pages Limit
              </label>
              <select
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                disabled={isCrawling}
                className="h-9 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white outline-none cursor-pointer"
              >
                <option value={10} className="bg-slate-900">10 Pages</option>
                <option value={50} className="bg-slate-900">50 Pages</option>
                <option value={200} className="bg-slate-900">200 Pages</option>
                <option value={500} className="bg-slate-900">500 Pages</option>
              </select>
            </div>

            {collections.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1">
                  Assign Crawled Pages to Folder
                </label>
                <select
                  value={selectedCollectionId || ""}
                  onChange={(e) =>
                    setSelectedCollectionId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  disabled={isCrawling}
                  className="h-9 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">All Folders</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleStartCrawl}
            disabled={isCrawling || isStarting || !seedUrl.trim()}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition disabled:opacity-40 shadow-lg"
          >
            {isCrawling ? "Domain Crawl in Progress..." : isStarting ? "Initializing..." : "Start Domain Crawl"}
          </button>
        </div>

        {/* Live Progress Metrics & Status Dashboard */}
        {jobStatus && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1.5">
                <span className="text-white/60 truncate max-w-xs">
                  {jobStatus.currentUrl ? `Crawling: ${jobStatus.currentUrl}` : `Domain: ${jobStatus.domain}`}
                </span>
                <span className="font-bold text-indigo-400">{jobStatus.progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${jobStatus.progressPercent}%` }}
                />
              </div>
            </div>

            {/* 4 Metric Cards: Queue, Visited, Remaining, Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-white/40">Queue</span>
                <span className="text-lg font-bold text-indigo-400">{jobStatus.queueCount}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-white/40">Visited</span>
                <span className="text-lg font-bold text-emerald-400">{jobStatus.visitedCount}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-white/40">Remaining</span>
                <span className="text-lg font-bold text-amber-400">{jobStatus.remainingCount}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <span className="block text-[10px] uppercase font-bold text-white/40">Progress</span>
                <span className="text-lg font-bold text-white">{jobStatus.progressPercent}%</span>
              </div>
            </div>

            {/* Live Feed of Newly Crawled Pages */}
            {jobStatus.crawledPages.length > 0 && (
              <div>
                <h5 className="text-[11px] font-bold text-white/60 mb-2">
                  Crawled Pages ({jobStatus.crawledPages.length})
                </h5>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {jobStatus.crawledPages.map((page, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[11px]"
                    >
                      <span className="truncate text-white/80 font-medium max-w-[240px]">
                        {page.title}
                      </span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 shrink-0 font-mono"
                      >
                        Link -&gt;
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
