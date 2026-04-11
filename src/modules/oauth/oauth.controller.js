import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../core/auth/cookie.js";
import { badRequest } from "../../utils/errors.js";
import {
  AUDIT_CATEGORY,
  AUDIT_EVENTS,
  AUDIT_STATUS,
} from "../audit/audit.events.js";
import {
  buildAuditContextFromRequest,
  emitAuditEvent,
} from "../audit/audit.service.js";
import { buildRequestDevice } from "../auth/device.service.js";
import { handleOauthCallback, getOauthStartUrl } from "./oauth.service.js";

const setAuthCookies = (res, tokens) => {
  res.cookie("access_token", tokens.accessToken, accessCookieOptions);
  res.cookie("refresh_token", tokens.refreshToken, refreshCookieOptions);
};

export const oauthStartHandler = async (req, res) => {
  const provider = req.params.provider;
  const auditContext = buildAuditContextFromRequest(req);
  const redirectUrl = getOauthStartUrl(provider);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.OAUTH_START,
    category: AUDIT_CATEGORY.OAUTH,
    status: AUDIT_STATUS.SUCCESS,
    message: "OAuth flow started",
    metadata: {
      provider,
    },
  });

  res.redirect(redirectUrl);
};

export const oauthCallbackHandler = async (req, res) => {
  const provider = req.params.provider;
  const code = req.query.code;
  const auditContext = buildAuditContextFromRequest(req);

  if (!code || typeof code !== "string") {
    await emitAuditEvent({
      ...auditContext,
      event: AUDIT_EVENTS.OAUTH_CALLBACK_FAILED,
      category: AUDIT_CATEGORY.OAUTH,
      status: AUDIT_STATUS.FAILURE,
      severity: "warn",
      message: "OAuth callback failed due to missing code",
      metadata: {
        provider,
      },
    });

    badRequest("Missing OAuth authorization code");
  }

  try {
    const result = await handleOauthCallback({
      provider,
      code,
      deviceInfo: buildRequestDevice(req),
    });

    await emitAuditEvent({
      ...auditContext,
      actorUserId: result.user.id,
      sessionId: result.session.id,
      event: AUDIT_EVENTS.OAUTH_CALLBACK_SUCCESS,
      category: AUDIT_CATEGORY.OAUTH,
      status: AUDIT_STATUS.SUCCESS,
      message: "OAuth callback succeeded",
      metadata: {
        provider,
        email: result.user.email,
      },
    });

    setAuthCookies(res, result);
    res.redirect(result.redirectTo);
  } catch (error) {
    await emitAuditEvent({
      ...auditContext,
      event: AUDIT_EVENTS.OAUTH_CALLBACK_FAILED,
      category: AUDIT_CATEGORY.OAUTH,
      status: AUDIT_STATUS.FAILURE,
      severity: "warn",
      message: "OAuth callback failed",
      metadata: {
        provider,
        reason: error.message,
      },
    });

    throw error;
  }
};
