import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";
import { extractCustomSchemaWithAI } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { url, content, prompt, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, message: "A custom extraction prompt instruction is required (e.g. 'Extract all products', 'Extract job listings')." },
        { status: 400 }
      );
    }

    let textToAnalyze = content || "";
    let pageTitle = "Web Extraction";

    if (url && typeof url === "string" && url.trim()) {
      const scrapeResult = await ScraperService.processUrl(url.trim());
      if (!scrapeResult.success || !scrapeResult.article) {
        return NextResponse.json(
          { success: false, message: scrapeResult.error || "Failed to extract web page content." },
          { status: 400 }
        );
      }
      textToAnalyze = scrapeResult.article.textContent || scrapeResult.article.content;
      pageTitle = scrapeResult.article.title;
    }

    if (!textToAnalyze.trim()) {
      return NextResponse.json(
        { success: false, message: "No content provided to extract from." },
        { status: 400 }
      );
    }

    const extractedData = await extractCustomSchemaWithAI(
      textToAnalyze,
      prompt.trim(),
      model
    );

    return NextResponse.json({
      success: true,
      prompt: prompt.trim(),
      title: pageTitle,
      itemsCount: Array.isArray(extractedData) ? extractedData.length : 1,
      data: extractedData,
    });
  } catch (error: any) {
    console.error("AI Structured Extraction API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute AI structured extraction." },
      { status: 500 }
    );
  }
}
