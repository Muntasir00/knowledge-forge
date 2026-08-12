import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

const envPath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../.env",
);
config({ path: envPath });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type DatabaseEnv = z.infer<typeof envSchema>;

export function getDatabaseEnv(): DatabaseEnv {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
}
