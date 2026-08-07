import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: "../../.env.test",
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("Test DATABASE_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
  strict: true,
});
