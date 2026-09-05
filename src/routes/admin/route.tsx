import { createFileRoute, Outlet } from "@tanstack/react-router";
import { api } from "../../admin/client";
import { AdminShell } from "../../admin/shell";
import type { CmsDocument, MediaItem } from "../../lib/cms";
import "../../admin/admin.css";

export const Route = createFileRoute("/admin")({
  // Identity pemilik ada pada cookie Access di browser, jadi loader tidak
  // boleh berjalan di server: fetch dari Worker tidak membawa JWT itu.
  ssr: false,
  staleTime: Infinity,
  head: () => ({
    meta: [
      { title: "Studio — Rizki" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    const [documents, media] = await Promise.all([
      api<CmsDocument[]>("documents"),
      api<MediaItem[]>("media"),
    ]);
    return { documents, media };
  },
  pendingComponent: () => (
    <AdminShell>
      <p>Loading your workspace…</p>
    </AdminShell>
  ),
  errorComponent: ({ error }) => (
    <AdminShell>
      <p className="cms-notice" role="alert">
        {error.message}
      </p>
    </AdminShell>
  ),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
