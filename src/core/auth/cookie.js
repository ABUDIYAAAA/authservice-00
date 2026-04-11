import env from "../config/config.js";

const baseCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE ?? env.APP_ENV === "production",
  sameSite: env.COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

export const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
};
