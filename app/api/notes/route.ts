import { NextResponse } from "next/server";
import { NoteService } from "@/services/note.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("stats") === "true") {
      const stats = await NoteService.getStats();
      return NextResponse.json({ success: true, stats });
    }

    const search = searchParams.get("search") || undefined;
    const collectionId = searchParams.get("collectionId")
      ? Number(searchParams.get("collectionId"))
      : undefined;
    const tag = searchParams.get("tag") || undefined;
    const isFavoriteParam = searchParams.get("isFavorite");
    const isFavorite =
      isFavoriteParam === "true"
        ? true
        : isFavoriteParam === "false"
        ? false
        : undefined;

    const difficulty = searchParams.get("difficulty") || undefined;
    const isSemantic = searchParams.get("semantic") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || "newest";

    const notes = await NoteService.getAllNotes({
      search,
      collectionId,
      tag,
      isFavorite,
      difficulty,
      isSemantic,
      sortBy,
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error("GET NOTES ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notes.",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}