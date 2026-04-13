import {
  accessCookieOptions,
  deviceCookieOptions,
  refreshCookieOptions,
} from "./cookie.js";
import { COOKIE_NAMES } from "../constants/cookie.constants.js";

export const setAuthCookies = (res, tokens, deviceInfo = null) => {
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

  if (deviceInfo?.deviceId) {
    res.cookie(
      COOKIE_NAMES.DEVICE_ID,
      deviceInfo.deviceId,
      deviceCookieOptions,
    );
  }
};

export const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    ...accessCookieOptions,
    maxAge: undefined,
  });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...refreshCookieOptions,
    maxAge: undefined,
  });
};
