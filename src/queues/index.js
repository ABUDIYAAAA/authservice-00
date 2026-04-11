import { Queue } from "bullmq";
import { getRedisClient } from "../core/config/redis.js";

const connection = getRedisClient();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const emailQueue = new Queue("emailQueue", {
  connection,
  defaultJobOptions,
});

export const deviceAlertQueue = new Queue("deviceAlertQueue", {
  connection,
  defaultJobOptions,
});

export const cleanupQueue = new Queue("cleanupQueue", {
  connection,
  defaultJobOptions,
});

export const deadLetterQueue = new Queue("deadLetterQueue", {
  connection,
  defaultJobOptions,
});
