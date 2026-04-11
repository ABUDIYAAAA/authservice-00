import { notFound } from "../../utils/errors.js";
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
  const user = await deleteUserById(userId);
  if (!user) {
    notFound("User not found");
  }
};
