import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Save, Upload, History } from "lucide-react";
import type {
  CmsDocument,
  EntryData,
  SiteData,
  Lang,
  MediaItem,
} from "../lib/cms";
import { otherLang } from "../lib/cms";
import { api } from "./client";
import { categoryNames } from "./edit-helpers";
import { EntryForm } from "./entry-form";
import { MarkdownTools } from "./markdown-tools";
import { Notice } from "./notice";
import { RevisionList, type Revision } from "./revision-list";
import { SeoFields } from "./seo-fields";
import { SiteForm } from "./site-form";
import { TranslationReview, type Translation } from "./translation-review";
import { useAsyncAction } from "./use-async-action";
import { useUnsavedGuard } from "./use-unsaved-guard";

export function DocumentEditor({
  document,
  media,
  lang,
  onLang,
  onSaved,
  onBack,
}: {
  document: CmsDocument;
  media: MediaItem[];
  lang: Lang;
  onLang: (lang: Lang) => void;
  onSaved: (d: CmsDocument) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(document.draft),
    [revisions, setRevisions] = useState<Revision[] | null>(null),
    [translation, setTranslation] = useState<Translation | null>(null);
  const { busy, message, setMessage, run } = useAsyncAction();
  const dirty = JSON.stringify(draft) !== JSON.stringify(document.draft),
    site = document.kind === "site";
  useUnsavedGuard(dirty);
  // Sengaja bergantung pada versi, bukan identitas objek: data loader
  // menghasilkan objek baru tiap invalidate dan akan menghapus ketikan.
  useEffect(() => {
    setDraft(document.draft);
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
      onSaved(updated);
      setMessage("Draft tersimpan. Versi publik belum berubah.");
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
      onSaved(updated);
      setMessage(
        action === "publish" ? "Konten diterbitkan." : "Perubahan tersimpan.",
      );
      setRevisions(null);
    });
  const translate = (field: string, text: string) =>
    run(async () => {
      const target = otherLang(lang);
      const result = await api<{ text: string }>("translate", {
        method: "POST",
        body: JSON.stringify({ text, lang: target }),
      });
      setTranslation({ field, text: result.text, target });
    });
  const entry = draft as EntryData;
  return (
    <div className="document-editor">
      <div className="editor-heading">
        <button className="cms-quiet" onClick={onBack}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <span className="cms-status">
          {document.published ? "Terbit" : "Draft"}
          {dirty ? " · Belum disimpan" : ""}
        </span>
      </div>
      <div className="cms-title-row">
        <div>
          <p className="cms-eyebrow">
            {site
              ? "Profil & pengaturan website"
              : categoryNames[entry.category]}
          </p>
          <h1>
            {site
              ? "Ruang personalmu"
              : entry.translations[lang].title || "Konten baru"}
          </h1>
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
            Simpan draft
          </button>
          <button
            className="cms-button strong"
            disabled={busy || dirty || !document.version}
            onClick={() => {
              if (confirm("Publikasikan versi draft ini ke website?"))
                void action("publish");
            }}
          >
            <Upload size={15} />
            Publish
          </button>
        </div>
      </div>
      <Notice>{message}</Notice>
      <div className="editor-language">
        <button
          className={lang === "id" ? "selected" : ""}
          onClick={() => onLang("id")}
        >
          Indonesia
        </button>
        <button
          className={lang === "en" ? "selected" : ""}
          onClick={() => onLang("en")}
        >
          English
        </button>
        <span>Isi satu bahasa dahulu juga boleh.</span>
      </div>
      <fieldset disabled={busy} className="editor-fields">
        {site ? (
          <SiteForm
            draft={draft as SiteData}
            media={media}
            lang={lang}
            onChange={setDraft}
            onTranslate={translate}
          />
        ) : (
          <EntryForm
            draft={entry}
            media={media}
            lang={lang}
            onChange={setDraft}
            onTranslate={translate}
          />
        )}
        <SeoFields draft={draft} lang={lang} onChange={setDraft} />
      </fieldset>
      {translation ? (
        <TranslationReview
          draft={draft}
          translation={translation}
          onChangeText={(text) => setTranslation({ ...translation, text })}
          onApply={(next, target) => {
            setDraft(next);
            onLang(target);
            setTranslation(null);
          }}
          onCancel={() => setTranslation(null)}
        />
      ) : null}
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
          Riwayat revisi
        </button>
        {!site ? (
          <MarkdownTools
            draft={entry}
            lang={lang}
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
              if (confirm("Tarik konten ini dari website publik?"))
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
