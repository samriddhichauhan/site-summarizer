"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Note } from "@/types/note";
import { Collection } from "@/types/collection";

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  collections: Collection[];
  onSave: (id: number, updatedData: any) => Promise<void>;
}

export function NoteEditModal({
  isOpen,
  onClose,
  note,
  collections,
  onSave,
}: NoteEditModalProps) {
  const [title, setTitle] = useState("");
  const [tldr, setTldr] = useState("");
  const [summary, setSummary] = useState("");
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setTldr(note.tldr || "");
      setSummary(note.summary || "");
      setCollectionId(note.collectionId || null);
      setDifficulty(note.difficulty || "Intermediate");
    }
  }, [note]);

  if (!note) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      await onSave(note!.id, {
        title: title.trim(),
        tldr: tldr.trim(),
        summary: summary.trim(),
        collectionId: collectionId ? Number(collectionId) : null,
        difficulty,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Note" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-white/80 mb-1">Article Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-white/80 mb-1">Folder / Collection</label>
            <select
              value={collectionId || ""}
              onChange={(e) =>
                setCollectionId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-xs outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">None</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-white/80 mb-1">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-xs outline-none cursor-pointer"
            >
              <option value="Beginner" className="bg-slate-900">Beginner</option>
              <option value="Intermediate" className="bg-slate-900">Intermediate</option>
              <option value="Advanced" className="bg-slate-900">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-white/80 mb-1">TL;DR</label>
          <input
            type="text"
            value={tldr}
            onChange={(e) => setTldr(e.target.value)}
            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
          />
        </div>

        <div>
          <label className="block font-medium text-white/80 mb-1">Summary (Markdown)</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white text-xs outline-none focus:border-indigo-500/50 font-mono leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
