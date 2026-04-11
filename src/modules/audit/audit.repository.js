import db from "../../db/client/db.js";
import { auditLogs } from "../../db/schemas/index.js";

export const createAuditLog = async (payload, tx = db) => {
  const [entry] = await tx.insert(auditLogs).values(payload).returning();
  return entry;
};
