import {
  db,
  eq,
  sessions,
  users,
  workspaceMembers,
  workspaces,
} from "@knowledge-forge/db";
import { loginInputSchema, registerInputSchema } from "@knowledge-forge/shared";
import { TRPCError } from "@trpc/server";

import { clearSessionCookie, setSessionCookie } from "../auth/cookie";
import {
  createSessionExpiration,
  generateSessionToken,
  hashSessionToken,
} from "../auth/session";
import { env } from "../env";
import { protectedProcedure, publicProcedure, router } from "../trpc/init";
import { createSlug } from "../utils/slug";

export const authRouter = router({
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await Bun.password.hash(input.password, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 2,
      });

      const rawSessionToken = generateSessionToken();
      const sessionTokenHash = hashSessionToken(rawSessionToken);
      const expiresAt = createSessionExpiration(env.SESSION_TTL_DAYS);

      try {
        const result = await db.transaction(async tx => {
          const [user] = await tx
            .insert(users)
            .values({
              email: input.email,
              name: input.name,
              passwordHash,
            })
            .returning({
              id: users.id,
              email: users.email,
              name: users.name,
            });

          const [workspace] = await tx
            .insert(workspaces)
            .values({
              name: input.workspaceName,
              slug: createSlug(input.workspaceName),
              createdBy: user.id,
            })
            .returning({
              id: workspaces.id,
              name: workspaces.name,
              slug: workspaces.slug,
            });

          await tx.insert(workspaceMembers).values({
            workspaceId: workspace.id,
            userId: user.id,
            role: "owner",
          });

          await tx.insert(sessions).values({
            userId: user.id,
            tokenHash: sessionTokenHash,
            expiresAt,
          });

          return {
            user,
            workspace,
          };
        });

        setSessionCookie(ctx.hono, rawSessionToken, expiresAt);

        return result;
      } catch (error) {
        const databaseError = error as {
          code?: string;
        };

        if (databaseError.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Account or workspace already exists",
          });
        }

        throw error;
      }
    }),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email or password is incorrect",
        });
      }

      const passwordMatches = await Bun.password.verify(
        input.password,
        user.passwordHash,
      );

      if (!passwordMatches) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email or password is incorrect",
        });
      }

      const rawSessionToken = generateSessionToken();
      const tokenHash = hashSessionToken(rawSessionToken);
      const expiresAt = createSessionExpiration(env.SESSION_TTL_DAYS);

      await db.insert(sessions).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      setSessionCookie(ctx.hono, rawSessionToken, expiresAt);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await db.delete(sessions).where(eq(sessions.id, ctx.session.id));

    clearSessionCookie(ctx.hono);

    return {
      success: true,
    };
  }),

  logoutAll: protectedProcedure.mutation(async ({ ctx }) => {
    await db.delete(sessions).where(eq(sessions.userId, ctx.user.id));

    clearSessionCookie(ctx.hono);

    return {
      success: true,
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: {
        expiresAt: ctx.session.expiresAt,
      },
    };
  }),
});
