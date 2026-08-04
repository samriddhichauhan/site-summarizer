import { NextResponse } from "next/server";
import { scrapeUrlAdvanced } from "@/lib/playwright";
import { SummaryService } from "@/services/summary.service";
import { NoteService } from "@/services/note.service";
import { checkApiKeyAndRateLimit } from "@/lib/auth-api";
import { ApiKeyService } from "@/services/api-key.service";

export async function POST(req: Request) {
  const auth = await checkApiKeyAndRateLimit(req, "/api/v1/scrape");
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const url = body?.url?.trim();
    const model = body?.model;
    const useDynamicBrowser = body?.useDynamicBrowser === true;
    const screenshot = body?.screenshot === true;
    const waitForSelector = body?.waitForSelector;

    if (!url) {
      return NextResponse.json(
        { success: false, message: "URL parameter is required." },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid URL format." },
        { status: 400 }
      );
    }

    // Scrape Webpage (Primary Readability/Cheerio + Playwright fallback)
    const scrapeResult = await scrapeUrlAdvanced(url, {
      useDynamicBrowser,
      screenshot,
      waitForSelector,
    });

    if (!scrapeResult.success || !scrapeResult.article) {
      await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/scrape", "POST", 422, Date.now() - auth.startTime);
      return NextResponse.json(
        { success: false, message: scrapeResult.error || "Failed to extract web page content." },
        { status: 422 }
      );
    }

    const article = scrapeResult.article;

    // AI Summarize
    const aiResult = await SummaryService.summarize(
      article.textContent,
      article.title,
      { model }
    );

    // Save to Database
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
      extractedData: article.smartData,
    });

    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/scrape", "POST", 200, Date.now() - auth.startTime);

    return NextResponse.json({
      success: true,
      data: {
        id: note.id,
        url: note.url,
        title: note.title,
        tldr: note.tldr,
        summary: note.summary,
        markdown: note.content,
        wordCount: note.wordCount,
        readingTime: note.readingTime,
        difficulty: note.difficulty,
        domainName: note.domainName,
        screenshot: scrapeResult.screenshotBase64 ? `data:image/jpeg;base64,${scrapeResult.screenshotBase64}` : null,
        schema: article.smartData,
      },
    });
  } catch (error: any) {
    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/scrape", "POST", 500, Date.now() - auth.startTime);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process scrape request." },
      { status: 500 }
    );
  }
}
