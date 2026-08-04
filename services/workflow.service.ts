import { prisma } from "@/lib/prisma";
import { ScraperService } from "@/services/scraper.service";
import { SummaryService } from "@/services/summary.service";
import { CleanerService } from "@/services/cleaner.service";

export interface WorkflowStepNode {
  id: string;
  type: "scrape" | "clean" | "extract" | "summarize" | "embed" | "export";
  name: string;
  config?: Record<string, any>;
}

export class WorkflowService {
  static async createPipeline(name: string, description: string | undefined, nodes: WorkflowStepNode[]) {
    return await prisma.workflowPipeline.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify([]),
        isActive: true,
      },
    });
  }

  static async listPipelines() {
    return await prisma.workflowPipeline.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        executions: {
          take: 3,
          orderBy: { startedAt: "desc" },
        },
      },
    });
  }

  static async executePipeline(pipelineId: number, initialInput: { url: string; model?: string }) {
    const pipeline = await prisma.workflowPipeline.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) throw new Error("Pipeline not found.");

    const execution = await prisma.workflowExecution.create({
      data: {
        pipelineId: pipeline.id,
        status: "running",
        logsJson: JSON.stringify([`Started execution for pipeline "${pipeline.name}" at ${new Date().toISOString()}`]),
      },
    });

    const logs: string[] = [`Pipeline execution initialized with target URL: ${initialInput.url}`];
    let currentPayload: any = { url: initialInput.url };

    try {
      const nodes: WorkflowStepNode[] = JSON.parse(pipeline.nodesJson);

      for (const node of nodes) {
        logs.push(`Executing Step [${node.type.toUpperCase()}]: ${node.name}...`);

        if (node.type === "scrape") {
          const scrapeResult = await ScraperService.processUrl(currentPayload.url);
          if (!scrapeResult.success || !scrapeResult.article) {
            throw new Error(`Scrape step failed: ${scrapeResult.error}`);
          }
          currentPayload = {
            ...currentPayload,
            article: scrapeResult.article,
            content: scrapeResult.article.textContent,
            title: scrapeResult.article.title,
          };
          logs.push(`Successfully scraped ${currentPayload.title} (${currentPayload.article.wordCount} words).`);
        } else if (node.type === "clean") {
          const text = currentPayload.content || "";
          const cleanedText = CleanerService.cleanRawText(text);
          currentPayload.content = cleanedText;
          logs.push(`Applied AI text cleaning rules. Cleaned text length: ${cleanedText.length} chars.`);
        } else if (node.type === "summarize") {
          const summaryRes = await SummaryService.summarize(
            currentPayload.content || "",
            currentPayload.title || "Untitled",
            { model: initialInput.model }
          );
          currentPayload.summary = summaryRes.summaryText;
          currentPayload.tldr = summaryRes.structured.tldr;
          logs.push(`Generated AI summary using model ${summaryRes.modelUsed}.`);
        } else if (node.type === "export") {
          logs.push(`Export step completed. Output payload formatted.`);
        }
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "success",
          completedAt: new Date(),
          logsJson: JSON.stringify(logs),
          outputData: JSON.stringify(currentPayload),
        },
      });

      return { success: true, executionId: execution.id, output: currentPayload, logs };
    } catch (err: any) {
      logs.push(`Execution Error: ${err?.message}`);

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          logsJson: JSON.stringify(logs),
        },
      });

      return { success: false, executionId: execution.id, error: err?.message, logs };
    }
  }

  static async deletePipeline(id: number) {
    return await prisma.workflowPipeline.delete({
      where: { id },
    });
  }
}
