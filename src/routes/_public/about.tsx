import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead } from "../../lib/public-head";

export const Route = createFileRoute("/_public/about")({
  head: ({ loaderData, match }) =>
    publicHead(loaderData, match.search.lang ?? "id"),
  component: () => <PublicPage tab="about" />,
});
