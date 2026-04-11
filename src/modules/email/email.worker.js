import { Worker } from "bullmq";
import { getRedisClient } from "../../core/config/redis.js";
import logger from "../../core/logger/logger.js";
import { deadLetterQueue } from "../../queues/index.js";
import { sendEmail } from "./email.service.js";

export const startEmailWorker = () => {
  const worker = new Worker(
    "emailQueue",
    async (job) => {
      await sendEmail(job.data);
      logger.info("Email sent", { jobId: job.id, to: job.data.to });
    },
    { connection: getRedisClient() },
  );

  worker.on("failed", async (job, error) => {
    logger.error("Email job failed", { jobId: job?.id, error: error.message });

    if (job) {
      await deadLetterQueue.add("email-failed", {
        queue: "emailQueue",
        payload: job.data,
        reason: error.message,
      });
    }
  });

  return worker;
};
