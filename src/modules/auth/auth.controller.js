import {
  forgotPassword,
  getUserSessions,
  login,
  logout,
  refreshAuth,
  resendVerificationEmail,
  resetPassword,
  revokeUserSession,
  signup,
  verifyEmail,
} from "./auth.service.js";
import { buildRequestDevice } from "./device.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
} from "../../validations/auth/auth.validators.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../core/auth/cookie.js";
import { unauthorized } from "../../utils/errors.js";
import { COOKIE_NAMES } from "../../core/constants/cookie.constants.js";
import { TOKEN_ERROR_MESSAGES } from "../../core/constants/security.constants.js";
import {
  AUDIT_CATEGORY,
  AUDIT_EVENTS,
  AUDIT_STATUS,
} from "../audit/audit.events.js";
import {
  buildAuditContextFromRequest,
  emitAuditEvent,
} from "../audit/audit.service.js";
import { AUTH_MESSAGES } from "./auth.constants.js";
import { AUDIT_MESSAGES } from "../audit/audit.messages.js";

const setAuthCookies = (res, tokens) => {
  res.cookie(
    COOKIE_NAMES.ACCESS_TOKEN,
    tokens.accessToken,
    accessCookieOptions,
  );
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    tokens.refreshToken,
    refreshCookieOptions,
  );
};

const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    ...accessCookieOptions,
    maxAge: undefined,
  });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...refreshCookieOptions,
    maxAge: undefined,
  });
};

export const signupHandler = async (req, res) => {
  const payload = signupSchema.parse(req.body);
  const deviceInfo = buildRequestDevice(req);
  const auditContext = buildAuditContextFromRequest(req);

  const result = await signup(payload, deviceInfo);
  setAuthCookies(res, result);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_SIGNUP_SUCCESS,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: result.user.id,
    message: AUDIT_MESSAGES.AUTH_SIGNUP_SUCCESS,
    metadata: {
      email: result.user.email,
      sessionId: result.session.id,
    },
  });

  res.status(201).json({
    user: result.user,
    session: result.session,
    accessToken: result.accessToken,
  });
};

export const loginHandler = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const deviceInfo = buildRequestDevice(req);
  const auditContext = buildAuditContextFromRequest(req);

  try {
    const result = await login(payload, deviceInfo);

    setAuthCookies(res, result);

    await emitAuditEvent({
      ...auditContext,
      actorUserId: result.user.id,
      sessionId: result.session.id,
      event: AUDIT_EVENTS.AUTH_LOGIN_SUCCESS,
      category: AUDIT_CATEGORY.AUTH,
      status: AUDIT_STATUS.SUCCESS,
      message: AUDIT_MESSAGES.AUTH_LOGIN_SUCCESS,
      metadata: {
        email: result.user.email,
        deviceId: result.session.deviceId,
      },
    });

    res.status(200).json({
      user: result.user,
      session: result.session,
      accessToken: result.accessToken,
    });
  } catch (error) {
    await emitAuditEvent({
      ...auditContext,
      event: AUDIT_EVENTS.AUTH_LOGIN_FAILED,
      category: AUDIT_CATEGORY.AUTH,
      status: AUDIT_STATUS.FAILURE,
      severity: "warn",
      message: AUDIT_MESSAGES.AUTH_LOGIN_FAILED,
      metadata: {
        email: payload.email,
        reason: error.message,
      },
    });

    throw error;
  }
};

export const logoutHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = logoutSchema.parse(req.body || {});

  await logout({
    userId: req.auth.sub,
    sessionId: req.auth.sid,
    clientId: payload.clientId,
    clientContext: payload.clientContext,
  });

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_LOGOUT,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_LOGOUT,
    metadata: {
      clientId: payload.clientId || null,
      clientContext: payload.clientContext || null,
    },
  });

  clearAuthCookies(res);
  res.status(200).json({ message: AUTH_MESSAGES.LOGGED_OUT });
};

export const refreshHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  if (!refreshToken) {
    await emitAuditEvent({
      ...auditContext,
      event: AUDIT_EVENTS.AUTH_REFRESH_FAILED,
      category: AUDIT_CATEGORY.AUTH,
      status: AUDIT_STATUS.FAILURE,
      severity: "warn",
      message: AUDIT_MESSAGES.AUTH_REFRESH_FAILED_MISSING_TOKEN,
    });
    unauthorized(TOKEN_ERROR_MESSAGES.MISSING_REFRESH);
  }

  try {
    const result = await refreshAuth(refreshToken);

    setAuthCookies(res, result);

    await emitAuditEvent({
      ...auditContext,
      actorUserId: req.auth?.sub,
      sessionId: result.session.id,
      event: AUDIT_EVENTS.AUTH_REFRESH_SUCCESS,
      category: AUDIT_CATEGORY.AUTH,
      status: AUDIT_STATUS.SUCCESS,
      message: AUDIT_MESSAGES.AUTH_REFRESH_SUCCESS,
      metadata: {
        newVersion: result.session.version,
      },
    });

    res.status(200).json({
      session: result.session,
      accessToken: result.accessToken,
    });
  } catch (error) {
    await emitAuditEvent({
      ...auditContext,
      event: AUDIT_EVENTS.AUTH_REFRESH_FAILED,
      category: AUDIT_CATEGORY.AUTH,
      status: AUDIT_STATUS.FAILURE,
      severity: "warn",
      message: AUDIT_MESSAGES.AUTH_REFRESH_FAILED,
      metadata: {
        reason: error.message,
      },
    });

    throw error;
  }
};

export const verifyEmailHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);

  await verifyEmail(req.params.token);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_EMAIL_VERIFIED,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_EMAIL_VERIFIED,
  });

  res.status(200).json({ message: AUTH_MESSAGES.EMAIL_VERIFIED });
};

export const resendVerificationHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = resendVerificationSchema.parse(req.body);

  await resendVerificationEmail(payload);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_VERIFICATION_RESEND,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_VERIFICATION_RESEND,
    metadata: {
      email: payload.email,
    },
  });

  res.status(200).json({ message: AUTH_MESSAGES.IF_ACCOUNT_EXISTS_EMAIL_SENT });
};

export const forgotPasswordHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = forgotPasswordSchema.parse(req.body);

  await forgotPassword(payload);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_FORGOT_PASSWORD_REQUESTED,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_FORGOT_PASSWORD_REQUESTED,
    metadata: {
      email: payload.email,
    },
  });

  res.status(200).json({ message: AUTH_MESSAGES.IF_ACCOUNT_EXISTS_RESET_SENT });
};

export const resetPasswordHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = resetPasswordSchema.parse(req.body);

  await resetPassword(payload);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_PASSWORD_RESET_SUCCESS,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_PASSWORD_RESET_SUCCESS,
  });

  clearAuthCookies(res);
  res.status(200).json({ message: AUTH_MESSAGES.PASSWORD_UPDATED });
};

export const listSessionsHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const sessions = await getUserSessions(req.auth.sub);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_SESSIONS_VIEWED,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_SESSIONS_VIEWED,
    metadata: {
      count: sessions.length,
    },
  });

  res.status(200).json({ sessions });
};

export const revokeSessionHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);

  await revokeUserSession(req.auth.sub, req.params.id);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.AUTH_SESSION_REVOKED,
    category: AUDIT_CATEGORY.AUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: AUDIT_MESSAGES.AUTH_SESSION_REVOKED,
    metadata: {
      revokedSessionId: req.params.id,
    },
  });

  res.status(200).json({ message: AUTH_MESSAGES.SESSION_REVOKED });
};
