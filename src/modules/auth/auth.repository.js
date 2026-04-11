import { and, desc, eq, gt, isNull } from "drizzle-orm";
import db from "../../db/client/db.js";
import {
  emailVerificationTokens,
  passwordResetTokens,
  sessions,
  users,
} from "../../db/schemas/index.js";

export const createUser = async (payload, tx = db) => {
  const [created] = await tx.insert(users).values(payload).returning();
  return created;
};

export const findUserByEmail = async (email, tx = db) => {
  const [user] = await tx
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user || null;
};

export const findUserById = async (id, tx = db) => {
  const [user] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
};

export const updateUserById = async (id, payload, tx = db) => {
  const [updated] = await tx
    .update(users)
    .set({ ...payload, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated || null;
};

export const createSession = async (payload, tx = db) => {
  const [created] = await tx.insert(sessions).values(payload).returning();
  return created;
};

export const findSessionById = async (sessionId, tx = db) => {
  const [session] = await tx
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return session || null;
};

export const findSessionByUserAndDevice = async (userId, deviceId, tx = db) => {
  const [session] = await tx
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.deviceId, deviceId),
        eq(sessions.isActive, true),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(sessions.lastActivityAt))
    .limit(1);

  return session || null;
};

export const listActiveSessionsByUserId = async (userId, tx = db) => {
  return tx
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.isActive, true),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(sessions.lastActivityAt));
};

export const revokeSessionById = async (userId, sessionId, tx = db) => {
  const [updated] = await tx
    .update(sessions)
    .set({ isActive: false, lastActivityAt: new Date() })
    .where(and(eq(sessions.userId, userId), eq(sessions.id, sessionId)))
    .returning();

  return updated || null;
};

export const revokeAllSessionsByUserId = async (userId, tx = db) => {
  return tx
    .update(sessions)
    .set({ isActive: false, lastActivityAt: new Date() })
    .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)));
};

export const rotateSessionVersion = async (
  sessionId,
  expectedVersion,
  tx = db,
) => {
  const [updated] = await tx
    .update(sessions)
    .set({
      version: expectedVersion + 1,
      lastActivityAt: new Date(),
    })
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.version, expectedVersion),
        eq(sessions.isActive, true),
      ),
    )
    .returning();

  return updated || null;
};

export const createEmailVerificationToken = async (payload, tx = db) => {
  const [created] = await tx
    .insert(emailVerificationTokens)
    .values(payload)
    .returning();
  return created;
};

export const findValidEmailVerificationToken = async (token, tx = db) => {
  const [record] = await tx
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date()),
        isNull(emailVerificationTokens.usedAt),
      ),
    )
    .limit(1);

  return record || null;
};

export const markEmailVerificationTokenUsed = async (id, tx = db) => {
  const [updated] = await tx
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, id))
    .returning();
  return updated || null;
};

export const createPasswordResetToken = async (payload, tx = db) => {
  const [created] = await tx
    .insert(passwordResetTokens)
    .values(payload)
    .returning();
  return created;
};

export const findValidPasswordResetToken = async (token, tx = db) => {
  const [record] = await tx
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  return record || null;
};

export const markPasswordResetTokenUsed = async (id, tx = db) => {
  const [updated] = await tx
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, id))
    .returning();

  return updated || null;
};
