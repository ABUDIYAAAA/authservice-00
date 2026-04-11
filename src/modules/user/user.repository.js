import { eq } from "drizzle-orm";
import db from "../../db/client/db.js";
import { users } from "../../db/schemas/index.js";

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

export const deleteUserById = async (id, tx = db) => {
  const [deleted] = await tx.delete(users).where(eq(users.id, id)).returning();
  return deleted || null;
};
