import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { env } from "./env";
import { appRouter } from "./routers";
import { createTrpcContext } from "./trpc/context";

export const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());

app.use(
  "*",
  cors({
    origin: env.WEB_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");

  if (origin && origin !== env.WEB_URL) {
    return c.json(
      {
        error: "Origin is not allowed",
      },
      403,
    );
  }

  await next();
});

app.get("/health", c => {
  return c.json({
    status: "ok",
    service: "knowledge-forge-api",
    runtime: "bun",
    timestamp: new Date().toISOString(),
  });
});

app.all("/trpc/*", async c => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => createTrpcContext(c),
    onError({ path, error }) {
      console.error("tRPC request failed", {
        path,
        code: error.code,
        message: error.message,
      });
    },
  });
});
