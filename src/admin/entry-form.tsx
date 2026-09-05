import { Languages } from "lucide-react";
import type { EntryData, Lang, MediaItem } from "../lib/cms";
import { splitList } from "../lib/text";
import { RichEditor } from "./editor";
import { AssetField, Field } from "./fields";
import { setTranslation } from "./edit-helpers";

export function EntryForm({
  draft,
  media,
  lang,
  onChange,
  onTranslate,
}: {
  draft: EntryData;
  media: MediaItem[];
  lang: Lang;
  onChange: (draft: EntryData) => void;
  onTranslate: (field: string, text: string) => void;
}) {
  const edit = <K extends keyof EntryData>(key: K, value: EntryData[K]) =>
    onChange({ ...draft, [key]: value });
  const editText = (field: string, value: string) =>
    onChange(setTranslation(draft, lang, field, value));
  const translation = draft.translations[lang];
  return (
    <>
      <section className="cms-card">
        <Field
          label="Judul"
          value={translation.title}
          onChange={(v) => editText("title", v)}
        />
        <button
          type="button"
          className="cms-quiet"
          onClick={() => onTranslate("title", translation.title)}
        >
          <Languages size={14} />
          Terjemahkan judul
        </button>
        <Field
          label="Ringkasan"
          value={translation.summary}
          onChange={(v) => editText("summary", v)}
          multiline
        />
        <button
          type="button"
          className="cms-quiet"
          onClick={() => onTranslate("summary", translation.summary)}
        >
          <Languages size={14} />
          Terjemahkan ringkasan
        </button>
        <div className="body-label">
          <h2>Isi konten</h2>
          <button
            type="button"
            className="cms-quiet"
            onClick={() => onTranslate("body", translation.body)}
          >
            <Languages size={14} />
            Buat terjemahan
          </button>
        </div>
        <RichEditor
          value={translation.body}
          onChange={(v) => editText("body", v)}
          media={media}
        />
      </section>
      <section className="cms-card">
        <h2>Detail &amp; tampilan</h2>
        <div className="field-grid">
          <Field
            label="Slug URL"
            value={draft.slug}
            onChange={(v) => edit("slug", v)}
          />
          <Field
            label="Tanggal"
            type="date"
            value={draft.date}
            onChange={(v) => edit("date", v)}
          />
          <Field
            label="Urutan (angka kecil tampil dahulu)"
            type="number"
            value={String(draft.order)}
            onChange={(v) => edit("order", Number(v))}
          />
          <Field
            label="Tags (pisahkan dengan koma)"
            value={draft.tags.join(", ")}
            onChange={(v) => edit("tags", splitList(v))}
          />
          <Field
            label="Repository URL"
            value={draft.repo}
            onChange={(v) => edit("repo", v)}
          />
          <Field
            label="Demo URL"
            value={draft.demoUrl}
            onChange={(v) => edit("demoUrl", v)}
          />
          <AssetField
            label="Gambar sampul"
            value={draft.cover}
            onChange={(v) => edit("cover", v)}
            media={media}
          />
          <label className="cms-field">
            <span>Ilustrasi konsep (jika tanpa sampul)</span>
            <select
              value={draft.visual}
              onChange={(ev) =>
                edit("visual", ev.target.value as EntryData["visual"])
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
              checked={draft.pinned}
              onChange={(ev) => edit("pinned", ev.target.checked)}
            />
            Sematkan sebagai pilihan
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.demo}
              onChange={(ev) => edit("demo", ev.target.checked)}
            />
            Tandai sebagai demo
          </label>
        </div>
      </section>
    </>
  );
}
