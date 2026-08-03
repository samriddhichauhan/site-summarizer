import { NextResponse } from "next/server";
import { NoteService } from "@/services/note.service";

export async function POST(req: Request) {
  try {
    const { url, id } = await req.json();

    if (!url && !id) {
      return NextResponse.json(
        { success: false, message: "Note URL or ID is required." },
        { status: 400 }
      );
    }

    const target = id ? Number(id) : url;
    await NoteService.deleteNote(target);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete note.",
      },
      { status: 500 }
    );
  }
}