import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseEnv } from "./env";
import * as schema from "./schema";

const env = getDatabaseEnv();

export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema,
});

export type Database = typeof db;

export async function closeDatabase(): Promise<void> {
  await queryClient.end();
}
