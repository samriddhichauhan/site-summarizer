"use client";

import React, { useState, useEffect, useRef } from "react";
import { Note } from "@/types/note";
import { ChatMessageItem, DEFAULT_QUICK_PROMPTS } from "@/types/chat";
import { useToast } from "../ui/Toast";

interface ChatPanelProps {
  note: Note;
  selectedModel: string;
}

export function ChatPanel({ note, selectedModel }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChatHistory();
  }, [note.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchChatHistory() {
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/notes/${note.id}/chat`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      //
    } finally {
      setHistoryLoading(false);
    }
  }

  async function sendMessage(textToSend?: string) {
    const query = (textToSend || inputMessage).trim();
    if (!query || isStreaming) return;

    setInputMessage("");

    // Optimistically add user message
    const userMsgItem: ChatMessageItem = {
      noteId: note.id,
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsgItem]);
    setIsStreaming(true);

    // Placeholder assistant message for streaming token chunks
    const assistantMsgPlaceholder: ChatMessageItem = {
      noteId: note.id,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: note.id,
          message: query,
          model: selectedModel,
        }),
      });

      if (!response.ok || !response.body) {
        toast("Failed to get response from AI.", "error");
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: updated[lastIdx].content + chunkText,
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast("Error communicating with AI.", "error");
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleClearHistory() {
    try {
      const res = await fetch(`/api/notes/${note.id}/chat`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessages([]);
        toast("Chat history cleared.", "success");
      }
    } catch {
      toast("Failed to clear chat.", "error");
    }
  }

  function handleCopy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      toast("Copied message to clipboard!", "success");
    } catch {
      toast("Copy failed.", "error");
    }
  }

  return (
    <div className="flex flex-col h-[520px] rounded-2xl border border-white/10 bg-black/40 p-4">
      {/* Top Header / History Control Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">AI Article Assistant</span>
          <span className="text-[10px] text-white/40 font-mono">({selectedModel})</span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-white/40 hover:text-rose-400 text-xs font-medium transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
        {historyLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            Loading history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-white/40 p-4">
            <p className="font-semibold text-white/70 mb-1">Ask questions about this article</p>
            <p className="max-w-xs leading-relaxed mb-4">
              AI will answer using only the content of &quot;{note.title}&quot;.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white/[0.05] border border-white/10 text-slate-200 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content || (isStreaming && idx === messages.length - 1 ? "..." : "")}</div>

                {m.role === "assistant" && m.content && (
                  <button
                    onClick={() => handleCopy(m.content)}
                    className="mt-2 opacity-0 group-hover:opacity-100 text-[10px] text-white/50 hover:text-white transition"
                  >
                    Copy Response
                  </button>
                )}
              </div>
              <span className="text-[9px] text-white/30 mt-1 px-1">
                {m.role === "user" ? "You" : "AI"}
              </span>
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium animate-pulse">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            AI is writing response...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {DEFAULT_QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => sendMessage(qp.prompt)}
            disabled={isStreaming}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask anything about this article..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isStreaming}
          className="h-11 flex-1 rounded-xl border border-white/10 bg-black/50 px-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50"
        />
        <button
          type="submit"
          disabled={isStreaming || !inputMessage.trim()}
          className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-40 shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
