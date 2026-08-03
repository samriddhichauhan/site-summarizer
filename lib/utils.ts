import jsPDF from "jspdf";
import { Note } from "@/types/note";

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

export function parseJsonArray(jsonStr?: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function generatePDF(note: Partial<Note>): void {
  const title = note.title || "AI Article Summary";
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const marginLeft = 14;
  let y = 20;
  const maxWidth = 180;
  const pageHeight = 297;
  const bottomMargin = 18;

  // Header Banner
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, 210, 12, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("AI KNOWLEDGE MANAGEMENT PLATFORM", marginLeft, 8);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  const titleLines = pdf.splitTextToSize(title, maxWidth);
  pdf.text(titleLines, marginLeft, y);
  y += titleLines.length * 8 + 4;

  // Metadata Line
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  const metaText = `Source: ${note.url || "N/A"} | Domain: ${note.domainName || "Web"} | Reading Time: ${
    note.readingTime || 1
  } min`;
  const metaLines = pdf.splitTextToSize(metaText, maxWidth);
  pdf.text(metaLines, marginLeft, y);
  y += metaLines.length * 5 + 6;

  // Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.line(marginLeft, y, marginLeft + maxWidth, y);
  y += 8;

  // TLDR Box if available
  if (note.tldr) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);

    const tldrText = `TL;DR: ${note.tldr}`;
    const tldrLines = pdf.splitTextToSize(tldrText, maxWidth - 8);
    const boxHeight = tldrLines.length * 5 + 8;

    pdf.roundedRect(marginLeft, y, maxWidth, boxHeight, 2, 2, "FD");
    pdf.text(tldrLines, marginLeft + 4, y + 6);
    y += boxHeight + 8;
  }

  // Content / Summary
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);

  const textToExport = note.summary || note.content || "";
  const lines = pdf.splitTextToSize(textToExport, maxWidth);

  for (const line of lines) {
    if (y > pageHeight - bottomMargin) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, marginLeft, y);
    y += 5.5;
  }

  const safeFileName = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);

  pdf.save(`${safeFileName || "summary"}.pdf`);
}

export function generateMarkdown(note: Partial<Note>): string {
  const title = note.title || "Untitled Summary";
  const url = note.url || "";
  const tldr = note.tldr ? `> **TL;DR:** ${note.tldr}\n\n` : "";
  const takeaways = note.takeaways
    ? parseJsonArray(note.takeaways)
    : [];
  const keywords = note.keywords ? parseJsonArray(note.keywords) : [];

  let md = `# ${title}\n\n`;
  md += `- **Source:** ${url}\n`;
  md += `- **Domain:** ${note.domainName || "Web"}\n`;
  md += `- **Reading Time:** ${note.readingTime || 1} min\n`;
  if (note.difficulty) md += `- **Difficulty:** ${note.difficulty}\n`;
  md += `\n---\n\n`;

  if (tldr) md += tldr;

  md += `## Summary\n\n${note.summary || ""}\n\n`;

  if (takeaways.length > 0) {
    md += `## Key Takeaways\n\n`;
    takeaways.forEach((item) => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }

  if (keywords.length > 0) {
    md += `**Keywords:** ${keywords.map((k) => `\`${k}\``).join(", ")}\n\n`;
  }

  md += `---\n*Generated with AI Knowledge Management Platform*\n`;
  return md;
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
