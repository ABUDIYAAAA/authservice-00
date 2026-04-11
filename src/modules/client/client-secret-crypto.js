import crypto from "node:crypto";
import fs from "node:fs";
import env from "../../core/config/config.js";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const ENCRYPTION_KEY_BYTES = 32;

let cachedKey;

const decodeConfiguredKey = (rawKey) => {
  const base64 = Buffer.from(rawKey, "base64");
  if (base64.length === ENCRYPTION_KEY_BYTES) {
    return base64;
  }

  const hex = Buffer.from(rawKey, "hex");
  if (hex.length === ENCRYPTION_KEY_BYTES) {
    return hex;
  }

  throw new Error(
    "OAUTH_CLIENT_SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes",
  );
};

const deriveKeyFromSigningMaterial = () => {
  const accessPrivateKey = fs.readFileSync(env.ACCESS_TOKEN_PRIVATE_KEY_PATH);
  const refreshPrivateKey = fs.readFileSync(env.REFRESH_TOKEN_PRIVATE_KEY_PATH);

  return crypto
    .createHash("sha256")
    .update(accessPrivateKey)
    .update(refreshPrivateKey)
    .digest();
};

const getEncryptionKey = () => {
  if (cachedKey) {
    return cachedKey;
  }

  cachedKey = env.OAUTH_CLIENT_SECRET_ENCRYPTION_KEY
    ? decodeConfiguredKey(env.OAUTH_CLIENT_SECRET_ENCRYPTION_KEY)
    : deriveKeyFromSigningMaterial();

  return cachedKey;
};

export const encryptClientSecret = (plainSecret) => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    iv,
    { authTagLength: AUTH_TAG_BYTES },
  );

  const encrypted = Buffer.concat([
    cipher.update(plainSecret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
};

export const decryptClientSecret = (ciphertext) => {
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(".");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted client secret payload");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    iv,
    { authTagLength: AUTH_TAG_BYTES },
  );
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
};
