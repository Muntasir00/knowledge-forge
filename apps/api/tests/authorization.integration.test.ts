import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  db,
  queryClient,
  sql,
  users,
  workspaceMembers,
  workspaces,
} from "@knowledge-forge/db";

import { requireWorkspaceMembership } from "../src/auth/authorization";

beforeEach(async () => {
  await db.execute(sql`
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
  await queryClient.end();
});

async function createUserAndWorkspace(email: string, workspaceName: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: email,
      passwordHash: "test-hash",
    })
    .returning();

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: workspaceName,
      slug: `${workspaceName.toLowerCase()}-${crypto.randomUUID()}`,
      createdBy: user.id,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  return {
    user,
    workspace,
  };
}

describe("workspace authorization", () => {
  test("allows a workspace member", async () => {
    const { user, workspace } = await createUserAndWorkspace(
      "owner@example.com",
      "Owner Workspace",
    );

    const membership = await requireWorkspaceMembership(workspace.id, user.id);

    expect(membership.role).toBe("owner");
  });

  test("rejects access from another tenant", async () => {
    const first = await createUserAndWorkspace(
      "first@example.com",
      "First Workspace",
    );

    const second = await createUserAndWorkspace(
      "second@example.com",
      "Second Workspace",
    );

    expect(
      requireWorkspaceMembership(first.workspace.id, second.user.id),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("rejects member-only role for admin operation", async () => {
    const owner = await createUserAndWorkspace(
      "admin@example.com",
      "Admin Workspace",
    );

    const [member] = await db
      .insert(users)
      .values({
        email: "member@example.com",
        name: "Member",
        passwordHash: "test-hash",
      })
      .returning();

    await db.insert(workspaceMembers).values({
      workspaceId: owner.workspace.id,
      userId: member.id,
      role: "member",
    });

    expect(
      requireWorkspaceMembership(owner.workspace.id, member.id, [
        "owner",
        "admin",
      ]),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
