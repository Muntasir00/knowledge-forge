import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { ingestionJobStatusEnum } from "./enums";
import { timestamps } from "./helpers";
import { documents } from "./knowledge";
import { workspaces } from "./workspaces";

export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, {
        onDelete: "cascade",
      }),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
      }),

    status: ingestionJobStatusEnum("status").default("pending").notNull(),

    attempts: integer("attempts").default(0).notNull(),

    maxAttempts: integer("max_attempts").default(3).notNull(),

    lockedAt: timestamp("locked_at", {
      withTimezone: true,
    }),

    lockedBy: text("locked_by"),

    availableAt: timestamp("available_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    lastError: text("last_error"),

    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    ...timestamps,
  },
  table => [
    index("ingestion_jobs_worker_poll_idx").on(table.status, table.availableAt),
    index("ingestion_jobs_document_id_idx").on(table.documentId),
    index("ingestion_jobs_workspace_id_idx").on(table.workspaceId),
  ],
);
