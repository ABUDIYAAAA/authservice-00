import { OAUTH_PROVIDERS } from "../oauth/oauth.constants.js";

export const CLIENT_ALLOWED_PROVIDERS = [
  OAUTH_PROVIDERS.GOOGLE,
  OAUTH_PROVIDERS.GITHUB,
];

export const CLIENT_SECRET_SUFFIX_LENGTH = 6;

export const CLIENT_CALLBACK_BASE_PATH = "/api/oauth/orgs";

export const CLIENT_ERRORS = {
  ORGANIZATION_NOT_FOUND: "Organization not found",
  CLIENT_NOT_FOUND: "Organization client not found",
  PROVIDER_NOT_FOUND: "Client provider configuration not found",
  MEMBER_REQUIRED: "You are not a collaborator in this organization",
  INSUFFICIENT_PERMISSIONS:
    "Only organization owners or admins can manage clients",
  CLIENT_NAME_EXISTS: "Client name already exists in this organization",
  PROVIDER_EXISTS: "Provider is already configured for this client",
  INVALID_PROVIDER: "Only google and github providers are supported",
  INVALID_AUTHORIZED_ORIGIN: "Authorized origins must be valid URLs",
  WEBHOOK_NOT_CONFIGURED: "Client webhook is not configured",
};

export const CLIENT_MESSAGES = {
  CLIENT_DELETED: "Organization client deleted",
  PROVIDER_REMOVED: "Provider removed from client",
  PROVIDER_CONFIGURED: "Provider configured for client",
  PROVIDER_UPDATED: "Provider credentials updated",
  WEBHOOK_CONFIGURED: "Client webhook configured",
  WEBHOOK_DISABLED: "Client webhook disabled",
};
