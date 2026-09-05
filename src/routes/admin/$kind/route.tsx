import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isKind } from "../../../admin/nav";

export const Route = createFileRoute("/admin/$kind")({
  beforeLoad: ({ params }) => {
    if (!isKind(params.kind)) throw notFound();
  },
  component: Outlet,
});
