import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/experience")({
  head: ({ matches, match }) =>
    publicHead({
      data: publicLoaderData(matches),
      lang: match.search.lang ?? "id",
      path: "/experience",
    }),
  component: () => <PublicPage tab="experience" />,
});
