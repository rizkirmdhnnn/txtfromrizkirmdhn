import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
	if (import.meta.env.PROD) {
		const { mediaBucket } = await import("../lib/r2");
		const object = await mediaBucket()?.get("og/default.png");
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
	return Response.redirect(new URL("/og-cache/default.png", url).href, 302);
};
