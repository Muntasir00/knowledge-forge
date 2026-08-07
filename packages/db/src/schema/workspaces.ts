import {
  index,
  pgTable,
  primaryKey,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { workspaceRoleEnum } from "./enums";
import { timestamps } from "./helpers";

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    slug: varchar("slug", {
      length: 80,
    }).notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    ...timestamps,
  },
  table => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    index("workspaces_created_by_idx").on(table.createdBy),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    role: workspaceRoleEnum("role").default("member").notNull(),

    ...timestamps,
  },
  table => [
    primaryKey({
      name: "workspace_members_pk",
      columns: [table.workspaceId, table.userId],
    }),
    index("workspace_members_user_id_idx").on(table.userId),
  ],
);
