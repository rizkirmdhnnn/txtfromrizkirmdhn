import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Save, Upload, History } from "lucide-react";
import type { CmsDocument, EntryData, SiteData, MediaItem } from "../lib/cms";
import { api } from "./client";
import { categoryNames } from "./edit-helpers";
import { EntryForm } from "./entry-form";
import { MarkdownTools } from "./markdown-tools";
import { Notice } from "./notice";
import { RevisionList, type Revision } from "./revision-list";
import { SeoFields } from "./seo-fields";
import { SiteForm } from "./site-form";
import { useAsyncAction } from "./use-async-action";
import { useUnsavedGuard } from "./use-unsaved-guard";

export function DocumentEditor({
  document,
  media,
  onSaved,
  onBack,
}: {
  document: CmsDocument;
  media: MediaItem[];
  onSaved: (d: CmsDocument) => void | Promise<void>;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(document.draft),
    [savedDraft, setSavedDraft] = useState(document.draft),
    [revisions, setRevisions] = useState<Revision[] | null>(null);
  const { busy, message, setMessage, run } = useAsyncAction();
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft),
    site = document.kind === "site";
  useUnsavedGuard(dirty);
  // Sengaja bergantung pada versi, bukan identitas objek: data loader
  // menghasilkan objek baru tiap invalidate dan akan menghapus ketikan.
  useEffect(() => {
    setDraft(document.draft);
    setSavedDraft(document.draft);
  }, [document.id, document.version]);
  const save = () =>
    run(async () => {
      const updated = await api<CmsDocument>("documents", {
        method: "POST",
        body: JSON.stringify({
          id: document.id,
          kind: document.kind,
          version: document.version,
          draft,
        }),
      });
      setSavedDraft(updated.draft);
      await onSaved(updated);
      setMessage("Draft saved. The published version has not changed.");
    });
  const action = (action: string, revisionId?: string) =>
    run(async () => {
      const updated = await api<CmsDocument>("action", {
        method: "POST",
        body: JSON.stringify({
          id: document.id,
          action,
          version: document.version,
          revisionId,
        }),
      });
      setDraft(updated.draft);
      setSavedDraft(updated.draft);
      await onSaved(updated);
      setMessage(
        action === "publish" ? "Content published." : "Changes saved.",
      );
      setRevisions(null);
    });
  const entry = draft as EntryData;
  return (
    <div className="document-editor">
      <div className="editor-heading">
        <button className="cms-quiet" onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="cms-status">
          {document.published ? "Published" : "Draft"}
          {dirty ? " · Unsaved changes" : ""}
        </span>
      </div>
      <div className="cms-title-row">
        <div>
          <p className="cms-eyebrow">
            {site
              ? "Profile & website settings"
              : categoryNames[entry.category]}
          </p>
          <h1>{site ? "Your personal space" : entry.title || "New content"}</h1>
        </div>
        <div className="cms-actions">
          <button
            className="cms-button"
            disabled={dirty || !document.version}
            onClick={() =>
              window.open(
                `/preview${site ? "" : `?slug=${entry.slug}`}`,
                "_blank",
              )
            }
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            className="cms-button"
            disabled={busy || (!dirty && document.version > 0)}
            onClick={save}
          >
            <Save size={15} />
            Save draft
          </button>
          <button
            className="cms-button strong"
            disabled={busy || dirty || !document.version}
            onClick={() => {
              if (confirm("Publish this draft to the website?"))
                void action("publish");
            }}
          >
            <Upload size={15} />
            Publish
          </button>
        </div>
      </div>
      <Notice>{message}</Notice>
      <fieldset disabled={busy} className="editor-fields">
        {site ? (
          <SiteForm
            draft={draft as SiteData}
            media={media}
            onChange={setDraft}
          />
        ) : (
          <EntryForm draft={entry} media={media} onChange={setDraft} />
        )}
        <SeoFields draft={draft} onChange={setDraft} />
      </fieldset>
      <div className="cms-actions editor-bottom">
        <button
          className="cms-button"
          disabled={!document.version || busy}
          onClick={() =>
            run(async () =>
              setRevisions(await api(`revisions?id=${document.id}`)),
            )
          }
        >
          <History size={15} />
          Revision history
        </button>
        {!site ? (
          <MarkdownTools
            draft={entry}
            onImport={(next, note) => {
              setDraft(next);
              setMessage(note);
            }}
            onRun={run}
          />
        ) : null}
        {document.published ? (
          <button
            className="cms-button danger"
            disabled={busy || dirty}
            onClick={() => {
              if (confirm("Unpublish this content from the website?"))
                void action("unpublish");
            }}
          >
            Unpublish
          </button>
        ) : null}
      </div>
      {revisions ? (
        <RevisionList
          revisions={revisions}
          disabled={busy || dirty}
          onRestore={(id) => void action("revision", id)}
        />
      ) : null}
    </div>
  );
}
