import { kinds, type EntryData, type Kind, type SiteData } from "../lib/cms";
import { defaultWords } from "../lib/default-words";
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
  const isSite = "sections" in draft;
  // Halaman utama memakai field SEO situs di atas, jadi section "projects"
  // tidak punya halaman terpisah untuk diatur.
  const sectionKinds = kinds.filter((k) => k !== "projects");
  const editSection = (
    kind: Kind,
    field: "seoTitle" | "seoDescription",
    value: string,
  ) => {
    if (!isSite) return;
    const current = draft.sectionSeo[kind] ?? {
      seoTitle: "",
      seoDescription: "",
    };
    onChange({
      ...draft,
      sectionSeo: {
        ...draft.sectionSeo,
        [kind]: { ...current, [field]: value },
      },
    });
  };
  return (
    <section className="cms-card">
      <h2>SEO</h2>
      <Field
        label={isSite ? "Homepage title" : "Page title"}
        value={draft.seoTitle}
        onChange={(v) => edit("seoTitle", v)}
      />
      <Field
        label={isSite ? "Homepage description" : "Search description"}
        value={draft.seoDescription}
        onChange={(v) => edit("seoDescription", v)}
        multiline
      />
      {isSite ? (
        <details className="seo-sections">
          <summary>
            Section pages — kosongkan untuk judul otomatis (“Writing —
            {draft.name || "your name"}”)
          </summary>
          {sectionKinds.map((kind) => (
            <div className="seo-section" key={kind}>
              <h3>{defaultWords[kind]}</h3>
              <Field
                label="Title"
                value={draft.sectionSeo[kind]?.seoTitle ?? ""}
                onChange={(v) => editSection(kind, "seoTitle", v)}
              />
              <Field
                label="Description"
                value={draft.sectionSeo[kind]?.seoDescription ?? ""}
                onChange={(v) => editSection(kind, "seoDescription", v)}
                multiline
              />
            </div>
          ))}
        </details>
      ) : null}
    </section>
  );
}
