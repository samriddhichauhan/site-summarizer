import { NextResponse } from "next/server";
import { CrawlerService } from "@/services/crawler.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Job ID is required." },
        { status: 400 }
      );
    }

    const job = CrawlerService.getJobStatus(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Crawl job not found or expired." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch crawl job status." },
      { status: 500 }
    );
  }
}
