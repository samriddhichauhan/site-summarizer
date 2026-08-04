import { prisma } from "@/lib/prisma";
import { ScraperService } from "@/services/scraper.service";
import crypto from "crypto";

export class MonitoringService {
  static computeContentHash(text: string): string {
    return crypto.createHash("md5").update(text.trim()).digest("hex");
  }

  static async addMonitoredSite(url: string, name?: string, frequencyHours: number = 24) {
    const cleanUrl = url.trim();
    const siteName = name?.trim() || new URL(cleanUrl).hostname;

    return await prisma.monitoredSite.upsert({
      where: { url: cleanUrl },
      update: {
        name: siteName,
        frequencyHours,
        status: "active",
      },
      create: {
        url: cleanUrl,
        name: siteName,
        frequencyHours,
        status: "active",
      },
    });
  }

  static async listMonitoredSites() {
    return await prisma.monitoredSite.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        snapshots: {
          take: 5,
          orderBy: { snapshotAt: "desc" },
        },
      },
    });
  }

  static async checkSiteChanges(siteId: number) {
    const site = await prisma.monitoredSite.findUnique({
      where: { id: siteId },
    });

    if (!site) throw new Error("Monitored site not found.");

    // Scrape page
    const scrapeRes = await ScraperService.processUrl(site.url);
    if (!scrapeRes.success || !scrapeRes.article) {
      throw new Error(scrapeRes.error || "Failed to fetch website during monitoring check.");
    }

    const currentText = scrapeRes.article.textContent;
    const newHash = this.computeContentHash(currentText);
    const hasChanges = site.lastHash !== null && site.lastHash !== newHash;

    let diffSummary: string | null = null;
    if (hasChanges) {
      diffSummary = `Detected content update at ${new Date().toLocaleTimeString()}. Content hash changed from ${site.lastHash?.slice(
        0,
        8
      )} to ${newHash.slice(0, 8)}. Word count: ${scrapeRes.article.wordCount}.`;
    }

    // Save snapshot
    const snapshot = await prisma.siteSnapshot.create({
      data: {
        siteId: site.id,
        contentHash: newHash,
        rawText: currentText.slice(0, 5000),
        diffSummary,
        hasChanges,
      },
    });

    // Update site state
    await prisma.monitoredSite.update({
      where: { id: site.id },
      data: {
        lastCheckedAt: new Date(),
        lastHash: newHash,
        status: hasChanges ? "alert" : "active",
        changesCount: hasChanges ? { increment: 1 } : site.changesCount,
      },
    });

    return {
      site,
      snapshot,
      hasChanges,
    };
  }

  static async deleteMonitoredSite(id: number) {
    return await prisma.monitoredSite.delete({
      where: { id },
    });
  }
}
