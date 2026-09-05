import type { Lang, PublicData } from "./cms";

type HeadData = PublicData & { origin: string };

export function publicLoaderData(
  matches: ReadonlyArray<{ routeId: string; loaderData?: unknown }>,
) {
  return matches.find((m) => m.routeId === "/_public")?.loaderData as
    HeadData | undefined;
}

export function publicHead({
  data,
  lang,
  path,
  title,
  description,
}: {
  data: HeadData | undefined;
  lang: Lang;
  path: string;
  title?: string;
  description?: string;
}) {
  const copy = data?.site?.translations[lang];
  const pageTitle = title || copy?.seoTitle || data?.site?.name || "Portfolio";
  const pageDescription =
    description || copy?.seoDescription || copy?.bio || "";
  const origin = data?.origin ?? "";
  const url = (value: Lang) =>
    `${origin}${path}${value === "en" ? "?lang=en" : ""}`;
  return {
    links: [
      ...(data?.site?.icon ? [{ rel: "icon", href: data.site.icon }] : []),
      { rel: "canonical", href: url(lang) },
      { rel: "alternate", hreflang: "id", href: url("id") },
      { rel: "alternate", hreflang: "en", href: url("en") },
      { rel: "alternate", hreflang: "x-default", href: url("id") },
    ],
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:type", content: "website" },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: url(lang) },
      { property: "og:locale", content: lang === "en" ? "en_US" : "id_ID" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(data?.site?.avatar
        ? [{ property: "og:image", content: `${origin}${data.site.avatar}` }]
        : []),
    ],
  };
}
