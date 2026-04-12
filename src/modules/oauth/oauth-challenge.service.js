import crypto from "node:crypto";
import db from "../../db/client/db.js";
import env from "../../core/config/config.js";
import {
  oauthReloginChallenges,
  oauthReloginRequirements,
} from "../../db/schemas/index.js";
import { and, eq, gt } from "drizzle-orm";

export const setReloginConfirmationRequirement = async ({
  orgId,
  clientId,
  userId,
  clientContext,
}) => {
  const expiresAt = new Date(
    Date.now() + env.OAUTH_RELOGIN_REQUIREMENT_TTL_SECONDS * 1000,
  );

  await db
    .insert(oauthReloginRequirements)
    .values({
      orgId,
      clientId,
      userId,
      clientContext: clientContext || null,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [
        oauthReloginRequirements.orgId,
        oauthReloginRequirements.clientId,
        oauthReloginRequirements.userId,
      ],
      set: {
        clientContext: clientContext || null,
        expiresAt,
      },
    });
};

export const consumeReloginConfirmationRequirement = async ({
  orgId,
  clientId,
  userId,
}) => {
  const [row] = await db
    .delete(oauthReloginRequirements)
    .where(
      and(
        eq(oauthReloginRequirements.orgId, orgId),
        eq(oauthReloginRequirements.clientId, clientId),
        eq(oauthReloginRequirements.userId, userId),
        gt(oauthReloginRequirements.expiresAt, new Date()),
      ),
    )
    .returning();

  return row || null;
};

export const createReloginChallenge = async (payload) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + env.OAUTH_RELOGIN_CHALLENGE_TTL_SECONDS * 1000,
  );

  await db.insert(oauthReloginChallenges).values({
    token,
    userId: payload.userId,
    sessionId: payload.sessionId,
    sessionVersion: payload.sessionVersion,
    orgId: payload.orgId,
    clientId: payload.clientId,
    flowType: payload.flowType,
    clientContext: payload.clientContext || null,
    redirectTo: payload.redirectTo,
    expiresAt,
  });

  return token;
};

export const consumeReloginChallenge = async (token) => {
  const [row] = await db
    .delete(oauthReloginChallenges)
    .where(
      and(
        eq(oauthReloginChallenges.token, token),
        gt(oauthReloginChallenges.expiresAt, new Date()),
      ),
    )
    .returning();

  return row || null;
};
