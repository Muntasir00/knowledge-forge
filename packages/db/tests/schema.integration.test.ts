import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  knowledgeBases,
  users,
  workspaceMembers,
  workspaces,
} from "../src/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for integration tests");
}

const client = postgres(databaseUrl, {
  max: 1,
});

const testDb = drizzle(client);

beforeEach(async () => {
  await testDb.execute(sql`
    TRUNCATE TABLE
      usage_records,
      messages,
      conversations,
      ingestion_jobs,
      document_chunks,
      documents,
      knowledge_bases,
      workspace_members,
      sessions,
      workspaces,
      users
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await client.end();
});

describe("database schema", () => {
  test("creates a user, workspace and knowledge base", async () => {
    const [user] = await testDb
      .insert(users)
      .values({
        email: "owner@example.com",
        name: "Workspace Owner",
        passwordHash: "test-password-hash",
      })
      .returning();

    const [workspace] = await testDb
      .insert(workspaces)
      .values({
        name: "Test Workspace",
        slug: "test-workspace",
        createdBy: user.id,
      })
      .returning();

    await testDb.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    });

    const [knowledgeBase] = await testDb
      .insert(knowledgeBases)
      .values({
        workspaceId: workspace.id,
        name: "Engineering Documentation",
      })
      .returning();

    expect(knowledgeBase.workspaceId).toBe(workspace.id);

    const memberships = await testDb
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));

    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role).toBe("owner");
  });

  test("rejects duplicate user emails", async () => {
    const value = {
      email: "duplicate@example.com",
      name: "Duplicate User",
      passwordHash: "test-password-hash",
    };

    await testDb.insert(users).values(value);

    expect(testDb.insert(users).values(value)).rejects.toThrow();
  });

  test("deletes memberships when a workspace is deleted", async () => {
    const [user] = await testDb
      .insert(users)
      .values({
        email: "cascade@example.com",
        name: "Cascade User",
        passwordHash: "test-password-hash",
      })
      .returning();

    const [workspace] = await testDb
      .insert(workspaces)
      .values({
        name: "Cascade Workspace",
        slug: "cascade-workspace",
        createdBy: user.id,
      })
      .returning();

    await testDb.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    });

    await testDb.delete(workspaces).where(eq(workspaces.id, workspace.id));

    const memberships = await testDb
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id));

    expect(memberships).toHaveLength(0);
  });

  test("has the pgvector extension installed", async () => {
    const result = await testDb.execute<{
      extname: string;
    }>(sql`
      SELECT extname
      FROM pg_extension
      WHERE extname = 'vector'
    `);

    expect(result[0]?.extname).toBe("vector");
  });
});
