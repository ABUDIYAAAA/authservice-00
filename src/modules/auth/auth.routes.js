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

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: access_token
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         code:
 *           type: string
 *         requestId:
 *           type: string
 *       required: [error, code]
 *     AuthSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         orgId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         deviceId:
 *           type: string
 *         userAgent:
 *           type: string
 *         ipAddress:
 *           type: string
 *         version:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         lastActivityAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *     AuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *           nullable: true
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         emailVerified:
 *           type: boolean
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SignupRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Must include uppercase, lowercase, number, and symbol.
 *         name:
 *           type: string
 *         avatarUrl:
 *           type: string
 *           format: uri
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         orgId:
 *           type: string
 *           format: uuid
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/AuthUser'
 *         session:
 *           $ref: '#/components/schemas/AuthSession'
 *         accessToken:
 *           type: string
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         session:
 *           $ref: '#/components/schemas/AuthSession'
 *         accessToken:
 *           type: string
 *     SessionListResponse:
 *       type: object
 *       properties:
 *         sessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AuthSession'
 */

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 */
router.post("/signup", signupLimiter, asyncHandler(signupHandler));

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginLimiter, asyncHandler(loginHandler));

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Unauthorized
 */

router.post("/logout", requireAuth, asyncHandler(logoutHandler));

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Invalid or missing refresh token
 */

router.post("/refresh", asyncHandler(refreshHandler));

/**
 * @openapi
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email by one-time token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 *       401:
 *         description: Invalid or expired token
 */

router.get("/verify-email/:token", asyncHandler(verifyEmailHandler));

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Request accepted
 */

router.post("/resend-verification", asyncHandler(resendVerificationHandler));

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Request accepted
 */

router.post(
  "/forgot-password",
  passwordResetLimiter,
  asyncHandler(forgotPasswordHandler),
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset account password with one-time token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Invalid or expired token
 */

router.post(
  "/reset-password",
  passwordResetLimiter,
  asyncHandler(resetPasswordHandler),
);

/**
 * @openapi
 * /api/auth/sessions:
 *   get:
 *     summary: List active sessions for current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionListResponse'
 *       401:
 *         description: Unauthorized
 */

router.get("/sessions", requireAuth, asyncHandler(listSessionsHandler));

/**
 * @openapi
 * /api/auth/sessions/{id}:
 *   delete:
 *     summary: Revoke a specific session for current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session revoked
 *       404:
 *         description: Session not found
 */

router.delete("/sessions/:id", requireAuth, asyncHandler(revokeSessionHandler));

export default router;
