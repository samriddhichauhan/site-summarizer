import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "DataForge AI Developer API",
      version: "1.0.0",
      description:
        "AI-Powered Web Data Collection & Dataset Generation Platform REST API endpoints for scraping, crawling, cleaning, extraction, embeddings, and workflow automation.",
      contact: {
        name: "DataForge AI Engineering",
        url: "https://dataforge.ai",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local Development Server",
      },
    ],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Developer API Key generated from DataForge AI Dashboard",
        },
      },
    },
    paths: {
      "/scrape": {
        post: {
          summary: "Scrape and summarize webpage content",
          description: "Extract clean content, smart DOM metadata, and AI structured summary from target URL.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", example: "https://example.com" },
                    useDynamicBrowser: { type: "boolean", example: true },
                    screenshot: { type: "boolean", example: true },
                  },
                  required: ["url"],
                },
              },
            },
          },
          responses: {
            200: { description: "Scrape successful" },
            401: { description: "Invalid API key" },
            429: { description: "Rate limit exceeded" },
          },
        },
      },
      "/crawl": {
        post: {
          summary: "Start domain crawler job",
          description: "Recursively crawl internal URLs for a target domain up to specified depth & page limit.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", example: "https://news.ycombinator.com" },
                    maxPages: { type: "integer", example: 50 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Crawler job started" } },
        },
      },
      "/clean": {
        post: {
          summary: "AI Dataset Cleaning & Quality Score",
          description: "Clean text or tabular dataset rows by stripping noise, duplicate paragraphs, and computing Quality Score.",
          responses: { 200: { description: "Dataset cleaned" } },
        },
      },
      "/extract-structured": {
        post: {
          summary: "AI Custom Schema Extraction",
          description: "Extract custom schemas (products, jobs, articles, FAQs) based on natural language prompt instructions.",
          responses: { 200: { description: "Schema extracted" } },
        },
      },
      "/embed": {
        post: {
          summary: "Generate semantic embeddings",
          description: "Compute vector embeddings or cosine similarity score between text pairs.",
          responses: { 200: { description: "Vector generated" } },
        },
      },
      "/export": {
        get: {
          summary: "Export dataset in multiple formats",
          description: "Export knowledge base in CSV, Excel, JSONL, Parquet, SQL, or Markdown formats.",
          responses: { 200: { description: "File download payload" } },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
