import { scrapeUrl } from "@/lib/scraper";
import { ScrapeOptions, ScrapeResult } from "@/types/scraper";

export class ScraperService {
  static async processUrl(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    if (!url || typeof url !== "string") {
      return {
        success: false,
        error: "A valid URL string is required.",
      };
    }

    const trimmedUrl = url.trim();

    try {
      new URL(trimmedUrl);
    } catch {
      return {
        success: false,
        error: "Invalid URL format. Please provide a full URL (e.g. https://example.com).",
      };
    }

    return await scrapeUrl(trimmedUrl, options);
  }
}
