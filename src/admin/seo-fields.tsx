import type { EntryData, Lang, SiteData } from "../lib/cms";
import { Field } from "./fields";
import { setTranslation } from "./edit-helpers";

export function SeoFields({
  draft,
  lang,
  onChange,
}: {
  draft: EntryData | SiteData;
  lang: Lang;
  onChange: (draft: EntryData | SiteData) => void;
}) {
  const edit = (field: string, value: string) =>
    onChange(setTranslation(draft, lang, field, value));
  return (
    <section className="cms-card">
      <h2>SEO · {lang.toUpperCase()}</h2>
      <Field
        label="Judul halaman"
        value={draft.translations[lang].seoTitle}
        onChange={(v) => edit("seoTitle", v)}
      />
      <Field
        label="Deskripsi pencarian"
        value={draft.translations[lang].seoDescription}
        onChange={(v) => edit("seoDescription", v)}
        multiline
      />
    </section>
  );
}
