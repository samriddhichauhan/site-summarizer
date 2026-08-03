"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              t.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : t.type === "error"
                ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
                : "bg-slate-900/90 border-slate-700 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="shrink-0">
                {t.type === "success" && "✓"}
                {t.type === "error" && "✕"}
                {t.type === "info" && "ℹ"}
              </span>
              <p className="leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/40 hover:text-white shrink-0 text-base font-bold transition"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
