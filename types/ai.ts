import { StructuredSummary } from "./note";

export interface OllamaModel {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
}

export interface AISummarizeOptions {
  model?: string;
  timeoutMs?: number;
}

export interface AISummarizeResult {
  summaryText: string;
  structured: StructuredSummary;
  modelUsed: string;
  isFallback: boolean;
}
