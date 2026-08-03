import { NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";

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

    const messages = await ChatService.getHistory(noteId);
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch chat history." },
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

    await ChatService.clearHistory(noteId);
    return NextResponse.json({ success: true, message: "Chat history cleared." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to clear chat history." },
      { status: 500 }
    );
  }
}
