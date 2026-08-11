import { httpBatchLink } from "@trpc/client";

import { trpc } from "./trpc";

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: import.meta.env.VITE_API_URL ?? "http://localhost:4000/trpc",

        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
