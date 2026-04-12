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
import { createOrReuseUserSession } from "../auth/session.service.js";
import { signAccessToken, signRefreshToken } from "../auth/token.service.js";
import { AppError } from "../../utils/errors.js";
import {
  OAUTH_ERROR_CODES,
  OAUTH_ERRORS,
  OAUTH_FLOW_TYPES,
  OAUTH_PROVIDERS,
} from "./oauth.constants.js";
import {
  findActiveOrganizationClientProvider,
  findOrganizationClientById,
  listActiveOrganizationClientProviders,
  upsertOrganizationClientUser,
} from "../client/client.repository.js";
import { decryptClientSecret } from "../client/client-secret-crypto.js";
import { createOauthState, consumeOauthState } from "./oauth-state.service.js";
import {
  consumeReloginChallenge,
  consumeReloginConfirmationRequirement,
  createReloginChallenge,
} from "./oauth-challenge.service.js";
import { findSession } from "../auth/session.service.js";

const getProviderAuthorizationUrl = (provider, credentials = {}) => {
  if (provider === OAUTH_PROVIDERS.GOOGLE) {
    return getGoogleAuthorizationUrl(credentials);
  }

  if (provider === OAUTH_PROVIDERS.GITHUB) {
    return getGithubAuthorizationUrl(credentials);
  }

  throw new AppError(OAUTH_ERRORS.INVALID_PROVIDER, 400, {
    code: OAUTH_ERROR_CODES.INVALID_PROVIDER,
  });
};

const getProviderProfile = async (provider, code, credentials = {}) => {
  if (provider === OAUTH_PROVIDERS.GOOGLE) {
    const tokenPayload = await exchangeGoogleCode(code, credentials);
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

  if (provider === OAUTH_PROVIDERS.GITHUB) {
    const tokenPayload = await exchangeGithubCode(code, credentials);
    const profile = await fetchGithubProfile(tokenPayload.access_token);

    return {
      profile,
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token,
      expiresAt: null,
    };
  }

  throw new AppError(OAUTH_ERRORS.INVALID_PROVIDER, 400, {
    code: OAUTH_ERROR_CODES.INVALID_PROVIDER,
  });
};

export const getOauthStartUrl = (provider) => {
  return getProviderAuthorizationUrl(provider);
};

const validateReturnTo = (returnTo, redirectUris) => {
  const returnToUrl = new URL(returnTo);
  const normalizedReturnTo = returnToUrl.toString();
  const allowedRedirectUris = Array.isArray(redirectUris) ? redirectUris : [];

  if (allowedRedirectUris.length === 0) {
    throw new AppError(OAUTH_ERRORS.RETURN_TO_NOT_ALLOWED, 400, {
      code: OAUTH_ERROR_CODES.RETURN_TO_NOT_ALLOWED,
      details: {
        reason: "No redirect URIs configured for client",
      },
    });
  }

  if (!allowedRedirectUris.includes(normalizedReturnTo)) {
    throw new AppError(OAUTH_ERRORS.RETURN_TO_NOT_ALLOWED, 400, {
      code: OAUTH_ERROR_CODES.RETURN_TO_NOT_ALLOWED,
      details: {
        returnTo: normalizedReturnTo,
      },
    });
  }

  return normalizedReturnTo;
};

const resolveClientOauthProviderConfig = async (orgId, clientId, provider) => {
  const providerConfig = await findActiveOrganizationClientProvider(
    orgId,
    clientId,
    provider,
  );

  if (!providerConfig) {
    throw new AppError(OAUTH_ERRORS.CLIENT_PROVIDER_NOT_CONFIGURED, 404, {
      code: OAUTH_ERROR_CODES.CLIENT_PROVIDER_NOT_CONFIGURED,
    });
  }

  return providerConfig;
};

const buildTokenPayload = (user, session) => ({
  sub: user.id,
  sid: session.id,
  ver: session.version,
});

const completeOauthAuthSession = async ({
  provider,
  providerData,
  deviceInfo,
  orgId = null,
  clientId = null,
}) => {
  if (!providerData.profile.email) {
    throw new AppError(OAUTH_ERRORS.MISSING_EMAIL, 400, {
      code: OAUTH_ERROR_CODES.MISSING_EMAIL,
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

    const sessionRow = await createOrReuseUserSession(
      {
        userId: oauthUser.id,
        orgId,
        clientId,
        deviceId: deviceInfo.deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      },
      tx,
    );

    if (clientId) {
      await upsertOrganizationClientUser(clientId, oauthUser.id, tx);
    }

    return { user: oauthUser, session: sessionRow };
  });

  const payload = buildTokenPayload(user, session);

  return {
    user,
    session,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const listOrganizationClientOauthProviders = async ({
  orgId,
  clientId,
}) => {
  const client = await findOrganizationClientById(orgId, clientId);
  if (!client) {
    throw new AppError(OAUTH_ERRORS.CLIENT_PROVIDER_NOT_CONFIGURED, 404, {
      code: OAUTH_ERROR_CODES.CLIENT_PROVIDER_NOT_CONFIGURED,
    });
  }

  const providers = await listActiveOrganizationClientProviders(
    orgId,
    clientId,
  );

  return {
    client: {
      id: client.id,
      orgId: client.orgId,
      name: client.name,
    },
    providers: providers.map((entry) => ({
      provider: entry.provider,
      startUrl: `${env.API_BASE_URL}/api/oauth/orgs/${orgId}/clients/${clientId}/${entry.provider}/start`,
    })),
  };
};

export const getOrganizationClientOauthStart = async ({
  orgId,
  clientId,
  provider,
  returnTo,
  flowType = OAUTH_FLOW_TYPES.SIGNIN,
  clientContext,
}) => {
  const providerConfig = await resolveClientOauthProviderConfig(
    orgId,
    clientId,
    provider,
  );

  const normalizedReturnTo = validateReturnTo(
    returnTo || env.FRONTEND_URL,
    providerConfig.redirectUris,
  );

  const stateToken = await createOauthState({
    orgId,
    clientId,
    provider,
    returnTo: normalizedReturnTo,
    flowType,
    clientContext: clientContext || null,
  });

  const redirectUrl = getProviderAuthorizationUrl(provider, {
    clientId: providerConfig.providerClientId,
    redirectUri: providerConfig.callbackUrl,
    state: stateToken,
  });

  return {
    stateToken,
    redirectUrl,
  };
};

export const handleOauthCallback = async ({ provider, code, deviceInfo }) => {
  const providerData = await getProviderProfile(provider, code);
  const result = await completeOauthAuthSession({
    provider,
    providerData,
    deviceInfo,
    orgId: null,
  });

  return {
    ...result,
    redirectTo: env.FRONTEND_URL,
  };
};

export const handleOrganizationClientOauthCallback = async ({
  orgId,
  clientId,
  provider,
  code,
  stateToken,
  deviceInfo,
}) => {
  const state = await consumeOauthState(stateToken);
  if (!state) {
    throw new AppError(OAUTH_ERRORS.INVALID_STATE, 400, {
      code: OAUTH_ERROR_CODES.INVALID_STATE,
    });
  }

  if (
    state.orgId !== orgId ||
    state.clientId !== clientId ||
    state.provider !== provider
  ) {
    throw new AppError(OAUTH_ERRORS.STATE_MISMATCH, 400, {
      code: OAUTH_ERROR_CODES.INVALID_STATE,
    });
  }

  const providerConfig = await resolveClientOauthProviderConfig(
    orgId,
    clientId,
    provider,
  );

  if (!providerConfig.providerClientSecretCiphertext) {
    throw new AppError(OAUTH_ERRORS.CLIENT_PROVIDER_SECRET_UNAVAILABLE, 400, {
      code: OAUTH_ERROR_CODES.CLIENT_PROVIDER_SECRET_UNAVAILABLE,
    });
  }

  const providerData = await getProviderProfile(provider, code, {
    clientId: providerConfig.providerClientId,
    clientSecret: decryptClientSecret(
      providerConfig.providerClientSecretCiphertext,
    ),
    redirectUri: providerConfig.callbackUrl,
  });

  const authResult = await completeOauthAuthSession({
    provider,
    providerData,
    deviceInfo,
    orgId,
    clientId,
  });

  const reloginRequirement = await consumeReloginConfirmationRequirement({
    orgId,
    clientId,
    userId: authResult.user.id,
  });

  if (reloginRequirement) {
    const challengeToken = await createReloginChallenge({
      userId: authResult.user.id,
      sessionId: authResult.session.id,
      sessionVersion: authResult.session.version,
      orgId,
      clientId,
      flowType: state.flowType,
      clientContext: state.clientContext,
      redirectTo: state.returnTo,
    });

    return {
      ...authResult,
      redirectTo: state.returnTo,
      flowType: state.flowType,
      clientContext: state.clientContext,
      confirmationRequired: true,
      challengeToken,
    };
  }

  return {
    ...authResult,
    redirectTo: state.returnTo,
    flowType: state.flowType,
    clientContext: state.clientContext,
    confirmationRequired: false,
  };
};

export const confirmOrganizationOauthChallenge = async (challengeToken) => {
  const challenge = await consumeReloginChallenge(challengeToken);
  if (!challenge) {
    throw new AppError(OAUTH_ERRORS.INVALID_STATE, 400, {
      code: OAUTH_ERROR_CODES.INVALID_STATE,
    });
  }

  const session = await findSession(challenge.sessionId);
  if (
    !session ||
    !session.isActive ||
    session.version !== challenge.sessionVersion
  ) {
    throw new AppError(OAUTH_ERRORS.INVALID_STATE, 400, {
      code: OAUTH_ERROR_CODES.INVALID_STATE,
    });
  }

  const payload = {
    sub: challenge.userId,
    sid: challenge.sessionId,
    ver: challenge.sessionVersion,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    redirectTo: challenge.redirectTo,
    flowType: challenge.flowType,
    clientContext: challenge.clientContext,
  };
};
