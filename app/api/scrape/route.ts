import ollama from "ollama";
import axios from "axios";
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { NextResponse } from "next/server";

type Note = {
  url: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          message: "URL is required",
        },
        { status: 400 }
      );
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
      },
      timeout: 30000,
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const title =
      article?.title?.trim() ||
      dom.window.document.title?.trim() ||
      "Untitled";

    const content = (article?.textContent || "No readable content found.")
      .replace(/\s+/g, " ")
      .trim();

    const responseAI = await ollama.chat({
      model: "llama3.2",
      options: {
        temperature: 0.2,
      },
      messages: [
        {
          role: "user",
          content: `
You are an expert research assistant.

Summarize the webpage.

Rules:
- Do NOT repeat the article.
- Do NOT include "Content:"
- Maximum 250 words.
- Return markdown.

Format:

# Main Topic

One sentence.

# Key Points

- Point 1
- Point 2
- Point 3
- Point 4

# Important Takeaways

Short paragraph.

Article:
${content.slice(0, 5000)}
`,
        },
      ],
    });

    const summary =
      responseAI?.message?.content?.trim() ||
      (content.length > 1000 ? content.slice(0, 1000) + "..." : content);

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "notes.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let notes: Note[] = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      notes = fileContent ? JSON.parse(fileContent) : [];
    }

    const existingIndex = notes.findIndex((note) => note.url === url);

    const newNote: Note = {
      url,
      title,
      content,
      summary,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      notes[existingIndex] = {
        ...notes[existingIndex],
        ...newNote,
      };
    } else {
      notes.unshift(newNote);
    }

    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      title,
      content,
      summary,
      url,
      createdAt: newNote.createdAt,
    });
  } catch (error: any) {
    console.error("SCRAPER ERROR:", error?.message);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Scraping failed",
      },
      { status: 500 }
    );
  }
}