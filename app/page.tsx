"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch(() => setNotes([]));
  }, []);

  async function scrapeWebsite() {
    if (!url) return;

    try {
      setLoading(true);

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      setTitle(data.title || "");
      setResult(data.summary || data.message || "No content returned.");
      setSelectedNote(null);

      const notesRes = await fetch("/api/notes");
      const notesData = await notesRes.json();
      setNotes(notesData);
    } catch (error) {
      setResult("Something went wrong while scraping the website.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tracking-wide text-white/90">
                WS
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                  Extraction Suite
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Website Scraper
                </h1>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/60 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Ready
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/35">
                Scrape source
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Turn any page into clean notes
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                Paste a website URL, extract the content, and get a concise
                summary in a workspace designed for focused reading.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/25 focus:bg-black/40"
                />
                <p className="mt-2 text-xs text-white/35">
                  Supports article pages, blogs, docs, and public websites.
                </p>
              </div>

              <button
                onClick={scrapeWebsite}
                disabled={loading || !url}
                className="group inline-flex h-14 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
              >
                {loading ? "Scraping content..." : "Start scraping"}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Speed
                </p>
                <p className="mt-2 text-sm font-medium text-white/85">
                  Fast fetch
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Output
                </p>
                <p className="mt-2 text-sm font-medium text-white/85">
                  Summary
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Notes
                </p>
                <p className="mt-2 text-sm font-medium text-white/85">
                  Ready
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Saved Notes
              </h3>

              <div className="max-h-80 space-y-2 overflow-auto">
                {notes.map((note, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedNote(note);
                      setTitle(note.title || "");
                      setResult(note.summary || "");
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition hover:bg-white/5 ${
                      selectedNote?.url === note.url
                        ? "border-white/40 bg-white/5"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <p className="truncate text-xs text-white/40">
                      {note.title || note.url}
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm text-white/70">
                      {note.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-[#0f1012] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                  Output
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Summary workspace
                </h2>
              </div>

              <div className="text-xs text-white/35">
                {loading ? "Processing..." : result ? "Completed" : "Waiting"}
              </div>
            </div>

            <div className="p-6">
              <div className="min-h-[420px] rounded-2xl border border-white/10 bg-black/20 p-6">
                {result ? (
                  <div>
                    {title && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest text-white/40">
                          Website Title
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {title}
                        </h3>
                      </div>
                    )}

                    <div className="max-w-3xl whitespace-pre-wrap text-[15px] leading-8 text-white/80">
                      {result}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col justify-between">
                    <div>
                      <div className="mb-4 h-3 w-24 rounded-full bg-white/10" />
                      <div className="space-y-3">
                        <div className="h-3 w-full rounded-full bg-white/5" />
                        <div className="h-3 w-11/12 rounded-full bg-white/5" />
                        <div className="h-3 w-10/12 rounded-full bg-white/5" />
                        <div className="h-3 w-8/12 rounded-full bg-white/5" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                      <p className="text-sm font-medium text-white/75">
                        Scraped content will appear here
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                        Your extracted summary will be shown in a clean reading
                        layout with enough spacing for long-form content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}