import { generateAISummary, getAvailableModels } from "@/lib/ollama";
import { AISummarizeOptions, AISummarizeResult, OllamaModel } from "@/types/ai";

class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift()!;
          next();
        } else {
          this.locked = false;
        }
      };

      if (this.locked) {
        this.queue.push(() => resolve(release));
      } else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}

export class SummaryService {
  private static aiLock = new Mutex();

  static async listModels(): Promise<OllamaModel[]> {
    return await getAvailableModels();
  }

  static async summarize(
    content: string,
    title: string,
    options: AISummarizeOptions = {}
  ): Promise<AISummarizeResult> {
    const release = await this.aiLock.acquire();
    try {
      return await generateAISummary(content, title, options);
    } finally {
      release();
    }
  }
}
