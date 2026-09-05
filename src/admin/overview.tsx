import type { CmsDocument, MediaItem } from "../lib/cms";
import { AnalyticsPanel } from "./analytics-panel";

export function documentTitle(doc: CmsDocument) {
  if (doc.kind === "site") return "Profile & website";
  return doc.draft.title || "Untitled";
}

export function documentSlug(doc: CmsDocument) {
  return doc.kind === "site" ? "" : doc.draft.slug;
}

export function Overview({
  documents,
  media,
  onOpen,
}: {
  documents: CmsDocument[];
  media: MediaItem[];
  onOpen: (doc: CmsDocument) => void;
}) {
  const live = documents.filter((d) => !d.deleted);
  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Published content</span>
          <strong>{live.filter((d) => d.published).length}</strong>
        </div>
        <div className="stat-card">
          <span>Draft</span>
          <strong>{live.filter((d) => !d.published).length}</strong>
        </div>
        <div className="stat-card">
          <span>Media files</span>
          <strong>{media.length}</strong>
        </div>
      </div>
      <section className="cms-card">
        <h2>Continue writing</h2>
        {live.slice(0, 5).map((d) => (
          <button
            className="document-list-item"
            key={d.id}
            onClick={() => onOpen(d)}
          >
            <span>{documentTitle(d)}</span>
            <small>{d.published ? "Published" : "Draft"}</small>
          </button>
        ))}
        {!documents.length ? (
          <p>
            Run the initial import with <code>npm run db:seed</code>
            to create draft content.
          </p>
        ) : null}
      </section>
      <AnalyticsPanel />
    </>
  );
}
