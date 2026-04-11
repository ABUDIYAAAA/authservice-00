import { z } from "zod";

export const updateMeSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    avatarUrl: z.string().url().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });
