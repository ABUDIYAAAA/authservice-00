import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";

export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "member",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationsSlugUniqueIdx: uniqueIndex("organizations_slug_unique_idx").on(
      table.slug,
    ),
    organizationsNameLowerUniqueIdx: uniqueIndex(
      "organizations_name_lower_unique_idx",
    ).on(sql`lower(${table.name})`),
  }),
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationRoleEnum("role").default("member").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationMembersUniqueIdx: uniqueIndex(
      "organization_members_unique_idx",
    ).on(table.orgId, table.userId),
    organizationMembersOrgIdx: index("idx_organization_members_org_id").on(
      table.orgId,
    ),
    organizationMembersUserIdx: index("idx_organization_members_user_id").on(
      table.userId,
    ),
  }),
);

export const organizationInvites = pgTable(
  "organization_invites",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invitedEmail: varchar("invited_email", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    role: organizationRoleEnum("role").default("member").notNull(),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    organizationInvitesTokenIdx: index("idx_organization_invites_token").on(
      table.token,
    ),
    organizationInvitesOrgIdx: index("idx_organization_invites_org_id").on(
      table.orgId,
    ),
    organizationInvitesEmailIdx: index(
      "idx_organization_invites_invited_email",
    ).on(table.invitedEmail),
    organizationInvitesInviterIdx: index(
      "idx_organization_invites_invited_by_user_id",
    ).on(table.invitedByUserId),
  }),
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invites: many(organizationInvites),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.orgId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
      relationName: "organization_member_user",
    }),
    invitedByUser: one(users, {
      fields: [organizationMembers.invitedByUserId],
      references: [users.id],
      relationName: "organization_member_invited_by_user",
    }),
  }),
);

export const organizationInvitesRelations = relations(
  organizationInvites,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationInvites.orgId],
      references: [organizations.id],
    }),
    invitedByUser: one(users, {
      fields: [organizationInvites.invitedByUserId],
      references: [users.id],
      relationName: "organization_invite_invited_by_user",
    }),
    acceptedByUser: one(users, {
      fields: [organizationInvites.acceptedByUserId],
      references: [users.id],
      relationName: "organization_invite_accepted_by_user",
    }),
  }),
);
