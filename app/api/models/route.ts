import { NextResponse } from "next/server";
import { SummaryService } from "@/services/summary.service";

export async function GET() {
  try {
    const models = await SummaryService.listModels();
    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch models.", models: [] },
      { status: 500 }
    );
  }
}
