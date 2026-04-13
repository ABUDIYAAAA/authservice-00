import { eq, sql } from "drizzle-orm";
import db from "../../db/client/db.js";
import { users } from "../../db/schemas/index.js";

export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const findUserByEmail = async (email, tx = db) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const [user] = await tx
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);

  return user || null;
};

export const findUserById = async (id, tx = db) => {
  const [user] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
};

const PROFILE_MUTABLE_FIELDS = ["name", "avatarUrl"];

const pickMutableProfileFields = (payload = {}) => {
  return PROFILE_MUTABLE_FIELDS.reduce((result, field) => {
    if (Object.hasOwn(payload, field)) {
      result[field] = payload[field];
    }

    return result;
  }, {});
};

export const updateUserById = async (id, payload, tx = db) => {
  const safePayload = pickMutableProfileFields(payload);
  if (Object.keys(safePayload).length === 0) {
    return findUserById(id, tx);
  }

  const [updated] = await tx
    .update(users)
    .set({ ...safePayload, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated || null;
};

export const deleteUserById = async (id, tx = db) => {
  const [deleted] = await tx.delete(users).where(eq(users.id, id)).returning();
  return deleted || null;
};
