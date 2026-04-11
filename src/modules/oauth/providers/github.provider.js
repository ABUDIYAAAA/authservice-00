import axios from "axios";
import env from "../../../core/config/config.js";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

export const getGithubAuthorizationUrl = () => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
  });

  return `${GITHUB_AUTH_URL}?${params.toString()}`;
};

export const exchangeGithubCode = async (code) => {
  const payload = {
    code,
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    redirect_uri: env.GITHUB_CALLBACK_URL,
  };

  const { data } = await axios.post(GITHUB_TOKEN_URL, payload, {
    headers: { Accept: "application/json" },
  });

  return data;
};

export const fetchGithubProfile = async (accessToken) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const [{ data: user }, { data: emails }] = await Promise.all([
    axios.get(GITHUB_USER_URL, { headers }),
    axios.get(GITHUB_EMAILS_URL, { headers }),
  ]);

  const primaryEmail =
    emails.find((entry) => entry.primary)?.email || user.email;

  return {
    provider: "github",
    providerAccountId: String(user.id),
    email: primaryEmail,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
  };
};
