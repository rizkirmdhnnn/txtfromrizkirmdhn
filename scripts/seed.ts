import { readFile, readdir } from "node:fs/promises";
import { parse } from "yaml";
import { defaultWords } from "../src/lib/default-words";
import { profile } from "../src/lib/profile";
import {
  emptyEntry,
  entrySchema,
  type EntryData,
  type SiteData,
} from "../src/lib/cms";
const origin = process.env.CMS_ORIGIN || "http://localhost:3000";
const headers: Record<string, string> = { Origin: origin };
if (process.env.CMS_ACCESS_TOKEN)
  headers["Cf-Access-Jwt-Assertion"] = process.env.CMS_ACCESS_TOKEN;
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${origin}/api/admin/${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok)
    throw new Error(
      `Import ${path} failed (${response.status}): ${await response.text()}`,
    );
  return response.json();
}
const docs = (await api("documents")) as { id: string }[];
const media = (await api("media")) as { id: string; name: string }[];
async function asset(name: string, type: string) {
  const existing = media.find((m) => m.name === name);
  if (existing) return `/api/media/${existing.id}`;
  const bytes = await readFile(
    new URL(`../seed-assets/${name}`, import.meta.url),
  );
  const uploaded = await api("media", {
    method: "POST",
    headers: { "Content-Type": type, "X-File-Name": encodeURIComponent(name) },
    body: bytes,
  });
  if (
    !uploaded ||
    typeof uploaded !== "object" ||
    !("url" in uploaded) ||
    typeof uploaded.url !== "string"
  )
    throw new Error("Invalid upload response");
  return uploaded.url;
}
if (!docs.some((d) => d.id === "site")) {
  const avatar = await asset("avatar.jpg", "image/jpeg"),
    cv = await asset("cv-demo.pdf", "application/pdf");
  const site: SiteData = {
    ...profile,
    brand: "ar",
    icon: "",
    avatar,
    skills: ["Fullstack development", "Cloud & DevOps", "AI-assisted building"],
    cv,
    sections: ["projects", "experience", "writing", "about"].map((key) => ({
      key: key as EntryData["category"],
      visible: true,
    })),
    headline: "Fullstack & cloud",
    bio: defaultWords.bio,
    note: defaultWords.note,
    aboutTitle: "Hello, I’m Rizki.",
    aboutBody:
      "I’m interested in turning ideas into useful things, from the interface to the infrastructure behind it.",
    footer: defaultWords.built,
    seoTitle: "Achmad Rizki Ramadhan — Fullstack & Cloud",
    seoDescription: defaultWords.bio,
    words: {
      ...defaultWords,
      space: "A personal space",
      downloadPdf: "Download PDF",
      liveDemo: "Live demo",
      projectsLabel: "Open source",
    },
  };
  await api("documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "site", kind: "site", version: 0, draft: site }),
  });
}
for (const category of [
  "projects",
  "experience",
  "writing",
  "about",
] as const) {
  for (const file of await readdir(
    new URL(`../content/${category}/`, import.meta.url),
  )) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(
      new URL(`../content/${category}/${file}`, import.meta.url),
      "utf8",
    );
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    const meta = parse(match[1]);
    const draft = entrySchema.parse({
      ...emptyEntry(category),
      ...meta,
      category,
      body: match[2],
    });
    const slug = draft.slug;
    const id = `seed-${category}-${slug}`;
    if (docs.some((d) => d.id === id)) continue;
    await api("documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind: category, version: 0, draft }),
    });
  }
}
console.log(
  "Import complete. All new content is draft; nothing was published.",
);
