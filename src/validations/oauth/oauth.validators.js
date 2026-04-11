import { z } from "zod";
import {
  OAUTH_FLOW_TYPES,
  OAUTH_PROVIDERS,
} from "../../modules/oauth/oauth.constants.js";

const oauthProviderSchema = z.enum([
  OAUTH_PROVIDERS.GOOGLE,
  OAUTH_PROVIDERS.GITHUB,
]);

export const organizationOauthParamSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  provider: oauthProviderSchema,
});

export const organizationOauthProvidersParamSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export const organizationOauthStartQuerySchema = z.object({
  returnTo: z.string().url().optional(),
  flowType: z
    .enum([OAUTH_FLOW_TYPES.SIGNIN, OAUTH_FLOW_TYPES.SIGNUP])
    .default(OAUTH_FLOW_TYPES.SIGNIN),
  clientContext: z.string().trim().min(1).max(255).optional(),
});

export const organizationOauthCallbackQuerySchema = z.object({
  code: z.string().trim().min(1),
  state: z.string().trim().min(20).max(500),
});

export const confirmOrganizationOauthChallengeSchema = z.object({
  challengeToken: z.string().trim().min(20).max(500),
});
