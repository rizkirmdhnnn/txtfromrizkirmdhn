import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead, publicLoaderData } from "../../lib/public-head";

export const Route = createFileRoute("/_public/writing")({
  head: ({ matches }) =>
    publicHead({
      data: publicLoaderData(matches),
      path: "/writing",
      kind: "writing",
    }),
  component: () => <PublicPage tab="writing" />,
});
