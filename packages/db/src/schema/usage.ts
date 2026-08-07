import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { usageTypeEnum } from "./enums";
import { timestamps } from "./helpers";
import { workspaces } from "./workspaces";

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    type: usageTypeEnum("type").notNull(),

    model: varchar("model", {
      length: 100,
    }),

    inputTokens: integer("input_tokens").default(0).notNull(),
    outputTokens: integer("output_tokens").default(0).notNull(),

    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 12,
      scale: 8,
    }).default("0"),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    ...timestamps,
  },
  table => [
    index("usage_records_workspace_created_at_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("usage_records_user_id_idx").on(table.userId),
  ],
);
