import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadPublic } from "../../lib/public-data";
import { loadOrigin } from "../../lib/public-origin";

export const Route = createFileRoute("/_public")({
  loader: async () => {
    const [data, origin] = await Promise.all([loadPublic(), loadOrigin()]);
    return { ...data, origin };
  },
  staleTime: 60_000,
  component: Outlet,
});
