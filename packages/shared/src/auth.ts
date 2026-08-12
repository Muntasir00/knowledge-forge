import { z } from "zod";

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(120),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(320)
    .transform((email) => email.toLowerCase()),

  password: z.string().min(12, "Password must contain at least 12 characters").max(128),

  workspaceName: z
    .string()
    .trim()
    .min(2, "Workspace name must contain at least 2 characters")
    .max(120),
});

export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),

  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
