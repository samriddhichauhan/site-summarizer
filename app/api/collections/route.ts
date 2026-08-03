import { NextResponse } from "next/server";
import { CollectionService } from "@/services/collection.service";

export async function GET() {
  try {
    const collections = await CollectionService.getAll();
    return NextResponse.json({ success: true, collections });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch collections." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Collection name is required." },
        { status: 400 }
      );
    }

    const collection = await CollectionService.create(body);
    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create collection." },
      { status: 500 }
    );
  }
}
