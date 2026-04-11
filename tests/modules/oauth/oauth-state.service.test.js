import { beforeEach, describe, expect, it, vi } from "vitest";

const setMock = vi.fn();
const evalMock = vi.fn();

const redisClientMock = {
  set: setMock,
  eval: evalMock,
};

vi.mock("../../../src/core/config/config.js", () => ({
  default: {
    OAUTH_STATE_TTL_SECONDS: 300,
  },
}));

vi.mock("../../../src/core/config/redis.js", () => ({
  getRedisClient: () => redisClientMock,
}));

describe("oauth-state.service", () => {
  beforeEach(() => {
    setMock.mockReset();
    evalMock.mockReset();
  });

  it("creates OAuth state with TTL", async () => {
    const { createOauthState } =
      await import("../../../src/modules/oauth/oauth-state.service.js");

    const stateToken = await createOauthState({
      orgId: "org-1",
      clientId: "client-1",
      provider: "google",
      returnTo: "https://app.example.com/callback",
    });

    expect(stateToken).toBeTypeOf("string");
    expect(stateToken.length).toBeGreaterThan(20);
    expect(setMock).toHaveBeenCalledTimes(1);

    const [key, rawState, ex, ttl] = setMock.mock.calls[0];
    expect(key).toMatch(/^oauth:state:/);
    expect(ex).toBe("EX");
    expect(ttl).toBe(300);

    const parsed = JSON.parse(rawState);
    expect(parsed.orgId).toBe("org-1");
    expect(parsed.clientId).toBe("client-1");
    expect(parsed.provider).toBe("google");
    expect(parsed.returnTo).toBe("https://app.example.com/callback");
    expect(parsed.issuedAt).toBeTypeOf("string");
  });

  it("consumes state once and parses payload", async () => {
    const { consumeOauthState } =
      await import("../../../src/modules/oauth/oauth-state.service.js");

    evalMock.mockResolvedValueOnce(
      JSON.stringify({ orgId: "org-2", clientId: "client-2" }),
    );

    const parsed = await consumeOauthState("state-token");

    expect(parsed).toEqual({ orgId: "org-2", clientId: "client-2" });
    expect(evalMock).toHaveBeenCalledTimes(1);
    expect(evalMock).toHaveBeenCalledWith(
      expect.any(String),
      1,
      expect.any(String),
    );
  });

  it("returns null for missing or invalid state payload", async () => {
    const { consumeOauthState } =
      await import("../../../src/modules/oauth/oauth-state.service.js");

    evalMock.mockResolvedValueOnce(null);
    await expect(consumeOauthState("missing")).resolves.toBeNull();

    evalMock.mockResolvedValueOnce("not-json");
    await expect(consumeOauthState("invalid")).resolves.toBeNull();
  });
});
