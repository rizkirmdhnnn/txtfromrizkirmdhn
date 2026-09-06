import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, Focus, Save, Upload, History, X } from "lucide-react";
import {
  entrySchema,
  siteSchema,
  type CmsDocument,
  type EntryData,
  type SiteData,
  type MediaItem,
} from "../lib/cms";
import { api } from "./client";
import { categoryNames } from "./edit-helpers";
import { EntryForm } from "./entry-form";
import { MarkdownTools } from "./markdown-tools";
import { Notice } from "./notice";
import { RevisionList, type Revision } from "./revision-list";
import { SeoFields } from "./seo-fields";
import { SiteForm } from "./site-form";
import { useAsyncAction } from "./use-async-action";
import { useAutosave, useSaveState, formatSaveTime } from "./use-autosave";
import { useUnsavedGuard } from "./use-unsaved-guard";
import { useRefresh } from "./data";

// Serah-terima draft saat rute berpindah dari /admin/$kind/new ke
// /admin/$kind/$id. Kedua rute itu komponen berbeda, jadi DocumentEditor
// di-unmount dan di-mount ulang; tanpa titipan ini, ketikan yang terjadi
// selama request "create" masih berjalan akan hilang karena editor menyemai
// ulang dari dokumen server. Hanya diisi untuk dokumen yang baru dibuat
// (version 0) dan langsung dikonsumsi oleh mount berikutnya.
let newDocumentHandoff: { id: string; draft: CmsDocument["draft"] } | null =
  null;

function takeHandoff(id: string) {
  if (newDocumentHandoff?.id !== id) return null;
  const { draft } = newDocumentHandoff;
  newDocumentHandoff = null;
  return draft;
}

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
  const [draft, setDraft] = useState(
      () => takeHandoff(document.id) ?? document.draft,
    ),
    [savedDraft, setSavedDraft] = useState(document.draft),
    [revisions, setRevisions] = useState<Revision[] | null>(null),
    [focusMode, setFocusMode] = useState(false),
    [focusSignal, setFocusSignal] = useState(0);
  const { busy, message, setMessage, run } = useAsyncAction();
  // saving = autosave berjalan di latar; tidak me-disable form (berbeda
  // dengan busy yang mengunci fieldset untuk aksi manual).
  const [saving, setSaving] = useState(false);
  const refresh = useRefresh();
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft),
    site = document.kind === "site";
  // Autosave hanya menembak draft yang lolos skema server. Tanpa ini slug,
  // tanggal, atau URL yang masih setengah diketik akan memicu 400 berulang
  // dan menampilkan "Gagal menyimpan otomatis" di tengah pengetikan.
  const draftValid = (site ? siteSchema : entrySchema).safeParse(draft).success;
  useUnsavedGuard(dirty);
  // Refs agar callback async selalu memakai nilai terbaru tanpa
  // membuat ulang effect autosave.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const documentRef = useRef(document);
  // Jangan mundurkan ke versi prop yang lebih tua. Pada /admin/$kind/new prop
  // `document` dibekukan di version 0, jadi setelah autosave pertama membuat
  // barisnya (version 1) autosave kedua akan mengirim version 0 dan ditolak
  // 409 sampai rute selesai berpindah.
  if (
    documentRef.current.id !== document.id ||
    document.version >= documentRef.current.version
  )
    documentRef.current = document;
  const syncedIdRef = useRef(document.id);
  // Sinkronisasi prop hanya bila form tidak dirty — mencegah ketikan hilang
  // saat refresh() mendarat setelah autosave/manual save. Sengaja bergantung
  // pada versi, bukan identitas objek: data loader menghasilkan objek baru
  // tiap invalidate dan akan menghapus ketikan.
  useEffect(() => {
    // Pengecualian: bila dokumennya berganti, selalu seed ulang. documentRef
    // sudah menunjuk dokumen baru, jadi menahan draft lama karena dirty akan
    // membuat autosave menimpa isi dokumen tujuan dengan draft dokumen lama.
    const switched = syncedIdRef.current !== document.id;
    syncedIdRef.current = document.id;
    const isDirty =
      JSON.stringify(draftRef.current) !== JSON.stringify(savedDraft);
    if (switched || !isDirty) {
      setDraft(document.draft);
      setSavedDraft(document.draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id, document.version]);

  const persistDraft = async (
    next: CmsDocument["draft"],
    opts: { silent: boolean },
  ) => {
    const doc = documentRef.current;
    const updated = await api<CmsDocument>("documents", {
      method: "POST",
      body: JSON.stringify({
        id: doc.id,
        kind: doc.kind,
        version: doc.version,
        draft: next,
        revision: !opts.silent,
      }),
    });
    documentRef.current = updated;
    setSavedDraft(updated.draft);
    // Dokumen baru saja dibuat: onSaved akan memindahkan rute dan me-mount
    // ulang editor, jadi titipkan ketikan yang masuk selama request berjalan.
    if (doc.version === 0 && draftRef.current !== updated.draft)
      newDocumentHandoff = { id: updated.id, draft: draftRef.current };
    await onSaved(updated);
    if (!opts.silent)
      setMessage("Draft saved. The published version has not changed.");
  };

  const save = () =>
    run(() => persistDraft(draftRef.current, { silent: false }));

  const { subscribe, getState } = useAutosave({
    document,
    draft,
    dirty,
    valid: draftValid,
    busy: busy || saving,
    save: async (next, opts) => {
      setSaving(true);
      try {
        await persistDraft(next, opts);
      } finally {
        setSaving(false);
      }
    },
  });
  const saveState = useSaveState(subscribe, getState);

  useEffect(() => {
    // `document` adalah prop CmsDocument yang me-shadow global document,
    // jadi akses DOM lewat window secara eksplisit.
    const body = window.document.body;
    if (!focusMode) return;
    const prevOverflow = body.style.overflow;
    body.classList.add("cms-focus");
    body.style.overflow = "hidden";
    return () => {
      body.classList.remove("cms-focus");
      body.style.overflow = prevOverflow;
    };
  }, [focusMode]);

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

  // Urutan penting: status "saved" bertahan sampai simpan berikutnya, jadi
  // `dirty` harus didahulukan — kalau tidak, label masih memamerkan
  // "Tersimpan otomatis" padahal ada perubahan yang belum tersimpan.
  const saveLabel =
    saveState.status === "saving" || saving ? (
      <span className="save-state">Menyimpan…</span>
    ) : saveState.status === "error" ? (
      <span className="save-state error">
        Gagal menyimpan otomatis: {saveState.message}
      </span>
    ) : dirty ? (
      <span className="save-state">Belum disimpan</span>
    ) : saveState.status === "saved" ? (
      <span className="save-state">
        Tersimpan otomatis · {formatSaveTime(saveState.at)}
      </span>
    ) : (
      <span className="save-state">Semua perubahan tersimpan</span>
    );

  const focusButton = () => {
    setFocusMode(true);
    setFocusSignal((n) => n + 1);
  };

  // Catatan struktur: form dirender SEKALI saja, di posisi pohon React yang
  // sama untuk kedua mode. Mode fokus hanya menukar chrome di sekitarnya dan
  // menambah class CSS — kalau form dipindah ke cabang JSX lain, React akan
  // unmount RichEditor dan riwayat undo TipTap ikut hilang tiap toggle.
  return (
    <div className={`document-editor${focusMode ? " focus-mode" : ""}`}>
      {focusMode ? (
        <div className="focus-overlay-bar">
          <div className="focus-overlay-title">
            <strong>
              {site ? "Your personal space" : entry.title || "New content"}
            </strong>
            <span className="cms-status">
              {document.published ? "Published" : "Draft"}
              {dirty ? " · Unsaved changes" : ""}
            </span>
          </div>
          <div className="focus-overlay-actions">
            {saveLabel}
            {site || !document.version ? null : (
              <button
                type="button"
                className="focus-overlay-button"
                onClick={() =>
                  window.open(`/preview?slug=${entry.slug}`, "_blank")
                }
                title="Buka pratinjau di tab baru"
              >
                <Eye size={15} />
                Preview
              </button>
            )}
            <button
              type="button"
              className="focus-overlay-button"
              onClick={() => setFocusMode(false)}
              title="Keluar dari mode fokus (Esc)"
            >
              <X size={15} />
              Keluar (Esc)
            </button>
          </div>
        </div>
      ) : (
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
      )}
      <div className="editor-scroll">
        <div className="editor-canvas">
          {focusMode ? null : (
            <div className="cms-title-row">
              <div>
                <p className="cms-eyebrow">
                  {site
                    ? "Profile & website settings"
                    : categoryNames[entry.category]}
                </p>
                <h1>
                  {site ? "Your personal space" : entry.title || "New content"}
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
                  // Tetap aktif walau tidak dirty: autosave sengaja tidak
                  // menulis revisi, jadi ini satu-satunya cara memaksa snapshot.
                  disabled={busy || saving}
                  onClick={() => void save()}
                >
                  <Save size={15} />
                  Save draft
                </button>
                <button
                  className="cms-button strong"
                  disabled={busy || saving || dirty || !document.version}
                  onClick={() => {
                    if (confirm("Publish this draft to the website?"))
                      void action("publish");
                  }}
                >
                  <Upload size={15} />
                  Publish
                </button>
                {!site ? (
                  <button
                    className="cms-button"
                    disabled={busy || saving}
                    onClick={focusButton}
                    title="Mode fokus: hanya editor (Esc untuk keluar)"
                  >
                    <Focus size={15} />
                    Focus
                  </button>
                ) : null}
              </div>
            </div>
          )}
          <Notice>{message}</Notice>
          <fieldset disabled={busy} className="editor-fields">
            {site ? (
              <SiteForm
                draft={draft as SiteData}
                media={media}
                onChange={setDraft}
              />
            ) : (
              <EntryForm
                draft={entry}
                media={media}
                onChange={setDraft}
                onMediaUploaded={() => refresh()}
                // Di mode fokus indikatornya sudah ada di overlay bar; tanpa
                // ini label yang sama tampil dua kali sekaligus.
                saveLabel={focusMode ? undefined : saveLabel}
                focusSignal={focusSignal}
                hideFocusButton={focusMode}
                onFocusMode={focusButton}
              />
            )}
            {focusMode ? null : <SeoFields draft={draft} onChange={setDraft} />}
          </fieldset>
          {focusMode ? null : (
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
          )}
          {focusMode || !revisions ? null : (
            <RevisionList
              revisions={revisions}
              disabled={busy || dirty}
              onRestore={(id) => void action("revision", id)}
            />
          )}
        </div>
      </div>
      <FocusModeKeys active={focusMode} onExit={() => setFocusMode(false)} />
    </div>
  );
}

function FocusModeKeys({
  active,
  onExit,
}: {
  active: boolean;
  onExit: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      // Popup slash & link menahan Escape-nya sendiri dengan stopPropagation,
      // jadi event yang sampai ke sini memang ditujukan untuk keluar dari mode
      // fokus. Sengaja TIDAK memakai e.defaultPrevented: prosemirror-view
      // selalu preventDefault() Escape (captureKeyDown), sehingga cek itu akan
      // membuat Escape tidak pernah bekerja selama kursor di dalam editor.
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onExit]);
  return null;
}
