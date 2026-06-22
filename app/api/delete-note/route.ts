import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const filePath = path.join(
      process.cwd(),
      "data",
      "notes.json"
    );

    const notes = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    const updatedNotes = notes.filter(
      (note: any) => note.url !== url
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(updatedNotes, null, 2)
    );

    return Response.json({
      success: true,
    });
  } catch {
    return Response.json({
      success: false,
    });
  }
}