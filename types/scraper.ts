export interface ScrapeOptions {
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

export interface ExtractedHeading {
  level: number;
  text: string;
}

export interface ExtractedImage {
  src: string;
  alt: string;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}

export interface ExtractedLink {
  href: string;
  text: string;
  isExternal: boolean;
}

export interface ExtractedSocialLink {
  platform: string;
  url: string;
}

export interface ExtractedCodeBlock {
  language?: string;
  code: string;
}

export interface ExtractedFAQ {
  question: string;
  answer: string;
}

export interface ExtractedSmartData {
  title: string;
  description: string;
  author?: string;
  publishedDate?: string;
  headings: ExtractedHeading[];
  tables: ExtractedTable[];
  images: ExtractedImage[];
  links: ExtractedLink[];
  metadata: Record<string, string>;
  jsonLd: any[];
  emails: string[];
  phoneNumbers: string[];
  socialLinks: ExtractedSocialLink[];
  codeBlocks: ExtractedCodeBlock[];
  faqs: ExtractedFAQ[];
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
  smartData?: ExtractedSmartData;
}

export interface ScrapeResult {
  success: boolean;
  article?: ExtractedArticle;
  error?: string;
}
