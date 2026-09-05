import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/writing")({
  head: ({ matches, match }) =>
    publicHead({
      data: publicLoaderData(matches),
      lang: match.search.lang ?? "id",
      path: "/writing",
    }),
  component: () => <PublicPage tab="writing" />,
});
