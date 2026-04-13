import db from "../../db/client/db.js";
import { notFound } from "../../utils/errors.js";
import { revokeAllSessionsByUserId } from "../auth/auth.repository.js";
import { deleteOauthStatesForUserId } from "../oauth/oauth-state.service.js";
import {
  deleteUserById,
  findUserById,
  updateUserById,
} from "./user.repository.js";

const sanitizeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const getMe = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    notFound("User not found");
  }

  return sanitizeUser(user);
};

export const updateMe = async (userId, payload) => {
  const user = await updateUserById(userId, payload);
  if (!user) {
    notFound("User not found");
  }

  return sanitizeUser(user);
};

export const deleteMe = async (userId) => {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    notFound("User not found");
  }

  await deleteOauthStatesForUserId(userId);

  const user = await db.transaction(async (tx) => {
    await revokeAllSessionsByUserId(userId, tx);
    return deleteUserById(userId, tx);
  });

  if (!user) {
    notFound("User not found");
  }
};
