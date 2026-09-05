import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/experience")({
  head: ({ matches }) =>
    publicHead({
      data: publicLoaderData(matches),
      path: "/experience",
    }),
  component: () => <PublicPage tab="experience" />,
});
