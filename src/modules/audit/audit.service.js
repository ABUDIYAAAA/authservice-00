import logger from "../../core/logger/logger.js";
import { createAuditLog } from "./audit.repository.js";

const getIpAddress = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "0.0.0.0";
};

const auditSinks = [];

export const registerAuditSink = (sink) => {
  if (typeof sink !== "function") {
    throw new Error("Audit sink must be a function");
  }

  auditSinks.push(sink);
};

registerAuditSink(async (entry) => {
  await createAuditLog(entry);
});

registerAuditSink(async (entry) => {
  logger.info("Audit event", {
    event: entry.event,
    category: entry.category,
    status: entry.status,
    actorUserId: entry.actorUserId,
    requestId: entry.requestId,
  });
});

const normalizeAuditEntry = (entry) => {
  return {
    event: entry.event,
    category: entry.category,
    status: entry.status,
    severity: entry.severity || "info",
    actorUserId: entry.actorUserId || null,
    targetUserId: entry.targetUserId || null,
    orgId: entry.orgId || null,
    sessionId: entry.sessionId || null,
    requestId: entry.requestId || null,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    message: entry.message || null,
    metadata: entry.metadata || {},
  };
};

export const emitAuditEvent = async (entry) => {
  const normalized = normalizeAuditEntry(entry);

  await Promise.all(
    auditSinks.map(async (sink) => {
      try {
        await sink(normalized);
      } catch (error) {
        logger.error("Audit sink failed", {
          event: normalized.event,
          sinkError: error.message,
        });
      }
    }),
  );
};

export const buildAuditContextFromRequest = (req) => {
  return {
    actorUserId: req.auth?.sub || null,
    sessionId: req.auth?.sid || null,
    requestId: req.id || null,
    ipAddress: getIpAddress(req),
    userAgent: req.headers["user-agent"] || "unknown",
  };
};
