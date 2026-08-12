import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  WEB_URL: z.url().default("http://localhost:3000"),

  PORT: z.coerce.number().int().positive().default(4000),

  SESSION_COOKIE_NAME: z.string().min(1).default("kf_session"),

  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  WEB_URL: process.env.WEB_URL,
  PORT: process.env.PORT,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS: process.env.SESSION_TTL_DAYS,
});
