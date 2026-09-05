import { createFileRoute } from "@tanstack/react-router";
import { loadPublic } from "../lib/public-data";
import { kinds, type Kind } from "../lib/cms";
import { PublicView } from "../components/public-view";
export const Route = createFileRoute("/")({
  // Nilai default sengaja tidak dimaterialkan: kanonikalisasi SSR akan
  // meredirect setiap kunjungan ke bentuk lengkapnya kalau dikembalikan.
  validateSearch: (
    s: Record<string, unknown>,
  ): { lang?: "en"; tab?: Kind } => ({
    lang: s.lang === "en" ? "en" : undefined,
    tab: kinds.includes(s.tab as Kind) ? (s.tab as Kind) : undefined,
  }),
  loader: () => loadPublic(),
  head: ({ loaderData, match }) => {
    const copy = loaderData?.site?.translations[match.search.lang ?? "id"];
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const lang = search.lang ?? "id";
  const tab = search.tab ?? "projects";
  const go = (next: Partial<typeof search>, replace = false) =>
    navigate({ search: { ...search, ...next }, replace });
  return (
    <PublicView
      data={data}
      lang={lang}
      tab={tab}
      onLanguage={(next) =>
        go({ lang: next === "en" ? "en" : undefined }, true)
      }
      onTab={(next) => go({ tab: next === "projects" ? undefined : next })}
      onPost={(slug) =>
        navigate({
          to: "/post/$slug",
          params: { slug },
          search: { lang: search.lang },
        })
      }
      onBack={() => go({ tab: undefined })}
    />
  );
}
