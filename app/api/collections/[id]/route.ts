import { NextResponse } from "next/server";
import { CollectionService } from "@/services/collection.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collectionId = Number(id);
    const body = await req.json();

    const collection = await CollectionService.update(collectionId, body);
    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update collection." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collectionId = Number(id);

    await CollectionService.delete(collectionId);
    return NextResponse.json({ success: true, message: "Collection deleted." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete collection." },
      { status: 500 }
    );
  }
}
