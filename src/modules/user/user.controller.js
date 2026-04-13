import { updateMeSchema } from "../../validations/user/user.validators.js";
import { deleteMe, getMe, updateMe } from "./user.service.js";
import {
  AUDIT_CATEGORY,
  AUDIT_EVENTS,
  AUDIT_STATUS,
} from "../audit/audit.events.js";
import {
  buildAuditContextFromRequest,
  emitAuditEvent,
} from "../audit/audit.service.js";
import { AUDIT_MESSAGES } from "../audit/audit.messages.js";
import { AUTH_HEADER_PREFIX } from "../../core/constants/security.constants.js";
import { COOKIE_NAMES } from "../../core/constants/cookie.constants.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../core/auth/cookie.js";
import { denylistAccessToken } from "../auth/token-denylist.service.js";

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

const getRequestAccessToken = (req) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith(AUTH_HEADER_PREFIX)
    ? authHeader.slice(AUTH_HEADER_PREFIX.length)
    : undefined;

  return req.cookies[COOKIE_NAMES.ACCESS_TOKEN] || bearerToken;
};

export const getMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const user = await getMe(req.auth.sub);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_VIEWED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: user.id,
    message: AUDIT_MESSAGES.USER_PROFILE_VIEWED,
  });

  res.status(200).json({ user });
};

export const updateMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = updateMeSchema.parse(req.body);
  const user = await updateMe(req.auth.sub, payload);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_UPDATED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: user.id,
    message: AUDIT_MESSAGES.USER_PROFILE_UPDATED,
    metadata: {
      updatedFields: Object.keys(payload),
    },
  });

  res.status(200).json({ user });
};

export const deleteMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const accessToken = getRequestAccessToken(req);

  await deleteMe(req.auth.sub);

  if (accessToken) {
    await denylistAccessToken(accessToken);
  }

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_DELETED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: req.auth.sub,
    message: AUDIT_MESSAGES.USER_PROFILE_DELETED,
  });

  clearAuthCookies(res);
  res.status(204).send();
};
