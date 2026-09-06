import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { CmsDocument, Kind } from "../lib/cms";
import { documentSlug, documentTitle } from "./overview";

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
        [documentTitle(d), documentSlug(d)]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : documents;
  return (
    <>
      <input
        className="cms-search"
        aria-label="Search content"
        placeholder="Search by title or slug…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <section className="cms-card content-list">
        {visible.map((d) => {
          // Item Setup dan Gallery dikenali dari fotonya, bukan judulnya.
          const thumb =
            d.kind === "setup" || d.kind === "gallery" ? d.draft.cover : "";
          const body = (
            <>
              <div className="document-main">
                {thumb ? (
                  <img className="document-thumb" src={thumb} alt="" />
                ) : null}
                <div>
                  <strong>{documentTitle(d)}</strong>
                  <small>/{documentSlug(d)}</small>
                </div>
              </div>
              <span className="cms-status">
                {d.published ? "Published" : "Draft"}
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
                      Restore
                    </button>
                    <button
                      className="danger"
                      onClick={() => onAction(d, "delete")}
                    >
                      Delete permanently
                    </button>
                  </>
                ) : (
                  <button
                    aria-label="Move to trash"
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
              ? "No content matches your search."
              : "No content here yet."}
          </p>
        ) : null}
      </section>
    </>
  );
}
