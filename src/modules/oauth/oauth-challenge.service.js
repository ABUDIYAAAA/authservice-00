import crypto from "node:crypto";
import env from "../../core/config/config.js";
import { getRedisClient } from "../../core/config/redis.js";

const REQUIRED_CONFIRMATION_KEY_PREFIX = "oauth:confirm:required";
const CHALLENGE_KEY_PREFIX = "oauth:confirm:challenge";

const requiredKey = ({ orgId, clientId, userId }) => {
  return `${REQUIRED_CONFIRMATION_KEY_PREFIX}:${orgId}:${clientId}:${userId}`;
};

const challengeKey = (challengeToken) => {
  return `${CHALLENGE_KEY_PREFIX}:${challengeToken}`;
};

const consumeKey = async (key) => {
  const value = await getRedisClient().eval(
    `
      local current = redis.call('GET', KEYS[1])
      if current then
        redis.call('DEL', KEYS[1])
      end
      return current
    `,
    1,
    key,
  );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const setReloginConfirmationRequirement = async ({
  orgId,
  clientId,
  userId,
  clientContext,
}) => {
  await getRedisClient().set(
    requiredKey({ orgId, clientId, userId }),
    JSON.stringify({
      orgId,
      clientId,
      userId,
      clientContext: clientContext || null,
      createdAt: new Date().toISOString(),
    }),
    "EX",
    env.OAUTH_RELOGIN_REQUIREMENT_TTL_SECONDS,
  );
};

export const consumeReloginConfirmationRequirement = async ({
  orgId,
  clientId,
  userId,
}) => {
  return consumeKey(requiredKey({ orgId, clientId, userId }));
};

export const createReloginChallenge = async (payload) => {
  const token = crypto.randomBytes(32).toString("base64url");

  await getRedisClient().set(
    challengeKey(token),
    JSON.stringify({
      ...payload,
      createdAt: new Date().toISOString(),
    }),
    "EX",
    env.OAUTH_RELOGIN_CHALLENGE_TTL_SECONDS,
  );

  return token;
};

export const consumeReloginChallenge = async (token) => {
  return consumeKey(challengeKey(token));
};
