import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/setup")({
  head: ({ matches }) =>
    publicHead({
      data: publicLoaderData(matches),
      path: "/setup",
    }),
  component: () => <PublicPage tab="setup" />,
});
