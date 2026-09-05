import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicView } from "../components/public-view";
import { api } from "../admin/client";
import type { PublicData, Kind } from "../lib/cms";
export const Route = createFileRoute("/preview")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { slug?: string; embedded?: true } => ({
    slug: typeof s.slug === "string" ? s.slug : undefined,
    embedded: s.embedded === true ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Preview draft — Rizki" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Preview,
});
function Preview() {
  const search = Route.useSearch();
  const [data, setData] = useState<PublicData | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState<Kind>("projects"),
    [slug, setSlug] = useState(search.slug),
    [mobile, setMobile] = useState(false);
  useEffect(() => {
    api<PublicData>("preview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {!search.embedded ? (
        <div className="preview-banner">
          <span>Saved draft preview · Owner only</span>
          <button onClick={() => setMobile(!mobile)}>
            {mobile ? "Desktop" : "Mobile"}
          </button>
          <a href="/admin">Back to dashboard</a>
        </div>
      ) : null}
      {mobile ? (
        <iframe
          className="mobile-preview-frame"
          title="Mobile preview"
          src={`/preview?embedded=true${slug ? `&slug=${encodeURIComponent(slug)}` : ""}`}
        />
      ) : error ? (
        <p role="alert">{error}</p>
      ) : data ? (
        <PublicView
          data={data}
          tab={tab}
          slug={slug}
          onTab={setTab}
          onPost={setSlug}
          onBack={() => setSlug(undefined)}
        />
      ) : (
        <p>Loading preview…</p>
      )}
    </>
  );
}
