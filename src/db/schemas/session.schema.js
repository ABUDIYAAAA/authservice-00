import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema.js";
import { users } from "./user.schema.js";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    deviceId: varchar("device_id", { length: 255 }),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    sessionsUserIdIdx: index("idx_sessions_user_id").on(table.userId),
    sessionsDeviceIdIdx: index("idx_sessions_device_id").on(table.deviceId),
    sessionsExpiryIdx: index("idx_sessions_expires_at").on(table.expiresAt),
  }),
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => ({
    verificationUserIdIdx: index("idx_email_verification_user_id").on(
      table.userId,
    ),
    verificationTokenIdx: index("idx_email_verification_token").on(table.token),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => ({
    resetUserIdIdx: index("idx_password_reset_user_id").on(table.userId),
    resetTokenIdx: index("idx_password_reset_token").on(table.token),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [sessions.orgId],
    references: [organizations.id],
  }),
}));
