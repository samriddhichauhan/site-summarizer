import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json(
        {
          success: false,
          message: "URL is required",
        },
        { status: 400 }
      );
    }

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    $("script").remove();
    $("style").remove();
    $("noscript").remove();

    const title = $("title").text().trim();

    let text = $("article").text() || $("main").text() || $("body").text();
    text = text.replace(/\s+/g, " ").trim();

    const content = text;

    const summary =
      text.length > 1000 ? text.slice(0, 1000) + "..." : text;

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "notes.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let notes: any[] = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      notes = fileContent ? JSON.parse(fileContent) : [];
    }

    const alreadyExists = notes.find((note) => note.url === url);

    if (!alreadyExists) {
      notes.unshift({
        url,
        title,
        content,
        summary,
        createdAt: new Date().toISOString(),
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), "utf8");

    return Response.json({
      success: true,
      title,
      content,
      summary,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Scraping failed",
      },
      { status: 500 }
    );
  }
}