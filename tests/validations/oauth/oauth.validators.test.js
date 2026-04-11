import { describe, expect, it } from "vitest";
import {
  confirmOrganizationOauthChallengeSchema,
  organizationOauthCallbackQuerySchema,
  organizationOauthParamSchema,
  organizationOauthStartQuerySchema,
} from "../../../src/validations/oauth/oauth.validators.js";

describe("oauth.validators", () => {
  it("parses OAuth route params for org/client/provider", () => {
    const parsed = organizationOauthParamSchema.parse({
      orgId: "11111111-1111-4111-8111-111111111111",
      clientId: "22222222-2222-4222-8222-222222222222",
      provider: "google",
    });

    expect(parsed.provider).toBe("google");
  });

  it("defaults flowType to signin", () => {
    const parsed = organizationOauthStartQuerySchema.parse({
      returnTo: "https://app.example.com/dashboard",
    });

    expect(parsed.flowType).toBe("signin");
  });

  it("requires code/state and challengeToken minimum lengths", () => {
    expect(() =>
      organizationOauthCallbackQuerySchema.parse({ code: "x", state: "short" }),
    ).toThrow();

    expect(() =>
      confirmOrganizationOauthChallengeSchema.parse({
        challengeToken: "short",
      }),
    ).toThrow();
  });
});
