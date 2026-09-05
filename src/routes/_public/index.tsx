import { createFileRoute, redirect } from "@tanstack/react-router";
import { PublicPage } from "../../components/public-page";
import { publicHead } from "../../lib/public-head";
import { tabPaths } from "../../lib/tabs";
import { kinds, type Kind } from "../../lib/cms";

export const Route = createFileRoute("/_public/")({
  validateSearch: (s: Record<string, unknown>): { tab?: Kind } => ({
    tab: kinds.includes(s.tab as Kind) ? (s.tab as Kind) : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.tab) return;
    throw redirect({
      to: tabPaths[search.tab],
      search: ({ tab: _tab, ...rest }) => rest,
      statusCode: 301,
    });
  },
  head: ({ loaderData, match }) =>
    publicHead(loaderData, match.search.lang ?? "id"),
  component: () => <PublicPage tab="projects" />,
});
