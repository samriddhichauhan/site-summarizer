import { scrapeUrl } from "@/lib/scraper";
import { scrapeUrlAdvanced } from "@/lib/playwright";
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

    // Try standard static scraping first (super fast)
    const staticResult = await scrapeUrl(trimmedUrl, options);
    
    // If standard static scraping returned empty content (indicating a dynamic JS template/SPA)
    const isEmptyOrDynamic = staticResult.success && 
      (!staticResult.article?.textContent || staticResult.article.textContent.trim().length < 100);
      
    if (!staticResult.success || isEmptyOrDynamic) {
      console.log(`Static scraping returned empty or failed. Trying dynamic browser scrape for: ${trimmedUrl}`);
      try {
        const dynamicResult = await scrapeUrlAdvanced(trimmedUrl, {
          ...options,
          useDynamicBrowser: true,
          timeoutMs: 35000,
        });
        
        if (dynamicResult.success && dynamicResult.article && dynamicResult.article.textContent.trim().length > 50) {
          return dynamicResult;
        }
      } catch (err: any) {
        console.error(`Dynamic browser scrape error: ${err?.message}`);
      }
    }

    return staticResult;
  }
}
