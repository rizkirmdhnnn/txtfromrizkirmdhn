import { useEffect, useState } from "react";
import { parse } from "yaml";
import { ArrowLeft, Eye, Save, Upload, History, Languages } from "lucide-react";
import type {
  CmsDocument,
  EntryData,
  SiteData,
  Lang,
  MediaItem,
} from "../lib/cms";
import { entrySchema } from "../lib/cms";
import { api, downloadText } from "./client";
import { RichEditor } from "./editor";
import { Field, AssetField } from "./fields";
const categoryNames = {
  projects: "Proyek",
  experience: "Pengalaman",
  writing: "Tulisan",
  about: "Tentang & sertifikasi",
};
export function DocumentEditor({
  document,
  media,
  onSaved,
  onBack,
  onDirty,
}: {
  document: CmsDocument;
  media: MediaItem[];
  onSaved: (d: CmsDocument) => void;
  onBack: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState(document.draft),
    [lang, setLang] = useState<Lang>("id"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [revisions, setRevisions] = useState<
      | { id: string; action: string; created_at: string; snapshot: string }[]
      | null
    >(null),
    [translation, setTranslation] = useState<{
      field: string;
      text: string;
      target: Lang;
    } | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(document.draft),
    site = document.kind === "site";
  useEffect(() => {
    onDirty(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      onDirty(false);
    };
  }, [dirty, onDirty]);
  useEffect(() => {
    setDraft(document.draft);
  }, [document]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }
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
  function editEntry<K extends keyof EntryData>(key: K, value: EntryData[K]) {
    setDraft({ ...draft, [key]: value } as EntryData);
  }
  function editSite<K extends keyof SiteData>(key: K, value: SiteData[K]) {
    setDraft({ ...draft, [key]: value } as SiteData);
  }
  function textField(field: string, value: string) {
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [lang]: { ...draft.translations[lang], [field]: value },
      },
    } as EntryData | SiteData);
  }
  async function translate(field: string) {
    const target = lang === "id" ? "en" : "id";
    const text = String(
      (draft.translations[lang] as unknown as Record<string, unknown>)[field] ??
        "",
    );
    await run(async () => {
      const result = await api<{ text: string }>("translate", {
        method: "POST",
        body: JSON.stringify({ text, lang: target }),
      });
      setTranslation({ field, text: result.text, target });
    });
  }
  const e = draft as EntryData,
    s = draft as SiteData;
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
            {site ? "Profil & pengaturan website" : categoryNames[e.category]}
          </p>
          <h1>
            {site
              ? "Ruang personalmu"
              : e.translations[lang].title || "Konten baru"}
          </h1>
        </div>
        <div className="cms-actions">
          <button
            className="cms-button"
            disabled={dirty || !document.version}
            onClick={() =>
              window.open(`/preview${site ? "" : `?slug=${e.slug}`}`, "_blank")
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
      {message ? (
        <p className="cms-notice" role="status">
          {message}
        </p>
      ) : null}
      <div className="editor-language">
        <button
          className={lang === "id" ? "selected" : ""}
          onClick={() => setLang("id")}
        >
          Indonesia
        </button>
        <button
          className={lang === "en" ? "selected" : ""}
          onClick={() => setLang("en")}
        >
          English
        </button>
        <span>Isi satu bahasa dahulu juga boleh.</span>
      </div>
      <fieldset disabled={busy} className="editor-fields">
        {site ? (
          <>
            <section className="cms-card">
              <h2>Identitas</h2>
              <div className="field-grid">
                <Field
                  label="Logo teks"
                  value={s.brand ?? "ar"}
                  onChange={(v) => editSite("brand", v)}
                />
                <AssetField
                  label="Ikon website"
                  value={s.icon ?? ""}
                  onChange={(v) => editSite("icon", v)}
                  media={media}
                />
                <Field
                  label="Nama"
                  value={s.name}
                  onChange={(v) => editSite("name", v)}
                />
                <Field
                  label="Username"
                  value={s.handle}
                  onChange={(v) => editSite("handle", v)}
                />
                <Field
                  label="Lokasi"
                  value={s.location}
                  onChange={(v) => editSite("location", v)}
                />
                <AssetField
                  label="Foto profil"
                  value={s.avatar}
                  onChange={(v) => editSite("avatar", v)}
                  media={media}
                />
              </div>
              <Field
                label="Keahlian (pisahkan dengan koma)"
                value={s.skills.join(", ")}
                onChange={(v) =>
                  editSite(
                    "skills",
                    v
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
              />
            </section>
            <section className="cms-card">
              <h2>Profil · {lang.toUpperCase()}</h2>
              {(
                [
                  "headline",
                  "bio",
                  "note",
                  "aboutTitle",
                  "aboutBody",
                  "footer",
                ] as const
              ).map((field) => (
                <div key={field}>
                  <Field
                    label={
                      {
                        headline: "Headline",
                        bio: "Bio",
                        note: "Kalimat pendamping",
                        aboutTitle: "Judul tentang",
                        aboutBody: "Isi tentang (Markdown)",
                        footer: "Footer",
                      }[field]
                    }
                    value={s.translations[lang][field]}
                    onChange={(v) => textField(field, v)}
                    multiline={field === "bio" || field === "aboutBody"}
                  />
                  {["bio", "aboutBody"].includes(field) ? (
                    <button
                      type="button"
                      className="cms-quiet"
                      onClick={() => translate(field)}
                    >
                      <Languages size={14} />
                      Buat terjemahan
                    </button>
                  ) : null}
                </div>
              ))}
            </section>
            <section className="cms-card">
              <h2>Kontak & CV</h2>
              <div className="field-grid">
                {(["email", "whatsapp", "github", "linkedin"] as const).map(
                  (field) => (
                    <Field
                      key={field}
                      label={field === "whatsapp" ? "WhatsApp (628…)" : field}
                      value={s[field]}
                      onChange={(v) => editSite(field, v)}
                    />
                  ),
                )}
                <AssetField
                  label="CV Indonesia"
                  value={s.cv.id}
                  onChange={(v) => editSite("cv", { ...s.cv, id: v })}
                  media={media}
                  pdf
                />
                <AssetField
                  label="CV English"
                  value={s.cv.en}
                  onChange={(v) => editSite("cv", { ...s.cv, en: v })}
                  media={media}
                  pdf
                />
              </div>
            </section>
            <section className="cms-card">
              <h2>Urutan & visibilitas bagian</h2>
              {s.sections.map((section, index) => (
                <div className="section-order" key={section.key}>
                  <label>
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={(event) =>
                        editSite(
                          "sections",
                          s.sections.map((x) =>
                            x.key === section.key
                              ? { ...x, visible: event.target.checked }
                              : x,
                          ),
                        )
                      }
                    />
                    {categoryNames[section.key]}
                  </label>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      const sections = [...s.sections];
                      [sections[index - 1], sections[index]] = [
                        sections[index],
                        sections[index - 1],
                      ];
                      editSite("sections", sections);
                    }}
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    disabled={index === s.sections.length - 1}
                    onClick={() => {
                      const sections = [...s.sections];
                      [sections[index + 1], sections[index]] = [
                        sections[index],
                        sections[index + 1],
                      ];
                      editSite("sections", sections);
                    }}
                  >
                    Turun
                  </button>
                </div>
              ))}
            </section>
            <details className="cms-card">
              <summary>Teks antarmuka · {lang.toUpperCase()}</summary>
              <div className="field-grid">
                {Object.entries(s.translations[lang].words).map(
                  ([key, value]) => (
                    <Field
                      key={key}
                      label={key}
                      value={value}
                      onChange={(value) => {
                        setDraft({
                          ...s,
                          translations: {
                            ...s.translations,
                            [lang]: {
                              ...s.translations[lang],
                              words: {
                                ...s.translations[lang].words,
                                [key]: value,
                              },
                            },
                          },
                        });
                      }}
                    />
                  ),
                )}
              </div>
            </details>
          </>
        ) : (
          <>
            <section className="cms-card">
              <Field
                label="Judul"
                value={e.translations[lang].title}
                onChange={(v) => textField("title", v)}
              />
              <button
                type="button"
                className="cms-quiet"
                onClick={() => translate("title")}
              >
                <Languages size={14} />
                Terjemahkan judul
              </button>
              <Field
                label="Ringkasan"
                value={e.translations[lang].summary}
                onChange={(v) => textField("summary", v)}
                multiline
              />
              <button
                type="button"
                className="cms-quiet"
                onClick={() => translate("summary")}
              >
                <Languages size={14} />
                Terjemahkan ringkasan
              </button>
              <div className="body-label">
                <h2>Isi konten</h2>
                <button
                  type="button"
                  className="cms-quiet"
                  onClick={() => translate("body")}
                >
                  <Languages size={14} />
                  Buat terjemahan
                </button>
              </div>
              <RichEditor
                key={lang}
                value={e.translations[lang].body}
                onChange={(v) => textField("body", v)}
                media={media}
              />
            </section>
            <section className="cms-card">
              <h2>Detail & tampilan</h2>
              <div className="field-grid">
                <Field
                  label="Slug URL"
                  value={e.slug}
                  onChange={(v) => editEntry("slug", v)}
                />
                <Field
                  label="Tanggal"
                  type="date"
                  value={e.date}
                  onChange={(v) => editEntry("date", v)}
                />
                <Field
                  label="Urutan (angka kecil tampil dahulu)"
                  type="number"
                  value={String(e.order)}
                  onChange={(v) => editEntry("order", Number(v))}
                />
                <Field
                  label="Tags (pisahkan dengan koma)"
                  value={e.tags.join(", ")}
                  onChange={(v) =>
                    editEntry(
                      "tags",
                      v
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    )
                  }
                />
                <Field
                  label="Repository URL"
                  value={e.repo}
                  onChange={(v) => editEntry("repo", v)}
                />
                <Field
                  label="Demo URL"
                  value={e.demoUrl}
                  onChange={(v) => editEntry("demoUrl", v)}
                />
                <AssetField
                  label="Gambar sampul"
                  value={e.cover}
                  onChange={(v) => editEntry("cover", v)}
                  media={media}
                />
                <label className="cms-field">
                  <span>Ilustrasi konsep (jika tanpa sampul)</span>
                  <select
                    value={e.visual}
                    onChange={(ev) =>
                      editEntry(
                        "visual",
                        ev.target.value as EntryData["visual"],
                      )
                    }
                  >
                    <option value="">Tidak ada</option>
                    <option value="mail">Mailriz</option>
                    <option value="storage">Cloud storage</option>
                    <option value="agent">AI agent</option>
                  </select>
                </label>
              </div>
              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={e.pinned}
                    onChange={(ev) => editEntry("pinned", ev.target.checked)}
                  />
                  Sematkan sebagai pilihan
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={e.demo}
                    onChange={(ev) => editEntry("demo", ev.target.checked)}
                  />
                  Tandai sebagai demo
                </label>
              </div>
            </section>
          </>
        )}
        <section className="cms-card">
          <h2>SEO · {lang.toUpperCase()}</h2>
          <Field
            label="Judul halaman"
            value={draft.translations[lang].seoTitle}
            onChange={(v) => textField("seoTitle", v)}
          />
          <Field
            label="Deskripsi pencarian"
            value={draft.translations[lang].seoDescription}
            onChange={(v) => textField("seoDescription", v)}
            multiline
          />
        </section>
      </fieldset>
      {translation ? (
        <section className="cms-card translation-review">
          <h2>Tinjau terjemahan · {translation.target.toUpperCase()}</h2>
          <textarea
            aria-label="Hasil terjemahan"
            value={translation.text}
            onChange={(ev) =>
              setTranslation({ ...translation, text: ev.target.value })
            }
          />
          <div className="cms-actions">
            <button className="cms-button" onClick={() => setTranslation(null)}>
              Batalkan
            </button>
            <button
              className="cms-button strong"
              onClick={() => {
                const current = (
                  draft.translations[translation.target] as unknown as Record<
                    string,
                    string
                  >
                )[translation.field];
                if (
                  current &&
                  !confirm("Ganti teks terjemahan yang sudah ada pada draft?")
                )
                  return;
                setDraft({
                  ...draft,
                  translations: {
                    ...draft.translations,
                    [translation.target]: {
                      ...draft.translations[translation.target],
                      [translation.field]: translation.text,
                    },
                  },
                } as EntryData | SiteData);
                setLang(translation.target);
                setTranslation(null);
              }}
            >
              Terapkan ke draft
            </button>
          </div>
        </section>
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
          <>
            <button
              className="cms-button"
              onClick={() =>
                downloadText(
                  `${e.slug}.${lang}.md`,
                  `---\n${JSON.stringify({ ...e, translations: undefined, ...e.translations[lang], lang }, null, 2)}\n---\n${e.translations[lang].body}`,
                )
              }
            >
              Ekspor Markdown
            </button>
            <label className="cms-button file-button">
              Impor Markdown
              <input
                type="file"
                accept=".md,.markdown"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  void run(async () => {
                    if (file.size > 400000)
                      throw new Error("File terlalu besar");
                    const raw = await file.text(),
                      match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
                    if (match) {
                      const meta = parse(match[1]);
                      const merged = entrySchema.parse({
                        ...e,
                        ...meta,
                        category: e.category,
                        translations: {
                          ...e.translations,
                          [lang]: {
                            ...e.translations[lang],
                            title: meta.title ?? e.translations[lang].title,
                            summary:
                              meta.summary ?? e.translations[lang].summary,
                            body: match[2],
                          },
                        },
                      });
                      setDraft(merged);
                    } else textField("body", raw);
                    setMessage(
                      "Markdown dimuat ke draft. Simpan setelah diperiksa.",
                    );
                  });
                  ev.target.value = "";
                }}
              />
            </label>
          </>
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
        <section className="cms-card">
          <h2>Riwayat revisi</h2>
          <p>Memulihkan versi tidak mengubah website publik.</p>
          {revisions.map((r) => (
            <div className="revision-row" key={r.id}>
              <span>
                {new Date(r.created_at).toLocaleString("id-ID")} · {r.action}
              </span>
              <button
                className="cms-button"
                disabled={busy || dirty}
                onClick={() => {
                  if (confirm("Pulihkan versi ini menjadi draft?"))
                    void action("revision", r.id);
                }}
              >
                Pulihkan
              </button>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
