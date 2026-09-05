import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";
import { ZodError } from "zod";
import { handleApi } from "./server/api";
import { isLocal, requireAdmin } from "./server/auth";
import { maintenanceGate } from "./server/maintenance";
import { englishUrl } from "./lib/legacy-url";
export default createServerEntry({
  async fetch(request) {
    try {
      const url = new URL(request.url);
      if (url.hostname === env.PUBLIC_HOST || isLocal(request)) {
        const canonical = englishUrl(request);
        if (canonical) return Response.redirect(canonical, 301);
      }
      const maintenance = await maintenanceGate(request, env);
      if (maintenance) return maintenance;
      const adminPath =
        url.pathname === "/admin" ||
        url.pathname.startsWith("/admin/") ||
        url.pathname === "/preview";
      if (adminPath) await requireAdmin(request, env);
      if (url.hostname === env.ADMIN_HOST && url.pathname === "/")
        return Response.redirect(`${url.origin}/admin`, 302);
      if (url.pathname.startsWith("/api/"))
        return await handleApi(request, env);
      if (url.pathname === "/robots.txt")
        return new Response(
          `User-agent: *\n${url.hostname === env.ADMIN_HOST ? "Disallow: /" : "Disallow: /admin\nDisallow: /preview\nDisallow: /api/"}`,
        );
      if (
        !isLocal(request) &&
        url.hostname !== env.PUBLIC_HOST &&
        url.hostname !== env.ADMIN_HOST
      )
        throw new Response("Not found", { status: 404 });
      let response = await handler.fetch(request);
      if (
        url.hostname === env.PUBLIC_HOST &&
        env.ANALYTICS_BEACON_TOKEN &&
        !adminPath &&
        response.headers.get("content-type")?.includes("text/html")
      ) {
        const beacon = JSON.stringify({
          token: env.ANALYTICS_BEACON_TOKEN,
        }).replaceAll("'", "&#39;");
        response = new HTMLRewriter()
          .on("head", {
            element(el) {
              el.append(
                `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${beacon}'></script>`,
                { html: true },
              );
            },
          })
          .transform(response);
      }
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      if (adminPath || url.hostname === env.ADMIN_HOST) {
        headers.set("X-Robots-Tag", "noindex, nofollow");
        headers.set("Content-Security-Policy", "frame-ancestors 'self'");
      }
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      if (error instanceof Response)
        return new Response(error.body, {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      if (error instanceof ZodError)
        return Response.json(
          {
            error: error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; "),
          },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      console.error(
        JSON.stringify({
          event: "request_failed",
          type: error instanceof Error ? error.name : "unknown",
        }),
      );
      return Response.json(
        {
          error:
            "Request failed. Try again; your changes may not have been saved.",
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  },
});
