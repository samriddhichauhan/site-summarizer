import { NextResponse } from "next/server";
import { TagService } from "@/services/tag.service";

export async function GET() {
  try {
    const tags = await TagService.getAll();
    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch tags." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Tag name is required." },
        { status: 400 }
      );
    }

    const tag = await TagService.create(body);
    return NextResponse.json({ success: true, tag });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create tag." },
      { status: 500 }
    );
  }
}
