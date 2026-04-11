import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema.js";
import { users } from "./user.schema.js";

export const organizationClientProviderEnum = pgEnum(
  "organization_client_provider",
  ["google", "github"],
);

export const organizationClients = pgTable(
  "organization_clients",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    authorizedOrigins: jsonb("authorized_origins")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
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
    organizationClientsOrgIdx: index("idx_organization_clients_org_id").on(
      table.orgId,
    ),
    organizationClientsNamePerOrgUniqueIdx: uniqueIndex(
      "organization_clients_name_per_org_unique_idx",
    ).on(table.orgId, sql`lower(${table.name})`),
  }),
);

export const organizationClientProviders = pgTable(
  "organization_client_providers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clientId: uuid("client_id")
      .notNull()
      .references(() => organizationClients.id, { onDelete: "cascade" }),
    provider: organizationClientProviderEnum("provider").notNull(),
    providerClientId: varchar("provider_client_id", { length: 255 }).notNull(),
    providerClientSecretHash: varchar("provider_client_secret_hash", {
      length: 255,
    }).notNull(),
    providerClientSecretSuffix: varchar("provider_client_secret_suffix", {
      length: 16,
    }).notNull(),
    callbackUrl: varchar("callback_url", { length: 500 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
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
    organizationClientProvidersClientIdx: index(
      "idx_organization_client_providers_client_id",
    ).on(table.clientId),
    organizationClientProvidersUniqueProviderPerClientIdx: uniqueIndex(
      "organization_client_providers_unique_provider_per_client_idx",
    ).on(table.clientId, table.provider),
  }),
);

export const organizationClientsRelations = relations(
  organizationClients,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [organizationClients.orgId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [organizationClients.createdByUserId],
      references: [users.id],
      relationName: "organization_client_created_by_user",
    }),
    updatedByUser: one(users, {
      fields: [organizationClients.updatedByUserId],
      references: [users.id],
      relationName: "organization_client_updated_by_user",
    }),
    providers: many(organizationClientProviders),
  }),
);

export const organizationClientProvidersRelations = relations(
  organizationClientProviders,
  ({ one }) => ({
    client: one(organizationClients, {
      fields: [organizationClientProviders.clientId],
      references: [organizationClients.id],
    }),
    createdByUser: one(users, {
      fields: [organizationClientProviders.createdByUserId],
      references: [users.id],
      relationName: "organization_client_provider_created_by_user",
    }),
    updatedByUser: one(users, {
      fields: [organizationClientProviders.updatedByUserId],
      references: [users.id],
      relationName: "organization_client_provider_updated_by_user",
    }),
  }),
);
