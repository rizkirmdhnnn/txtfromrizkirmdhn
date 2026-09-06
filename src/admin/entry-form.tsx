import type { EntryData, MediaItem } from "../lib/cms";
import { splitList } from "../lib/text";
import { RichEditor } from "./editor";
import { AssetField, Field } from "./fields";

export function EntryForm({
  draft,
  media,
  onMediaUploaded,
  saveLabel,
  focusSignal,
  onFocusMode,
  hideFocusButton,
  onChange,
}: {
  draft: EntryData;
  media: MediaItem[];
  onMediaUploaded: () => void | Promise<void>;
  saveLabel?: React.ReactNode;
  focusSignal?: number;
  onFocusMode?: () => void;
  hideFocusButton?: boolean;
  onChange: (draft: EntryData) => void;
}) {
  const edit = <K extends keyof EntryData>(key: K, value: EntryData[K]) =>
    onChange({ ...draft, [key]: value });
  return (
    <>
      <section className="cms-card">
        <Field
          label="Title"
          value={draft.title}
          onChange={(v) => edit("title", v)}
        />
        <Field
          label="Summary"
          value={draft.summary}
          onChange={(v) => edit("summary", v)}
          multiline
        />
        <div className="body-label">
          <h2>Content</h2>
          <div className="body-label-actions">
            {saveLabel}
            {onFocusMode && !hideFocusButton ? (
              <button
                type="button"
                className="cms-quiet"
                onClick={onFocusMode}
                title="Mode fokus: sembunyikan panel lain (Esc untuk keluar)"
              >
                Mode fokus
              </button>
            ) : null}
          </div>
        </div>
        <RichEditor
          value={draft.body}
          onChange={(v) => edit("body", v)}
          media={media}
          onMediaUploaded={onMediaUploaded}
          focusSignal={focusSignal}
        />
      </section>
      <section className="cms-card">
        <h2>Details &amp; appearance</h2>
        <div className="field-grid">
          <Field
            label="Slug URL"
            value={draft.slug}
            onChange={(v) => edit("slug", v)}
          />
          <Field
            label="Date"
            type="date"
            value={draft.date}
            onChange={(v) => edit("date", v)}
          />
          <Field
            label="Order (lower numbers appear first)"
            type="number"
            value={String(draft.order)}
            onChange={(v) => edit("order", Number(v))}
          />
          <Field
            label="Tags (comma-separated)"
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
            label="Cover image"
            value={draft.cover}
            onChange={(v) => edit("cover", v)}
            media={media}
          />
          <label className="cms-field">
            <span>Concept illustration (without a cover)</span>
            <select
              value={draft.visual}
              onChange={(ev) =>
                edit("visual", ev.target.value as EntryData["visual"])
              }
            >
              <option value="">None</option>
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
            Pin as featured
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.demo}
              onChange={(ev) => edit("demo", ev.target.checked)}
            />
            Mark as demo
          </label>
        </div>
      </section>
    </>
  );
}
