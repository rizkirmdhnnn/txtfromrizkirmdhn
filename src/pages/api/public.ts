import type { APIRoute } from "astro";

export const GET: APIRoute = async () =>
	Response.json(
		{
			error: "The legacy public API was retired during the EmDash migration.",
			replacement: "/llms.txt",
		},
		{ status: 410, headers: { "Cache-Control": "no-store" } },
	);
