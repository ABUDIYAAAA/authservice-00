import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    post: postMock,
  },
}));

describe("webhook.service", () => {
  beforeEach(() => {
    postMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("dispatches signed webhook with expected headers", async () => {
    const { dispatchServiceWebhook } =
      await import("../../../src/modules/webhook/webhook.service.js");

    await dispatchServiceWebhook({
      webhookUrl: "https://hooks.example.com/events",
      webhookSecret: "super-secret",
      event: "session.logout",
      payload: {
        orgId: "org-1",
        clientId: "client-1",
        userId: "user-1",
      },
      idempotencyKey: "abc123",
    });

    expect(postMock).toHaveBeenCalledTimes(1);

    const [url, body, options] = postMock.mock.calls[0];
    expect(url).toBe("https://hooks.example.com/events");
    expect(body).toEqual({
      event: "session.logout",
      occurredAt: "2026-01-01T00:00:00.000Z",
      payload: {
        orgId: "org-1",
        clientId: "client-1",
        userId: "user-1",
      },
    });

    expect(options.timeout).toBe(5000);
    expect(options.headers["X-Webhook-Timestamp"]).toBe("1767225600000");
    expect(options.headers["X-Webhook-Idempotency-Key"]).toBe("abc123");

    const expectedSignature = crypto
      .createHmac("sha256", "super-secret")
      .update(
        `${options.headers["X-Webhook-Timestamp"]}.${JSON.stringify(body)}`,
      )
      .digest("hex");

    expect(options.headers["X-Webhook-Signature"]).toBe(expectedSignature);
  });
});
