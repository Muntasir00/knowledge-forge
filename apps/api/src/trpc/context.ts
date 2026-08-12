import {
  and,
  db,
  eq,
  gt,
  sessions,
  users,
  workspaceMembers,
} from "@knowledge-forge/db";
import type { Context as HonoContext } from "hono";

import { getSessionCookie } from "../auth/cookie";
import { hashSessionToken } from "../auth/session";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthenticatedSession = {
  id: string;
  expiresAt: Date;
};

export type TrpcContext = {
  hono: HonoContext;
  user: AuthenticatedUser | null;
  session: AuthenticatedSession | null;
};

export async function createTrpcContext(
  hono: HonoContext,
): Promise<TrpcContext> {
  const rawToken = getSessionCookie(hono);

  if (!rawToken) {
    return {
      hono,
      user: null,
      session: null,
    };
  }

  const tokenHash = hashSessionToken(rawToken);

  const [result] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!result) {
    return {
      hono,
      user: null,
      session: null,
    };
  }

  return {
    hono,
    session: {
      id: result.sessionId,
      expiresAt: result.expiresAt,
    },
    user: {
      id: result.userId,
      email: result.email,
      name: result.name,
    },
  };
}

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
};

export async function findWorkspaceMembership(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMembership | null> {
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);

  return membership ?? null;
}
