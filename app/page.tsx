"use client";

import jsPDF from "jspdf";
import { useEffect, useState } from "react";

type Note = {
  url: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "content">("summary");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    }
  }

  async function deleteNote(noteUrl: string) {
    try {
      const res = await fetch("/api/delete-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: noteUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) return;

      await fetchNotes();

      if (selectedNote?.url === noteUrl) {
        setSelectedNote(null);
        setTitle("");
        setContent("");
        setResult("");
        setViewMode("summary");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  function exportPDF() {
    if (!result) return;

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const marginLeft = 14;
    const marginTop = 20;
    const maxWidth = 180;
    const pageHeight = 297;
    const bottomMargin = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(title || "AI Summary", marginLeft, marginTop);

    let y = marginTop + 10;

    if (selectedNote?.url) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const urlLines = pdf.splitTextToSize(selectedNote.url, maxWidth);
      pdf.text(urlLines, marginLeft, y);
      y += urlLines.length * 5 + 4;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(result, maxWidth);

    for (const line of lines) {
      if (y > pageHeight - bottomMargin) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(line, marginLeft, y);
      y += 6;
    }

    const safeFileName = `${title || "summary"}`
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    pdf.save(`${safeFileName || "summary"}.pdf`);
  }

  async function scrapeWebsite() {
    if (!url.trim()) return;

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

      if (!res.ok || !data.success) {
        setResult(data.message || "Something went wrong while scraping.");
        setContent("");
        return;
      }

      setTitle(data.title || "");
      setContent(data.content || "");
      setResult(data.summary || "No content returned.");
      setSelectedNote({
        url,
        title: data.title || "",
        content: data.content || "",
        summary: data.summary || "",
        createdAt: new Date().toISOString(),
      });
      setViewMode("summary");

      await fetchNotes();
    } catch (error) {
      setResult("Something went wrong while scraping the website.");
      setContent("");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(result);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  const filteredNotes = notes.filter((note) =>
    `${note.title || ""} ${note.url || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold tracking-wide text-white/90">
                AI
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                  Powered by Ollama
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  AI Site Summarizer
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
                Turn any page into AI notes
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                Paste a website URL, extract the content, and get a structured
                AI summary in a focused reading workspace.
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
                disabled={loading || !url.trim()}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
              >
                {loading ? "AI is analyzing..." : "Start scraping"}
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
                  AI summary
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Notes
                </p>
                <p className="mt-2 text-sm font-medium text-white/85">
                  Saved
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Saved Notes
              </h3>

              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />

              <div className="max-h-80 space-y-2 overflow-auto pr-1">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note, index) => (
                    <div
                      key={`${note.url}-${index}`}
                      onClick={() => {
                        setSelectedNote(note);
                        setTitle(note.title || "");
                        setContent(note.content || "");
                        setResult(note.summary || "");
                        setViewMode("summary");
                      }}
                      className={`cursor-pointer rounded-xl border p-3 transition hover:bg-white/5 ${
                        selectedNote?.url === note.url
                          ? "border-white/40 bg-white/5"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm text-white/80">
                          {note.title || note.url}
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.url);
                          }}
                          className="shrink-0 text-red-400 transition hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-white/40">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    No notes found.
                  </div>
                )}
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
                      <div className="mb-4">
                        <p className="text-xs uppercase tracking-widest text-white/40">
                          Website Title
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {title}
                        </h3>

                        {selectedNote?.url && (
                          <a
                            href={selectedNote.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
                          >
                            Open Original Website →
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode("summary")}
                        className={`rounded-xl px-4 py-2 text-sm transition ${
                          viewMode === "summary"
                            ? "bg-white text-black"
                            : "border border-white/10 text-white"
                        }`}
                      >
                        Summary
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode("content")}
                        className={`rounded-xl px-4 py-2 text-sm transition ${
                          viewMode === "content"
                            ? "bg-white text-black"
                            : "border border-white/10 text-white"
                        }`}
                      >
                        Full Content
                      </button>

                      <button
                        type="button"
                        onClick={exportPDF}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
                      >
                        Export PDF
                      </button>

                      {viewMode === "summary" && (
                        <button
                          type="button"
                          onClick={copySummary}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
                        >
                          Copy Summary
                        </button>
                      )}
                    </div>

                    <div className="mb-6 border-b border-white/10"></div>

                    <div className="max-w-4xl whitespace-pre-wrap text-[15px] leading-8 text-white/80">
                      {viewMode === "summary" ? result : content}
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
                        AI summary will appear here
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