import crypto from "node:crypto";

export const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "0.0.0.0";
};

export const buildDeviceId = ({ userAgent, ipAddress }) => {
  const input = `${userAgent || "unknown"}::${ipAddress || "unknown"}`;
  return crypto.createHash("sha256").update(input).digest("hex");
};

export const buildRequestDevice = (req) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ipAddress = getRequestIp(req);

  return {
    userAgent,
    ipAddress,
    deviceId: buildDeviceId({ userAgent, ipAddress }),
  };
};
