import crypto from "node:crypto";
import { serviceWebhookQueue } from "../../queues/index.js";
import { QUEUE_JOB_NAMES } from "../../core/constants/queue.constants.js";
import { getOrganizationClientWebhookConfigForDispatch } from "../client/client.service.js";

export const queueServiceLogoutWebhook = async ({
  orgId,
  clientId,
  userId,
  sessionId,
  clientContext,
}) => {
  const webhookConfig = await getOrganizationClientWebhookConfigForDispatch(
    orgId,
    clientId,
  );

  if (!webhookConfig) {
    return false;
  }

  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${orgId}:${clientId}:${sessionId}:session.logout`)
    .digest("hex");

  await serviceWebhookQueue.add(QUEUE_JOB_NAMES.SEND_SERVICE_WEBHOOK, {
    webhookUrl: webhookConfig.webhookUrl,
    webhookSecret: webhookConfig.webhookSecret,
    event: "session.logout",
    payload: {
      orgId,
      clientId,
      userId,
      sessionId,
      clientContext: clientContext || null,
    },
    idempotencyKey,
  });

  return true;
};
