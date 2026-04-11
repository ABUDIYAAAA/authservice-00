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

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Unauthorized
 */

router.get("/me", requireAuth, asyncHandler(getMeHandler));

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

router.patch(
  "/me",
  requireAuth,
  userMutationLimiter,
  asyncHandler(updateMeHandler),
);

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 */

router.delete("/me", requireAuth, asyncHandler(deleteMeHandler));

export default router;
