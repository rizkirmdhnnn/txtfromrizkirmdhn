import type { PublicData, Lang } from "./cms";

export function publicHead(data: PublicData | undefined, lang: Lang) {
  const copy = data?.site?.translations[lang];
  return {
    links: data?.site?.icon ? [{ rel: "icon", href: data.site.icon }] : [],
    meta: [
      { title: copy?.seoTitle || data?.site?.name || "Portfolio" },
      { name: "description", content: copy?.seoDescription || copy?.bio || "" },
    ],
  };
}
