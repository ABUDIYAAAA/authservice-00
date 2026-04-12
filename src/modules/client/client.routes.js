import { Router } from "express";
import asyncHandler from "../../utils/async-handler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  addOrganizationClientProviderHandler,
  configureOrganizationClientWebhookHandler,
  createOrganizationClientHandler,
  deleteOrganizationClientHandler,
  deleteOrganizationClientProviderHandler,
  disableOrganizationClientWebhookHandler,
  getOrganizationClientHandler,
  listOrganizationClientUsersHandler,
  listOrganizationClientsHandler,
  rotateOrganizationClientSecretHandler,
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
router.get(
  "/:clientId/users",
  requireAuth,
  asyncHandler(listOrganizationClientUsersHandler),
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
  "/:clientId/secret/rotate",
  requireAuth,
  organizationClientMutationLimiter,
  asyncHandler(rotateOrganizationClientSecretHandler),
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

router.post(
  "/:clientId/webhook",
  requireAuth,
  organizationClientProviderMutationLimiter,
  asyncHandler(configureOrganizationClientWebhookHandler),
);

router.delete(
  "/:clientId/webhook",
  requireAuth,
  organizationClientProviderMutationLimiter,
  asyncHandler(disableOrganizationClientWebhookHandler),
);

export default router;
