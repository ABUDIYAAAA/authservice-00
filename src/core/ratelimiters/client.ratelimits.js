import rateLimit from "express-rate-limit";
import { RATE_LIMIT_POLICY } from "../constants/rate-limit.constants.js";

export const organizationClientMutationLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_MUTATION.windowMs,
  limit: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_MUTATION.limit,
  standardHeaders: RATE_LIMIT_POLICY.STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_POLICY.LEGACY_HEADERS,
  message: {
    error: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_MUTATION.error,
    code: "RATE_LIMIT_EXCEEDED",
  },
});

export const organizationClientProviderMutationLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_PROVIDER_MUTATION.windowMs,
  limit: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_PROVIDER_MUTATION.limit,
  standardHeaders: RATE_LIMIT_POLICY.STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_POLICY.LEGACY_HEADERS,
  message: {
    error: RATE_LIMIT_POLICY.ORGANIZATION_CLIENT_PROVIDER_MUTATION.error,
    code: "RATE_LIMIT_EXCEEDED",
  },
});
