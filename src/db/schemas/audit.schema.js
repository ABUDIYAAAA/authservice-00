import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user.schema.js";
import { sessions } from "./session.schema.js";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    event: varchar("event", { length: 120 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    severity: varchar("severity", { length: 20 }).default("info").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    requestId: varchar("request_id", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    message: text("message"),
    metadata: jsonb("metadata")
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    auditEventIdx: index("idx_audit_logs_event").on(table.event),
    auditCategoryIdx: index("idx_audit_logs_category").on(table.category),
    auditStatusIdx: index("idx_audit_logs_status").on(table.status),
    auditActorUserIdx: index("idx_audit_logs_actor_user_id").on(
      table.actorUserId,
    ),
    auditTargetUserIdx: index("idx_audit_logs_target_user_id").on(
      table.targetUserId,
    ),
    auditRequestIdx: index("idx_audit_logs_request_id").on(table.requestId),
    auditCreatedAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
  }),
);
