import axios from "axios";
import env from "../../../core/config/config.js";
import { OAUTH_PROVIDERS } from "../oauth.constants.js";
import { OAUTH_PROVIDER_DETAILS } from "./provider.constants.js";

const GOOGLE_PROVIDER = OAUTH_PROVIDER_DETAILS[OAUTH_PROVIDERS.GOOGLE];

const resolveGoogleCredentials = (overrides = {}) => ({
  clientId: overrides.clientId || env.GOOGLE_CLIENT_ID,
  clientSecret: overrides.clientSecret || env.GOOGLE_CLIENT_SECRET,
  redirectUri: overrides.redirectUri || env.GOOGLE_CALLBACK_URL,
});

export const getGoogleAuthorizationUrl = (overrides = {}) => {
  const credentials = resolveGoogleCredentials(overrides);

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: overrides.scope || GOOGLE_PROVIDER.scope,
    access_type: GOOGLE_PROVIDER.accessType,
    prompt: GOOGLE_PROVIDER.prompt,
  });

  if (overrides.state) {
    params.set("state", overrides.state);
  }

  if (overrides.nonce) {
    params.set("nonce", overrides.nonce);
  }

  return `${GOOGLE_PROVIDER.authUrl}?${params.toString()}`;
};

export const exchangeGoogleCode = async (code, overrides = {}) => {
  const credentials = resolveGoogleCredentials(overrides);

  const payload = new URLSearchParams({
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: credentials.redirectUri,
    grant_type: GOOGLE_PROVIDER.tokenGrantType,
  });

  const { data } = await axios.post(
    GOOGLE_PROVIDER.tokenUrl,
    payload.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  return data;
};

export const fetchGoogleProfile = async (accessToken) => {
  const { data } = await axios.get(GOOGLE_PROVIDER.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    provider: OAUTH_PROVIDERS.GOOGLE,
    providerAccountId: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.picture,
  };
};
