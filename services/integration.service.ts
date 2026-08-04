import { prisma } from "@/lib/prisma";
import axios from "axios";

export class IntegrationService {
  static async addIntegration(name: string, provider: string, config: Record<string, any>) {
    return await prisma.integrationConfig.create({
      data: {
        name: name.trim(),
        provider: provider.toLowerCase(),
        configJson: JSON.stringify(config),
        isEnabled: true,
      },
    });
  }

  static async listIntegrations() {
    return await prisma.integrationConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async triggerWebhook(integrationId: number, data: any) {
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.isEnabled) {
      throw new Error("Integration not found or disabled.");
    }

    const config = JSON.parse(integration.configJson);

    if (integration.provider === "webhook" || integration.provider === "slack") {
      const webhookUrl = config.webhookUrl;
      if (!webhookUrl) throw new Error("Webhook URL is missing in integration configuration.");

      const payload =
        integration.provider === "slack"
          ? { text: `🚀 *DataForge AI Integration Dispatch*\n\nData Payload:\n\`\`\`${JSON.stringify(data, null, 2).slice(0, 1500)}\`\`\`` }
          : { event: "dataforge.data_collected", data, timestamp: new Date().toISOString() };

      await axios.post(webhookUrl, payload, { timeout: 10000 });

      await prisma.integrationConfig.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, message: `Successfully dispatched payload to ${integration.provider}.` };
    }

    return { success: true, message: `Integration ${integration.name} simulated payload sync.` };
  }

  static async deleteIntegration(id: number) {
    return await prisma.integrationConfig.delete({
      where: { id },
    });
  }
}
