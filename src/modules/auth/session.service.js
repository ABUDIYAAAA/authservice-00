import env from "../../core/config/config.js";
import {
  createSession,
  findSessionById,
  rotateSessionVersion,
  revokeSessionById,
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

export const rotateSession = async (sessionId, expectedVersion, tx) => {
  return rotateSessionVersion(sessionId, expectedVersion, tx);
};

export const findSession = async (sessionId, tx) => {
  return findSessionById(sessionId, tx);
};

export const revokeSession = async (userId, sessionId, tx) => {
  return revokeSessionById(userId, sessionId, tx);
};
