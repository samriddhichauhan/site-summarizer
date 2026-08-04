export interface ApiKeyItem {
  id: number;
  name: string;
  key: string;
  rateLimit: number;
  totalRequests: number;
  isActive: boolean;
  lastUsedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface ApiLogItem {
  id: number;
  apiKeyId?: number | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  ipAddress?: string | null;
  createdAt: string | Date;
}

export interface CrawlJobItem {
  id?: number;
  jobId: string;
  seedUrl: string;
  domain: string;
  status: "idle" | "crawling" | "paused" | "completed" | "failed" | "canceled";
  maxPages: number;
  maxDepth: number;
  visitedCount: number;
  progressPercent: number;
  queueData?: string | null;
  visitedData?: string | null;
  crawledData?: string | null;
  errorsData?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MonitoredSiteItem {
  id: number;
  url: string;
  name: string;
  frequencyHours: number;
  lastCheckedAt?: string | Date | null;
  lastHash?: string | null;
  status: "active" | "paused" | "alert";
  changesCount: number;
  createdAt: string | Date;
  snapshots?: SiteSnapshotItem[];
}

export interface SiteSnapshotItem {
  id: number;
  siteId: number;
  contentHash: string;
  rawText: string;
  diffSummary?: string | null;
  hasChanges: boolean;
  snapshotAt: string | Date;
}

export interface WorkflowNode {
  id: string;
  type: "scrape" | "clean" | "extract" | "summarize" | "embed" | "export" | "webhook";
  title: string;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowPipelineItem {
  id: number;
  name: string;
  description?: string | null;
  nodesJson: string;
  edgesJson: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DatasetRecordItem {
  id: number;
  name: string;
  description?: string | null;
  format: "json" | "csv" | "parquet" | "jsonl" | "sql" | "excel";
  rowCount: number;
  qualityScore: number;
  dataJson: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IntegrationConfigItem {
  id: number;
  name: string;
  provider: "notion" | "webhook" | "slack" | "airtable" | "googlesheets" | "postgres" | "mongodb";
  configJson: string;
  isEnabled: boolean;
  lastSyncAt?: string | Date | null;
  createdAt: string | Date;
}

export interface DatasetCleaningOptions {
  removeNavigation?: boolean;
  removeAds?: boolean;
  removeCookieBanners?: boolean;
  removeDuplicateParagraphs?: boolean;
  removeBrokenHtml?: boolean;
  removeScripts?: boolean;
  cleanWhitespace?: boolean;
  removeInvalidRows?: boolean;
}

export interface DatasetQualityReport {
  qualityScore: number;
  totalRows: number;
  validRows: number;
  duplicatesRemoved: number;
  junkElementsStripped: number;
  suggestions: string[];
}
