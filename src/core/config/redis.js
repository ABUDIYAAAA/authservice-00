import IORedis from "ioredis";
import env from "./config.js";
import logger from "../logger/logger.js";

let redis;

export const getRedisClient = () => {
  if (!redis) {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  return redis;
};

export const ensureRedisConnection = async () => {
  const client = getRedisClient();
  await client.ping();
  logger.info("Redis connection established");
  return client;
};

export const closeRedisConnection = async () => {
  if (!redis) {
    return;
  }

  await redis.quit();
  logger.info("Redis connection closed");
};
