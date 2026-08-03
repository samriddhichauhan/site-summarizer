import { NextResponse } from "next/server";
import { NoteService } from "@/services/note.service";
import {
  generateCSV,
  generateExcelCSV,
  generateJSONL,
  generateMarkdown,
  generateParquetData,
  generateSQL,
} from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    const notes = await NoteService.getAllNotes();

    if (format === "csv") {
      const csvData = generateCSV(notes);
      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="web-data-pipeline.csv"',
        },
      });
    }

    if (format === "excel" || format === "xlsx") {
      const excelData = generateExcelCSV(notes);
      return new Response(excelData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="dataset-excel.csv"',
        },
      });
    }

    if (format === "sql") {
      const sqlData = generateSQL(notes);
      return new Response(sqlData, {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": 'attachment; filename="articles-dataset.sql"',
        },
      });
    }

    if (format === "parquet") {
      const parquetData = generateParquetData(notes);
      return new Response(parquetData, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="dataset.parquet.json"',
        },
      });
    }

    if (format === "jsonl") {
      const jsonlData = generateJSONL(notes);
      return new Response(jsonlData, {
        headers: {
          "Content-Type": "application/jsonl; charset=utf-8",
          "Content-Disposition": 'attachment; filename="llm-finetune-dataset.jsonl"',
        },
      });
    }

    if (format === "markdown" || format === "md") {
      const mdContent = notes.map((n) => generateMarkdown(n)).join("\n\n---\n\n");
      return new Response(mdContent, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="knowledge-base.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to export data." },
      { status: 500 }
    );
  }
}
