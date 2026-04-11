import { Worker } from "bullmq";
import { getRedisClient } from "../../core/config/redis.js";
import logger from "../../core/logger/logger.js";
import { deadLetterQueue } from "../../queues/index.js";
import {
  QUEUE_JOB_NAMES,
  QUEUE_NAMES,
} from "../../core/constants/queue.constants.js";
import { dispatchServiceWebhook } from "./webhook.service.js";

export const startServiceWebhookWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.SERVICE_WEBHOOK,
    async (job) => {
      await dispatchServiceWebhook(job.data);
      logger.info("Service webhook delivered", {
        jobId: job.id,
        event: job.data.event,
        webhookUrl: job.data.webhookUrl,
      });
    },
    { connection: getRedisClient() },
  );

  worker.on("failed", async (job, error) => {
    logger.error("Service webhook delivery failed", {
      jobId: job?.id,
      error: error.message,
    });

    if (job) {
      await deadLetterQueue.add(QUEUE_JOB_NAMES.SERVICE_WEBHOOK_FAILED, {
        queue: QUEUE_NAMES.SERVICE_WEBHOOK,
        payload: job.data,
        reason: error.message,
      });
    }
  });

  return worker;
};
