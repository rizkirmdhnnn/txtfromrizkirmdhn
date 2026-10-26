import type { APIRoute } from "astro";
import mediaMap from "../../../../migration/media-map.json";

export const GET: APIRoute = async ({ params, redirect }) => {
	const id = params.id;
	if (!id) return new Response("Not found", { status: 404 });
	const target = (mediaMap as Record<string, { url?: string }>)[id];
	if (!target?.url) return new Response("Gone", { status: 410 });
	return redirect(target.url, 301);
};
