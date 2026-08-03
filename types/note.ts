import { Collection } from "./collection";
import { Tag } from "./tag";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Note {
  id: number;
  url: string;
  title: string;
  summary: string;
  tldr?: string | null;
  takeaways?: string | null; // JSON string of string[]
  keywords?: string | null; // JSON string of string[]
  difficulty?: DifficultyLevel | string | null;
  content: string;
  wordCount: number;
  readingTime: number;
  domainName?: string | null;
  articleImage?: string | null;
  author?: string | null;
  publishedAt?: string | Date | null;
  isFavorite: boolean;
  lastOpenedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  collectionId?: number | null;
  collection?: Collection | null;
  tags?: Tag[];
}

export interface StructuredSummary {
  overview: string;
  tldr: string;
  keyPoints: string[];
  takeaways: string[];
  keywords: string[];
  readingTime: number;
  difficulty: DifficultyLevel;
}

export interface NoteCreateInput {
  url: string;
  title: string;
  content: string;
  summary: string;
  tldr?: string;
  takeaways?: string[];
  keywords?: string[];
  difficulty?: DifficultyLevel;
  wordCount: number;
  readingTime: number;
  domainName?: string;
  articleImage?: string;
  author?: string;
  publishedAt?: Date;
  collectionId?: number;
  tagNames?: string[];
}

export interface NoteUpdateInput {
  title?: string;
  summary?: string;
  tldr?: string;
  takeaways?: string[];
  keywords?: string[];
  difficulty?: DifficultyLevel;
  isFavorite?: boolean;
  collectionId?: number | null;
  tagNames?: string[];
}

export interface NoteFilter {
  search?: string;
  collectionId?: number;
  tag?: string;
  isFavorite?: boolean;
  difficulty?: string;
  sortBy?: "newest" | "oldest" | "title" | "readingTime";
}
