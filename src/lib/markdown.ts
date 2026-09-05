import type { EntryData } from "./cms";

export function splitFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? { meta: match[1], body: match[2] } : null;
}

export function entryMarkdown(entry: EntryData) {
  const { body, ...meta } = entry;
  return `---\n${JSON.stringify(meta, null, 2)}\n---\n${body}`;
}
