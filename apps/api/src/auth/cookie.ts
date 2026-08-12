import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { env } from "../env";

export function getSessionCookie(c: Context): string | undefined {
  return getCookie(c, env.SESSION_COOKIE_NAME);
}

export function setSessionCookie(
  c: Context,
  token: string,
  expiresAt: Date,
): void {
  setCookie(c, env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, env.SESSION_COOKIE_NAME, {
    path: "/",
    secure: env.NODE_ENV === "production",
  });
}
