import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { CmsDocument, EntryData, Kind } from "../lib/cms";
import { documentTitle } from "./overview";

export function ContentList({
  documents,
  kind,
  query,
  onQuery,
  onAction,
}: {
  documents: CmsDocument[];
  kind: Kind | null;
  query: string;
  onQuery: (value: string) => void;
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
        {visible.map((d) => {
          const body = (
            <>
              <div>
                <strong>{documentTitle(d)}</strong>
                <small>/{(d.draft as EntryData).slug}</small>
              </div>
              <span className="cms-status">
                {d.published ? "Terbit" : "Draft"}
              </span>
            </>
          );
          return (
            <div className="document-row" key={d.id}>
              {kind ? (
                <Link
                  className="document-list-item"
                  to="/admin/$kind/$id"
                  params={{ kind, id: d.id }}
                >
                  {body}
                </Link>
              ) : (
                <span className="document-list-item disabled">{body}</span>
              )}
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
          );
        })}
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
