import crypto from "node:crypto";

const sanitizeClientRequestId = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 255);
};

const requestContext = (req, _res, next) => {
  req.id = crypto.randomUUID();
  req.clientRequestId = sanitizeClientRequestId(req.header("x-request-id"));
  next();
};

export default requestContext;
