import { createServerFn } from "@tanstack/react-start";

export const loadOrigin = createServerFn({ method: "GET" }).handler(
  async () => {
    const { env } = await import("cloudflare:workers");
    return env.PUBLIC_HOST ? `https://${env.PUBLIC_HOST}` : "";
  },
);
