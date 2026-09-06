import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  emptyEntry,
  entrySchema,
  siteSchema,
  type CmsDocument,
  type EntryData,
  type Kind,
  type MediaItem,
  type SimpleKind,
  type SiteData,
} from "../lib/cms";
import { api } from "./client";
import { useRefresh } from "./data";
import { AssetField, IMAGE_ACCEPT } from "./fields";
import { uploadImageFiles } from "./image-upload";
import { sectionLabel } from "./nav";
import { Notice } from "./notice";
import { PageHeader } from "./page-header";
import { useDocAutosave } from "./use-doc-autosave";

type EntryDoc = Extract<CmsDocument, { kind: Kind }>;
type SiteDoc = Extract<CmsDocument, { kind: "site" }>;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
// Slug tidak pernah tampil untuk kind ini (tidak ada halaman detail yang
// ditautkan), tapi tetap harus unik saat publish. Akhiran acak mencegah
// bentrok antar foto bernama sama seperti IMG_0001.
function newSlug(base: string, fallback: string) {
  const slug = slugify(base).slice(0, 60).replace(/-+$/, "");
  return `${slug || fallback}-${crypto.randomUUID().slice(0, 6)}`;
}
function titleFromFile(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
const byOrder = (a: EntryDoc, b: EntryDoc) =>
  a.draft.order - b.draft.order ||
  b.draft.date.localeCompare(a.draft.date) ||
  a.draft.title.localeCompare(b.draft.title);

const copy = {
  gallery: {
    description: "Upload photos, give each a title, then publish.",
    add: "Add photos",
    empty: "No photos yet. Add photos to start the gallery.",
  },
  setup: {
    description: "List the gear and tools you use. Group them, then publish.",
    add: "Add item",
    empty: "No items yet. Add the first thing on your desk.",
  },
};

export function ItemManager({
  kind,
  documents,
  media,
}: {
  kind: SimpleKind;
  documents: CmsDocument[];
  media: MediaItem[];
}) {
  const refresh = useRefresh();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const items = documents
    .filter((d): d is EntryDoc => d.kind === kind && !d.deleted)
    .sort(byOrder);
  const site = documents.find((d): d is SiteDoc => d.kind === "site");
  const groups =
    kind === "setup"
      ? [
          ...new Set(items.map((d) => d.draft.group.trim()).filter(Boolean)),
        ].sort()
      : [];
  const nextOrder = () =>
    items.length ? Math.max(...items.map((d) => d.draft.order)) + 1 : 0;
  const fail = (e: unknown) =>
    setMessage(e instanceof Error ? e.message : "Something went wrong");
  const pending = items.filter(
    (d) =>
      !d.published || JSON.stringify(d.published) !== JSON.stringify(d.draft),
  );

  // Pindah urutan mengubah draft dua item sekaligus; satu tombol ini
  // menghindari publish satu per satu. Item yang ditolak server (misalnya
  // belum punya judul) dilewati dan disebutkan.
  const publishAll = async () => {
    setBusy("Publishing…");
    const skipped: string[] = [];
    try {
      for (const doc of pending)
        try {
          await api("action", {
            method: "POST",
            body: JSON.stringify({
              id: doc.id,
              action: "publish",
              version: doc.version,
            }),
          });
        } catch (e) {
          skipped.push(
            `${doc.draft.title || "Untitled"}: ${e instanceof Error ? e.message : "failed"}`,
          );
        }
      setMessage(
        skipped.length
          ? `Published ${pending.length - skipped.length}. Skipped ${skipped.join("; ")}.`
          : `Published ${pending.length} ${pending.length === 1 ? "item" : "items"}.`,
      );
    } finally {
      setBusy("");
      await refresh();
    }
  };

  const create = (draft: Partial<EntryData>) =>
    api("documents", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        kind,
        version: 0,
        draft: { ...emptyEntry(kind), ...draft },
      }),
    });

  const addPhotos = async (files: File[]) => {
    let order = nextOrder();
    let done = 0;
    try {
      for (const file of files) {
        setBusy(`Uploading ${done + 1} of ${files.length}…`);
        const [item] = await uploadImageFiles([file]);
        const title = titleFromFile(file.name);
        await create({
          title,
          slug: newSlug(title, kind),
          cover: `/api/media/${item.id}`,
          order: order++,
        });
        done++;
      }
      setMessage(
        done === 1
          ? "Photo added as a draft. Check the title, then publish."
          : `${done} photos added as drafts. Check the titles, then publish.`,
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
      await refresh();
    }
  };

  const addItem = async () => {
    setBusy("Adding…");
    try {
      await create({ slug: newSlug("", kind), order: nextOrder() });
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
      await refresh();
    }
  };

  // Urutan disimpan sebagai `order` berurutan 0..n-1. Baris yang sedang
  // diketik menyesuaikan `order` barunya lewat useDocAutosave.
  const move = async (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy("Reordering…");
    try {
      for (const [i, doc] of next.entries())
        if (doc.draft.order !== i)
          await api("documents", {
            method: "POST",
            body: JSON.stringify({
              id: doc.id,
              kind,
              version: doc.version,
              draft: { ...doc.draft, order: i },
              revision: false,
            }),
          });
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
      await refresh();
    }
  };

  return (
    <>
      <PageHeader
        title={sectionLabel(kind)}
        description={copy[kind].description}
        action={
          <div className="cms-actions">
            {pending.length > 1 ? (
              <button
                className="cms-button"
                disabled={Boolean(busy)}
                onClick={() => void publishAll()}
              >
                Publish all ({pending.length})
              </button>
            ) : null}
            {kind === "gallery" ? (
              <label className="cms-button strong file-button">
                <Plus size={16} />
                {busy || copy.gallery.add}
                <input
                  type="file"
                  multiple
                  accept={IMAGE_ACCEPT}
                  disabled={Boolean(busy)}
                  onChange={(event) => {
                    const files = [...(event.target.files ?? [])];
                    event.target.value = "";
                    if (files.length) void addPhotos(files);
                  }}
                />
              </label>
            ) : (
              <button
                className="cms-button strong"
                disabled={Boolean(busy)}
                onClick={() => void addItem()}
              >
                <Plus size={16} />
                {busy || copy.setup.add}
              </button>
            )}
          </div>
        }
      />
      <Notice onDismiss={() => setMessage("")}>{message}</Notice>
      {kind === "setup" && site ? (
        <SetupHeader site={site} media={media} onSaved={() => refresh()} />
      ) : null}
      <section className="cms-card item-list">
        {items.map((doc, index) => (
          <ItemRow
            key={doc.id}
            doc={doc}
            kind={kind}
            index={index}
            count={items.length}
            locked={Boolean(busy)}
            onMove={move}
            onSaved={() => refresh()}
            onNotice={setMessage}
          />
        ))}
        {!items.length ? (
          <p className="empty-list">{copy[kind].empty}</p>
        ) : null}
        {groups.length ? (
          <datalist id="setup-groups">
            {groups.map((group) => (
              <option value={group} key={group} />
            ))}
          </datalist>
        ) : null}
      </section>
    </>
  );
}

function ItemRow({
  doc,
  kind,
  index,
  count,
  locked,
  onMove,
  onSaved,
  onNotice,
}: {
  doc: EntryDoc;
  kind: SimpleKind;
  index: number;
  count: number;
  locked: boolean;
  onMove: (index: number, offset: number) => void;
  onSaved: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const { draft, setDraft, status, dirty, valid, action } =
    useDocAutosave<EntryData>({
      doc,
      validate: (d) => entrySchema.safeParse(d).success,
      onSaved,
    });
  const [replacing, setReplacing] = useState(false);
  const edit = <K extends keyof EntryData>(key: K, value: EntryData[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const live = Boolean(doc.published);
  const changed =
    dirty || JSON.stringify(doc.published) !== JSON.stringify(doc.draft);
  const state = !live
    ? "Draft"
    : changed
      ? "Changes not published"
      : "Published";
  const saving = status.kind === "saving";
  const note =
    status.kind === "error"
      ? status.message
      : !valid
        ? "Use an https:// link."
        : saving
          ? "Saving…"
          : "";

  const replacePhoto = async (file: File) => {
    setReplacing(true);
    try {
      const [item] = await uploadImageFiles([file]);
      edit("cover", `/api/media/${item.id}`);
    } catch (e) {
      onNotice(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className={`item-row${kind === "gallery" ? " with-photo" : ""}`}>
      {kind === "gallery" ? (
        <div className="item-photo">
          {draft.cover ? (
            <img src={draft.cover} alt="" />
          ) : (
            <div className="item-photo-empty">No photo</div>
          )}
          <label className="cms-button file-button">
            {replacing ? "Uploading…" : "Replace"}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              disabled={replacing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void replacePhoto(file);
              }}
            />
          </label>
        </div>
      ) : null}
      <div className="item-fields">
        {kind === "setup" ? (
          <div className="pair">
            <input
              aria-label="Group"
              placeholder="Group (Hardware, Software…)"
              list="setup-groups"
              value={draft.group}
              onChange={(e) => edit("group", e.target.value)}
            />
            <input
              className="title"
              aria-label="Name"
              placeholder="Name"
              value={draft.title}
              onChange={(e) => edit("title", e.target.value)}
            />
          </div>
        ) : (
          <input
            className="title"
            aria-label="Title"
            placeholder="Title"
            value={draft.title}
            onChange={(e) => edit("title", e.target.value)}
          />
        )}
        <textarea
          aria-label="Description"
          placeholder="One or two sentences."
          rows={2}
          value={draft.summary}
          onChange={(e) => edit("summary", e.target.value)}
        />
        <input
          aria-label="Link"
          placeholder="https://"
          inputMode="url"
          value={draft.demoUrl}
          onChange={(e) => edit("demoUrl", e.target.value)}
        />
      </div>
      <div className="item-side">
        <span className={`cms-status${live && changed ? " pending" : ""}`}>
          {state}
        </span>
        <button
          className="cms-button strong"
          disabled={locked || saving || !valid || (live && !changed)}
          onClick={() => void action("publish")}
        >
          Publish
        </button>
        <div className="icon-row">
          <button
            type="button"
            aria-label="Move up"
            disabled={locked || index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={locked || index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            className="danger"
            aria-label="Move to trash"
            disabled={locked || saving}
            onClick={() =>
              void action("trash").then((ok) => {
                if (ok) onNotice("Moved to trash. Restore it from Trash.");
              })
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
        {note ? (
          <small
            className={`item-state${status.kind === "error" || !valid ? " error" : ""}`}
          >
            {note}
          </small>
        ) : null}
      </div>
    </div>
  );
}

// Foto meja dan pengantar tersimpan di dokumen profil (site), jadi tombol
// Publish di sini menerbitkan dokumen itu. Perubahan profil lain yang belum
// terbit ikut naik; dikatakan terang-terangan hanya bila memang ada.
function SetupHeader({
  site,
  media,
  onSaved,
}: {
  site: SiteDoc;
  media: MediaItem[];
  onSaved: () => Promise<void>;
}) {
  const { draft, setDraft, status, dirty, valid, action } =
    useDocAutosave<SiteData>({
      doc: site,
      validate: (d) => siteSchema.safeParse(d).success,
      onSaved,
    });
  const upload = async (file: File) => {
    const [item] = await uploadImageFiles([file]);
    await onSaved();
    return `/api/media/${item.id}`;
  };
  const strip = (s: SiteData) =>
    JSON.stringify({ ...s, setupCover: "", setupIntro: "" });
  const headerChanged =
    dirty ||
    !site.published ||
    site.published.setupCover !== site.draft.setupCover ||
    site.published.setupIntro !== site.draft.setupIntro;
  const otherChanges =
    Boolean(site.published) && strip(site.draft) !== strip(site.published!);
  const saving = status.kind === "saving";
  return (
    <section className="cms-card">
      <h2>Header</h2>
      <div className="item-header-grid">
        <AssetField
          label="Desk photo"
          value={draft.setupCover}
          onChange={(v) => setDraft((d) => ({ ...d, setupCover: v }))}
          media={media}
          onUpload={upload}
        />
        <label className="cms-field">
          <span>Intro</span>
          <textarea
            rows={4}
            placeholder="A sentence or two above the list. Markdown works."
            value={draft.setupIntro}
            onChange={(e) =>
              setDraft((d) => ({ ...d, setupIntro: e.target.value }))
            }
          />
        </label>
      </div>
      <div className="cms-actions">
        <button
          className="cms-button strong"
          disabled={saving || !valid || !headerChanged}
          onClick={() => void action("publish")}
        >
          Publish header
        </button>
        <span
          className={`cms-status${site.published && headerChanged ? " pending" : ""}`}
        >
          {!site.published
            ? "Draft"
            : headerChanged
              ? "Changes not published"
              : "Published"}
        </span>
        {otherChanges ? (
          <span className="cms-description">
            Publishing also applies other unpublished profile changes.
          </span>
        ) : null}
        {status.kind === "error" ? (
          <small className="item-state error">{status.message}</small>
        ) : saving ? (
          <small className="item-state">Saving…</small>
        ) : null}
      </div>
    </section>
  );
}
