import { defineMiddleware } from "astro:middleware";
import { getProfile } from "./lib/content";

const PUBLIC_HOST = "txtfromrizkirmdhn.my.id";
const ADMIN_HOST = "admin.txtfromrizkirmdhn.my.id";

let maintenanceCache: { value: { enabled: boolean; title: string; body: string } | null; at: number } | null = null;

async function maintenanceState() {
	const now = Date.now();
	if (maintenanceCache && now - maintenanceCache.at < 30_000) return maintenanceCache.value;
	const profile = await getProfile();
	const data = profile?.data;
	const value = data?.maintenance_enabled
		? {
				enabled: true,
				title: data.maintenance_title || "Back soon.",
				body: data.maintenance_body || "This space is being maintained. Please check back later.",
			}
		: null;
	maintenanceCache = { value, at: now };
	return value;
}

const escape = (value: string) =>
	value.replace(/[&<>"']/g, (character) =>
		({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character,
	);

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);

	if (url.hostname === ADMIN_HOST) {
		return context.redirect(`https://${PUBLIC_HOST}/_emdash/admin`, 301);
	}

	if (url.pathname === "/projects") return context.redirect("/", 301);

	if (
		url.searchParams.has("lang") &&
		!url.pathname.startsWith("/_emdash") &&
		!url.pathname.startsWith("/api/") &&
		!url.pathname.startsWith("/og")
	) {
		url.searchParams.delete("lang");
		return context.redirect(url.pathname + url.search, 301);
	}

	if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
		return context.redirect("/_emdash/admin", 301);
	}
	if (url.pathname === "/preview") return context.redirect("/_emdash/admin", 302);

	if (url.pathname !== "/" && url.pathname.endsWith("/")) {
		return context.redirect(url.pathname.slice(0, -1) + url.search, 301);
	}

	const isPublic =
		(url.hostname === PUBLIC_HOST || url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
		!url.pathname.startsWith("/_emdash") &&
		!url.pathname.startsWith("/_astro") &&
		!url.pathname.startsWith("/api/") &&
		!url.pathname.startsWith("/og") &&
		url.pathname !== "/favicon.svg";

	if (isPublic) {
		const state = await maintenanceState();
		if (state?.enabled) {
			const headers = {
				"Cache-Control": "no-store",
				"Retry-After": "300",
				"Content-Type": "text/html; charset=utf-8",
				"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
			};
			const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(state.title)}</title><style>:root{color-scheme:light dark;font-family:system-ui,sans-serif;background:#f8f9fb;color:#282d34}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:28px}main{width:100%;max-width:480px}h1{font-size:clamp(25px,5vw,34px);font-weight:600;letter-spacing:-.04em;line-height:1.2}p{line-height:1.75;opacity:.65;white-space:pre-wrap;overflow-wrap:anywhere}@media(prefers-color-scheme:dark){:root{background:#17191c;color:#e3e6eb}}</style></head><body><main><h1>${escape(state.title)}</h1><p>${escape(state.body)}</p></main></body></html>`;
			return new Response(html, { status: 503, headers });
		}
	}

	const response = await next();
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	if (url.pathname.startsWith("/_emdash/")) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}
	return response;
});
