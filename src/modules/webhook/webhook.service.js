import crypto from "node:crypto";
import axios from "axios";

const WEBHOOK_TIMEOUT_MS = 5000;

const signWebhookPayload = ({ secret, timestamp, body }) => {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
};

export const dispatchServiceWebhook = async ({
  webhookUrl,
  webhookSecret,
  event,
  payload,
  idempotencyKey,
}) => {
  const timestamp = Date.now().toString();
  const body = JSON.stringify({
    event,
    occurredAt: new Date().toISOString(),
    payload,
  });

  const signature = signWebhookPayload({
    secret: webhookSecret,
    timestamp,
    body,
  });

  await axios.post(webhookUrl, JSON.parse(body), {
    timeout: WEBHOOK_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Timestamp": timestamp,
      "X-Webhook-Idempotency-Key": idempotencyKey,
    },
  });
};
