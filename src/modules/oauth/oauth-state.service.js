import crypto from "node:crypto";
import env from "../../core/config/config.js";
import { getRedisClient } from "../../core/config/redis.js";
import { OAUTH_STATE_KEY_PREFIX } from "./oauth.constants.js";

const getStateKey = (stateToken) => {
  return `${OAUTH_STATE_KEY_PREFIX}:${stateToken}`;
};

export const createOauthState = async (payload) => {
  const stateToken = crypto.randomBytes(32).toString("base64url");
  const key = getStateKey(stateToken);
  const value = JSON.stringify({
    ...payload,
    issuedAt: new Date().toISOString(),
  });

  await getRedisClient().set(key, value, "EX", env.OAUTH_STATE_TTL_SECONDS);

  return stateToken;
};

export const consumeOauthState = async (stateToken) => {
  const key = getStateKey(stateToken);

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

export const readOauthState = async (stateToken) => {
  const key = getStateKey(stateToken);
  const value = await getRedisClient().get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const deleteOauthStatesForUserId = async (userId) => {
  const client = getRedisClient();
  let cursor = "0";
  let deletedCount = 0;

  do {
    const [nextCursor, keys] = await client.scan(
      cursor,
      "MATCH",
      `${OAUTH_STATE_KEY_PREFIX}:*`,
      "COUNT",
      200,
    );
    cursor = nextCursor;

    if (!keys.length) {
      continue;
    }

    const values = await client.mget(keys);
    const keysToDelete = [];

    for (let index = 0; index < keys.length; index += 1) {
      const rawValue = values[index];
      if (!rawValue) {
        continue;
      }

      try {
        const parsedValue = JSON.parse(rawValue);
        if (parsedValue?.userId === userId) {
          keysToDelete.push(keys[index]);
        }
      } catch {
        // Ignore malformed payloads and continue cleanup.
      }
    }

    if (keysToDelete.length > 0) {
      deletedCount += await client.del(...keysToDelete);
    }
  } while (cursor !== "0");

  return deletedCount;
};
