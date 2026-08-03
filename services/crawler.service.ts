import { crawlerJobManager, CrawlJobStatus } from "@/lib/crawler";

export class CrawlerService {
  static startCrawl(
    seedUrl: string,
    maxPages: number = 50,
    collectionId?: number,
    model?: string
  ): CrawlJobStatus {
    return crawlerJobManager.createJob(seedUrl, maxPages, collectionId, model);
  }

  static getJobStatus(jobId: string): CrawlJobStatus | null {
    return crawlerJobManager.getJobStatus(jobId);
  }
}
