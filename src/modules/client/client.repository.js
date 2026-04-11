import { and, asc, eq, sql } from "drizzle-orm";
import db from "../../db/client/db.js";
import {
  organizationClientProviders,
  organizationClients,
} from "../../db/schemas/index.js";

export const createOrganizationClient = async (payload, tx = db) => {
  const [created] = await tx
    .insert(organizationClients)
    .values(payload)
    .returning();

  return created;
};

export const findOrganizationClientById = async (orgId, clientId, tx = db) => {
  const [client] = await tx
    .select()
    .from(organizationClients)
    .where(
      and(
        eq(organizationClients.orgId, orgId),
        eq(organizationClients.id, clientId),
      ),
    )
    .limit(1);

  return client || null;
};

export const findOrganizationClientByNormalizedName = async (
  orgId,
  normalizedName,
  tx = db,
) => {
  const [client] = await tx
    .select()
    .from(organizationClients)
    .where(
      and(
        eq(organizationClients.orgId, orgId),
        sql`lower(${organizationClients.name}) = ${normalizedName}`,
      ),
    )
    .limit(1);

  return client || null;
};

export const listOrganizationClientsByOrgId = async (orgId, tx = db) => {
  return tx
    .select()
    .from(organizationClients)
    .where(eq(organizationClients.orgId, orgId))
    .orderBy(asc(organizationClients.createdAt));
};

export const updateOrganizationClientById = async (
  orgId,
  clientId,
  payload,
  tx = db,
) => {
  const [updated] = await tx
    .update(organizationClients)
    .set({ ...payload, updatedAt: new Date() })
    .where(
      and(
        eq(organizationClients.orgId, orgId),
        eq(organizationClients.id, clientId),
      ),
    )
    .returning();

  return updated || null;
};

export const deleteOrganizationClientById = async (
  orgId,
  clientId,
  tx = db,
) => {
  const [deleted] = await tx
    .delete(organizationClients)
    .where(
      and(
        eq(organizationClients.orgId, orgId),
        eq(organizationClients.id, clientId),
      ),
    )
    .returning();

  return deleted || null;
};

export const createOrganizationClientProvider = async (payload, tx = db) => {
  const [created] = await tx
    .insert(organizationClientProviders)
    .values(payload)
    .returning();

  return created;
};

export const findOrganizationClientProvider = async (
  clientId,
  provider,
  tx = db,
) => {
  const [clientProvider] = await tx
    .select()
    .from(organizationClientProviders)
    .where(
      and(
        eq(organizationClientProviders.clientId, clientId),
        eq(organizationClientProviders.provider, provider),
      ),
    )
    .limit(1);

  return clientProvider || null;
};

export const listOrganizationClientProviders = async (clientId, tx = db) => {
  return tx
    .select()
    .from(organizationClientProviders)
    .where(eq(organizationClientProviders.clientId, clientId))
    .orderBy(asc(organizationClientProviders.createdAt));
};

export const listOrganizationClientProvidersByOrgId = async (
  orgId,
  tx = db,
) => {
  return tx
    .select({
      id: organizationClientProviders.id,
      clientId: organizationClientProviders.clientId,
      provider: organizationClientProviders.provider,
      providerClientId: organizationClientProviders.providerClientId,
      providerClientSecretHash:
        organizationClientProviders.providerClientSecretHash,
      providerClientSecretSuffix:
        organizationClientProviders.providerClientSecretSuffix,
      callbackUrl: organizationClientProviders.callbackUrl,
      isActive: organizationClientProviders.isActive,
      createdByUserId: organizationClientProviders.createdByUserId,
      updatedByUserId: organizationClientProviders.updatedByUserId,
      createdAt: organizationClientProviders.createdAt,
      updatedAt: organizationClientProviders.updatedAt,
    })
    .from(organizationClientProviders)
    .innerJoin(
      organizationClients,
      eq(organizationClients.id, organizationClientProviders.clientId),
    )
    .where(eq(organizationClients.orgId, orgId))
    .orderBy(asc(organizationClientProviders.createdAt));
};

export const updateOrganizationClientProvider = async (
  clientId,
  provider,
  payload,
  tx = db,
) => {
  const [updated] = await tx
    .update(organizationClientProviders)
    .set({ ...payload, updatedAt: new Date() })
    .where(
      and(
        eq(organizationClientProviders.clientId, clientId),
        eq(organizationClientProviders.provider, provider),
      ),
    )
    .returning();

  return updated || null;
};

export const deleteOrganizationClientProvider = async (
  clientId,
  provider,
  tx = db,
) => {
  const [deleted] = await tx
    .delete(organizationClientProviders)
    .where(
      and(
        eq(organizationClientProviders.clientId, clientId),
        eq(organizationClientProviders.provider, provider),
      ),
    )
    .returning();

  return deleted || null;
};
