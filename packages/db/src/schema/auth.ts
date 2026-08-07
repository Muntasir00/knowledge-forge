import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./helpers";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", {
      length: 320,
    }).notNull(),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    passwordHash: text("password_hash").notNull(),

    emailVerifiedAt: timestamp("email_verified_at", {
      withTimezone: true,
    }),

    ...timestamps,
  },
  table => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    tokenHash: text("token_hash").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
    }).defaultNow(),

    ...timestamps,
  },
  table => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);
