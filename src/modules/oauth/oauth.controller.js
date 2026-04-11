import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../../core/auth/cookie.js";
import { badRequest } from "../../utils/errors.js";
import { buildRequestDevice } from "../auth/device.service.js";
import { handleOauthCallback, getOauthStartUrl } from "./oauth.service.js";

const setAuthCookies = (res, tokens) => {
  res.cookie("access_token", tokens.accessToken, accessCookieOptions);
  res.cookie("refresh_token", tokens.refreshToken, refreshCookieOptions);
};

export const oauthStartHandler = async (req, res) => {
  const provider = req.params.provider;
  const redirectUrl = getOauthStartUrl(provider);
  res.redirect(redirectUrl);
};

export const oauthCallbackHandler = async (req, res) => {
  const provider = req.params.provider;
  const code = req.query.code;

  if (!code || typeof code !== "string") {
    badRequest("Missing OAuth authorization code");
  }

  const result = await handleOauthCallback({
    provider,
    code,
    deviceInfo: buildRequestDevice(req),
  });

  setAuthCookies(res, result);
  res.redirect(result.redirectTo);
};
