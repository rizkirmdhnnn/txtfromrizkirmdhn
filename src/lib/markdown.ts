import type { EntryData, Lang } from "./cms";

export function splitFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? { meta: match[1], body: match[2] } : null;
}

export function entryMarkdown(entry: EntryData, lang: Lang) {
  const translation = entry.translations[lang];
  const meta = { ...entry, translations: undefined, ...translation, lang };
  return `---\n${JSON.stringify(meta, null, 2)}\n---\n${translation.body}`;
}
