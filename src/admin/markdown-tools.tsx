import { parse } from "yaml";
import { entrySchema, type EntryData } from "../lib/cms";
import { entryMarkdown, splitFrontmatter } from "../lib/markdown";
import { downloadText } from "./client";

export function MarkdownTools({
  draft,
  onImport,
  onRun,
}: {
  draft: EntryData;
  onImport: (draft: EntryData, message: string) => void;
  onRun: (task: () => Promise<void>) => Promise<void>;
}) {
  return (
    <>
      <button
        className="cms-button"
        onClick={() => downloadText(`${draft.slug}.md`, entryMarkdown(draft))}
      >
        Export Markdown
      </button>
      <label className="cms-button file-button">
        Import Markdown
        <input
          type="file"
          accept=".md,.markdown"
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            void onRun(async () => {
              if (file.size > 400000) throw new Error("File is too large");
              const raw = await file.text();
              const parsed = splitFrontmatter(raw);
              if (!parsed) {
                onImport(
                  { ...draft, body: raw },
                  "Markdown loaded into the draft. Review it before saving.",
                );
                return;
              }
              const meta = parse(parsed.meta);
              onImport(
                entrySchema.parse({
                  ...draft,
                  ...meta,
                  category: draft.category,
                  body: parsed.body,
                }),
                "Markdown loaded into the draft. Review it before saving.",
              );
            });
            ev.target.value = "";
          }}
        />
      </label>
    </>
  );
}
