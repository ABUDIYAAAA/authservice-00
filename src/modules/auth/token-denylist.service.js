import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getRedisClient } from "../../core/config/redis.js";

const ACCESS_TOKEN_DENYLIST_KEY_PREFIX = "auth:access-token-denylist";
const FALLBACK_DENYLIST_TTL_SECONDS = 15 * 60;

const getDenylistKey = (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return `${ACCESS_TOKEN_DENYLIST_KEY_PREFIX}:${tokenHash}`;
};

const getTokenTtlSeconds = (token) => {
  const decoded = jwt.decode(token);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.exp !== "number"
  ) {
    return FALLBACK_DENYLIST_TTL_SECONDS;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return Math.max(decoded.exp - nowInSeconds, 1);
};

export const denylistAccessToken = async (token) => {
  if (!token || typeof token !== "string") {
    return;
  }

  const ttlSeconds = getTokenTtlSeconds(token);
  await getRedisClient().set(getDenylistKey(token), "1", "EX", ttlSeconds);
};

export const isAccessTokenDenylisted = async (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const exists = await getRedisClient().exists(getDenylistKey(token));
  return exists === 1;
};
