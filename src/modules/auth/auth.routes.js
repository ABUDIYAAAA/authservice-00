import { Router } from "express";
import asyncHandler from "../../utils/async-handler.js";
import { requireAuth } from "./auth.middleware.js";
import {
  forgotPasswordHandler,
  listSessionsHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  revokeSessionHandler,
  signupHandler,
  verifyEmailHandler,
} from "./auth.controller.js";
import {
  loginLimiter,
  passwordResetLimiter,
  signupLimiter,
} from "../../core/ratelimiters/auth.ratelimits.js";

const router = Router();

router.post("/signup", signupLimiter, asyncHandler(signupHandler));

router.post("/login", loginLimiter, asyncHandler(loginHandler));

router.post("/logout", requireAuth, asyncHandler(logoutHandler));

router.post("/refresh", asyncHandler(refreshHandler));

router.get("/verify-email/:token", asyncHandler(verifyEmailHandler));

router.post("/resend-verification", asyncHandler(resendVerificationHandler));

router.post(
  "/forgot-password",
  passwordResetLimiter,
  asyncHandler(forgotPasswordHandler),
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  asyncHandler(resetPasswordHandler),
);

router.get("/sessions", requireAuth, asyncHandler(listSessionsHandler));

router.delete("/sessions/:id", requireAuth, asyncHandler(revokeSessionHandler));

export default router;
