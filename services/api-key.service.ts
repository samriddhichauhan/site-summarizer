import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export class ApiKeyService {
  static generateRawKey(): string {
    return `df_live_${crypto.randomBytes(16).toString("hex")}`;
  }

  static async createKey(name: string, rateLimit: number = 60) {
    const rawKey = this.generateRawKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: rawKey,
        rateLimit: Math.max(10, Math.min(1000, rateLimit)),
      },
    });
    return { ...apiKey, rawKey };
  }

  static async listKeys() {
    return await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
      },
    });
  }

  static async revokeKey(id: number) {
    return await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async validateAndLog(keyStr: string | null, endpoint: string, method: string) {
    if (!keyStr) return { valid: true, rateLimited: false, keyObj: null }; // Default dev mode

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: keyStr },
    });

    if (!apiKey || !apiKey.isActive) {
      return { valid: false, rateLimited: false, keyObj: null };
    }

    // Check rate limit in last 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCalls = await prisma.apiLog.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentCalls >= apiKey.rateLimit) {
      return { valid: true, rateLimited: true, keyObj: apiKey };
    }

    // Update stats async
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return { valid: true, rateLimited: false, keyObj: apiKey };
  }

  static async logRequest(
    apiKeyId: number | null,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    ipAddress?: string
  ) {
    try {
      await prisma.apiLog.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          statusCode,
          responseTimeMs,
          ipAddress: ipAddress || "127.0.0.1",
        },
      });
    } catch {
      // Ignore logging failure
    }
  }

  static async getLogs(limit: number = 50) {
    return await prisma.apiLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { apiKey: true },
    });
  }
}
