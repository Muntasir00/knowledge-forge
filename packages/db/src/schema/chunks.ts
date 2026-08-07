import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { documents, knowledgeBases } from "./knowledge";
import { workspaces } from "./workspaces";

export type ChunkMetadata = {
  page?: number;
  section?: string;
  startCharacter?: number;
  endCharacter?: number;
};

export const documentChunks = pgTable(
  "document_chunks",
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

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
      }),

    chunkIndex: integer("chunk_index").notNull(),

    content: text("content").notNull(),

    tokenCount: integer("token_count"),

    embedding: vector("embedding", {
      dimensions: 1536,
    }),

    metadata: jsonb("metadata").$type<ChunkMetadata>().default({}).notNull(),

    ...timestamps,
  },
  table => [
    index("document_chunks_workspace_id_idx").on(table.workspaceId),

    index("document_chunks_knowledge_base_id_idx").on(table.knowledgeBaseId),

    index("document_chunks_document_id_idx").on(table.documentId),

    uniqueIndex("document_chunks_document_position_unique").on(
      table.documentId,
      table.chunkIndex,
    ),

    index("document_chunks_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
