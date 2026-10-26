import type { APIRoute } from "astro";
import { getProfile } from "../lib/content";

/**
 * Inline CV preview.
 *
 * EmDash serves uploaded files with `Content-Disposition: attachment` (a
 * deliberate stored-XSS guard), so pointing an iframe at the media URL makes
 * the browser download the PDF on page load. This route streams the same
 * owner-controlled PDF with `inline` disposition, and the modal only requests
 * it when the visitor opens the CV dialog.
 */
export const GET: APIRoute = async ({ locals, url }) => {
	const profile = await getProfile();
	const cv = profile?.data?.cv as
		| { url?: string; src?: string; meta?: { storageKey?: string } }
		| undefined;
	const storageKey = cv?.meta?.storageKey;
	const storage = (locals as any).emdash?.storage;

	if (!storageKey || !storage?.download) {
		const fallback = cv?.url || cv?.src;
		if (fallback) return Response.redirect(new URL(fallback, url).href, 302);
		return new Response("CV not found", { status: 404 });
	}

	const file = await storage.download(storageKey);
	return new Response(file.body, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": 'inline; filename="CV.pdf"',
			"Cache-Control": "public, max-age=3600",
			"X-Content-Type-Options": "nosniff",
		},
	});
};
