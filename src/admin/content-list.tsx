import { Trash2 } from "lucide-react";
import type { CmsDocument, EntryData } from "../lib/cms";
import { documentTitle } from "./overview";

export function ContentList({
  documents,
  query,
  onQuery,
  onOpen,
  onAction,
}: {
  documents: CmsDocument[];
  query: string;
  onQuery: (value: string) => void;
  onOpen: (doc: CmsDocument) => void;
  onAction: (doc: CmsDocument, action: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? documents.filter((d) =>
        JSON.stringify(d.draft).toLowerCase().includes(needle),
      )
    : documents;
  return (
    <>
      <input
        className="cms-search"
        aria-label="Cari konten"
        placeholder="Cari judul atau slug…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <section className="cms-card content-list">
        {visible.map((d) => (
          <div className="document-row" key={d.id}>
            <button
              className="document-list-item"
              onClick={() => onOpen(d)}
              disabled={!!d.deleted}
            >
              <div>
                <strong>{documentTitle(d)}</strong>
                <small>/{(d.draft as EntryData).slug}</small>
              </div>
              <span className="cms-status">
                {d.published ? "Terbit" : "Draft"}
              </span>
            </button>
            <div className="row-actions">
              {d.deleted ? (
                <>
                  <button onClick={() => onAction(d, "restore")}>
                    Pulihkan
                  </button>
                  <button
                    className="danger"
                    onClick={() => onAction(d, "delete")}
                  >
                    Hapus permanen
                  </button>
                </>
              ) : (
                <button
                  aria-label="Pindahkan ke sampah"
                  onClick={() => onAction(d, "trash")}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {!visible.length ? (
          <p className="empty-list">
            {needle
              ? "Tidak ada konten yang cocok dengan pencarian."
              : "Belum ada konten di sini."}
          </p>
        ) : null}
      </section>
    </>
  );
}
