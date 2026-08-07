import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { messageRoleEnum } from "./enums";
import { timestamps } from "./helpers";
import { knowledgeBases } from "./knowledge";
import { workspaces } from "./workspaces";

export type MessageSource = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  score: number;
  page?: number;
};

export type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  state: "called" | "result" | "error";
  input?: unknown;
  output?: unknown;
};

export const conversations = pgTable(
  "conversations",
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

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", {
      length: 255,
    }),

    ...timestamps,
  },
  table => [
    index("conversations_workspace_id_idx").on(table.workspaceId),
    index("conversations_user_id_idx").on(table.userId),
    index("conversations_knowledge_base_id_idx").on(table.knowledgeBaseId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, {
        onDelete: "cascade",
      }),

    role: messageRoleEnum("role").notNull(),

    content: text("content").notNull(),

    sources: jsonb("sources").$type<MessageSource[]>().default([]).notNull(),

    toolInvocations: jsonb("tool_invocations")
      .$type<ToolInvocation[]>()
      .default([])
      .notNull(),

    model: varchar("model", {
      length: 100,
    }),

    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),

    ...timestamps,
  },
  table => [
    index("messages_conversation_id_idx").on(table.conversationId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);
