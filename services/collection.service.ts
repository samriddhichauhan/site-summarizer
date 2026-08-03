import { prisma } from "@/lib/prisma";
import { CollectionCreateInput, CollectionUpdateInput } from "@/types/collection";

export class CollectionService {
  static async getAll() {
    return await prisma.collection.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
  }

  static async create(data: CollectionCreateInput) {
    return await prisma.collection.create({
      data: {
        name: data.name.trim(),
        color: data.color || "#6366f1",
        icon: data.icon || "folder",
        description: data.description?.trim(),
      },
    });
  }

  static async update(id: number, data: CollectionUpdateInput) {
    return await prisma.collection.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.color && { color: data.color }),
        ...(data.icon && { icon: data.icon }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
      },
    });
  }

  static async delete(id: number) {
    return await prisma.collection.delete({
      where: { id },
    });
  }
}
