export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
};

export const OAUTH_ERRORS = {
  INVALID_PROVIDER: "Unsupported OAuth provider",
  MISSING_EMAIL: "OAuth provider did not return an email",
  MISSING_CODE: "Missing OAuth authorization code",
  MISSING_STATE: "Missing OAuth state",
  INVALID_STATE: "OAuth state is invalid or expired",
  STATE_MISMATCH: "OAuth state does not match callback route",
  CLIENT_PROVIDER_NOT_CONFIGURED:
    "OAuth provider is not configured for this client",
  CLIENT_PROVIDER_SECRET_UNAVAILABLE:
    "OAuth provider secret is unavailable for this client",
  RETURN_TO_NOT_ALLOWED: "Return URL is not allowed for this client",
};

export const OAUTH_ERROR_CODES = {
  INVALID_PROVIDER: "OAUTH_PROVIDER_INVALID",
  MISSING_EMAIL: "OAUTH_EMAIL_MISSING",
  INVALID_STATE: "OAUTH_STATE_INVALID",
  CLIENT_PROVIDER_NOT_CONFIGURED: "OAUTH_CLIENT_PROVIDER_NOT_CONFIGURED",
  CLIENT_PROVIDER_SECRET_UNAVAILABLE:
    "OAUTH_CLIENT_PROVIDER_SECRET_UNAVAILABLE",
  RETURN_TO_NOT_ALLOWED: "OAUTH_RETURN_TO_NOT_ALLOWED",
};

export const OAUTH_CALLBACK_QUERY_CODE = "code";
export const OAUTH_CALLBACK_QUERY_STATE = "state";
export const OAUTH_CALLBACK_QUERY_CHALLENGE_TOKEN = "challengeToken";

export const OAUTH_FLOW_TYPES = {
  SIGNIN: "signin",
  SIGNUP: "signup",
};

export const OAUTH_ROUTE_PATHS = {
  GOOGLE: "/google",
  GOOGLE_CALLBACK: "/google/callback",
  GITHUB: "/github",
  GITHUB_CALLBACK: "/github/callback",
  ORG_CLIENT_PROVIDERS: "/orgs/:orgId/clients/:clientId/providers",
  ORG_CLIENT_START: "/orgs/:orgId/clients/:clientId/:provider/start",
  ORG_CLIENT_CALLBACK: "/orgs/:orgId/clients/:clientId/:provider/callback",
  ORG_CLIENT_CONFIRM: "/orgs/confirm",
};
