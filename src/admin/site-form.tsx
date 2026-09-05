import { Languages } from "lucide-react";
import type { Lang, MediaItem, SiteData } from "../lib/cms";
import { splitList } from "../lib/text";
import { AssetField, Field } from "./fields";
import { categoryNames, setTranslation } from "./edit-helpers";

const profileFields = [
  { key: "headline", label: "Headline" },
  { key: "bio", label: "Bio", multiline: true, translatable: true },
  { key: "note", label: "Kalimat pendamping" },
  { key: "aboutTitle", label: "Judul tentang" },
  {
    key: "aboutBody",
    label: "Isi tentang (Markdown)",
    multiline: true,
    translatable: true,
  },
  { key: "footer", label: "Footer" },
] as const;

export function SiteForm({
  draft,
  media,
  lang,
  onChange,
  onTranslate,
}: {
  draft: SiteData;
  media: MediaItem[];
  lang: Lang;
  onChange: (draft: SiteData) => void;
  onTranslate: (field: string, text: string) => void;
}) {
  const edit = <K extends keyof SiteData>(key: K, value: SiteData[K]) =>
    onChange({ ...draft, [key]: value });
  const editText = (field: string, value: string) =>
    onChange(setTranslation(draft, lang, field, value));
  const move = (index: number, offset: number) => {
    const sections = [...draft.sections];
    [sections[index + offset], sections[index]] = [
      sections[index],
      sections[index + offset],
    ];
    edit("sections", sections);
  };
  return (
    <>
      <section className="cms-card">
        <h2>Identitas</h2>
        <div className="field-grid">
          <Field
            label="Logo teks"
            value={draft.brand ?? "ar"}
            onChange={(v) => edit("brand", v)}
          />
          <AssetField
            label="Ikon website"
            value={draft.icon ?? ""}
            onChange={(v) => edit("icon", v)}
            media={media}
          />
          <Field
            label="Nama"
            value={draft.name}
            onChange={(v) => edit("name", v)}
          />
          <Field
            label="Username"
            value={draft.handle}
            onChange={(v) => edit("handle", v)}
          />
          <Field
            label="Lokasi"
            value={draft.location}
            onChange={(v) => edit("location", v)}
          />
          <AssetField
            label="Foto profil"
            value={draft.avatar}
            onChange={(v) => edit("avatar", v)}
            media={media}
          />
        </div>
        <Field
          label="Keahlian (pisahkan dengan koma)"
          value={draft.skills.join(", ")}
          onChange={(v) => edit("skills", splitList(v))}
        />
      </section>
      <section className="cms-card">
        <h2>Profil · {lang.toUpperCase()}</h2>
        {profileFields.map((field) => (
          <div key={field.key}>
            <Field
              label={field.label}
              value={draft.translations[lang][field.key]}
              onChange={(v) => editText(field.key, v)}
              multiline={"multiline" in field && field.multiline}
            />
            {"translatable" in field && field.translatable ? (
              <button
                type="button"
                className="cms-quiet"
                onClick={() =>
                  onTranslate(field.key, draft.translations[lang][field.key])
                }
              >
                <Languages size={14} />
                Buat terjemahan
              </button>
            ) : null}
          </div>
        ))}
      </section>
      <section className="cms-card">
        <h2>Kontak &amp; CV</h2>
        <div className="field-grid">
          {(["email", "whatsapp", "github", "linkedin"] as const).map(
            (field) => (
              <Field
                key={field}
                label={field === "whatsapp" ? "WhatsApp (628…)" : field}
                value={draft[field]}
                onChange={(v) => edit(field, v)}
              />
            ),
          )}
          <AssetField
            label="CV Indonesia"
            value={draft.cv.id}
            onChange={(v) => edit("cv", { ...draft.cv, id: v })}
            media={media}
            pdf
          />
          <AssetField
            label="CV English"
            value={draft.cv.en}
            onChange={(v) => edit("cv", { ...draft.cv, en: v })}
            media={media}
            pdf
          />
        </div>
      </section>
      <section className="cms-card">
        <h2>Urutan &amp; visibilitas bagian</h2>
        {draft.sections.map((section, index) => (
          <div className="section-order" key={section.key}>
            <label>
              <input
                type="checkbox"
                checked={section.visible}
                onChange={(event) =>
                  edit(
                    "sections",
                    draft.sections.map((x) =>
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
              onClick={() => move(index, -1)}
            >
              Naik
            </button>
            <button
              type="button"
              disabled={index === draft.sections.length - 1}
              onClick={() => move(index, 1)}
            >
              Turun
            </button>
          </div>
        ))}
      </section>
      <details className="cms-card">
        <summary>Teks antarmuka · {lang.toUpperCase()}</summary>
        <div className="field-grid">
          {Object.entries(draft.translations[lang].words).map(
            ([key, value]) => (
              <Field
                key={key}
                label={key}
                value={value}
                onChange={(next) =>
                  onChange({
                    ...draft,
                    translations: {
                      ...draft.translations,
                      [lang]: {
                        ...draft.translations[lang],
                        words: {
                          ...draft.translations[lang].words,
                          [key]: next,
                        },
                      },
                    },
                  })
                }
              />
            ),
          )}
        </div>
      </details>
    </>
  );
}
