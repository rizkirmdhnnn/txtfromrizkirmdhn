import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/about")({
  head: ({ matches }) =>
    publicHead({
      data: publicLoaderData(matches),
      path: "/about",
      kind: "about",
    }),
  component: () => <PublicPage tab="about" />,
});
