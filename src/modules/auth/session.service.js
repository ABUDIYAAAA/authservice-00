import env from "../../core/config/config.js";
import {
  createSession,
  findReusableSession,
  findSessionById,
  rotateSessionVersion,
  revokeSessionById,
  touchSessionById,
} from "./auth.repository.js";

export const sessionExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.SESSION_TTL_DAYS);
  return expiresAt;
};

export const createUserSession = async (
  { userId, orgId, clientId, deviceId, userAgent, ipAddress },
  tx,
) => {
  return createSession(
    {
      userId,
      orgId,
      clientId: clientId || null,
      deviceId,
      userAgent,
      ipAddress,
      expiresAt: sessionExpiryDate(),
      isActive: true,
      version: 1,
    },
    tx,
  );
};

export const createOrReuseUserSession = async (
  { userId, orgId, clientId, deviceId, userAgent, ipAddress },
  tx,
) => {
  const existingSession = await findReusableSession(
    {
      userId,
      orgId: orgId || null,
      clientId: clientId || null,
      deviceId,
    },
    tx,
  );

  if (!existingSession) {
    return createUserSession(
      {
        userId,
        orgId,
        clientId,
        deviceId,
        userAgent,
        ipAddress,
      },
      tx,
    );
  }

  const touchedSession = await touchSessionById(
    existingSession.id,
    {
      userAgent,
      ipAddress,
      expiresAt: sessionExpiryDate(),
    },
    tx,
  );

  return touchedSession || existingSession;
};

export const rotateSession = async (sessionId, expectedVersion, tx) => {
  return rotateSessionVersion(sessionId, expectedVersion, tx);
};

export const findSession = async (sessionId, tx) => {
  return findSessionById(sessionId, tx);
};

export const revokeSession = async (userId, sessionId, tx) => {
  return revokeSessionById(userId, sessionId, tx);
};
