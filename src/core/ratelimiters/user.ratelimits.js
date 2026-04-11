import rateLimit from "express-rate-limit";

export const userMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many user profile update requests",
    code: "RATE_LIMIT_EXCEEDED",
  },
});
