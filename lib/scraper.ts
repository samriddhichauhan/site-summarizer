import axios from "axios";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import {
  ExtractedArticle,
  ExtractedCodeBlock,
  ExtractedFAQ,
  ExtractedHeading,
  ExtractedImage,
  ExtractedLink,
  ExtractedSocialLink,
  ExtractedTable,
  ExtractedSmartData,
  ScrapeOptions,
  ScrapeResult,
} from "@/types/scraper";
import { calculateWordCount, calculateReadingTime, extractDomain } from "./utils";

const BROWSER_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

export async function scrapeUrl(urlStr: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const timeoutMs = options.timeoutMs || 25000;

  try {
    const userAgent = getRandomUserAgent();
    const response = await axios.get(urlStr, {
      timeout: timeoutMs,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...options.customHeaders,
      },
      maxRedirects: 5,
    });

    const html = response.data;
    if (!html || typeof html !== "string") {
      return {
        success: false,
        error: "Received empty or non-text response from web server.",
      };
    }

    return parseHtmlContent(html, urlStr, options);
  } catch (error: any) {
    console.error("Scraper Engine Failure:", error?.message);
    return {
      success: false,
      error: error?.message || "Failed to fetch and scrape the target web page.",
    };
  }
}

export function preprocessHtmlForJsdom(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
    .replace(/<svg\b[^<]*>([\s\S]*?)<\/svg>/gi, "")
    .replace(/<iframe\b[^<]*>([\s\S]*?)<\/iframe>/gi, "")
    .replace(/<noscript\b[^<]*>([\s\S]*?)<\/noscript>/gi, "");
}

export function parseHtmlContent(html: string, urlStr: string, options: ScrapeOptions = {}): ScrapeResult {
  const domainName = extractDomain(urlStr);

  // Preprocess HTML to strip heavy tags that aren't needed by readability (saves CPU & memory in JSDOM)
  const cleanHtml = preprocessHtmlForJsdom(html);

  // Primary Parser: Mozilla Readability
  const dom = new JSDOM(cleanHtml, { url: urlStr });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

    // Secondary Parser & Smart Data Extractor: Cheerio DOM Engine
    const $ = cheerio.load(html);
    const smartData = extractSmartData($, urlStr, domainName, article);

    if (article && article.textContent && article.textContent.trim().length > 100) {
      const cleanContent = cleanExtractedText(article.textContent);
      const wordCount = calculateWordCount(cleanContent);
      const readingTime = calculateReadingTime(wordCount);

      return {
        success: true,
        article: {
          title: (article.title || smartData.title || "Untitled Article").trim(),
          content: article.content || cleanContent,
          textContent: cleanContent,
          excerpt: article.excerpt || smartData.description || undefined,
          byline: article.byline || smartData.author || undefined,
          domainName,
          articleImage: smartData.images[0]?.src || undefined,
          wordCount,
          readingTime,
          smartData,
        },
      };
    }

    // Cheerio Fallback for non-standard HTML
    const fallbackTitle = $("title").text().trim() || $("h1").first().text().trim() || "Untitled Article";
    const bodyClone = $("body").clone();
    bodyClone.find("script, style, nav, footer, header, noscript, iframe, svg, [role='banner']").remove();
    const cleanContent = cleanExtractedText(bodyClone.text());
    const wordCount = calculateWordCount(cleanContent);
    const readingTime = calculateReadingTime(wordCount);

    if (!cleanContent || cleanContent.length < 50) {
      // Build a fallback content representation from page title, description, headings, images, and links
      const fallbackTitleText = fallbackTitle || smartData.title || "Untitled Web Asset";
      const parts: string[] = [];
      parts.push(`# ${fallbackTitleText}`);
      
      if (smartData.description) {
        parts.push(`**Description:** ${smartData.description}`);
      } else {
        parts.push(`**Description:** Interactive visual portfolio, animation gallery, or template page.`);
      }
      
      if (smartData.headings && smartData.headings.length > 0) {
        parts.push(`## Section Outlines`);
        smartData.headings.forEach((h) => {
          parts.push(`- ${h.text}`);
        });
      }
      
      if (smartData.images && smartData.images.length > 0) {
        parts.push(`## Visual Assets & Templates`);
        parts.push(`Discovered ${smartData.images.length} images/animation templates:`);
        smartData.images.slice(0, 10).forEach((img, idx) => {
          parts.push(`- Asset ${idx + 1}: [Image Link](${img.src}) ${img.alt ? `(Label: ${img.alt})` : ""}`);
        });
      }
      
      if (smartData.links && smartData.links.length > 0) {
        parts.push(`## Interactive References`);
        parts.push(`Discovered links:`);
        smartData.links.slice(0, 15).forEach((link) => {
          parts.push(`- [${link.text || "Direct Link"}](${link.href})`);
        });
      }

      const generatedContent = parts.join("\n\n");
      const generatedWordCount = calculateWordCount(generatedContent);
      const generatedReadingTime = calculateReadingTime(generatedWordCount);

      return {
        success: true,
        article: {
          title: fallbackTitleText,
          content: generatedContent,
          textContent: generatedContent,
          excerpt: smartData.description || undefined,
          domainName,
          articleImage: smartData.images[0]?.src || undefined,
          wordCount: generatedWordCount,
          readingTime: generatedReadingTime,
          smartData,
        },
      };
    }

    return {
      success: true,
      article: {
        title: fallbackTitle,
        content: cleanContent,
        textContent: cleanContent,
        excerpt: smartData.description || undefined,
        domainName,
        articleImage: smartData.images[0]?.src || undefined,
        wordCount,
        readingTime,
        smartData,
      },
    };
  }

function extractSmartData(
  $: cheerio.CheerioAPI,
  urlStr: string,
  domainName: string,
  article: any
): ExtractedSmartData {
  const pageTitle = $("title").text().trim() || $("h1").first().text().trim() || article?.title || "Untitled";
  const pageDesc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    article?.excerpt ||
    "";

  const author =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    article?.byline ||
    "";

  const publishedDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    "";

  // 1. Headings
  const headings: ExtractedHeading[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace("h", ""), 10) || 1;
    const text = $(el).text().trim();
    if (text.length > 1 && text.length < 250) {
      headings.push({ level, text });
    }
  });

  // 2. Images
  const images: ExtractedImage[] = [];
  $("img").each((_, el) => {
    let src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt")?.trim() || "";
    if (src && !src.startsWith("data:")) {
      try {
        src = new URL(src, urlStr).href;
        if (!images.some((i) => i.src === src)) {
          images.push({ src, alt });
        }
      } catch {
        // invalid URL
      }
    }
  });

  // 3. Tables
  const tables: ExtractedTable[] = [];
  $("table").each((_, tableEl) => {
    const headers: string[] = [];
    $(tableEl)
      .find("th")
      .each((_, th) => {
        headers.push($(th).text().trim());
      });

    const rows: string[][] = [];
    $(tableEl)
      .find("tr")
      .each((_, tr) => {
        const rowCells: string[] = [];
        $(tr)
          .find("td")
          .each((_, td) => {
            rowCells.push($(td).text().trim());
          });
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
      });

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  // 4. Links & Social Links
  const links: ExtractedLink[] = [];
  const socialLinks: ExtractedSocialLink[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();

    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

    try {
      const fullUrl = new URL(href, urlStr).href;
      const isExternal = extractDomain(fullUrl) !== domainName;

      // Identify Social Profiles
      if (fullUrl.includes("github.com/")) socialLinks.push({ platform: "GitHub", url: fullUrl });
      else if (fullUrl.includes("twitter.com/") || fullUrl.includes("x.com/")) socialLinks.push({ platform: "Twitter/X", url: fullUrl });
      else if (fullUrl.includes("linkedin.com/")) socialLinks.push({ platform: "LinkedIn", url: fullUrl });
      else if (fullUrl.includes("youtube.com/")) socialLinks.push({ platform: "YouTube", url: fullUrl });
      else if (fullUrl.includes("facebook.com/")) socialLinks.push({ platform: "Facebook", url: fullUrl });

      if (text.length > 1 && text.length < 150 && !links.some((l) => l.href === fullUrl)) {
        links.push({ href: fullUrl, text, isExternal });
      }
    } catch {
      //
    }
  });

  // 5. Metadata Map
  const metadata: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property");
    const content = $(el).attr("content");
    if (name && content) {
      metadata[name] = content;
    }
  });

  // 6. JSON-LD Schemas
  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || "");
      jsonLd.push(parsed);
    } catch {
      //
    }
  });

  // 7. Contact Info (Emails & Phone Numbers)
  const fullHtml = $.html();
  const emails = Array.from(
    new Set(fullHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
  ).slice(0, 10);

  const phoneNumbers = Array.from(
    new Set(fullHtml.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [])
  ).slice(0, 10);

  // 8. Code Blocks
  const codeBlocks: ExtractedCodeBlock[] = [];
  $("pre code, code").each((_, el) => {
    const code = $(el).text().trim();
    const className = $(el).attr("class") || "";
    const langMatch = className.match(/language-(\w+)/);
    const language = langMatch ? langMatch[1] : undefined;

    if (code.length > 20 && !codeBlocks.some((c) => c.code === code)) {
      codeBlocks.push({ language, code });
    }
  });

  // 9. FAQ extraction (Schema.org FAQPage or Q&A patterns)
  const faqs: ExtractedFAQ[] = [];
  jsonLd.forEach((schema) => {
    if (schema["@type"] === "FAQPage" && Array.isArray(schema.mainEntity)) {
      schema.mainEntity.forEach((item: any) => {
        if (item.name && item.acceptedAnswer?.text) {
          faqs.push({ question: item.name, answer: item.acceptedAnswer.text });
        }
      });
    }
  });

  if (faqs.length === 0) {
    $("h2, h3, dt").each((_, el) => {
      const text = $(el).text().trim();
      if (text.endsWith("?") && text.length > 10) {
        const answer = $(el).next("p, dd").text().trim();
        if (answer.length > 10) {
          faqs.push({ question: text, answer });
        }
      }
    });
  }

  return {
    title: pageTitle,
    description: pageDesc,
    author: author || undefined,
    publishedDate: publishedDate || undefined,
    headings: headings.slice(0, 20),
    tables: tables.slice(0, 10),
    images: images.slice(0, 25),
    links: links.slice(0, 50),
    metadata,
    jsonLd,
    emails,
    phoneNumbers,
    socialLinks: Array.from(new Set(socialLinks.map((s) => JSON.stringify(s)))).map((s) => JSON.parse(s)),
    codeBlocks: codeBlocks.slice(0, 15),
    faqs: faqs.slice(0, 10),
  };
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
