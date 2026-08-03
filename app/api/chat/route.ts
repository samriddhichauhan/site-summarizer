import { NextResponse } from "next/server";
import { NoteService } from "@/services/note.service";
import { ChatService } from "@/services/chat.service";
import { streamArticleChat } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { noteId, message, model } = await req.json();

    if (!noteId || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Note ID and message are required." },
        { status: 400 }
      );
    }

    const note = await NoteService.findById(Number(noteId));
    if (!note) {
      return NextResponse.json(
        { success: false, message: "Article note not found." },
        { status: 404 }
      );
    }

    const trimmedUserMsg = message.trim();

    // 1. Save user message in Prisma DB
    await ChatService.saveMessage({
      noteId: note.id,
      role: "user",
      content: trimmedUserMsg,
    });

    // 2. Fetch recent conversation history
    const history = await ChatService.getHistory(note.id);
    // Exclude the message we just saved to pass clean history
    const pastHistory = history
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }));

    // 3. Setup Streaming Response
    const encoder = new TextEncoder();
    let fullAssistantResponse = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamArticleChat(
            note.content,
            note.title,
            pastHistory,
            trimmedUserMsg,
            model
          );

          for await (const chunk of generator) {
            fullAssistantResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // 4. Save full assistant response once finished
          if (fullAssistantResponse.trim()) {
            await ChatService.saveMessage({
              noteId: note.id,
              role: "assistant",
              content: fullAssistantResponse,
            });
          }

          controller.close();
        } catch (err) {
          console.error("Stream controller error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to process chat message.",
      },
      { status: 500 }
    );
  }
}
