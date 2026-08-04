import { ScrapeOptions, ScrapeResult } from "@/types/scraper";
import { scrapeUrl as standardScrapeUrl } from "@/lib/scraper";

export interface AdvancedScrapeOptions extends ScrapeOptions {
  useDynamicBrowser?: boolean;
  waitForSelector?: string;
  screenshot?: boolean;
  cookies?: { name: string; value: string; domain: string }[];
  maxScrolls?: number;
}

export async function scrapeUrlAdvanced(
  urlStr: string,
  options: AdvancedScrapeOptions = {}
): Promise<ScrapeResult & { screenshotBase64?: string }> {
  // Try Playwright dynamic rendering if explicitly requested
  if (options.useDynamicBrowser) {
    try {
      // Dynamic import with string variable to evade compile-time missing module error
      const moduleName = "playwright";
      const pw: any = await import(/* webpackIgnore: true */ moduleName);
      const { chromium } = pw;

      if (chromium) {
        const browser = await chromium.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const context = await browser.newContext({
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          viewport: { width: 1280, height: 800 },
        });

        if (options.cookies && Array.isArray(options.cookies)) {
          await context.addCookies(options.cookies);
        }

        const page = await context.newPage();
        await page.goto(urlStr, { waitUntil: "domcontentloaded", timeout: options.timeoutMs || 30000 });

        if (options.waitForSelector) {
          try {
            await page.waitForSelector(options.waitForSelector, { timeout: 8000 });
          } catch {
            //
          }
        }

        if (options.maxScrolls && options.maxScrolls > 0) {
          for (let i = 0; i < Math.min(options.maxScrolls, 5); i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await page.waitForTimeout(500);
          }
        }

        let screenshotBase64: string | undefined;
        if (options.screenshot) {
          const buffer = await page.screenshot({ fullPage: false, type: "jpeg", quality: 60 });
          screenshotBase64 = buffer.toString("base64");
        }

        await browser.close();

        const standardResult = await standardScrapeUrl(urlStr, options);
        return {
          ...standardResult,
          screenshotBase64,
        };
      }
    } catch {
      // Playwright dynamic import fallback
    }
  }

  return await standardScrapeUrl(urlStr, options);
}
