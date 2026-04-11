import axios from "axios";
import env from "../../../core/config/config.js";
import { OAUTH_PROVIDERS } from "../oauth.constants.js";
import { OAUTH_PROVIDER_DETAILS } from "./provider.constants.js";

const GITHUB_PROVIDER = OAUTH_PROVIDER_DETAILS[OAUTH_PROVIDERS.GITHUB];

const resolveGithubCredentials = (overrides = {}) => ({
  clientId: overrides.clientId || env.GITHUB_CLIENT_ID,
  clientSecret: overrides.clientSecret || env.GITHUB_CLIENT_SECRET,
  redirectUri: overrides.redirectUri || env.GITHUB_CALLBACK_URL,
});

export const getGithubAuthorizationUrl = (overrides = {}) => {
  const credentials = resolveGithubCredentials(overrides);

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    scope: GITHUB_PROVIDER.scope,
  });

  if (overrides.state) {
    params.set("state", overrides.state);
  }

  return `${GITHUB_PROVIDER.authUrl}?${params.toString()}`;
};

export const exchangeGithubCode = async (code, overrides = {}) => {
  const credentials = resolveGithubCredentials(overrides);

  const payload = {
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: credentials.redirectUri,
  };

  const { data } = await axios.post(GITHUB_PROVIDER.tokenUrl, payload, {
    headers: { Accept: GITHUB_PROVIDER.acceptJson },
  });

  return data;
};

export const fetchGithubProfile = async (accessToken) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: GITHUB_PROVIDER.acceptGithubVnd,
  };

  const [{ data: user }, { data: emails }] = await Promise.all([
    axios.get(GITHUB_PROVIDER.profileUrl, { headers }),
    axios.get(GITHUB_PROVIDER.emailsUrl, { headers }),
  ]);

  const primaryEmail =
    emails.find((entry) => entry.primary)?.email || user.email;

  return {
    provider: OAUTH_PROVIDERS.GITHUB,
    providerAccountId: String(user.id),
    email: primaryEmail,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
  };
};
