import { crawlerJobManager, CrawlJobStatus } from "@/lib/crawler";

export class CrawlerService {
  static async startCrawl(
    seedUrl: string,
    maxPages: number = 50,
    collectionId?: number,
    model?: string
  ): Promise<CrawlJobStatus> {
    return await crawlerJobManager.createJob(seedUrl, maxPages, collectionId, model);
  }

  static async getJobStatus(jobId: string): Promise<CrawlJobStatus | null> {
    return await crawlerJobManager.getJobStatus(jobId);
  }
}
