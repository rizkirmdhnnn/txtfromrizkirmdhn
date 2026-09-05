import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "./client";
import { ContentList } from "./content-list";
import { DocumentEditor } from "./document-editor";
import { MediaLibrary } from "./media-library";
import { Notice } from "./notice";
import { Overview } from "./overview";
import { SettingsPanel } from "./settings-panel";
import { AdminShell } from "./shell";
import { sectionLabel, type Section } from "./nav";
import {
  emptyEntry,
  kinds,
  type CmsDocument,
  type Kind,
  type MediaItem,
} from "../lib/cms";

const isKind = (section: Section): section is Kind =>
  (kinds as readonly string[]).includes(section);

export function Dashboard() {
  const [section, setSection] = useState<Section>("overview"),
    [documents, setDocuments] = useState<CmsDocument[]>([]),
    [media, setMedia] = useState<MediaItem[]>([]),
    [selected, setSelected] = useState<CmsDocument | null>(null),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState("");
  const refresh = useCallback(async () => {
    const [docs, assets] = await Promise.all([
      api<CmsDocument[]>("documents"),
      api<MediaItem[]>("media"),
    ]);
    setDocuments(docs);
    setMedia(assets);
  }, []);
  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  function canLeave() {
    return (
      !dirty || confirm("Ada perubahan belum disimpan. Tinggalkan editor?")
    );
  }
  function go(id: Section) {
    if (!canLeave()) return;
    setSelected(null);
    setDirty(false);
    setSection(id);
    setQuery("");
    if (id === "site") {
      const site = documents.find((d) => d.id === "site");
      if (site) setSelected(site);
    }
  }
  function open(doc: CmsDocument) {
    if (doc.kind !== "site") setSection(doc.kind);
    setSelected(doc);
  }
  async function act(doc: CmsDocument, action: string) {
    if (
      !confirm(
        action === "delete"
          ? "Hapus permanen konten dan seluruh revisinya?"
          : "Lanjutkan perubahan ini?",
      )
    )
      return;
    try {
      await api("action", {
        method: "POST",
        body: JSON.stringify({ id: doc.id, action, version: doc.version }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const saved = (doc: CmsDocument) => {
    setSelected(doc);
    setDocuments((old) => [doc, ...old.filter((d) => d.id !== doc.id)]);
  };
  const listed = documents.filter((d) =>
    section === "trash" ? d.deleted : !d.deleted && d.kind === section,
  );
  return (
    <AdminShell section={section} onNavigate={go}>
      <Notice role="alert" onDismiss={() => setError("")}>
        {error}
      </Notice>
      {loading ? (
        <p>Memuat ruang kerjamu…</p>
      ) : selected ? (
        <DocumentEditor
          key={selected.id}
          document={selected}
          media={media}
          onSaved={saved}
          onDirty={setDirty}
          onBack={() => {
            if (canLeave()) {
              setSelected(null);
              setDirty(false);
            }
          }}
        />
      ) : (
        <>
          <div className="cms-title-row">
            <div>
              <p className="cms-eyebrow">Personal studio</p>
              <h1>
                {section === "overview"
                  ? "Selamat datang, Rizki."
                  : sectionLabel(section)}
              </h1>
              <p className="cms-description">
                {section === "overview"
                  ? "Tempat merawat ide, cerita, dan karya yang kamu bagikan."
                  : "Atur kontenmu dengan tenang. Publikasikan saat sudah siap."}
              </p>
            </div>
            {isKind(section) ? (
              <button
                className="cms-button strong"
                onClick={() =>
                  setSelected({
                    id: crypto.randomUUID(),
                    kind: section,
                    draft: emptyEntry(section),
                    published: null,
                    slug: null,
                    version: 0,
                    deleted: 0,
                    updated_at: new Date().toISOString(),
                  })
                }
              >
                <Plus size={16} />
                Tambah konten
              </button>
            ) : null}
          </div>
          {section === "overview" ? (
            <Overview documents={documents} media={media} onOpen={open} />
          ) : section === "media" ? (
            <MediaLibrary media={media} onChanged={refresh} />
          ) : section === "settings" ? (
            <SettingsPanel />
          ) : section === "site" ? (
            <p>Profil belum diimpor. Jalankan impor awal untuk memulai.</p>
          ) : (
            <ContentList
              documents={listed}
              query={query}
              onQuery={setQuery}
              onOpen={open}
              onAction={act}
            />
          )}
        </>
      )}
    </AdminShell>
  );
}
