import axios from "axios";
import * as cheerio from "cheerio";
import { extractWithReadability } from "./readability";
import { ExtractedArticle, ScrapeOptions, ScrapeResult } from "@/types/scraper";
import { calculateWordCount, calculateReadingTime, extractDomain } from "./utils";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function scrapeUrl(urlStr: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  try {
    const parsedUrl = new URL(urlStr);
    const timeout = options.timeoutMs || 30000;

    const response = await axios.get(parsedUrl.toString(), {
      timeout,
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://www.google.com/",
        ...options.customHeaders,
      },
      maxRedirects: 5,
    });

    const html = response.data;
    if (!html || typeof html !== "string") {
      return {
        success: false,
        error: "Empty or invalid HTML response received from webpage.",
      };
    }

    // Try Primary Extraction with Mozilla Readability
    const readabilityResult = extractWithReadability(html, parsedUrl.toString());
    if (readabilityResult && readabilityResult.textContent.length > 150) {
      return {
        success: true,
        article: readabilityResult,
      };
    }

    // Graceful Fallback with Cheerio
    const fallbackArticle = extractFallbackWithCheerio(html, parsedUrl.toString());
    if (fallbackArticle && fallbackArticle.textContent.length > 50) {
      return {
        success: true,
        article: fallbackArticle,
      };
    }

    return {
      success: false,
      error: "Could not extract readable article content from the requested webpage.",
    };
  } catch (error: any) {
    console.error("Scraper fetch error:", error?.message || error);
    let errorMessage = "Failed to scrape the website.";

    if (error.response) {
      if (error.response.status === 403) {
        errorMessage = "Access forbidden (403). The website is blocking automated scraping requests.";
      } else if (error.response.status === 404) {
        errorMessage = "Page not found (404). Please verify the URL.";
      } else {
        errorMessage = `HTTP Error ${error.response.status} while fetching website.`;
      }
    } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      errorMessage = "Webpage fetch timed out. The website took too long to respond.";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Domain name not found. Check the URL for typos.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function extractFallbackWithCheerio(html: string, url: string): ExtractedArticle | null {
  try {
    const $ = cheerio.load(html);

    // Remove noise elements
    $(
      "script, style, svg, iframe, nav, footer, header, form, button, noscript, [role='banner'], [role='navigation'], .aria-hidden, .cookie-banner, .ad, .ads, .advertisement, .sidebar"
    ).remove();

    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").text().trim() ||
      "Untitled Page";

    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      undefined;

    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      undefined;

    // Collect text from main container or paragraphs
    let contentSelector = "article, main, .content, #content, .post, .entry-content";
    let bodyText = $(contentSelector).text().trim();

    if (!bodyText || bodyText.length < 100) {
      const paragraphs: string[] = [];
      $("p, h2, h3, h4, li").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 25) {
          paragraphs.push(text);
        }
      });
      bodyText = paragraphs.join("\n\n");
    } else {
      bodyText = bodyText.replace(/\s+/g, " ").trim();
    }

    if (!bodyText) return null;

    const wordCount = calculateWordCount(bodyText);
    const readingTime = calculateReadingTime(wordCount);
    const domainName = extractDomain(url);

    return {
      title,
      content: `<p>${bodyText.replace(/\n\n/g, "</p><p>")}</p>`,
      textContent: bodyText,
      excerpt: bodyText.slice(0, 200) + "...",
      byline: author,
      domainName,
      articleImage: ogImage,
      wordCount,
      readingTime,
    };
  } catch (err) {
    console.error("Cheerio fallback extraction failed:", err);
    return null;
  }
}
