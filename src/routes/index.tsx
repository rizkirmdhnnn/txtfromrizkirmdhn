import { createFileRoute } from "@tanstack/react-router";
import { loadPublic } from "../lib/public-data";
import { kinds, type Lang, type Kind } from "../lib/cms";
import { PublicView } from "../components/public-view";
export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { lang: Lang; tab: Kind } => ({
    lang: s.lang === "en" ? "en" : "id",
    tab: kinds.includes(s.tab as Kind) ? (s.tab as Kind) : "projects",
  }),
  loaderDeps: ({ search }) => search,
  loader: () => loadPublic(),
  head: ({ loaderData, match }) => {
    const copy = loaderData?.site?.translations[match.search.lang];
    return {
      links: loaderData?.site?.icon
        ? [{ rel: "icon", href: loaderData.site.icon }]
        : [],
      meta: [
        { title: copy?.seoTitle || loaderData?.site?.name || "Portfolio" },
        {
          name: "description",
          content: copy?.seoDescription || copy?.bio || "",
        },
      ],
    };
  },
  component: Home,
});
function Home() {
  const data = Route.useLoaderData();
  const { lang, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PublicView
      data={data}
      lang={lang}
      tab={tab}
      onLanguage={(lang) => navigate({ search: { lang, tab }, replace: true })}
      onTab={(tab) => navigate({ search: { lang, tab } })}
      onPost={(slug) => {
        window.location.href = `/post/${slug}?lang=${lang}`;
      }}
      onBack={() => navigate({ search: { lang, tab: "projects" } })}
    />
  );
}
