import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";
import { SummaryService } from "@/services/summary.service";
import { NoteService } from "@/services/note.service";

export async function POST(req: Request) {
  try {
    const { urls, model, collectionId } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, message: "An array of URL strings is required." },
        { status: 400 }
      );
    }

    const cleanUrls = Array.from(
      new Set(
        urls
          .map((u: any) => (typeof u === "string" ? u.trim() : ""))
          .filter((u) => u.length > 0)
      )
    );

    if (cleanUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid URLs provided." },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process URLs in batches of 3 concurrently
    const batchSize = 3;
    for (let i = 0; i < cleanUrls.length; i += batchSize) {
      const chunk = cleanUrls.slice(i, i + batchSize);

      const chunkPromises = chunk.map(async (url) => {
        try {
          // Check existing note
          const existing = await NoteService.findByUrl(url);
          if (existing) {
            return { success: true, cached: true, note: existing };
          }

          // Scrape
          const scrapeResult = await ScraperService.processUrl(url);
          if (!scrapeResult.success || !scrapeResult.article) {
            return {
              success: false,
              url,
              error: scrapeResult.error || "Failed to extract article content.",
            };
          }

          const article = scrapeResult.article;

          // AI Summarize
          const aiResult = await SummaryService.summarize(
            article.textContent,
            article.title,
            { model }
          );

          // Save
          const note = await NoteService.upsertNote({
            url,
            title: article.title,
            content: article.textContent,
            summary: aiResult.summaryText,
            tldr: aiResult.structured.tldr,
            takeaways: aiResult.structured.takeaways,
            keywords: aiResult.structured.keywords,
            difficulty: aiResult.structured.difficulty,
            wordCount: article.wordCount,
            readingTime: article.readingTime,
            domainName: article.domainName,
            articleImage: article.articleImage,
            author: article.byline,
            collectionId: collectionId ? Number(collectionId) : undefined,
            tagNames: aiResult.structured.keywords.slice(0, 5),
            extractedData: article.smartData,
          });

          return { success: true, cached: false, note };
        } catch (err: any) {
          return { success: false, url, error: err?.message || "Extraction error." };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach((r) => {
        if (r.success) {
          results.push(r.note);
        } else {
          errors.push({ url: r.url, error: r.error });
        }
      });
    }

    return NextResponse.json({
      success: true,
      totalRequested: cleanUrls.length,
      successfullyProcessed: results.length,
      failedCount: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error("Batch Scrape API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process batch URLs." },
      { status: 500 }
    );
  }
}
