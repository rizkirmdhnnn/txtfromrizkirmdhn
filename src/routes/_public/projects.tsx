import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/projects")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: (prev) => prev, statusCode: 301 });
  },
});
