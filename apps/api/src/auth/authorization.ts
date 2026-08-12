import { TRPCError } from "@trpc/server";

import { findWorkspaceMembership } from "../trpc/context";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export async function requireWorkspaceMembership(
  workspaceId: string,
  userId: string,
  allowedRoles?: WorkspaceRole[],
) {
  const membership = await findWorkspaceMembership(workspaceId, userId);

  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Workspace was not found",
    });
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }

  return membership;
}
