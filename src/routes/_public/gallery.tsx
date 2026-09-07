import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/gallery")({
  head: ({ matches }) =>
    publicHead({
      data: publicLoaderData(matches),
      path: "/gallery",
      kind: "gallery",
    }),
  component: () => <PublicPage tab="gallery" />,
});
