import { emailQueue } from "../../queues/index.js";

export const queueEmailJob = async ({ to, subject, html }) => {
  return emailQueue.add(
    "send-email",
    { to, subject, html },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1500,
      },
    },
  );
};
