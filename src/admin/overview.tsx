import type { CmsDocument, EntryData, MediaItem } from "../lib/cms";
import { AnalyticsPanel } from "./analytics-panel";

export function documentTitle(doc: CmsDocument) {
  if (doc.kind === "site") return "Profil & website";
  const { translations } = doc.draft as EntryData;
  return translations.id.title || translations.en.title || "Tanpa judul";
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
          <span>Konten terbit</span>
          <strong>{live.filter((d) => d.published).length}</strong>
        </div>
        <div className="stat-card">
          <span>Draft</span>
          <strong>{live.filter((d) => !d.published).length}</strong>
        </div>
        <div className="stat-card">
          <span>File media</span>
          <strong>{media.length}</strong>
        </div>
      </div>
      <section className="cms-card">
        <h2>Lanjutkan menulis</h2>
        {live.slice(0, 5).map((d) => (
          <button
            className="document-list-item"
            key={d.id}
            onClick={() => onOpen(d)}
          >
            <span>{documentTitle(d)}</span>
            <small>{d.published ? "Terbit" : "Draft"}</small>
          </button>
        ))}
        {!documents.length ? (
          <p>
            Jalankan impor awal melalui <code>npm run db:seed</code> untuk
            menyiapkan konten draft.
          </p>
        ) : null}
      </section>
      <AnalyticsPanel />
    </>
  );
}
