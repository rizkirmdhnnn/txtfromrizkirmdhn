import type { MediaItem, SiteData } from "../lib/cms";
import { splitList } from "../lib/text";
import { AssetField, Field } from "./fields";
import { categoryNames } from "./edit-helpers";

const profileFields = [
  { key: "headline", label: "Headline" },
  { key: "bio", label: "Bio", multiline: true },
  { key: "note", label: "Supporting text" },
  { key: "aboutTitle", label: "About title" },
  {
    key: "aboutBody",
    label: "About content (Markdown)",
    multiline: true,
  },
  { key: "footer", label: "Footer" },
] as const;

export function SiteForm({
  draft,
  media,
  onChange,
}: {
  draft: SiteData;
  media: MediaItem[];
  onChange: (draft: SiteData) => void;
}) {
  const edit = <K extends keyof SiteData>(key: K, value: SiteData[K]) =>
    onChange({ ...draft, [key]: value });
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
        <h2>Identity</h2>
        <div className="field-grid">
          <Field
            label="Text logo"
            value={draft.brand ?? "ar"}
            onChange={(v) => edit("brand", v)}
          />
          <AssetField
            label="Website icon"
            value={draft.icon ?? ""}
            onChange={(v) => edit("icon", v)}
            media={media}
          />
          <Field
            label="Name"
            value={draft.name}
            onChange={(v) => edit("name", v)}
          />
          <Field
            label="Username"
            value={draft.handle}
            onChange={(v) => edit("handle", v)}
          />
          <Field
            label="Location"
            value={draft.location}
            onChange={(v) => edit("location", v)}
          />
          <AssetField
            label="Profile photo"
            value={draft.avatar}
            onChange={(v) => edit("avatar", v)}
            media={media}
          />
        </div>
        <Field
          label="Skills (comma-separated)"
          value={draft.skills.join(", ")}
          onChange={(v) => edit("skills", splitList(v))}
        />
      </section>
      <section className="cms-card">
        <h2>Profile</h2>
        {profileFields.map((field) => (
          <div key={field.key}>
            <Field
              label={field.label}
              value={draft[field.key]}
              onChange={(v) => edit(field.key, v)}
              multiline={"multiline" in field && field.multiline}
            />
          </div>
        ))}
      </section>
      <section className="cms-card">
        <h2>Contact &amp; CV</h2>
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
            label="CV"
            value={draft.cv}
            onChange={(v) => edit("cv", v)}
            media={media}
            pdf
          />
        </div>
      </section>
      <section className="cms-card">
        <h2>Section order &amp; visibility</h2>
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
              Move up
            </button>
            <button
              type="button"
              disabled={index === draft.sections.length - 1}
              onClick={() => move(index, 1)}
            >
              Move down
            </button>
          </div>
        ))}
      </section>
      <details className="cms-card">
        <summary>Interface text</summary>
        <div className="field-grid">
          {Object.entries(draft.words).map(([key, value]) => (
            <Field
              key={key}
              label={key}
              value={value}
              onChange={(next) =>
                onChange({
                  ...draft,
                  words: { ...draft.words, [key]: next },
                })
              }
            />
          ))}
        </div>
      </details>
    </>
  );
}
