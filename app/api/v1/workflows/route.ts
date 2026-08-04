import { NextResponse } from "next/server";
import { WorkflowService } from "@/services/workflow.service";

export async function GET() {
  try {
    const pipelines = await WorkflowService.listPipelines();
    return NextResponse.json({ success: true, pipelines });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to list workflow pipelines." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "execute") {
      const { pipelineId, url, model } = body;
      if (!pipelineId || !url) {
        return NextResponse.json(
          { success: false, message: "Pipeline ID and target URL are required." },
          { status: 400 }
        );
      }

      const execRes = await WorkflowService.executePipeline(Number(pipelineId), { url, model });
      return NextResponse.json(execRes);
    }

    const { name, description, nodes } = body;
    if (!name || !Array.isArray(nodes)) {
      return NextResponse.json(
        { success: false, message: "Pipeline name and nodes array are required." },
        { status: 400 }
      );
    }

    const pipeline = await WorkflowService.createPipeline(name, description, nodes);
    return NextResponse.json({ success: true, pipeline });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create/execute pipeline." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Valid pipeline ID is required." }, { status: 400 });
    }

    await WorkflowService.deletePipeline(id);
    return NextResponse.json({ success: true, message: "Pipeline deleted successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete pipeline." },
      { status: 500 }
    );
  }
}
