import { createRemoteJWKSet, jwtVerify } from "jose";
export function isLocal(request: Request) {
  return (
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)
  );
}
export async function requireAdmin(request: Request, env: Env) {
  const url = new URL(request.url);
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.headers.get("origin") !== url.origin
  )
    throw new Response("Origin is not allowed", { status: 403 });
  if (isLocal(request)) return env.OWNER_EMAIL;
  if (url.hostname !== env.ADMIN_HOST)
    throw new Response("Not found", { status: 404 });
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD)
    throw new Response("Login has not been configured", { status: 503 });
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) throw new Response("Login required", { status: 401 });
  try {
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
    const { payload } = await jwtVerify(
      token,
      createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
      { issuer, audience: env.ACCESS_AUD, algorithms: ["RS256"] },
    );
    if (payload.email !== env.OWNER_EMAIL) throw new Error("owner");
    return env.OWNER_EMAIL;
  } catch {
    throw new Response("Access denied", { status: 403 });
  }
}
