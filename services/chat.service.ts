import { prisma } from "@/lib/prisma";
import { ChatMessageItem } from "@/types/chat";

export class ChatService {
  static async getHistory(noteId: number) {
    return await prisma.chatMessage.findMany({
      where: { noteId },
      orderBy: { createdAt: "asc" },
    });
  }

  static async saveMessage(data: ChatMessageItem) {
    return await prisma.chatMessage.create({
      data: {
        noteId: data.noteId,
        role: data.role,
        content: data.content,
      },
    });
  }

  static async clearHistory(noteId: number) {
    return await prisma.chatMessage.deleteMany({
      where: { noteId },
    });
  }
}
