import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";
import { SummaryService } from "@/services/summary.service";
import { NoteService } from "@/services/note.service";
import { parseJsonArray } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { url, model } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, message: "URL string is required." },
        { status: 400 }
      );
    }

    // 1. Extract clean web article data & DOM schema
    const scrapeResult = await ScraperService.processUrl(url);

    if (!scrapeResult.success || !scrapeResult.article) {
      return NextResponse.json(
        { success: false, message: scrapeResult.error || "Failed to scrape webpage." },
        { status: 422 }
      );
    }

    const { article } = scrapeResult;

    // 2. Generate AI summary
    const aiResult = await SummaryService.summarize(
      article.textContent || article.content,
      article.title || "Untitled Article",
      { model }
    );

    // 3. Upsert to DB
    const note = await NoteService.upsertNote({
      url,
      title: article.title || "Untitled Article",
      content: article.textContent || article.content,
      summary: aiResult.summaryText,
      tldr: aiResult.structured.tldr,
      takeaways: aiResult.structured.takeaways,
      keywords: aiResult.structured.keywords,
      difficulty: aiResult.structured.difficulty,
      wordCount: article.wordCount,
      readingTime: article.readingTime,
      domainName: article.domainName,
      author: article.byline,
      extractedData: article.smartData,
    });

    let structuredSchema = article.smartData;
    if (!structuredSchema && note.extractedData) {
      try {
        structuredSchema = JSON.parse(note.extractedData);
      } catch {
        structuredSchema = undefined;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: note.id,
        url: note.url,
        title: note.title,
        tldr: note.tldr,
        summary: note.summary,
        markdown: note.content,
        takeaways: parseJsonArray(note.takeaways),
        keywords: parseJsonArray(note.keywords),
        wordCount: note.wordCount,
        readingTime: note.readingTime,
        difficulty: note.difficulty,
        domainName: note.domainName,
        schema: structuredSchema,
        createdAt: note.createdAt,
      },
    });
  } catch (error: any) {
    console.error("V1 Extract API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to extract webpage." },
      { status: 500 }
    );
  }
}
