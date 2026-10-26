import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url }) => {
	const slug = params.slug;
	if (!slug) return new Response("Not found", { status: 404 });
	if (import.meta.env.PROD) {
		const { mediaBucket } = await import("../../lib/r2");
		const object = await mediaBucket()?.get(`og/${slug}.png`);
		if (object) {
			return new Response(object.body, {
				headers: {
					"Content-Type": "image/png",
					"Cache-Control": "public, max-age=3600",
					ETag: object.httpEtag,
				},
			});
		}
	}
	return Response.redirect(new URL(`/og-cache/${slug}.png`, url).href, 302);
};
