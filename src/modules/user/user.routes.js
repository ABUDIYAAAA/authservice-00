import { Router } from "express";
import asyncHandler from "../../utils/async-handler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  deleteMeHandler,
  getMeHandler,
  updateMeHandler,
} from "./user.controller.js";
import { userMutationLimiter } from "../../core/ratelimiters/user.ratelimits.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMeHandler));

router.patch(
  "/me",
  requireAuth,
  userMutationLimiter,
  asyncHandler(updateMeHandler),
);

router.delete("/me", requireAuth, asyncHandler(deleteMeHandler));

export default router;
