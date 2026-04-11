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
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
} from "../../validations/auth/auth.validators.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../core/auth/cookie.js";
import { unauthorized } from "../../utils/errors.js";

const setAuthCookies = (res, tokens) => {
  res.cookie("access_token", tokens.accessToken, accessCookieOptions);
  res.cookie("refresh_token", tokens.refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie("access_token", {
    ...accessCookieOptions,
    maxAge: undefined,
  });
  res.clearCookie("refresh_token", {
    ...refreshCookieOptions,
    maxAge: undefined,
  });
};

export const signupHandler = async (req, res) => {
  const payload = signupSchema.parse(req.body);
  const deviceInfo = buildRequestDevice(req);

  const result = await signup(payload, deviceInfo);
  setAuthCookies(res, result);

  res.status(201).json({
    user: result.user,
    session: result.session,
    accessToken: result.accessToken,
  });
};

export const loginHandler = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const deviceInfo = buildRequestDevice(req);

  const result = await login(payload, deviceInfo);
  setAuthCookies(res, result);

  res.status(200).json({
    user: result.user,
    session: result.session,
    accessToken: result.accessToken,
  });
};

export const logoutHandler = async (req, res) => {
  await logout({ userId: req.auth.sub, sessionId: req.auth.sid });
  clearAuthCookies(res);
  res.status(200).json({ message: "Logged out" });
};

export const refreshHandler = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    unauthorized("Missing refresh token");
  }

  const result = await refreshAuth(refreshToken);

  setAuthCookies(res, result);

  res.status(200).json({
    session: result.session,
    accessToken: result.accessToken,
  });
};

export const verifyEmailHandler = async (req, res) => {
  await verifyEmail(req.params.token);
  res.status(200).json({ message: "Email verified" });
};

export const resendVerificationHandler = async (req, res) => {
  const payload = resendVerificationSchema.parse(req.body);
  await resendVerificationEmail(payload);
  res
    .status(200)
    .json({ message: "If the account exists, an email has been sent" });
};

export const forgotPasswordHandler = async (req, res) => {
  const payload = forgotPasswordSchema.parse(req.body);
  await forgotPassword(payload);
  res
    .status(200)
    .json({ message: "If the account exists, a reset email has been sent" });
};

export const resetPasswordHandler = async (req, res) => {
  const payload = resetPasswordSchema.parse(req.body);
  await resetPassword(payload);
  clearAuthCookies(res);
  res.status(200).json({ message: "Password updated" });
};

export const listSessionsHandler = async (req, res) => {
  const sessions = await getUserSessions(req.auth.sub);
  res.status(200).json({ sessions });
};

export const revokeSessionHandler = async (req, res) => {
  await revokeUserSession(req.auth.sub, req.params.id);
  res.status(200).json({ message: "Session revoked" });
};
