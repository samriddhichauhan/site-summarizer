import { DatasetCleaningOptions, DatasetQualityReport } from "@/types/platform";
import { prisma } from "@/lib/prisma";

export class CleanerService {
  static cleanRawText(text: string, options: DatasetCleaningOptions = {}): string {
    if (!text) return "";
    let cleaned = text;

    // 1. Clean Whitespace & Line breaks
    if (options.cleanWhitespace !== false) {
      cleaned = cleaned
        .replace(/\r\n/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    // 2. Remove Scripts, Styles, Inline CSS
    if (options.removeScripts !== false) {
      cleaned = cleaned.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "");
      cleaned = cleaned.replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "");
    }

    // 3. Remove Cookie Banners & Common Ad noise text
    if (options.removeCookieBanners !== false) {
      cleaned = cleaned.replace(/we use cookies[^\n.]*/gi, "");
      cleaned = cleaned.replace(/accept all cookies[^\n.]*/gi, "");
      cleaned = cleaned.replace(/privacy policy[^\n.]*/gi, "");
    }

    // 4. Remove Navigation boilerplates
    if (options.removeNavigation !== false) {
      cleaned = cleaned.replace(/^(home|about|contact|privacy|terms|menu|navigation|login|sign up)\s*$/gim, "");
    }

    // 5. Remove Duplicate Paragraphs
    if (options.removeDuplicateParagraphs !== false) {
      const paragraphs = cleaned.split("\n\n");
      const uniqueParagraphs = Array.from(new Set(paragraphs));
      cleaned = uniqueParagraphs.join("\n\n");
    }

    return cleaned;
  }

  static cleanDatasetRows(rows: any[], options: DatasetCleaningOptions = {}): {
    cleanedRows: any[];
    report: DatasetQualityReport;
  } {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        cleanedRows: [],
        report: {
          qualityScore: 0,
          totalRows: 0,
          validRows: 0,
          duplicatesRemoved: 0,
          junkElementsStripped: 0,
          suggestions: ["No rows provided to clean."],
        },
      };
    }

    const totalInitial = rows.length;
    let duplicatesCount = 0;
    let junkCount = 0;

    // Deduplicate identical objects
    const rowStrings = new Set<string>();
    let filteredRows: any[] = [];

    rows.forEach((row) => {
      if (!row || typeof row !== "object") {
        junkCount++;
        return;
      }

      // Check empty objects
      const keys = Object.keys(row);
      if (keys.length === 0) {
        junkCount++;
        return;
      }

      // Check if all values are empty/null
      const hasNonNull = keys.some((k) => row[k] !== null && row[k] !== undefined && String(row[k]).trim() !== "");
      if (!hasNonNull) {
        junkCount++;
        return;
      }

      // Deduplication check
      const serialized = JSON.stringify(row);
      if (rowStrings.has(serialized)) {
        duplicatesCount++;
        return;
      }

      rowStrings.add(serialized);

      // Clean string values inside object
      const cleanedRow: Record<string, any> = {};
      keys.forEach((k) => {
        const val = row[k];
        if (typeof val === "string") {
          cleanedRow[k] = this.cleanRawText(val, options);
        } else {
          cleanedRow[k] = val;
        }
      });

      filteredRows.push(cleanedRow);
    });

    const validRows = filteredRows.length;

    // Quality Score Calculation
    let qualityScore = 100;
    if (totalInitial > 0) {
      const dedupeDeduction = (duplicatesCount / totalInitial) * 40;
      const junkDeduction = (junkCount / totalInitial) * 50;
      qualityScore = Math.max(0, Math.round(100 - dedupeDeduction - junkDeduction));
    }

    const suggestions: string[] = [];
    if (duplicatesCount > 0) {
      suggestions.push(`Removed ${duplicatesCount} duplicate rows (${Math.round((duplicatesCount / totalInitial) * 100)}% of dataset).`);
    }
    if (junkCount > 0) {
      suggestions.push(`Filtered out ${junkCount} invalid or empty rows.`);
    }
    if (qualityScore >= 90) {
      suggestions.push("Dataset quality is excellent (ready for AI fine-tuning & analytics).");
    } else if (qualityScore >= 70) {
      suggestions.push("Dataset quality is good. Consider reviewing missing field values.");
    } else {
      suggestions.push("Low quality score. Check source webpage selectors or extraction prompt.");
    }

    return {
      cleanedRows: filteredRows,
      report: {
        qualityScore,
        totalRows: totalInitial,
        validRows,
        duplicatesRemoved: duplicatesCount,
        junkElementsStripped: junkCount,
        suggestions,
      },
    };
  }

  static async saveCleanedDataset(name: string, rows: any[], format: string = "json", qualityScore: number = 100) {
    return await prisma.datasetRecord.create({
      data: {
        name: name.trim(),
        format,
        rowCount: rows.length,
        qualityScore,
        dataJson: JSON.stringify(rows),
      },
    });
  }

  static async listDatasets() {
    return await prisma.datasetRecord.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async deleteDataset(id: number) {
    return await prisma.datasetRecord.delete({
      where: { id },
    });
  }
}
