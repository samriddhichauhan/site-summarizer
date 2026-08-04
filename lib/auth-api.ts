import { NextResponse } from "next/server";
import { ApiKeyService } from "@/services/api-key.service";

export async function checkApiKeyAndRateLimit(req: Request, endpointName: string) {
  const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  const method = req.method;
  const startTime = Date.now();

  const validation = await ApiKeyService.validateAndLog(apiKeyHeader || null, endpointName, method);

  if (!validation.valid) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Invalid or inactive API key. Please provide a valid 'x-api-key' header." },
        { status: 401 }
      ),
      apiKeyId: null,
      startTime,
    };
  }

  if (validation.rateLimited) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please slow down your API requests." },
        { status: 429 }
      ),
      apiKeyId: validation.keyObj?.id || null,
      startTime,
    };
  }

  return {
    errorResponse: null,
    apiKeyId: validation.keyObj?.id || null,
    startTime,
  };
}
