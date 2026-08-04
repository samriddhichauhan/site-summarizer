import { NextResponse } from "next/server";
import { ApiKeyService } from "@/services/api-key.service";

export async function GET() {
  try {
    const keys = await ApiKeyService.listKeys();
    const logs = await ApiKeyService.getLogs(50);

    return NextResponse.json({
      success: true,
      keys,
      recentLogs: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to list API keys." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, rateLimit } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, message: "Key name string is required." },
        { status: 400 }
      );
    }

    const keyResult = await ApiKeyService.createKey(name, rateLimit ? Number(rateLimit) : 60);

    return NextResponse.json({
      success: true,
      message: "API key generated successfully.",
      apiKey: keyResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create API key." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Valid API key ID is required." }, { status: 400 });
    }

    await ApiKeyService.revokeKey(id);
    return NextResponse.json({ success: true, message: "API key revoked successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to revoke API key." },
      { status: 500 }
    );
  }
}
