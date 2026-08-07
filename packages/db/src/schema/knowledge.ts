import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documentStatusEnum } from "./enums";
import { timestamps } from "./helpers";
import { workspaces } from "./workspaces";

export type DocumentMetadata = {
  originalName?: string;
  mimeType?: string;
  pageCount?: number;
  language?: string;
};

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    description: text("description"),

    ...timestamps,
  },
  table => [
    index("knowledge_bases_workspace_id_idx").on(table.workspaceId),

    uniqueIndex("knowledge_bases_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, {
        onDelete: "cascade",
      }),

    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    storageKey: text("storage_key").notNull(),

    checksum: varchar("checksum", {
      length: 64,
    }).notNull(),

    mimeType: varchar("mime_type", {
      length: 100,
    }).notNull(),

    sizeBytes: bigint("size_bytes", {
      mode: "number",
    }).notNull(),

    status: documentStatusEnum("status").default("pending").notNull(),

    errorMessage: text("error_message"),

    chunkCount: integer("chunk_count").default(0).notNull(),

    metadata: jsonb("metadata").$type<DocumentMetadata>().default({}).notNull(),

    ...timestamps,
  },
  table => [
    index("documents_workspace_id_idx").on(table.workspaceId),
    index("documents_knowledge_base_id_idx").on(table.knowledgeBaseId),
    index("documents_status_idx").on(table.status),

    uniqueIndex("documents_workspace_checksum_unique").on(
      table.workspaceId,
      table.checksum,
    ),
  ],
);
