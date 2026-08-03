import { NextResponse } from "next/server";
import { NoteService } from "@/services/note.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = Number(id);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Note ID." },
        { status: 400 }
      );
    }

    const note = await NoteService.findById(noteId);
    if (!note) {
      return NextResponse.json(
        { success: false, message: "Note not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch note." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = Number(id);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Note ID." },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (body.toggleFavorite) {
      const updated = await NoteService.toggleFavorite(noteId);
      return NextResponse.json({ success: true, note: updated });
    }

    const updatedNote = await NoteService.updateNote(noteId, body);
    return NextResponse.json({ success: true, note: updatedNote });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update note." },
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
    const noteId = Number(id);

    if (isNaN(noteId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Note ID." },
        { status: 400 }
      );
    }

    await NoteService.deleteNote(noteId);
    return NextResponse.json({ success: true, message: "Note deleted successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete note." },
      { status: 500 }
    );
  }
}
