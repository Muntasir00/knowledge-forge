import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "knowledge-forge-api",
    runtime: "bun",
    timestamp: new Date().toISOString(),
  });
});

export default {
  port: Number(process.env.PORT ?? 4000),
  fetch: app.fetch,
};
