import { NextResponse } from "next/server";
import { CleanerService } from "@/services/cleaner.service";
import { checkApiKeyAndRateLimit } from "@/lib/auth-api";
import { ApiKeyService } from "@/services/api-key.service";

export async function POST(req: Request) {
  const auth = await checkApiKeyAndRateLimit(req, "/api/v1/clean");
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { rows, text, options, datasetName, saveDataset } = await req.json();

    if (text && typeof text === "string") {
      const cleanedText = CleanerService.cleanRawText(text, options);
      await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/clean", "POST", 200, Date.now() - auth.startTime);

      return NextResponse.json({
        success: true,
        type: "text",
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        cleanedText,
      });
    }

    if (Array.isArray(rows)) {
      const result = CleanerService.cleanDatasetRows(rows, options);

      let savedRecord = null;
      if (saveDataset && datasetName) {
        savedRecord = await CleanerService.saveCleanedDataset(
          datasetName,
          result.cleanedRows,
          "json",
          result.report.qualityScore
        );
      }

      await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/clean", "POST", 200, Date.now() - auth.startTime);

      return NextResponse.json({
        success: true,
        type: "dataset",
        report: result.report,
        cleanedRows: result.cleanedRows,
        savedDataset: savedRecord,
      });
    }

    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/clean", "POST", 400, Date.now() - auth.startTime);
    return NextResponse.json(
      { success: false, message: "Either 'rows' array or 'text' string is required for cleaning." },
      { status: 400 }
    );
  } catch (error: any) {
    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/clean", "POST", 500, Date.now() - auth.startTime);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute dataset cleaning." },
      { status: 500 }
    );
  }
}
