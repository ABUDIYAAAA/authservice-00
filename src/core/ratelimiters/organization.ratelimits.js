import rateLimit from "express-rate-limit";
import { RATE_LIMIT_POLICY } from "../constants/rate-limit.constants.js";

export const organizationMutationLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICY.ORGANIZATION_MUTATION.windowMs,
  limit: RATE_LIMIT_POLICY.ORGANIZATION_MUTATION.limit,
  standardHeaders: RATE_LIMIT_POLICY.STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_POLICY.LEGACY_HEADERS,
  message: {
    error: RATE_LIMIT_POLICY.ORGANIZATION_MUTATION.error,
    code: "RATE_LIMIT_EXCEEDED",
  },
});

export const organizationInviteSendLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_SEND.windowMs,
  limit: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_SEND.limit,
  standardHeaders: RATE_LIMIT_POLICY.STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_POLICY.LEGACY_HEADERS,
  message: {
    error: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_SEND.error,
    code: "RATE_LIMIT_EXCEEDED",
  },
});

export const organizationInviteAcceptLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_ACCEPT.windowMs,
  limit: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_ACCEPT.limit,
  standardHeaders: RATE_LIMIT_POLICY.STANDARD_HEADERS,
  legacyHeaders: RATE_LIMIT_POLICY.LEGACY_HEADERS,
  message: {
    error: RATE_LIMIT_POLICY.ORGANIZATION_INVITE_ACCEPT.error,
    code: "RATE_LIMIT_EXCEEDED",
  },
});
