"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditModal } from "@/components/notes/NoteEditModal";
import { Workspace } from "@/components/reader/Workspace";
import { ReaderMode } from "@/components/reader/ReaderMode";
import { CollectionManager } from "@/components/collections/CollectionManager";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { NoteCardSkeleton } from "@/components/ui/Skeleton";
import { Note } from "@/types/note";
import { Collection } from "@/types/collection";

function MainDashboard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedModel, setSelectedModel] = useState("phi:latest");
  const [collections, setCollections] = useState<Collection[]>([]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [scrapeCollectionId, setScrapeCollectionId] = useState<number | null>(null);

  // Modals & Overlays
  const [isReaderModeOpen, setIsReaderModeOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  // Stats State
  const [stats, setStats] = useState<any>(null);

  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    try {
      setNotesLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCollectionId) params.append("collectionId", String(selectedCollectionId));
      if (onlyFavorites) params.append("isFavorite", "true");
      if (sortBy) params.append("sortBy", sortBy);

      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      const loadedNotes: Note[] = Array.isArray(data) ? data : [];
      setNotes(loadedNotes);

      // Select first note if none selected or current selected is lost
      if (loadedNotes.length > 0 && !selectedNote) {
        setSelectedNote(loadedNotes[0]);
      }
    } catch {
      toast("Failed to load notes.", "error");
    } finally {
      setNotesLoading(false);
    }
  }, [searchTerm, selectedCollectionId, onlyFavorites, sortBy, selectedNote, toast]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch {
      //
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/notes?stats=true");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchCollections();
    fetchStats();
  }, [fetchNotes, fetchCollections, fetchStats]);

  async function scrapeWebsite() {
    if (!url.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          model: selectedModel,
          collectionId: scrapeCollectionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Failed to scrape webpage.", "error");
        return;
      }

      toast(data.message || "Article scraped successfully!", "success");
      setSelectedNote(data.note);
      setUrl("");

      await fetchNotes();
      await fetchStats();
    } catch (error) {
      toast("Something went wrong while connecting to the server.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(noteId: number) {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Failed to delete note.", "error");
        return;
      }

      toast("Article deleted.", "success");

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }

      await fetchNotes();
      await fetchStats();
    } catch {
      toast("Error deleting note.", "error");
    }
  }

  async function toggleFavorite(noteId: number) {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleFavorite: true }),
      });
      const data = await res.json();

      if (data.success && data.note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, isFavorite: data.note.isFavorite } : n))
        );
        if (selectedNote?.id === noteId) {
          setSelectedNote((prev) => (prev ? { ...prev, isFavorite: data.note.isFavorite } : null));
        }
        toast(data.note.isFavorite ? "Added to favorites" : "Removed from favorites", "info");
        await fetchStats();
      }
    } catch {
      toast("Failed to update favorite.", "error");
    }
  }

  async function saveEditedNote(noteId: number, updatedData: any) {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.message || "Failed to save note changes.", "error");
        return;
      }

      toast("Note updated successfully!", "success");
      setSelectedNote(data.note);
      await fetchNotes();
    } catch {
      toast("Error saving note.", "error");
    }
  }

  async function createCollection(name: string, color?: string) {
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();

      if (data.success) {
        toast(`Folder "${name}" created!`, "success");
        await fetchCollections();
        await fetchStats();
      } else {
        toast(data.message || "Failed to create collection.", "error");
      }
    } catch {
      toast("Error creating collection.", "error");
    }
  }

  async function deleteCollection(id: number) {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast("Folder deleted.", "success");
        await fetchCollections();
        await fetchStats();
      } else {
        toast(data.message || "Failed to delete collection.", "error");
      }
    } catch {
      toast("Error deleting collection.", "error");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0c10] text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8 lg:py-8">
        {/* Header Component */}
        <Header
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenCollections={() => setIsCollectionsModalOpen(true)}
        />

        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Main Workspace Layout */}
        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[400px_minmax(0,1fr)] items-start">
          {/* Left Sidebar Pane: Scraper Input & Saved Notes */}
          <aside className="space-y-6 rounded-3xl border border-white/10 bg-[#0f1117] p-5 shadow-2xl">
            {/* Scraper Input Card */}
            <div>
              <div className="mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  AI Web Scraper
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                  Summarize Webpages
                </h2>
                <p className="mt-1 text-xs text-white/50 leading-relaxed">
                  Extract articles from blogs, docs, news, or Wikipedia into your knowledge base.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") scrapeWebsite();
                    }}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/50 focus:bg-black/60"
                  />
                </div>

                {collections.length > 0 && (
                  <div>
                    <select
                      value={scrapeCollectionId || ""}
                      onChange={(e) =>
                        setScrapeCollectionId(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="h-9 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white/70 outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">
                        Assign to Folder (Optional)
                      </option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={scrapeWebsite}
                  disabled={loading || !url.trim()}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 text-xs font-bold text-white transition shadow-lg disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Analyzing Page...
                    </span>
                  ) : (
                    "Extract & Summarize Article"
                  )}
                </button>
              </div>
            </div>

            {/* Saved Articles List & Search Section */}
            <div className="border-t border-white/10 pt-5">
              <h3 className="mb-3 font-bold text-sm text-white">
                Knowledge Library ({notes.length})
              </h3>

              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCollectionId={selectedCollectionId}
                onCollectionChange={setSelectedCollectionId}
                collections={collections}
                onlyFavorites={onlyFavorites}
                onToggleFavorites={() => setOnlyFavorites(!onlyFavorites)}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                {notesLoading ? (
                  <>
                    <NoteCardSkeleton />
                    <NoteCardSkeleton />
                  </>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSelected={selectedNote?.id === note.id}
                      onSelect={() => setSelectedNote(note)}
                      onDelete={() => deleteNote(note.id)}
                      onToggleFavorite={() => toggleFavorite(note.id)}
                      onEdit={() => {
                        setNoteToEdit(note);
                        setIsEditModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-xs text-white/40">
                    No articles found matching filters.
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Pane: Reading & Summary Workspace */}
          <section className="sticky top-6">
            <Workspace
              note={selectedNote}
              loading={loading}
              selectedModel={selectedModel}
              onOpenReaderMode={() => setIsReaderModeOpen(true)}
              onEditNote={() => {
                if (selectedNote) {
                  setNoteToEdit(selectedNote);
                  setIsEditModalOpen(true);
                }
              }}
            />
          </section>
        </section>
      </div>

      {/* Reader Mode Full Overlay */}
      {isReaderModeOpen && selectedNote && (
        <ReaderMode
          note={selectedNote}
          onClose={() => setIsReaderModeOpen(false)}
        />
      )}

      {/* Edit Note Modal */}
      <NoteEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        note={noteToEdit}
        collections={collections}
        onSave={saveEditedNote}
      />

      {/* Collections / Folders Manager Modal */}
      <CollectionManager
        isOpen={isCollectionsModalOpen}
        onClose={() => setIsCollectionsModalOpen(false)}
        collections={collections}
        onCreateCollection={createCollection}
        onDeleteCollection={deleteCollection}
      />
    </main>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <MainDashboard />
    </ToastProvider>
  );
}