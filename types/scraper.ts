export interface ScrapeOptions {
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

export interface ExtractedArticle {
  title: string;
  content: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  domainName: string;
  articleImage?: string;
  wordCount: number;
  readingTime: number;
}

export interface ScrapeResult {
  success: boolean;
  article?: ExtractedArticle;
  error?: string;
}
