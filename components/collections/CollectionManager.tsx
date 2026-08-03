"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Collection } from "@/types/collection";

interface CollectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onCreateCollection: (name: string, color?: string) => Promise<void>;
  onDeleteCollection: (id: number) => Promise<void>;
}

export function CollectionManager({
  isOpen,
  onClose,
  collections,
  onCreateCollection,
  onDeleteCollection,
}: CollectionManagerProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onCreateCollection(name.trim(), color);
      setName("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Folders / Collections" maxWidth="md">
      <div className="space-y-5 text-xs">
        {/* Create Collection Form */}
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <h4 className="font-semibold text-white">Create New Folder</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Folder name (e.g. AI Research, Web Dev)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-indigo-500/50"
              required
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-xl border border-white/10 bg-black/40 p-1"
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add"}
            </button>
          </div>
        </form>

        {/* Existing Collections List */}
        <div>
          <h4 className="font-semibold text-white/80 mb-2">Existing Folders ({collections.length})</h4>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {collections.length > 0 ? (
              collections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.color || "#6366f1" }}
                    />
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className="text-white/40 text-[11px]">
                      ({c._count?.notes || 0} articles)
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteCollection(c.id)}
                    className="text-rose-400 hover:text-rose-300 transition font-bold px-2 py-1"
                    title="Delete Folder"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="text-white/40 italic p-3 text-center">No folders created yet.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
