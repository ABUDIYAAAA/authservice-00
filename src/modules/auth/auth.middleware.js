import { verifyAccessToken } from "./token.service.js";
import { unauthorized } from "../../utils/errors.js";

export const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const token = req.cookies.access_token || bearerToken;

  if (!token) {
    unauthorized("Missing access token");
  }

  const payload = verifyAccessToken(token);
  req.auth = payload;
  next();
};
