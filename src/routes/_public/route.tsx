import {
  createFileRoute,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { loadPublic } from "../../lib/public-data";

export const Route = createFileRoute("/_public")({
  // Nilai default sengaja tidak dimaterialkan: kanonikalisasi SSR akan
  // meredirect setiap kunjungan ke bentuk lengkapnya kalau dikembalikan.
  validateSearch: (s: Record<string, unknown>): { lang?: "en" } => ({
    lang: s.lang === "en" ? "en" : undefined,
  }),
  search: { middlewares: [retainSearchParams(["lang"])] },
  loader: () => loadPublic(),
  staleTime: 60_000,
  component: Outlet,
});
