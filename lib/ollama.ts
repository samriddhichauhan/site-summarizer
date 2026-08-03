import ollama from "ollama";
import { AISummarizeOptions, AISummarizeResult, OllamaModel } from "@/types/ai";
import { StructuredSummary } from "@/types/note";
import { calculateWordCount, calculateReadingTime } from "./utils";

export async function getAvailableModels(): Promise<OllamaModel[]> {
  try {
    const list = await ollama.list();
    if (list && Array.isArray(list.models)) {
      return list.models.map((m: any) => ({
        name: m.name,
        size: m.size,
        modified_at: m.modified_at,
      }));
    }
    return [{ name: process.env.OLLAMA_MODEL || "phi:latest" }];
  } catch (error) {
    console.warn("Could not list local Ollama models, defaulting to configured model.");
    return [{ name: process.env.OLLAMA_MODEL || "phi:latest" }];
  }
}

export async function generateAISummary(
  content: string,
  title: string,
  options: AISummarizeOptions = {}
): Promise<AISummarizeResult> {
  const modelToUse = options.model || process.env.OLLAMA_MODEL || "phi:latest";
  const timeoutMs = options.timeoutMs || 45000;

  const prompt = `
You are a senior AI research assistant and knowledge curator. Analyze the following article and generate a structured JSON summary.

Article Title: "${title}"

Article Text:
${content.slice(0, 10000)}

Respond strictly in valid JSON format matching this exact schema:
{
  "tldr": "A 1-2 sentence high impact summary.",
  "overview": "A clear 2-3 sentence overview explaining the main concept.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"],
  "keywords": ["tag1", "tag2", "tag3", "tag4"],
  "difficulty": "Beginner" | "Intermediate" | "Advanced"
}
`;

  try {
    const chatPromise = ollama.chat({
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      options: { temperature: 0.2 },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Ollama request timed out")), timeoutMs)
    );

    const response = (await Promise.race([chatPromise, timeoutPromise])) as any;
    const rawText = response.message.content.trim();

    const parsedJSON = tryParseJSONResponse(rawText);
    if (parsedJSON) {
      const wordCount = calculateWordCount(content);
      const readingTime = calculateReadingTime(wordCount);

      const structured: StructuredSummary = {
        overview: parsedJSON.overview || "Overview not provided.",
        tldr: parsedJSON.tldr || parsedJSON.overview || "No TLDR generated.",
        keyPoints: Array.isArray(parsedJSON.keyPoints) ? parsedJSON.keyPoints : [],
        takeaways: Array.isArray(parsedJSON.takeaways) ? parsedJSON.takeaways : [],
        keywords: Array.isArray(parsedJSON.keywords) ? parsedJSON.keywords : [],
        readingTime,
        difficulty: ["Beginner", "Intermediate", "Advanced"].includes(parsedJSON.difficulty)
          ? parsedJSON.difficulty
          : "Intermediate",
      };

      const markdownText = formatStructuredSummaryToMarkdown(structured);

      return {
        summaryText: markdownText,
        structured,
        modelUsed: modelToUse,
        isFallback: false,
      };
    }

    // Raw text format fallback if JSON was not returned properly by model
    const wordCount = calculateWordCount(content);
    const readingTime = calculateReadingTime(wordCount);
    const structuredFallback: StructuredSummary = {
      overview: rawText.slice(0, 300) + "...",
      tldr: rawText.slice(0, 150),
      keyPoints: ["Read full article for detailed breakdown"],
      takeaways: [],
      keywords: ["Article", "Summary"],
      readingTime,
      difficulty: "Intermediate",
    };

    return {
      summaryText: rawText,
      structured: structuredFallback,
      modelUsed: modelToUse,
      isFallback: false,
    };
  } catch (error) {
    console.warn("Ollama AI generation failed or unreachable, using intelligent rule-based fallback:", error);
    return generateRuleBasedFallbackSummary(content, title, modelToUse);
  }
}

function tryParseJSONResponse(text: string): any {
  try {
    // Attempt direct parse
    return JSON.parse(text);
  } catch {
    // Attempt extracting JSON block from markdown ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }

    // Search for first { and last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function formatStructuredSummaryToMarkdown(s: StructuredSummary): string {
  let md = `# Overview\n\n${s.overview}\n\n`;

  if (s.tldr) {
    md += `> **TL;DR:** ${s.tldr}\n\n`;
  }

  if (s.keyPoints.length > 0) {
    md += `# Key Points\n\n` + s.keyPoints.map((kp) => `- ${kp}`).join("\n") + `\n\n`;
  }

  if (s.takeaways.length > 0) {
    md += `# Important Takeaways\n\n` + s.takeaways.map((t) => `- ${t}`).join("\n") + `\n\n`;
  }

  if (s.keywords.length > 0) {
    md += `**Keywords:** ${s.keywords.map((k) => `\`${k}\``).join(", ")}\n`;
  }

  return md;
}

function generateRuleBasedFallbackSummary(
  content: string,
  title: string,
  modelName: string
): AISummarizeResult {
  const sentences = content
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const overview = sentences.slice(0, 2).join(" ") || content.slice(0, 250);
  const tldr = sentences[0] || title;
  const keyPoints = sentences.slice(2, 6);
  const takeaways = sentences.slice(6, 8);

  const wordCount = calculateWordCount(content);
  const readingTime = calculateReadingTime(wordCount);

  // Extract simple keywords based on word frequency
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freqMap: Record<string, number> = {};
  const stopWords = new Set([
    "this", "that", "with", "from", "have", "more", "their", "about", "which", "when", "what", "there", "some"
  ]);

  words.forEach((w) => {
    if (!stopWords.has(w)) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }
  });

  const keywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const structured: StructuredSummary = {
    overview,
    tldr,
    keyPoints: keyPoints.length > 0 ? keyPoints : [tldr],
    takeaways: takeaways.length > 0 ? takeaways : ["Review article content for further details."],
    keywords: keywords.length > 0 ? keywords : ["Web", "Article"],
    readingTime,
    difficulty: wordCount > 1500 ? "Advanced" : wordCount > 600 ? "Intermediate" : "Beginner",
  };

  return {
    summaryText: formatStructuredSummaryToMarkdown(structured),
    structured,
    modelUsed: `${modelName} (Offline Fallback)`,
    isFallback: true,
  };
}
