import type { APIRoute } from "astro";
import { getAllPublishedEntries, getProfile } from "../lib/content";

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ url }) => {
	const [profile, entries] = await Promise.all([getProfile(), getAllPublishedEntries()]);
	const siteUrl = url.origin;
	const posts = entries
		.filter(({ collection }) => collection === "writing")
		.sort((a, b) => String(b.entry.data.date || "").localeCompare(String(a.entry.data.date || "")))
		.slice(0, 20);
	const siteTitle = profile?.data.name || "Portfolio";
	const siteDescription = profile?.data.headline || "";
	const items = posts
		.map(({ entry }) => {
			const link = `${siteUrl}/post/${entry.id}`;
			const published = entry.data.date ? new Date(entry.data.date) : null;
			return `    <item>
      <title>${escapeXml(entry.data.title || "Untitled")}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      ${published && !Number.isNaN(published.getTime()) ? `<pubDate>${published.toUTCString()}</pubDate>` : ""}
      <description>${escapeXml(entry.data.summary || "")}</description>
    </item>`;
		})
		.join("\n");
	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
	return new Response(rss, {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
	});
};
