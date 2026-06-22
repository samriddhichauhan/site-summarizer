import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "notes.json"
    );

    const notes = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    return Response.json(notes);
  } catch {
    return Response.json([]);
  }
}