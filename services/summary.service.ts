import { generateAISummary, getAvailableModels } from "@/lib/ollama";
import { AISummarizeOptions, AISummarizeResult, OllamaModel } from "@/types/ai";

export class SummaryService {
  static async listModels(): Promise<OllamaModel[]> {
    return await getAvailableModels();
  }

  static async summarize(
    content: string,
    title: string,
    options: AISummarizeOptions = {}
  ): Promise<AISummarizeResult> {
    return await generateAISummary(content, title, options);
  }
}
