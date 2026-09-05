import { parse } from "yaml";
export type Lang = "id" | "en";
export type Category = "projects" | "experience" | "writing" | "about";
export type Entry = {
  slug: string;
  category: Category;
  lang: Lang;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  demo?: boolean;
  pinned?: boolean;
  visual?: string;
  repo?: string;
  body: string;
};
const files = import.meta.glob("../../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
export const entries: Entry[] = Object.entries(files)
  .map(([path, raw]) => {
    const match = String(raw).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`Invalid Markdown frontmatter: ${path}`);
    const data = parse(match[1]);
    for (const key of ["slug", "category", "lang", "title", "summary", "date"])
      if (typeof data[key] !== "string")
        throw new Error(`Missing ${key}: ${path}`);
    return { tags: [], ...data, body: match[2] } as Entry;
  })
  .sort(
    (a, b) =>
      Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date),
  );
export function getEntries(lang: Lang, category: Category) {
  return entries.filter((e) => e.lang === lang && e.category === category);
}
