import {
  createFileRoute,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { loadPublic } from "../../lib/public-data";
import { loadOrigin } from "../../lib/public-origin";

export const Route = createFileRoute("/_public")({
  // Nilai default sengaja tidak dimaterialkan: kanonikalisasi SSR akan
  // meredirect setiap kunjungan ke bentuk lengkapnya kalau dikembalikan.
  validateSearch: (s: Record<string, unknown>): { lang?: "en" } => ({
    lang: s.lang === "en" ? "en" : undefined,
  }),
  search: { middlewares: [retainSearchParams(["lang"])] },
  loader: async () => {
    const [data, origin] = await Promise.all([loadPublic(), loadOrigin()]);
    return { ...data, origin };
  },
  staleTime: 60_000,
  component: Outlet,
});
