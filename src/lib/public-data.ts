import { createServerFn } from "@tanstack/react-start";
export const loadPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    const [{ env }, { publicData }] = await Promise.all([
      import("cloudflare:workers"),
      import("../server/store"),
    ]);
    return publicData(env);
  },
);
