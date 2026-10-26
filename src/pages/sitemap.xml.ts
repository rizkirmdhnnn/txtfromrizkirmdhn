import type { APIRoute } from "astro";
import {
	getAllPublishedEntries,
	getProfile,
	tabPaths,
	visibleSections,
} from "../lib/content";

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ url }) => {
	const origin = url.origin;
	const [profile, entries] = await Promise.all([getProfile(), getAllPublishedEntries()]);
	const urls: string[] = [];
	if (profile) {
		for (const section of visibleSections(profile)) {
			urls.push(`<url><loc>${escapeXml(`${origin}${tabPaths[section.key]}`)}</loc></url>`);
		}
	}
	for (const { entry } of entries) {
		const lastmod = entry.updatedAt
			? new Date(entry.updatedAt).toISOString().slice(0, 10)
			: String(entry.data.date || "").slice(0, 10);
		urls.push(
			`<url><loc>${escapeXml(`${origin}/post/${entry.id}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
		);
	}
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
	});
};
