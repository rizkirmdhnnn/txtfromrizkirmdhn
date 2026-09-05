import type { EntryData, SiteData } from "../lib/cms";
import { Field } from "./fields";

export function SeoFields({
  draft,
  onChange,
}: {
  draft: EntryData | SiteData;
  onChange: (draft: EntryData | SiteData) => void;
}) {
  const edit = (field: "seoTitle" | "seoDescription", value: string) =>
    onChange({ ...draft, [field]: value });
  return (
    <section className="cms-card">
      <h2>SEO</h2>
      <Field
        label="Page title"
        value={draft.seoTitle}
        onChange={(v) => edit("seoTitle", v)}
      />
      <Field
        label="Search description"
        value={draft.seoDescription}
        onChange={(v) => edit("seoDescription", v)}
        multiline
      />
    </section>
  );
}
