import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { loadPublic } from "../lib/public-data";
import { contentLanguage, type Lang } from "../lib/cms";
import { PublicView } from "../components/public-view";
const findRedirect = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { env } = await import("cloudflare:workers");
    const row = await env.DB.prepare(
      "SELECT d.slug FROM redirects r JOIN documents d ON d.id=r.document_id WHERE r.slug=? AND d.published IS NOT NULL AND d.deleted=0",
    )
      .bind(slug)
      .first<{ slug: string }>();
    return row?.slug ?? null;
  });
export const Route = createFileRoute("/post/$slug")({
  validateSearch: (s: Record<string, unknown>): { lang: Lang } => ({
    lang: s.lang === "en" ? "en" : "id",
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const data = await loadPublic();
    if (!data.entries.some((e) => e.slug === params.slug)) {
      const slug = await findRedirect({ data: params.slug });
      if (slug)
        throw redirect({
          to: "/post/$slug",
          params: { slug },
          search: { lang: deps.lang },
          statusCode: 301,
        });
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData, params, match }) => {
    const e = loaderData?.entries.find((e) => e.slug === params.slug);
    const tr = e?.translations[contentLanguage(e, match.search.lang)];
    return {
      meta: [
        {
          title:
            tr?.seoTitle ||
            `${tr?.title ?? "Portfolio"} — ${loaderData?.site?.name ?? ""}`,
        },
        {
          name: "description",
          content: tr?.seoDescription || tr?.summary || "",
        },
      ],
    };
  },
  component: Post,
});
function Post() {
  const data = Route.useLoaderData();
  const { lang } = Route.useSearch();
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const back = () =>
    navigate({
      to: "/",
      search: {
        lang,
        tab: data.entries.find((e) => e.slug === slug)?.category ?? "projects",
      },
    });
  return (
    <PublicView
      data={data}
      lang={lang}
      slug={slug}
      onLanguage={(lang) => navigate({ search: { lang }, replace: true })}
      onBack={back}
      onTab={back}
      onPost={(slug) => navigate({ params: { slug }, search: { lang } })}
    />
  );
}
