import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "../admin/dashboard";
import "../admin/admin.css";
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Studio — Rizki" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});
