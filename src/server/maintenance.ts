import { defaultMaintenance, maintenanceSchema } from "../lib/maintenance";
import { isLocal } from "./auth";
export async function readMaintenance(env: Env) {
  const row = await env.DB.prepare(
    "SELECT value FROM integrations WHERE id='maintenance'",
  ).first<{ value: string }>();
  return row
    ? maintenanceSchema.parse(JSON.parse(row.value))
    : defaultMaintenance;
}
export async function saveMaintenance(env: Env, input: unknown) {
  const value = maintenanceSchema.parse(input);
  await env.DB.prepare(
    "INSERT INTO integrations(id,value) VALUES('maintenance',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
  )
    .bind(JSON.stringify(value))
    .run();
  return value;
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function maintenanceGate(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const local = isLocal(request);
  if (url.hostname !== env.PUBLIC_HOST && !local) return null;
  if (
    local &&
    (url.pathname === "/admin" ||
      url.pathname.startsWith("/admin/") ||
      url.pathname === "/preview" ||
      url.pathname.startsWith("/api/admin/") ||
      url.pathname.startsWith("/api/media/"))
  )
    return null;
  const state = await readMaintenance(env);
  if (!state.enabled) return null;
  const lang = url.searchParams.get("lang") === "en" ? "en" : "id";
  const copy = state.translations[lang];
  const headers = {
    "Cache-Control": "no-store",
    "Retry-After": "300",
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
  };
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_server"))
    return Response.json(
      { maintenance: true, ...copy },
      {
        status: 503,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(copy.title)}</title><style>:root{color-scheme:light dark;font-family:system-ui,sans-serif;background:#faf9f6;color:#252724}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:28px}main{width:100%;max-width:480px}nav{display:flex;gap:16px;margin-bottom:64px}a{color:inherit;text-decoration:none;font-size:13px;opacity:.6}a[aria-current]{opacity:1;text-decoration:underline;text-underline-offset:5px}h1{font-size:clamp(25px,5vw,34px);font-weight:550;letter-spacing:-.04em;line-height:1.2}p{line-height:1.75;opacity:.65;white-space:pre-wrap;overflow-wrap:anywhere}@media(prefers-color-scheme:dark){:root{background:#131512;color:#e9eae5}}</style></head><body><main><nav aria-label="Language"><a href="?lang=id" ${lang === "id" ? 'aria-current="page"' : ""}>ID</a><a href="?lang=en" ${lang === "en" ? 'aria-current="page"' : ""}>EN</a></nav><h1>${escape(copy.title)}</h1><p>${escape(copy.body)}</p></main></body></html>`;
  return new Response(request.method === "HEAD" ? null : html, {
    status: 503,
    headers,
  });
}
