import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";
import { SummaryService } from "@/services/summary.service";
import { NoteService } from "@/services/note.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body?.url?.trim();
    const requestedModel = body?.model;
    const collectionId = body?.collectionId ? Number(body.collectionId) : undefined;
    const forceRescrape = body?.forceRescrape === true;

    if (!url) {
      return NextResponse.json(
        { success: false, message: "URL is required." },
        { status: 400 }
      );
    }

    // URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: "Please enter a valid URL." },
        { status: 400 }
      );
    }

    // Check existing note if not forcing rescrape
    if (!forceRescrape) {
      const existing = await NoteService.findByUrl(url);
      if (existing) {
        return NextResponse.json({
          success: true,
          cached: true,
          note: existing,
          message: "Retrieved saved article from your knowledge base.",
        });
      }
    }

    // Scrape Webpage
    const scrapeResult = await ScraperService.processUrl(url);
    if (!scrapeResult.success || !scrapeResult.article) {
      return NextResponse.json(
        {
          success: false,
          message: scrapeResult.error || "Could not extract article content from webpage.",
        },
        { status: 422 }
      );
    }

    const article = scrapeResult.article;

    // Generate AI Summary
    const aiResult = await SummaryService.summarize(
      article.textContent,
      article.title,
      { model: requestedModel }
    );

    // Save/Upsert in SQLite via Prisma
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
      collectionId,
      tagNames: aiResult.structured.keywords.slice(0, 5),
    });

    return NextResponse.json({
      success: true,
      cached: false,
      note,
      isFallback: aiResult.isFallback,
      modelUsed: aiResult.modelUsed,
      message: aiResult.isFallback
        ? "Article saved with rule-based fallback summary (Ollama model unavailable)."
        : `Article scraped and summarized successfully using ${aiResult.modelUsed}.`,
    });
  } catch (error: any) {
    console.error("Scrape API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "An unexpected error occurred while processing the website.",
      },
      { status: 500 }
    );
  }
}
