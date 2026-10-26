import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
	const host = url.hostname;
	const body = `User-agent: *
Allow: /
Disallow: /_emdash/
Disallow: /admin
Disallow: /api/
Sitemap: https://${host}/sitemap.xml

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: meta-externalagent
Disallow: /
`;
	return new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
	});
};
