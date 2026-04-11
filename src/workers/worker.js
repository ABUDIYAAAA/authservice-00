import { Worker } from "bullmq";
import db from "../db/client/db.js";
import {
  emailVerificationTokens,
  organizationInvites,
  passwordResetTokens,
  sessions,
} from "../db/schemas/index.js";
import { lte } from "drizzle-orm";
import { getRedisClient } from "../core/config/redis.js";
import logger from "../core/logger/logger.js";
import {
  closeRedisConnection,
  ensureRedisConnection,
} from "../core/config/redis.js";
import { startEmailWorker } from "../modules/email/email.worker.js";
import { startServiceWebhookWorker } from "../modules/webhook/webhook.worker.js";
import { deadLetterQueue } from "../queues/index.js";
import {
  QUEUE_JOB_NAMES,
  QUEUE_NAMES,
} from "../core/constants/queue.constants.js";

const isMissingTableError = (error) => {
  return error?.cause?.code === "42P01" || error?.code === "42P01";
};

const cleanupWorker = new Worker(
  QUEUE_NAMES.CLEANUP,
  async () => {
    const now = new Date();
    await Promise.all([
      db.delete(sessions).where(lte(sessions.expiresAt, now)),
      db
        .delete(emailVerificationTokens)
        .where(lte(emailVerificationTokens.expiresAt, now)),
      db
        .delete(passwordResetTokens)
        .where(lte(passwordResetTokens.expiresAt, now)),
      db
        .delete(organizationInvites)
        .where(lte(organizationInvites.expiresAt, now)),
    ]);

    logger.info("Cleanup job finished");
  },
  { connection: getRedisClient() },
);

cleanupWorker.on("failed", async (job, error) => {
  const code = error?.cause?.code || error?.code;

  logger.error("Cleanup job failed", {
    jobId: job?.id,
    error: error.message,
    cause: error?.cause?.message,
    code,
  });

  if (isMissingTableError(error)) {
    logger.error(
      "Worker stopping due to schema drift. Apply latest DB migration.",
      {
        missingTable: "organization_invites",
        requiredAction: "Run db migration before starting worker",
      },
    );

    await closeRedisConnection();
    process.exit(1);
  }

  if (job) {
    await deadLetterQueue.add(QUEUE_JOB_NAMES.CLEANUP_FAILED, {
      queue: QUEUE_NAMES.CLEANUP,
      payload: job.data,
      reason: error.message,
    });
  }
});

const deviceAlertWorker = new Worker(
  QUEUE_NAMES.DEVICE_ALERT,
  async (job) => {
    logger.info("Processed device alert job", {
      userId: job.data.userId,
      email: job.data.email,
    });
  },
  { connection: getRedisClient() },
);

deviceAlertWorker.on("failed", async (job, error) => {
  logger.error("Device alert job failed", {
    jobId: job?.id,
    error: error.message,
  });

  if (job) {
    await deadLetterQueue.add(QUEUE_JOB_NAMES.DEVICE_ALERT_FAILED, {
      queue: QUEUE_NAMES.DEVICE_ALERT,
      payload: job.data,
      reason: error.message,
    });
  }
});

const emailWorker = startEmailWorker();
const serviceWebhookWorker = startServiceWebhookWorker();

const shutdown = async () => {
  logger.info("Shutting down workers");
  await Promise.all([
    cleanupWorker.close(),
    deviceAlertWorker.close(),
    emailWorker.close(),
    serviceWebhookWorker.close(),
  ]);
  await closeRedisConnection();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const bootstrap = async () => {
  await ensureRedisConnection();
  logger.info("Worker process started");
};

bootstrap().catch(async (error) => {
  logger.error("Worker bootstrap failed", { error: error.message });
  await closeRedisConnection();
  process.exit(1);
});
