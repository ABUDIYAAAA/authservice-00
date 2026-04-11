import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "member",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    name: varchar("name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    usersEmailUniqueIdx: uniqueIndex("users_email_unique_idx").on(table.email),
    usersEmailIdx: index("idx_users_email").on(table.email),
  }),
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    oauthProviderAccountUniqueIdx: uniqueIndex(
      "oauth_provider_account_unique_idx",
    ).on(table.provider, table.providerAccountId),
    oauthUserIdIdx: index("idx_oauth_user_id").on(table.userId),
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

export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  organizationMemberships: many(organizationMembers),
  organizationInvitesSent: many(organizationInvites, {
    relationName: "invites_sent",
  }),
  organizationInvitesAccepted: many(organizationInvites, {
    relationName: "invites_accepted",
  }),
}));

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
    }),
    invitedByUser: one(users, {
      fields: [organizationMembers.invitedByUserId],
      references: [users.id],
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
      relationName: "invites_sent",
    }),
    acceptedByUser: one(users, {
      fields: [organizationInvites.acceptedByUserId],
      references: [users.id],
      relationName: "invites_accepted",
    }),
  }),
);
