import { NextResponse } from "next/server";
import { MonitoringService } from "@/services/monitoring.service";

export async function GET() {
  try {
    const sites = await MonitoringService.listMonitoredSites();
    return NextResponse.json({ success: true, sites });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to list monitored sites." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "check") {
      const { siteId } = body;
      if (!siteId) {
        return NextResponse.json({ success: false, message: "Site ID is required for checking." }, { status: 400 });
      }

      const checkRes = await MonitoringService.checkSiteChanges(Number(siteId));
      return NextResponse.json({ success: true, data: checkRes });
    }

    const { url, name, frequencyHours } = body;
    if (!url) {
      return NextResponse.json({ success: false, message: "URL is required to monitor site." }, { status: 400 });
    }

    const site = await MonitoringService.addMonitoredSite(url, name, frequencyHours ? Number(frequencyHours) : 24);
    return NextResponse.json({ success: true, site });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to monitor site." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Valid site ID is required." }, { status: 400 });
    }

    await MonitoringService.deleteMonitoredSite(id);
    return NextResponse.json({ success: true, message: "Monitored site removed." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to remove site." },
      { status: 500 }
    );
  }
}
