import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  User,
  Folder,
  Briefcase,
  FileText,
  Award,
  Image,
  Settings,
  Trash2,
  Plus,
  ExternalLink,
  Menu,
  Download,
} from "lucide-react";
import { api } from "./client";
import { DocumentEditor } from "./document-editor";
import { Field } from "./fields";
import { MaintenancePanel } from "./maintenance-panel";
import {
  emptyEntry,
  type CmsDocument,
  type EntryData,
  type Kind,
  type MediaItem,
} from "../lib/cms";
import { ThemeToggle } from "../components/theme-toggle";
const nav = [
  { id: "overview", label: "Ringkasan", Icon: LayoutDashboard },
  { id: "site", label: "Profil & website", Icon: User },
  { id: "projects", label: "Proyek", Icon: Folder },
  { id: "experience", label: "Pengalaman", Icon: Briefcase },
  { id: "writing", label: "Tulisan", Icon: FileText },
  { id: "about", label: "Tentang & sertifikasi", Icon: Award },
  { id: "media", label: "Media library", Icon: Image },
  { id: "settings", label: "Pengaturan", Icon: Settings },
  { id: "trash", label: "Sampah", Icon: Trash2 },
];
export function Dashboard() {
  const [section, setSection] = useState("overview"),
    [documents, setDocuments] = useState<CmsDocument[]>([]),
    [media, setMedia] = useState<MediaItem[]>([]),
    [selected, setSelected] = useState<CmsDocument | null>(null),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [mobileOpen, setMobileOpen] = useState(false),
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
  function go(id: string) {
    if (!canLeave()) return;
    setSelected(null);
    setDirty(false);
    setSection(id);
    setMobileOpen(false);
    setQuery("");
    if (id === "site") {
      const site = documents.find((d) => d.id === "site");
      if (site) setSelected(site);
    }
  }
  async function action(doc: CmsDocument, action: string) {
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
  return (
    <div className="cms-shell">
      <aside className={`cms-sidebar ${mobileOpen ? "open" : ""}`}>
        <a className="cms-brand" href="/admin">
          ar<span>.</span>
          <small>Studio</small>
        </a>
        <div className="cms-sidebar-caption">Ruang untuk karyamu</div>
        <nav>
          {nav.map(({ id, label, Icon }) => (
            <button
              className={section === id ? "active" : ""}
              key={id}
              onClick={() => go(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/preview" target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Preview website
          </a>
          <a href="/cdn-cgi/access/logout">Keluar</a>
        </div>
      </aside>
      <div className="cms-workspace">
        <header className="cms-topbar">
          <button
            className="cms-mobile-menu"
            aria-label="Buka navigasi"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={20} />
          </button>
          <span>Portofolio / {nav.find((n) => n.id === section)?.label}</span>
          <div>
            <span className="owner-dot" />
            Rizki
            <ThemeToggle lang="id" />
          </div>
        </header>
        <main id="main" className="cms-main">
          {error ? (
            <div className="cms-notice" role="alert">
              {error}
              <button onClick={() => setError("")}>Tutup</button>
            </div>
          ) : null}
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
                      : nav.find((n) => n.id === section)?.label}
                  </h1>
                  <p className="cms-description">
                    {section === "overview"
                      ? "Tempat merawat ide, cerita, dan karya yang kamu bagikan."
                      : "Atur kontenmu dengan tenang. Publikasikan saat sudah siap."}
                  </p>
                </div>
                {["projects", "experience", "writing", "about"].includes(
                  section,
                ) ? (
                  <button
                    className="cms-button strong"
                    onClick={() =>
                      setSelected({
                        id: crypto.randomUUID(),
                        kind: section as Kind,
                        draft: emptyEntry(section as Kind),
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
                <>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <span>Konten terbit</span>
                      <strong>
                        {
                          documents.filter((d) => d.published && !d.deleted)
                            .length
                        }
                      </strong>
                    </div>
                    <div className="stat-card">
                      <span>Draft</span>
                      <strong>
                        {
                          documents.filter((d) => !d.published && !d.deleted)
                            .length
                        }
                      </strong>
                    </div>
                    <div className="stat-card">
                      <span>File media</span>
                      <strong>{media.length}</strong>
                    </div>
                  </div>
                  <section className="cms-card">
                    <h2>Lanjutkan menulis</h2>
                    {documents
                      .filter((d) => !d.deleted)
                      .slice(0, 5)
                      .map((d) => (
                        <button
                          className="document-list-item"
                          key={d.id}
                          onClick={() => {
                            setSection(d.kind);
                            setSelected(d);
                          }}
                        >
                          <span>
                            {d.kind === "site"
                              ? "Profil & website"
                              : (d.draft as EntryData).translations.id.title ||
                                (d.draft as EntryData).translations.en.title ||
                                "Tanpa judul"}
                          </span>
                          <small>{d.published ? "Terbit" : "Draft"}</small>
                        </button>
                      ))}
                    {!documents.length ? (
                      <p>
                        Jalankan impor awal melalui <code>npm run db:seed</code>{" "}
                        untuk menyiapkan konten draft.
                      </p>
                    ) : null}
                  </section>
                  <Analytics />
                </>
              ) : section === "media" ? (
                <MediaLibrary media={media} refresh={refresh} />
              ) : section === "settings" ? (
                <SettingsPanel />
              ) : section === "site" ? (
                <p>Profil belum diimpor. Jalankan impor awal untuk memulai.</p>
              ) : (
                <>
                  <input
                    className="cms-search"
                    aria-label="Cari konten"
                    placeholder="Cari judul atau slug…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <section className="cms-card content-list">
                    {documents
                      .filter((d) =>
                        section === "trash"
                          ? d.deleted
                          : !d.deleted && d.kind === section,
                      )
                      .filter((d) =>
                        JSON.stringify(d.draft)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((d) => (
                        <div className="document-row" key={d.id}>
                          <button
                            className="document-list-item"
                            onClick={() => {
                              if (!d.deleted) setSelected(d);
                            }}
                            disabled={!!d.deleted}
                          >
                            <div>
                              <strong>
                                {(d.draft as EntryData).translations.id.title ||
                                  (d.draft as EntryData).translations.en
                                    .title ||
                                  "Tanpa judul"}
                              </strong>
                              <small>/{(d.draft as EntryData).slug}</small>
                            </div>
                            <span className="cms-status">
                              {d.published ? "Terbit" : "Draft"}
                            </span>
                          </button>
                          <div className="row-actions">
                            {d.deleted ? (
                              <>
                                <button onClick={() => action(d, "restore")}>
                                  Pulihkan
                                </button>
                                <button
                                  className="danger"
                                  onClick={() => action(d, "delete")}
                                >
                                  Hapus permanen
                                </button>
                              </>
                            ) : (
                              <button
                                aria-label="Pindahkan ke sampah"
                                onClick={() => action(d, "trash")}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    {!documents.some((d) =>
                      section === "trash"
                        ? d.deleted
                        : !d.deleted && d.kind === section,
                    ) ? (
                      <p className="empty-list">Belum ada konten di sini.</p>
                    ) : null}
                  </section>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function MediaLibrary({
  media,
  refresh,
}: {
  media: MediaItem[];
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="cms-actions">
        <label className="cms-button strong file-button">
          {busy ? "Mengunggah…" : "Unggah file"}
          <input
            type="file"
            multiple
            disabled={busy}
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              void run(async () => {
                for (const file of files) {
                  if (
                    file.size >
                    (file.type === "application/pdf" ? 20 : 10) * 1024 * 1024
                  )
                    throw new Error("File melebihi batas ukuran");
                  await api("media", {
                    method: "POST",
                    headers: {
                      "Content-Type": file.type,
                      "X-File-Name": encodeURIComponent(file.name),
                    },
                    body: file,
                  });
                }
                setMessage(
                  "File berhasil diunggah. Pilih dari editor untuk menggunakannya.",
                );
              });
              e.target.value = "";
            }}
          />
        </label>
        <span className="cms-description">
          Gambar maks. 10 MB · PDF maks. 20 MB
        </span>
      </div>
      {message ? (
        <p className="cms-notice" role="status">
          {message}
        </p>
      ) : null}
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard
            key={m.id}
            item={m}
            disabled={busy}
            onSave={(alt) =>
              run(async () => {
                await api("media", {
                  method: "PATCH",
                  body: JSON.stringify({ id: m.id, alt }),
                });
                setMessage("Alt text tersimpan.");
              })
            }
            onDelete={() => {
              if (confirm("Hapus file ini secara permanen?"))
                void run(async () => {
                  await api("media", {
                    method: "DELETE",
                    body: JSON.stringify({ id: m.id }),
                  });
                  setMessage("File dihapus.");
                });
            }}
          />
        ))}
      </div>
    </>
  );
}
function MediaCard({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: MediaItem;
  disabled: boolean;
  onSave: (alt: MediaItem["alt"]) => void;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  return (
    <article className="cms-card media-card">
      {item.type.startsWith("image/") ? (
        <img src={`/api/media/${item.id}`} alt={item.alt.id || item.name} />
      ) : (
        <div className="pdf-icon">
          <FileText size={45} />
          <span>PDF</span>
        </div>
      )}
      <strong>{item.name}</strong>
      <small>{(item.size / 1024).toFixed(0)} KB</small>
      {item.type.startsWith("image/") ? (
        <>
          <Field
            label="Alt text Indonesia"
            value={alt.id}
            onChange={(id) => setAlt({ ...alt, id })}
          />
          <Field
            label="Alt text English"
            value={alt.en}
            onChange={(en) => setAlt({ ...alt, en })}
          />
          <button
            className="cms-button"
            disabled={disabled}
            onClick={() => onSave(alt)}
          >
            Simpan alt text
          </button>
        </>
      ) : null}
      <div className="cms-actions">
        <a href={`/api/media/${item.id}`} target="_blank" rel="noreferrer">
          Lihat
        </a>
        <button className="danger" disabled={disabled} onClick={onDelete}>
          Hapus
        </button>
      </div>
    </article>
  );
}
function SettingsPanel() {
  const [settings, setSettings] = useState({
      baseUrl: "",
      model: "",
      apiKey: "",
      hasKey: false,
    }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    api<Omit<typeof settings, "apiKey">>("ai")
      .then((s) => setSettings({ ...s, apiKey: "" }))
      .catch((e) => setMessage(e.message));
  }, []);
  async function save(removeKey = false) {
    setBusy(true);
    try {
      const saved = await api<Omit<typeof settings, "apiKey">>("ai", {
        method: "POST",
        body: JSON.stringify({ ...settings, removeKey }),
      });
      setSettings({ ...saved, apiKey: "" });
      setMessage("Pengaturan AI tersimpan.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <MaintenancePanel />
      <section className="cms-card">
        <h2>Terjemahan dengan AI</h2>
        <p className="cms-description">
          Gunakan provider OpenAI-compatible milikmu. Permintaan hanya dikirim
          ketika kamu menekan terjemahkan atau tes koneksi.
        </p>
        <Field
          label="Base URL (contoh: https://api.provider.com/v1)"
          value={settings.baseUrl}
          onChange={(baseUrl) => setSettings({ ...settings, baseUrl })}
        />
        <Field
          label="Nama model"
          value={settings.model}
          onChange={(model) => setSettings({ ...settings, model })}
        />
        <Field
          label={
            settings.hasKey
              ? "API key baru (kosongkan untuk mempertahankan)"
              : "API key"
          }
          type="password"
          value={settings.apiKey}
          onChange={(apiKey) => setSettings({ ...settings, apiKey })}
        />
        <p className="cms-description">
          {settings.hasKey
            ? "API key tersimpan dan terenkripsi."
            : "Belum ada API key."}
        </p>
        <div className="cms-actions">
          <button
            className="cms-button strong"
            disabled={busy}
            onClick={() => save()}
          >
            Simpan
          </button>
          <button
            className="cms-button"
            disabled={busy || !settings.hasKey}
            onClick={async () => {
              setBusy(true);
              try {
                await api("translate", {
                  method: "POST",
                  body: JSON.stringify({ text: "", lang: "en", test: true }),
                });
                setMessage(
                  "Koneksi berhasil menggunakan pengaturan tersimpan.",
                );
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Tes koneksi
          </button>
          <button
            className="cms-button danger"
            disabled={busy || !settings.hasKey}
            onClick={() => {
              if (confirm("Hapus API key tersimpan?")) void save(true);
            }}
          >
            Hapus key
          </button>
        </div>
        {message ? (
          <p role="status" className="cms-notice">
            {message}
          </p>
        ) : null}
      </section>
      <section className="cms-card">
        <h2>Cadangan konten</h2>
        <p className="cms-description">
          Unduh konten, revisi, pengaturan website, Markdown, dan media. API key
          tidak disertakan.
        </p>
        <a className="cms-button" href="/api/admin/backup">
          <Download size={16} />
          Ekspor cadangan ZIP
        </a>
      </section>
    </>
  );
}
function Analytics() {
  const [days, setDays] = useState("30"),
    [data, setData] = useState<{
      configured: boolean;
      error?: boolean;
      message?: string;
      visits?: number;
      views?: number;
      pages?: { path: string; views: number }[];
      updatedAt?: string;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setData(null);
    api<NonNullable<typeof data>>(`analytics?days=${days}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);
  return (
    <section className="cms-card">
      <div className="cms-title-row">
        <h2>Pengunjung website</h2>
        <select
          aria-label="Periode statistik"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">7 hari terakhir</option>
          <option value="30">30 hari terakhir</option>
        </select>
      </div>
      {error ? (
        <p>{error}</p>
      ) : !data ? (
        <p>Memuat statistik…</p>
      ) : !data.configured || data.error ? (
        <p className="cms-description">{data.message}</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span>Kunjungan</span>
              <strong>{data.visits}</strong>
            </div>
            <div className="stat-card">
              <span>Page views</span>
              <strong>{data.views}</strong>
            </div>
          </div>
          <h3>Halaman populer</h3>
          {data.pages?.length ? (
            data.pages.map((p) => (
              <div className="revision-row" key={p.path}>
                <span>{p.path}</span>
                <strong>{p.views}</strong>
              </div>
            ))
          ) : (
            <p>Belum ada data kunjungan.</p>
          )}
          <small>
            Diperbarui{" "}
            {data.updatedAt
              ? new Date(data.updatedAt).toLocaleString("id-ID")
              : ""}
          </small>
        </>
      )}
    </section>
  );
}
