import crypto from "node:crypto";
import { COOKIE_NAMES } from "../../core/constants/cookie.constants.js";

export const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "0.0.0.0";
};

export const buildDeviceId = ({ userAgent, ipAddress }) => {
  const input = `${userAgent || "unknown"}`;
  return crypto.createHash("sha256").update(input).digest("hex");
};

const isValidDeviceId = (value) => {
  return typeof value === "string" && value.length >= 8 && value.length <= 255;
};

const generateDeviceId = () => {
  return crypto.randomBytes(24).toString("base64url");
};

export const buildRequestDevice = (req) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ipAddress = getRequestIp(req);
  const cookieDeviceId = req.cookies?.[COOKIE_NAMES.DEVICE_ID];
  const headerDeviceId = req.headers["x-device-id"];

  if (isValidDeviceId(headerDeviceId)) {
    return {
      userAgent,
      ipAddress,
      deviceId: headerDeviceId,
      shouldSetDeviceCookie: cookieDeviceId !== headerDeviceId,
    };
  }

  if (isValidDeviceId(cookieDeviceId)) {
    return {
      userAgent,
      ipAddress,
      deviceId: cookieDeviceId,
      shouldSetDeviceCookie: false,
    };
  }

  const generatedDeviceId = generateDeviceId();

  return {
    userAgent,
    ipAddress,
    deviceId: generatedDeviceId,
    shouldSetDeviceCookie: true,
  };
};
