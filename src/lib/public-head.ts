import type { PublicData } from "./cms";

type HeadData = PublicData & { origin: string };

export function publicLoaderData(
  matches: ReadonlyArray<{ routeId: string; loaderData?: unknown }>,
) {
  return matches.find((m) => m.routeId === "/_public")?.loaderData as
    HeadData | undefined;
}

export function publicHead({
  data,
  path,
  title,
  description,
}: {
  data: HeadData | undefined;
  path: string;
  title?: string;
  description?: string;
}) {
  const copy = data?.site;
  const pageTitle = title || copy?.seoTitle || data?.site?.name || "Portfolio";
  const pageDescription =
    description || copy?.seoDescription || copy?.bio || "";
  const origin = data?.origin ?? "";
  const url = `${origin}${path}`;
  return {
    links: [
      ...(data?.site?.icon ? [{ rel: "icon", href: data.site.icon }] : []),
      { rel: "canonical", href: url },
    ],
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:type", content: "website" },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: url },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(data?.site?.avatar
        ? [{ property: "og:image", content: `${origin}${data.site.avatar}` }]
        : []),
    ],
  };
}
