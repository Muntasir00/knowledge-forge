import { router } from "../trpc/init";
import { authRouter } from "./auth.router";
import { workspaceRouter } from "./workspace.router";

export const appRouter = router({
  auth: authRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
