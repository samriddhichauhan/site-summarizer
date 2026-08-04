import { NextResponse } from "next/server";
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings";
import { checkApiKeyAndRateLimit } from "@/lib/auth-api";
import { ApiKeyService } from "@/services/api-key.service";

export async function POST(req: Request) {
  const auth = await checkApiKeyAndRateLimit(req, "/api/v1/embed");
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { text, textA, textB, model } = await req.json();

    if (textA && textB) {
      const vecA = await generateEmbedding(textA, model);
      const vecB = await generateEmbedding(textB, model);
      const similarity = cosineSimilarity(vecA, vecB);

      await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/embed", "POST", 200, Date.now() - auth.startTime);

      return NextResponse.json({
        success: true,
        type: "similarity",
        similarityScore: Math.round(similarity * 1000) / 1000,
        vectorDimensions: vecA.length,
      });
    }

    if (!text || typeof text !== "string") {
      await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/embed", "POST", 400, Date.now() - auth.startTime);
      return NextResponse.json(
        { success: false, message: "Text input string is required." },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(text.trim(), model);
    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/embed", "POST", 200, Date.now() - auth.startTime);

    return NextResponse.json({
      success: true,
      type: "embedding",
      dimensions: embedding.length,
      embedding,
    });
  } catch (error: any) {
    await ApiKeyService.logRequest(auth.apiKeyId, "/api/v1/embed", "POST", 500, Date.now() - auth.startTime);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to generate vector embedding." },
      { status: 500 }
    );
  }
}
