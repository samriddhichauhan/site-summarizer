import { prisma } from "@/lib/prisma";
import { TagCreateInput } from "@/types/tag";

export class TagService {
  static async getAll() {
    return await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
  }

  static async create(data: TagCreateInput) {
    return await prisma.tag.create({
      data: {
        name: data.name.trim().toLowerCase(),
        color: data.color || "#8b5cf6",
      },
    });
  }

  static async delete(id: number) {
    return await prisma.tag.delete({
      where: { id },
    });
  }
}
