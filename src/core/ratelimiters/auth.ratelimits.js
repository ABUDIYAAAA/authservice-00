import rateLimit from "express-rate-limit";

const defaultLimiterOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
  },
};

export const signupLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 60 * 60 * 1000,
  limit: 3,
});

export const loginLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const passwordResetLimiter = rateLimit({
  ...defaultLimiterOptions,
  windowMs: 60 * 60 * 1000,
  limit: 3,
});
