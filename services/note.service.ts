import { prisma } from "@/lib/prisma";
import { NoteCreateInput, NoteFilter, NoteUpdateInput } from "@/types/note";

export class NoteService {
  static async upsertNote(data: NoteCreateInput) {
    const jsonTakeaways = data.takeaways ? JSON.stringify(data.takeaways) : null;
    const jsonKeywords = data.keywords ? JSON.stringify(data.keywords) : null;

    // Check if tag objects exist or connect/create them
    const tagConnectOrCreate = data.tagNames
      ? data.tagNames.map((name) => ({
          where: { name },
          create: { name },
        }))
      : [];

    return await prisma.note.upsert({
      where: { url: data.url },
      update: {
        title: data.title,
        summary: data.summary,
        tldr: data.tldr,
        takeaways: jsonTakeaways,
        keywords: jsonKeywords,
        difficulty: data.difficulty,
        content: data.content,
        wordCount: data.wordCount,
        readingTime: data.readingTime,
        domainName: data.domainName,
        articleImage: data.articleImage,
        author: data.author,
        publishedAt: data.publishedAt,
        collectionId: data.collectionId,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      create: {
        url: data.url,
        title: data.title,
        summary: data.summary,
        tldr: data.tldr,
        takeaways: jsonTakeaways,
        keywords: jsonKeywords,
        difficulty: data.difficulty,
        content: data.content,
        wordCount: data.wordCount,
        readingTime: data.readingTime,
        domainName: data.domainName,
        articleImage: data.articleImage,
        author: data.author,
        publishedAt: data.publishedAt,
        collectionId: data.collectionId,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        collection: true,
        tags: true,
      },
    });
  }

  static async findByUrl(url: string) {
    return await prisma.note.findUnique({
      where: { url },
      include: {
        collection: true,
        tags: true,
      },
    });
  }

  static async findById(id: number) {
    // Also update lastOpenedAt when fetching individual note
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        collection: true,
        tags: true,
      },
    });

    if (note) {
      await prisma.note.update({
        where: { id },
        data: { lastOpenedAt: new Date() },
      });
    }

    return note;
  }

  static async getAllNotes(filter: NoteFilter = {}) {
    const where: any = {};

    if (filter.search?.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { content: { contains: q } },
        { url: { contains: q } },
        { domainName: { contains: q } },
        { keywords: { contains: q } },
      ];
    }

    if (filter.collectionId) {
      where.collectionId = filter.collectionId;
    }

    if (filter.isFavorite !== undefined) {
      where.isFavorite = filter.isFavorite;
    }

    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }

    if (filter.tag) {
      where.tags = {
        some: {
          name: filter.tag,
        },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (filter.sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (filter.sortBy === "title") {
      orderBy = { title: "asc" };
    } else if (filter.sortBy === "readingTime") {
      orderBy = { readingTime: "desc" };
    }

    return await prisma.note.findMany({
      where,
      orderBy,
      include: {
        collection: true,
        tags: true,
      },
    });
  }

  static async updateNote(id: number, data: NoteUpdateInput) {
    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.summary !== undefined) updatePayload.summary = data.summary;
    if (data.tldr !== undefined) updatePayload.tldr = data.tldr;
    if (data.isFavorite !== undefined) updatePayload.isFavorite = data.isFavorite;
    if (data.difficulty !== undefined) updatePayload.difficulty = data.difficulty;
    if (data.collectionId !== undefined) updatePayload.collectionId = data.collectionId;

    if (data.takeaways) {
      updatePayload.takeaways = JSON.stringify(data.takeaways);
    }
    if (data.keywords) {
      updatePayload.keywords = JSON.stringify(data.keywords);
    }

    if (data.tagNames) {
      updatePayload.tags = {
        set: [],
        connectOrCreate: data.tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    return await prisma.note.update({
      where: { id },
      data: updatePayload,
      include: {
        collection: true,
        tags: true,
      },
    });
  }

  static async deleteNote(idOrUrl: number | string) {
    if (typeof idOrUrl === "number") {
      return await prisma.note.delete({
        where: { id: idOrUrl },
      });
    }

    return await prisma.note.delete({
      where: { url: idOrUrl },
    });
  }

  static async toggleFavorite(id: number) {
    const existing = await prisma.note.findUnique({
      where: { id },
      select: { isFavorite: true },
    });

    if (!existing) return null;

    return await prisma.note.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    });
  }

  static async getStats() {
    const totalNotes = await prisma.note.count();
    const favoritesCount = await prisma.note.count({ where: { isFavorite: true } });
    const collectionsCount = await prisma.collection.count();

    const aggregate = await prisma.note.aggregate({
      _sum: {
        readingTime: true,
        wordCount: true,
      },
    });

    return {
      totalNotes,
      favoritesCount,
      collectionsCount,
      totalReadingTime: aggregate._sum.readingTime || 0,
      totalWords: aggregate._sum.wordCount || 0,
    };
  }
}
