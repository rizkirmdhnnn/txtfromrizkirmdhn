import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicView } from "../components/public-view";
import { api } from "../admin/client";
import type { PublicData, Lang, Kind } from "../lib/cms";
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
    [lang, setLang] = useState<Lang>("id"),
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
          <span>Preview draft tersimpan · Hanya pemilik</span>
          <button onClick={() => setMobile(!mobile)}>
            {mobile ? "Desktop" : "Mobile"}
          </button>
          <a href="/admin">Kembali ke dashboard</a>
        </div>
      ) : null}
      {mobile ? (
        <iframe
          className="mobile-preview-frame"
          title="Preview ukuran mobile"
          src={`/preview?embedded=true${slug ? `&slug=${encodeURIComponent(slug)}` : ""}`}
        />
      ) : error ? (
        <p role="alert">{error}</p>
      ) : data ? (
        <PublicView
          data={data}
          lang={lang}
          tab={tab}
          slug={slug}
          onLanguage={setLang}
          onTab={setTab}
          onPost={setSlug}
          onBack={() => setSlug(undefined)}
        />
      ) : (
        <p>Memuat preview…</p>
      )}
    </>
  );
}
