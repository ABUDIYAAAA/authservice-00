import { beforeEach, describe, expect, it, vi } from "vitest";

const setMock = vi.fn();
const evalMock = vi.fn();

const redisClientMock = {
  set: setMock,
  eval: evalMock,
};

vi.mock("../../../src/core/config/config.js", () => ({
  default: {
    OAUTH_RELOGIN_REQUIREMENT_TTL_SECONDS: 86400,
    OAUTH_RELOGIN_CHALLENGE_TTL_SECONDS: 180,
  },
}));

vi.mock("../../../src/core/config/redis.js", () => ({
  getRedisClient: () => redisClientMock,
}));

describe("oauth-challenge.service", () => {
  beforeEach(() => {
    setMock.mockReset();
    evalMock.mockReset();
  });

  it("stores relogin requirement with configured TTL", async () => {
    const { setReloginConfirmationRequirement } =
      await import("../../../src/modules/oauth/oauth-challenge.service.js");

    await setReloginConfirmationRequirement({
      orgId: "org-1",
      clientId: "client-1",
      userId: "user-1",
      clientContext: "checkout",
    });

    expect(setMock).toHaveBeenCalledTimes(1);
    const [key, rawPayload, ex, ttl] = setMock.mock.calls[0];
    expect(key).toBe("oauth:confirm:required:org-1:client-1:user-1");
    expect(ex).toBe("EX");
    expect(ttl).toBe(86400);

    const parsed = JSON.parse(rawPayload);
    expect(parsed.clientContext).toBe("checkout");
    expect(parsed.createdAt).toBeTypeOf("string");
  });

  it("creates relogin challenge token with configured TTL", async () => {
    const { createReloginChallenge } =
      await import("../../../src/modules/oauth/oauth-challenge.service.js");

    const token = await createReloginChallenge({
      userId: "user-2",
      sessionId: "session-2",
      sessionVersion: 1,
      orgId: "org-2",
      clientId: "client-2",
      flowType: "signin",
      clientContext: "context",
      redirectTo: "https://app.example.com/return",
    });

    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(20);
    expect(setMock).toHaveBeenCalledTimes(1);

    const [key, rawPayload, ex, ttl] = setMock.mock.calls[0];
    expect(key).toMatch(/^oauth:confirm:challenge:/);
    expect(ex).toBe("EX");
    expect(ttl).toBe(180);

    const parsed = JSON.parse(rawPayload);
    expect(parsed.userId).toBe("user-2");
    expect(parsed.sessionId).toBe("session-2");
    expect(parsed.redirectTo).toBe("https://app.example.com/return");
  });

  it("consumes requirement and challenge payloads safely", async () => {
    const { consumeReloginConfirmationRequirement, consumeReloginChallenge } =
      await import("../../../src/modules/oauth/oauth-challenge.service.js");

    evalMock.mockResolvedValueOnce(JSON.stringify({ ok: true }));
    await expect(
      consumeReloginConfirmationRequirement({
        orgId: "org-3",
        clientId: "client-3",
        userId: "user-3",
      }),
    ).resolves.toEqual({ ok: true });

    evalMock.mockResolvedValueOnce("invalid-json");
    await expect(consumeReloginChallenge("challenge-1")).resolves.toBeNull();
  });
});
