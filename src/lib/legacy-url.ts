/** Remove the obsolete language selector while preserving unrelated queries. */
export function englishUrl(request: Request): string | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server") ||
    url.pathname === "/admin" ||
    url.pathname.startsWith("/admin/") ||
    url.pathname === "/preview" ||
    !url.searchParams.has("lang")
  )
    return null;
  url.searchParams.delete("lang");
  return url.href;
}
