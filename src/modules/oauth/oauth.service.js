import db from "../../db/client/db.js";
import env from "../../core/config/config.js";
import {
  createUser,
  findUserByEmail,
  upsertOauthAccount,
} from "./oauth.repository.js";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  getGoogleAuthorizationUrl,
} from "./providers/google.provider.js";
import {
  exchangeGithubCode,
  fetchGithubProfile,
  getGithubAuthorizationUrl,
} from "./providers/github.provider.js";
import { createUserSession } from "../auth/session.service.js";
import { signAccessToken, signRefreshToken } from "../auth/token.service.js";
import { AppError } from "../../utils/errors.js";

const getProviderAuthorizationUrl = (provider) => {
  if (provider === "google") {
    return getGoogleAuthorizationUrl();
  }

  if (provider === "github") {
    return getGithubAuthorizationUrl();
  }

  throw new AppError("Unsupported OAuth provider", 400, {
    code: "OAUTH_PROVIDER_INVALID",
  });
};

const getProviderProfile = async (provider, code) => {
  if (provider === "google") {
    const tokenPayload = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(tokenPayload.access_token);

    return {
      profile,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      expiresAt: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
    };
  }

  if (provider === "github") {
    const tokenPayload = await exchangeGithubCode(code);
    const profile = await fetchGithubProfile(tokenPayload.access_token);

    return {
      profile,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      expiresAt: null,
    };
  }

  throw new AppError("Unsupported OAuth provider", 400, {
    code: "OAUTH_PROVIDER_INVALID",
  });
};

export const getOauthStartUrl = (provider) => {
  return getProviderAuthorizationUrl(provider);
};

export const handleOauthCallback = async ({ provider, code, deviceInfo }) => {
  const providerData = await getProviderProfile(provider, code);

  if (!providerData.profile.email) {
    throw new AppError("OAuth provider did not return an email", 400, {
      code: "OAUTH_EMAIL_MISSING",
    });
  }

  const { user, session } = await db.transaction(async (tx) => {
    let oauthUser = await findUserByEmail(providerData.profile.email, tx);

    if (!oauthUser) {
      oauthUser = await createUser(
        {
          email: providerData.profile.email,
          name: providerData.profile.name,
          avatarUrl: providerData.profile.avatarUrl,
          emailVerified: true,
          passwordHash: null,
        },
        tx,
      );
    }

    await upsertOauthAccount(
      {
        userId: oauthUser.id,
        provider,
        providerAccountId: providerData.profile.providerAccountId,
        accessToken: providerData.accessToken,
        refreshToken: providerData.refreshToken,
        expiresAt: providerData.expiresAt,
      },
      tx,
    );

    const sessionRow = await createUserSession(
      {
        userId: oauthUser.id,
        orgId: null,
        deviceId: deviceInfo.deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      },
      tx,
    );

    return { user: oauthUser, session: sessionRow };
  });

  const payload = {
    sub: user.id,
    sid: session.id,
    ver: session.version,
  };

  return {
    user,
    session,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    redirectTo: env.FRONTEND_URL,
  };
};
