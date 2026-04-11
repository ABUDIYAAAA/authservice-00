import { z } from "zod";

const passwordComplexity =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordComplexity, {
    message:
      "Password must be at least 8 characters and include upper, lower, number, and symbol",
  }),
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  orgId: z.string().uuid().optional(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().regex(passwordComplexity, {
    message:
      "Password must be at least 8 characters and include upper, lower, number, and symbol",
  }),
});
