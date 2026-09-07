import { kinds, type Kind, type PublicData } from "./cms";

const pagePaths: Record<Kind, string> = {
  projects: "/",
  experience: "/experience",
  writing: "/writing",
  about: "/about",
  setup: "/setup",
  gallery: "/gallery",
};

/** Sitemap XML dari data publik + lastmod per slug (updated_at dokumen). */
export function sitemapXml(
  host: string,
  data: PublicData,
  updatedAt: Map<string, string>,
) {
  const origin = `https://${host}`;
  const visible = new Set(
    data.site?.sections.filter((s) => s.visible).map((s) => s.key) ?? [],
  );
  const urls: string[] = [];
  for (const kind of kinds) {
    if (!visible.has(kind)) continue;
    urls.push(`<url><loc>${origin}${pagePaths[kind]}</loc></url>`);
  }
  for (const entry of data.entries) {
    const lastmod = updatedAt.get(entry.slug)?.slice(0, 10);
    urls.push(
      `<url><loc>${origin}/post/${entry.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}
