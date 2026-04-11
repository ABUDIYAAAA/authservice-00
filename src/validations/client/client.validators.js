import { z } from "zod";
import { CLIENT_ALLOWED_PROVIDERS } from "../../modules/client/client.constants.js";

const providerSchema = z.enum(CLIENT_ALLOWED_PROVIDERS);

export const organizationClientParamSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export const organizationClientProviderParamSchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  provider: providerSchema,
});

export const createOrganizationClientSchema = z.object({
  name: z.string().trim().min(2).max(255),
  authorizedOrigins: z.array(z.string().url()).max(30).default([]),
});

export const updateOrganizationClientSchema = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    authorizedOrigins: z.array(z.string().url()).max(30).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const createOrganizationClientProviderSchema = z.object({
  provider: providerSchema,
  providerClientId: z.string().trim().min(1).max(255),
  providerClientSecret: z.string().min(8).max(255),
});

export const updateOrganizationClientProviderSchema = z
  .object({
    providerClientId: z.string().trim().min(1).max(255).optional(),
    providerClientSecret: z.string().min(8).max(255).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });
