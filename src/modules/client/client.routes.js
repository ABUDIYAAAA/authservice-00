import { Router } from "express";
import asyncHandler from "../../utils/async-handler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  addOrganizationClientProviderHandler,
  createOrganizationClientHandler,
  deleteOrganizationClientHandler,
  deleteOrganizationClientProviderHandler,
  getOrganizationClientHandler,
  listOrganizationClientsHandler,
  updateOrganizationClientHandler,
  updateOrganizationClientProviderHandler,
} from "./client.controller.js";
import {
  organizationClientMutationLimiter,
  organizationClientProviderMutationLimiter,
} from "../../core/ratelimiters/client.ratelimits.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, asyncHandler(listOrganizationClientsHandler));
router.get(
  "/:clientId",
  requireAuth,
  asyncHandler(getOrganizationClientHandler),
);

router.post(
  "/",
  requireAuth,
  organizationClientMutationLimiter,
  asyncHandler(createOrganizationClientHandler),
);
router.patch(
  "/:clientId",
  requireAuth,
  organizationClientMutationLimiter,
  asyncHandler(updateOrganizationClientHandler),
);
router.delete(
  "/:clientId",
  requireAuth,
  organizationClientMutationLimiter,
  asyncHandler(deleteOrganizationClientHandler),
);

router.post(
  "/:clientId/providers",
  requireAuth,
  organizationClientProviderMutationLimiter,
  asyncHandler(addOrganizationClientProviderHandler),
);
router.patch(
  "/:clientId/providers/:provider",
  requireAuth,
  organizationClientProviderMutationLimiter,
  asyncHandler(updateOrganizationClientProviderHandler),
);
router.delete(
  "/:clientId/providers/:provider",
  requireAuth,
  organizationClientProviderMutationLimiter,
  asyncHandler(deleteOrganizationClientProviderHandler),
);

export default router;
