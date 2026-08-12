import { z } from "zod";

export const workspaceIdSchema = z.object({
  workspaceId: z.string().uuid(),
});

export const createWorkspaceInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const updateWorkspaceInputSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
});

export type WorkspaceIdInput = z.infer<typeof workspaceIdSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
