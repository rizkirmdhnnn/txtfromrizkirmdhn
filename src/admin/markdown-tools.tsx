import { parse } from "yaml";
import { entrySchema, type EntryData, type Lang } from "../lib/cms";
import { entryMarkdown, splitFrontmatter } from "../lib/markdown";
import { downloadText } from "./client";
import { setTranslation } from "./edit-helpers";

export function MarkdownTools({
  draft,
  lang,
  onImport,
  onRun,
}: {
  draft: EntryData;
  lang: Lang;
  onImport: (draft: EntryData, message: string) => void;
  onRun: (task: () => Promise<void>) => Promise<void>;
}) {
  return (
    <>
      <button
        className="cms-button"
        onClick={() =>
          downloadText(`${draft.slug}.${lang}.md`, entryMarkdown(draft, lang))
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
            void onRun(async () => {
              if (file.size > 400000) throw new Error("File terlalu besar");
              const raw = await file.text();
              const parsed = splitFrontmatter(raw);
              if (!parsed) {
                onImport(
                  setTranslation(draft, lang, "body", raw),
                  "Markdown dimuat ke draft. Simpan setelah diperiksa.",
                );
                return;
              }
              const meta = parse(parsed.meta);
              const translation = draft.translations[lang];
              onImport(
                entrySchema.parse({
                  ...draft,
                  ...meta,
                  category: draft.category,
                  translations: {
                    ...draft.translations,
                    [lang]: {
                      ...translation,
                      title: meta.title ?? translation.title,
                      summary: meta.summary ?? translation.summary,
                      body: parsed.body,
                    },
                  },
                }),
                "Markdown dimuat ke draft. Simpan setelah diperiksa.",
              );
            });
            ev.target.value = "";
          }}
        />
      </label>
    </>
  );
}
