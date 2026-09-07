import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { loadPublic } from "../lib/public-data";
import { loadOrigin } from "../lib/public-origin";
import { publicHead } from "../lib/public-head";
import { PublicView, type PublicNav } from "../components/public-view";
import { tabPaths } from "../lib/tabs";
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
  loader: async ({ params }) => {
    const [data, origin] = await Promise.all([loadPublic(), loadOrigin()]);
    if (!data.entries.some((e) => e.slug === params.slug)) {
      const slug = await findRedirect({ data: params.slug });
      if (slug)
        throw redirect({
          to: "/post/$slug",
          params: { slug },
          search: (prev) => prev,
          statusCode: 301,
        });
      throw notFound();
    }
    return { ...data, origin };
  },
  head: ({ loaderData, params }) => {
    const entry = loaderData?.entries.find((e) => e.slug === params.slug);
    return publicHead({
      data: loaderData,
      path: `/post/${params.slug}`,
      title:
        entry?.seoTitle ||
        `${entry?.title ?? "Portfolio"} — ${loaderData?.site?.name ?? ""}`,
      description: entry?.seoDescription || entry?.summary || "",
      entry,
    });
  },
  component: Post,
});
function Post() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const category = data.entries.find((e) => e.slug === slug)?.category;
  const back = () =>
    navigate({
      to: "/",
      search: {
        tab: category === "projects" ? undefined : category,
      },
    });
  const nav: PublicNav = {
    tab: (kind, children, active) => (
      <Link
        to={tabPaths[kind]}
        search={search}
        activeProps={{}}
        activeOptions={{ exact: true }}
        className={active ? "active" : ""}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </Link>
    ),
  };
  return (
    <PublicView
      data={data}
      slug={slug}
      nav={nav}
      onBack={back}
      onTab={back}
      onPost={(next) => navigate({ params: { slug: next }, search })}
    />
  );
}
