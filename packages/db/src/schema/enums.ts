import { pgEnum } from "drizzle-orm/pg-core";

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const ingestionJobStatusEnum = pgEnum("ingestion_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "dead_letter",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "system",
  "user",
  "assistant",
  "tool",
]);

export const usageTypeEnum = pgEnum("usage_type", [
  "embedding",
  "chat_completion",
  "document_processing",
]);
