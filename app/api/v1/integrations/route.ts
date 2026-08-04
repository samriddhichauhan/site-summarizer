import { NextResponse } from "next/server";
import { IntegrationService } from "@/services/integration.service";

export async function GET() {
  try {
    const integrations = await IntegrationService.listIntegrations();
    return NextResponse.json({ success: true, integrations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to list integrations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "trigger") {
      const { integrationId, data } = body;
      if (!integrationId) {
        return NextResponse.json({ success: false, message: "Integration ID is required." }, { status: 400 });
      }

      const res = await IntegrationService.triggerWebhook(Number(integrationId), data);
      return NextResponse.json(res);
    }

    const { name, provider, config } = body;
    if (!name || !provider || !config) {
      return NextResponse.json(
        { success: false, message: "Name, provider, and config parameters are required." },
        { status: 400 }
      );
    }

    const integration = await IntegrationService.addIntegration(name, provider, config);
    return NextResponse.json({ success: true, integration });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to configure integration." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Valid integration ID is required." }, { status: 400 });
    }

    await IntegrationService.deleteIntegration(id);
    return NextResponse.json({ success: true, message: "Integration removed successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to remove integration." },
      { status: 500 }
    );
  }
}
