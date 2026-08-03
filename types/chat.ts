export interface ChatMessageItem {
  id?: number;
  noteId: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string | Date;
}

export interface ChatRequest {
  noteId: number;
  message: string;
  model?: string;
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Explain Simply", prompt: "Explain this article in simple language suitable for a beginner." },
  { label: "Interview Questions", prompt: "Generate 5 important technical interview questions and answers based on this article." },
  { label: "Exam Notes", prompt: "Create concise, high-yield exam study notes based on this article." },
  { label: "Explain in Hindi", prompt: "Explain the main points of this article in Hindi." },
  { label: "5 Bullet Summary", prompt: "Summarize the key findings of this article in exactly 5 bullet points." },
  { label: "Disadvantages & Limits", prompt: "What are the limitations, risks, or disadvantages mentioned in this article?" },
];
