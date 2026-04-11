import fs from "node:fs";
import jwt from "jsonwebtoken";
import env from "../../core/config/config.js";
import { AppError } from "../../utils/errors.js";

const accessPrivateKey = fs.readFileSync(
  env.ACCESS_TOKEN_PRIVATE_KEY_PATH,
  "utf8",
);
const accessPublicKey = fs.readFileSync(
  env.ACCESS_TOKEN_PUBLIC_KEY_PATH,
  "utf8",
);
const refreshPrivateKey = fs.readFileSync(
  env.REFRESH_TOKEN_PRIVATE_KEY_PATH,
  "utf8",
);
const refreshPublicKey = fs.readFileSync(
  env.REFRESH_TOKEN_PUBLIC_KEY_PATH,
  "utf8",
);

export const signAccessToken = (payload) => {
  return jwt.sign(payload, accessPrivateKey, {
    algorithm: "RS256",
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, refreshPrivateKey, {
    algorithm: "RS256",
    expiresIn: env.REFRESH_TOKEN_TTL,
  });
};

const mapJwtError = (error) => {
  if (error.name === "TokenExpiredError") {
    throw new AppError("Token has expired", 401, { code: "TOKEN_EXPIRED" });
  }

  throw new AppError("Invalid token", 401, { code: "TOKEN_INVALID" });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, accessPublicKey, { algorithms: ["RS256"] });
  } catch (error) {
    return mapJwtError(error);
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, refreshPublicKey, { algorithms: ["RS256"] });
  } catch (error) {
    return mapJwtError(error);
  }
};
