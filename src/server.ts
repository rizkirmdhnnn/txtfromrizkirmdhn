import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";
import { ZodError } from "zod";
import { handleApi } from "./server/api";
import { isLocal, requireAdmin } from "./server/auth";
import { maintenanceGate } from "./server/maintenance";
import { publicData } from "./server/store";
import { ogResponse } from "./server/og";
import { sitemapXml } from "./lib/sitemap";
import { llmsTxt } from "./lib/llms";
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
          url.hostname === env.ADMIN_HOST
            ? "User-agent: *\nDisallow: /"
            : // Bot training-only tetap diblokir di sini agar bisa mematikan
              // "Managed robots.txt" Cloudflare (yang juga memblokir bot
              // citation seperti ClaudeBot/GPTBot) tanpa kehilangan proteksi.
              `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /preview\nDisallow: /api/\nSitemap: https://${env.PUBLIC_HOST}/sitemap.xml\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n\nUser-agent: Amazonbot\nDisallow: /\n\nUser-agent: Applebot-Extended\nDisallow: /\n\nUser-agent: meta-externalagent\nDisallow: /`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      if (url.pathname === "/sitemap.xml") {
        if (url.hostname !== env.PUBLIC_HOST && !isLocal(request))
          throw new Response("Not found", { status: 404 });
        const [data, rows] = await Promise.all([
          publicData(env),
          env.DB.prepare(
            "SELECT slug, updated_at FROM documents WHERE deleted=0 AND kind!='site' AND published IS NOT NULL",
          ).all<{ slug: string; updated_at: string }>(),
        ]);
        const xml = sitemapXml(
          env.PUBLIC_HOST,
          data,
          new Map(rows.results.map((r) => [r.slug, r.updated_at])),
        );
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      if (url.pathname === "/llms.txt") {
        if (url.hostname !== env.PUBLIC_HOST && !isLocal(request))
          throw new Response("Not found", { status: 404 });
        return new Response(llmsTxt(env.PUBLIC_HOST, await publicData(env)), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      if (url.pathname === "/og.png" || url.pathname.startsWith("/og/")) {
        if (url.hostname !== env.PUBLIC_HOST && !isLocal(request))
          throw new Response("Not found", { status: 404 });
        // Slug mengikuti pola cms.ts: kebab-case [a-z0-9-].
        const slug = url.pathname.match(
          /^\/og\/([a-z0-9]+(?:-[a-z0-9]+)*)\.png$/,
        )?.[1];
        if (!slug && url.pathname !== "/og.png")
          throw new Response("Not found", { status: 404 });
        return await ogResponse(env, slug);
      }
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
