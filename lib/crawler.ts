import * as cheerio from "cheerio";
import { extractDomain } from "./utils";
import { ScraperService } from "@/services/scraper.service";
import { SummaryService } from "@/services/summary.service";
import { NoteService } from "@/services/note.service";

export interface CrawlJobStatus {
  jobId: string;
  seedUrl: string;
  domain: string;
  status: "idle" | "crawling" | "completed" | "failed";
  maxPages: number;
  visitedCount: number;
  queueCount: number;
  remainingCount: number;
  progressPercent: number;
  currentUrl?: string;
  crawledPages: { id: number; title: string; url: string }[];
  errors: { url: string; error: string }[];
  createdAt: string;
}

class CrawlJobManager {
  private jobs: Map<string, {
    status: CrawlJobStatus;
    queue: string[];
    visited: Set<string>;
    collectionId?: number;
    model?: string;
  }> = new Map();

  createJob(seedUrl: string, maxPages: number = 50, collectionId?: number, model?: string): CrawlJobStatus {
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const domain = extractDomain(seedUrl);

    let formattedUrl = seedUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const jobData: CrawlJobStatus = {
      jobId,
      seedUrl: formattedUrl,
      domain,
      status: "idle",
      maxPages: Math.min(500, Math.max(5, maxPages)),
      visitedCount: 0,
      queueCount: 1,
      remainingCount: 1,
      progressPercent: 0,
      crawledPages: [],
      errors: [],
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, {
      status: jobData,
      queue: [formattedUrl],
      visited: new Set<string>(),
      collectionId,
      model,
    });

    // Start background processing
    this.processJob(jobId);

    return jobData;
  }

  getJobStatus(jobId: string): CrawlJobStatus | null {
    const job = this.jobs.get(jobId);
    return job ? { ...job.status } : null;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status.status = "crawling";

    const CONCURRENCY = 3;
    let activeWorkers = 0;

    const worker = async () => {
      while (
        job.status.status === "crawling" &&
        job.status.visitedCount < job.status.maxPages
      ) {
        let currentUrl: string | undefined;

        // Synchronously acquire next URL to avoid duplicate work among workers
        if (job.queue.length > 0 && job.status.visitedCount < job.status.maxPages) {
          const next = job.queue.shift()!;
          if (!job.visited.has(next)) {
            currentUrl = next;
            job.visited.add(currentUrl);
          }
        }

        if (!currentUrl) {
          // If queue is empty but other workers are still crawling, they might discover and push new links.
          // Wait briefly and try again.
          if (activeWorkers > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
          }
          // No more URLs and no other workers are active. Crawl is finished.
          break;
        }

        activeWorkers++;
        job.status.currentUrl = currentUrl;
        job.status.queueCount = job.queue.length;

        try {
          // 1. Scrape Page & Extract Smart DOM
          const scrapeResult = await ScraperService.processUrl(currentUrl);

          // Verify job wasn't canceled while scraping
          if (job.status.status !== "crawling") {
            activeWorkers--;
            break;
          }

          if (scrapeResult.success && scrapeResult.article) {
            const { article } = scrapeResult;

            // 2. Discover new internal links matching domain
            if (article.smartData && Array.isArray(article.smartData.links)) {
              article.smartData.links.forEach((link) => {
                const linkUrl = link.href;
                if (
                  linkUrl &&
                  !link.isExternal &&
                  !job.visited.has(linkUrl) &&
                  !job.queue.includes(linkUrl) &&
                  extractDomain(linkUrl) === job.status.domain
                ) {
                  job.queue.push(linkUrl);
                }
              });
            }

            // 3. Summarize via AI (this will call serialized SummaryService.summarize)
            const aiResult = await SummaryService.summarize(
              article.textContent || article.content,
              article.title || "Untitled",
              { model: job.model }
            );

            // Verify job wasn't canceled while summarizing
            if (job.status.status !== "crawling") {
              activeWorkers--;
              break;
            }

            // 4. Save to Database
            const note = await NoteService.upsertNote({
              url: currentUrl,
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
              articleImage: article.articleImage,
              author: article.byline,
              collectionId: job.collectionId,
              tagNames: aiResult.structured.keywords.slice(0, 5),
              extractedData: article.smartData,
            });

            job.status.crawledPages.push({
              id: note.id,
              title: note.title,
              url: note.url,
            });

            job.status.visitedCount = job.visited.size;
          } else {
            job.status.errors.push({
              url: currentUrl,
              error: scrapeResult.error || "Failed to extract article content.",
            });
          }
        } catch (err: any) {
          job.status.errors.push({
            url: currentUrl,
            error: err?.message || "Crawl exception.",
          });
        } finally {
          activeWorkers--;
        }

        // Update counters & progress percentage
        job.status.queueCount = job.queue.length;
        job.status.remainingCount = Math.max(
          0,
          Math.min(job.queue.length, job.status.maxPages - job.status.visitedCount)
        );

        const targetTotal = Math.min(
          job.status.maxPages,
          job.status.visitedCount + job.queue.length
        );
        job.status.progressPercent =
          targetTotal > 0
            ? Math.min(100, Math.round((job.status.visitedCount / job.status.maxPages) * 100))
            : 100;

        // Small delay to be polite to servers
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    };

    // Start workers in parallel
    const workerPromises = Array.from({ length: CONCURRENCY }).map(() => worker());
    await Promise.all(workerPromises);

    job.status.status = "completed";
    job.status.progressPercent = 100;
    job.status.remainingCount = 0;
    job.status.queueCount = 0;
  }
}

export const crawlerJobManager = new CrawlJobManager();
