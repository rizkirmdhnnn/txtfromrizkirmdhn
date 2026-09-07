import type { Kind, PublicData, PublicEntry } from "./cms";
import { defaultWords } from "./default-words";

type HeadData = PublicData & { origin: string };

export function publicLoaderData(
  matches: ReadonlyArray<{ routeId: string; loaderData?: unknown }>,
) {
  return matches.find((m) => m.routeId === "/_public")?.loaderData as
    HeadData | undefined;
}

function sectionLabel(site: PublicData["site"] | undefined, kind: Kind) {
  return site?.words?.[kind] || defaultWords[kind];
}

export function publicHead({
  data,
  path,
  title,
  description,
  kind,
  entry,
}: {
  data: HeadData | undefined;
  path: string;
  title?: string;
  description?: string;
  kind?: Kind;
  entry?: PublicEntry;
}) {
  const copy = data?.site;
  const section = kind ? copy?.sectionSeo?.[kind] : undefined;
  const sectionTitle = kind
    ? `${sectionLabel(copy, kind)} — ${copy?.name ?? "Portfolio"}`
    : undefined;
  const pageTitle =
    title ||
    section?.seoTitle ||
    sectionTitle ||
    copy?.seoTitle ||
    copy?.name ||
    "Portfolio";
  const pageDescription =
    description ||
    section?.seoDescription ||
    copy?.seoDescription ||
    copy?.bio ||
    "";
  const origin = data?.origin ?? "";
  const url = `${origin}${path}`;
  const image = entry?.cover || copy?.avatar || "";
  const imageUrl = image ? `${origin}${image}` : "";
  // Schema.org untuk rich results dan visibilitas di AI search (GEO).
  const graph: Record<string, unknown>[] = [];
  if (copy) {
    const person: Record<string, unknown> = {
      "@type": "Person",
      "@id": `${origin}/#person`,
      name: copy.name,
      url: `${origin}/`,
    };
    if (copy.avatar) person.image = `${origin}${copy.avatar}`;
    if (copy.email) person.email = copy.email;
    if (copy.headline) person.jobTitle = copy.headline;
    const sameAs = [copy.github, copy.linkedin].filter((v): v is string =>
      Boolean(v),
    );
    if (sameAs.length) person.sameAs = sameAs;
    graph.push(person);
    graph.push({
      "@type": "WebSite",
      name: copy.name,
      url: `${origin}/`,
    });
    if (entry) {
      graph.push({
        "@type": "BlogPosting",
        headline: pageTitle,
        description: pageDescription,
        url,
        ...(imageUrl ? { image: imageUrl } : {}),
        datePublished: entry.date,
        ...(entry.updatedAt
          ? { dateModified: entry.updatedAt.slice(0, 10) }
          : {}),
        articleSection:
          entry.category.charAt(0).toUpperCase() + entry.category.slice(1),
        author: { "@id": `${origin}/#person` },
        mainEntityOfPage: url,
      });
    }
  }
  const meta: Record<string, unknown>[] = [
    { title: pageTitle },
    { name: "description", content: pageDescription },
    { property: "og:type", content: entry ? "article" : "website" },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: pageDescription },
    { property: "og:url", content: url },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(imageUrl
      ? [
          { property: "og:image", content: imageUrl },
          {
            property: "og:image:alt",
            content: entry?.title || copy?.name || "Portfolio",
          },
        ]
      : []),
    ...(graph.length
      ? [
          {
            "script:ld+json": {
              "@context": "https://schema.org",
              "@graph": graph,
            },
          },
        ]
      : []),
  ];
  return {
    links: [
      ...(copy?.icon ? [{ rel: "icon", href: copy.icon }] : []),
      { rel: "canonical", href: url },
    ],
    meta,
  };
}
