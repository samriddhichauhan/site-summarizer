import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { ExtractedArticle } from "@/types/scraper";
import { calculateWordCount, calculateReadingTime, extractDomain } from "./utils";

export function extractWithReadability(html: string, url: string): ExtractedArticle | null {
  try {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract meta properties before Readability mutates document
    const ogImage =
      document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
      undefined;

    const author =
      document.querySelector('meta[name="author"]')?.getAttribute("content") ||
      document.querySelector('meta[property="article:author"]')?.getAttribute("content") ||
      undefined;

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent || !article.textContent.trim()) {
      return null;
    }

    const title =
      article.title?.trim() ||
      document.title?.trim() ||
      "Untitled Page";

    const textContent = article.textContent.replace(/\s+/g, " ").trim();
    const wordCount = calculateWordCount(textContent);
    const readingTime = calculateReadingTime(wordCount);
    const domainName = extractDomain(url);

    return {
      title,
      content: article.content || `<p>${textContent}</p>`,
      textContent,
      excerpt: article.excerpt?.trim() || undefined,
      byline: article.byline?.trim() || author || undefined,
      domainName,
      articleImage: ogImage || undefined,
      wordCount,
      readingTime,
    };
  } catch (error) {
    console.error("Readability extraction error:", error);
    return null;
  }
}
