import { and, db, eq, workspaceMembers, workspaces } from "@knowledge-forge/db";
import {
  createWorkspaceInputSchema,
  updateWorkspaceInputSchema,
  workspaceIdSchema,
} from "@knowledge-forge/shared";

import { requireWorkspaceMembership } from "../auth/authorization";
import { protectedProcedure, router } from "../trpc/init";
import { createSlug } from "../utils/slug";

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        role: workspaceMembers.role,
        createdAt: workspaces.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, ctx.user.id));
  }),

  byId: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ ctx, input }) => {
      const membership = await requireWorkspaceMembership(
        input.workspaceId,
        ctx.user.id,
      );

      const [workspace] = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaces)
        .where(eq(workspaces.id, input.workspaceId))
        .limit(1);

      return {
        ...workspace,
        role: membership.role,
      };
    }),

  create: protectedProcedure
    .input(createWorkspaceInputSchema)
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async tx => {
        const [workspace] = await tx
          .insert(workspaces)
          .values({
            name: input.name,
            slug: createSlug(input.name),
            createdBy: ctx.user.id,
          })
          .returning();

        await tx.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId: ctx.user.id,
          role: "owner",
        });

        return workspace;
      });
    }),

  update: protectedProcedure
    .input(updateWorkspaceInputSchema)
    .mutation(async ({ ctx, input }) => {
      await requireWorkspaceMembership(input.workspaceId, ctx.user.id, [
        "owner",
        "admin",
      ]);

      const [workspace] = await db
        .update(workspaces)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, input.workspaceId))
        .returning();

      return workspace;
    }),

  members: protectedProcedure
    .input(workspaceIdSchema)
    .query(async ({ ctx, input }) => {
      await requireWorkspaceMembership(input.workspaceId, ctx.user.id);

      return db
        .select({
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          joinedAt: workspaceMembers.createdAt,
        })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, input.workspaceId)));
    }),
});
