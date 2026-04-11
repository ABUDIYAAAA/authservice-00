import crypto from "node:crypto";
import db from "../../db/client/db.js";
import env from "../../core/config/config.js";
import { conflict, notFound, unauthorized } from "../../utils/errors.js";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createUser,
  findSessionByUserAndDevice,
  findUserByEmail,
  findUserById,
  listActiveSessionsByUserId,
  markEmailVerificationTokenUsed,
  markPasswordResetTokenUsed,
  findValidEmailVerificationToken,
  findValidPasswordResetToken,
  revokeAllSessionsByUserId,
  updateUserById,
} from "./auth.repository.js";
import { comparePassword, hashPassword } from "./password.service.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service.js";
import {
  createUserSession,
  findSession,
  rotateSession,
  revokeSession,
} from "./session.service.js";
import { deviceAlertQueue } from "../../queues/index.js";
import { queueEmailJob } from "../email/email.queue.js";
import {
  emailVerificationTemplate,
  newDeviceAlertTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from "../email/email.templates.js";

const generateOneTimeToken = () => crypto.randomBytes(32).toString("hex");

const issueAuthTokens = ({ userId, sessionId, sessionVersion }) => {
  const payload = {
    sub: userId,
    sid: sessionId,
    ver: sessionVersion,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

const sanitizeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const signup = async (input, deviceInfo) => {
  const result = await db.transaction(async (tx) => {
    const existing = await findUserByEmail(input.email, tx);
    if (existing) {
      conflict("Email is already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await createUser(
      {
        email: input.email,
        passwordHash,
        name: input.name,
        avatarUrl: input.avatarUrl,
        emailVerified: false,
      },
      tx,
    );

    const verificationToken = generateOneTimeToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await createEmailVerificationToken(
      {
        userId: user.id,
        token: verificationToken,
        email: user.email,
        expiresAt,
      },
      tx,
    );

    const session = await createUserSession(
      {
        userId: user.id,
        orgId: null,
        deviceId: deviceInfo.deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      },
      tx,
    );

    await updateUserById(user.id, { lastLoginAt: new Date() }, tx);

    return {
      user,
      session,
      verificationToken,
    };
  });

  const verificationUrl = `${env.API_BASE_URL}/api/auth/verify-email/${result.verificationToken}`;

  await Promise.all([
    queueEmailJob({
      to: result.user.email,
      subject: "Welcome to Auth Service",
      html: welcomeTemplate({ name: result.user.name }),
    }),
    queueEmailJob({
      to: result.user.email,
      subject: "Verify your email",
      html: emailVerificationTemplate({ verifyUrl: verificationUrl }),
    }),
  ]);

  const tokens = issueAuthTokens({
    userId: result.user.id,
    sessionId: result.session.id,
    sessionVersion: result.session.version,
  });

  return {
    ...tokens,
    user: sanitizeUser(result.user),
    session: result.session,
  };
};

export const login = async (input, deviceInfo) => {
  const user = await findUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    unauthorized("Invalid email or password");
  }

  const matches = await comparePassword(input.password, user.passwordHash);
  if (!matches) {
    unauthorized("Invalid email or password");
  }

  const knownDevice = await findSessionByUserAndDevice(
    user.id,
    deviceInfo.deviceId,
  );

  const session = await createUserSession({
    userId: user.id,
    orgId: input.orgId || null,
    deviceId: deviceInfo.deviceId,
    userAgent: deviceInfo.userAgent,
    ipAddress: deviceInfo.ipAddress,
  });

  await updateUserById(user.id, { lastLoginAt: new Date() });

  if (!knownDevice) {
    await deviceAlertQueue.add("new-device-alert", {
      userId: user.id,
      email: user.email,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
    });

    await queueEmailJob({
      to: user.email,
      subject: "New device login detected",
      html: newDeviceAlertTemplate({
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        loggedInAt: new Date().toISOString(),
      }),
    });
  }

  const tokens = issueAuthTokens({
    userId: user.id,
    sessionId: session.id,
    sessionVersion: session.version,
  });

  return {
    ...tokens,
    user: sanitizeUser(user),
    session,
  };
};

export const logout = async ({ userId, sessionId }) => {
  const revoked = await revokeSession(userId, sessionId);
  if (!revoked) {
    notFound("Session not found");
  }
};

export const refreshAuth = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);

  const currentSession = await findSession(payload.sid);
  if (!currentSession || !currentSession.isActive) {
    unauthorized("Session is no longer active");
  }

  if (new Date(currentSession.expiresAt).getTime() <= Date.now()) {
    unauthorized("Session has expired");
  }

  if (currentSession.version !== payload.ver) {
    unauthorized("Session token version mismatch");
  }

  const rotated = await rotateSession(
    currentSession.id,
    currentSession.version,
  );
  if (!rotated) {
    unauthorized("Session refresh failed");
  }

  const tokens = issueAuthTokens({
    userId: payload.sub,
    sessionId: rotated.id,
    sessionVersion: rotated.version,
  });

  return {
    ...tokens,
    session: rotated,
  };
};

export const verifyEmail = async (token) => {
  const verificationRecord = await findValidEmailVerificationToken(token);
  if (!verificationRecord) {
    unauthorized("Invalid or expired verification token");
  }

  await db.transaction(async (tx) => {
    await markEmailVerificationTokenUsed(verificationRecord.id, tx);
    await updateUserById(
      verificationRecord.userId,
      { emailVerified: true },
      tx,
    );
  });
};

export const resendVerificationEmail = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }

  if (user.emailVerified) {
    return;
  }

  const token = generateOneTimeToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await createEmailVerificationToken({
    userId: user.id,
    email,
    token,
    expiresAt,
  });

  await queueEmailJob({
    to: email,
    subject: "Verify your email",
    html: emailVerificationTemplate({
      verifyUrl: `${env.API_BASE_URL}/api/auth/verify-email/${token}`,
    }),
  });
};

export const forgotPassword = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }

  const token = generateOneTimeToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await createPasswordResetToken({
    userId: user.id,
    token,
    expiresAt,
  });

  await queueEmailJob({
    to: user.email,
    subject: "Reset your password",
    html: passwordResetTemplate({
      resetUrl: `${env.FRONTEND_URL}/reset-password?token=${token}`,
    }),
  });
};

export const resetPassword = async ({ token, password }) => {
  const resetRecord = await findValidPasswordResetToken(token);
  if (!resetRecord) {
    unauthorized("Invalid or expired reset token");
  }

  await db.transaction(async (tx) => {
    const passwordHash = await hashPassword(password);

    await markPasswordResetTokenUsed(resetRecord.id, tx);
    await updateUserById(resetRecord.userId, { passwordHash }, tx);
    await revokeAllSessionsByUserId(resetRecord.userId, tx);
  });

  const user = await findUserById(resetRecord.userId);
  if (user) {
    await queueEmailJob({
      to: user.email,
      subject: "Your password has changed",
      html: passwordChangedTemplate({ changedAt: new Date().toISOString() }),
    });
  }
};

export const getUserSessions = async (userId) => {
  return listActiveSessionsByUserId(userId);
};

export const revokeUserSession = async (userId, sessionId) => {
  const session = await revokeSession(userId, sessionId);
  if (!session) {
    notFound("Session not found");
  }
};
