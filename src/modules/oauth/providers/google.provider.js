import axios from "axios";
import env from "../../../core/config/config.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const getGoogleAuthorizationUrl = () => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const exchangeGoogleCode = async (code) => {
  const payload = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    grant_type: "authorization_code",
  });

  const { data } = await axios.post(GOOGLE_TOKEN_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data;
};

export const fetchGoogleProfile = async (accessToken) => {
  const { data } = await axios.get(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    provider: "google",
    providerAccountId: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.picture,
  };
};
