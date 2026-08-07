import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type DatabaseEnv = z.infer<typeof envSchema>;

export function getDatabaseEnv(): DatabaseEnv {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
}
