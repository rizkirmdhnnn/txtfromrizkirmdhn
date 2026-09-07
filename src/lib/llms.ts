import { kinds, type Kind, type PublicData } from "./cms";
import { defaultWords } from "./default-words";

const pagePaths: Record<Kind, string> = {
  projects: "/",
  experience: "/experience",
  writing: "/writing",
  about: "/about",
  setup: "/setup",
  gallery: "/gallery",
};

const pageDescriptions: Record<Kind, string> = {
  projects: "Featured work and projects",
  experience: "Work experience and roles",
  writing: "Notes and articles",
  about: "About the author",
  setup: "Hardware and software in use",
  gallery: "Photos",
};

/**
 * llms.txt — ringkasan situs yang mudah diparse LLM (llmstxt.org).
 * Memberi AI engine konteks: siapa pemiliknya, halaman apa saja, dan daftar
 * tulisan/proyek dengan tautan + tanggal.
 */
export function llmsTxt(host: string, data: PublicData) {
  const origin = `https://${host}`;
  const site = data.site;
  if (!site) {
    return `# Portfolio\n\n> ${origin}\n\nThis personal site is being prepared.\n`;
  }
  const words = { ...defaultWords, ...site.words };
  const visible = new Set(
    site.sections.filter((s) => s.visible).map((s) => s.key),
  );
  const lines: string[] = [];
  lines.push(`# ${site.name}`);
  if (site.headline) lines.push("", `> ${site.headline}`);
  if (site.bio) lines.push("", site.bio);
  const facts: string[] = [];
  if (site.location) facts.push(`Location: ${site.location}`);
  if (site.email) facts.push(`Email: ${site.email}`);
  if (site.github) facts.push(`GitHub: ${site.github}`);
  if (site.linkedin) facts.push(`LinkedIn: ${site.linkedin}`);
  if (site.skills.length) facts.push(`Skills: ${site.skills.join(", ")}`);
  if (facts.length) lines.push("", facts.map((f) => `- ${f}`).join("\n"));
  lines.push("", "## Pages");
  for (const kind of kinds) {
    if (!visible.has(kind)) continue;
    lines.push(
      `- [${words[kind]}](${origin}${pagePaths[kind]}): ${pageDescriptions[kind]}`,
    );
  }
  for (const kind of kinds) {
    const entries = data.entries.filter((e) => e.category === kind);
    if (!entries.length) continue;
    lines.push("", `## ${words[kind]}`);
    for (const entry of entries) {
      const description = entry.summary
        ? `: ${entry.summary.replace(/\s+/g, " ").slice(0, 200)}`
        : "";
      lines.push(
        `- [${entry.title}](${origin}/post/${entry.slug})${description} (${entry.date})`,
      );
    }
  }
  return lines.join("\n");
}
