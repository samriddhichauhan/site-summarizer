"use client";

import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass =
    maxWidth === "sm"
      ? "max-w-sm"
      : maxWidth === "lg"
      ? "max-w-2xl"
      : maxWidth === "xl"
      ? "max-w-4xl"
      : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${widthClass} rounded-3xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl transition-all animate-in zoom-in-95`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
