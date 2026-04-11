import bcrypt from "bcrypt";
import env from "../../core/config/config.js";

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash);
};
