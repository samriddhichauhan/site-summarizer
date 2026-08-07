import { NextResponse } from "next/server";
import { CrawlerService } from "@/services/crawler.service";

export async function POST(req: Request) {
  try {
    const { url, maxPages, collectionId, model } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid seed URL or domain is required." },
        { status: 400 }
      );
    }

    const job = await CrawlerService.startCrawl(
      url,
      maxPages ? Number(maxPages) : 50,
      collectionId ? Number(collectionId) : undefined,
      model
    );

    return NextResponse.json({
      success: true,
      message: `Started crawling ${job.domain} (limit: ${job.maxPages} pages).`,
      job,
    });
  } catch (error: any) {
    console.error("Crawl API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to start domain web crawl." },
      { status: 500 }
    );
  }
}
