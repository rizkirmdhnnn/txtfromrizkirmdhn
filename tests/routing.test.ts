import { describe, it, expect } from "vitest";
import { isKind, sectionFromPath } from "../src/lib/routing";
import { tabPaths } from "../src/lib/tabs";
import { entryMarkdown, splitFrontmatter } from "../src/lib/markdown";
import { emptyEntry, kinds, mediaIds, siteSchema } from "../src/lib/cms";
import { defaultWords } from "../src/lib/default-words";

describe("admin paths", () => {
  it("maps every sidebar destination back to its section", () => {
    expect(sectionFromPath("/admin")).toBe("overview");
    expect(sectionFromPath("/admin/")).toBe("overview");
    expect(sectionFromPath("/admin/profile")).toBe("site");
    expect(sectionFromPath("/admin/media")).toBe("media");
    expect(sectionFromPath("/admin/settings")).toBe("settings");
    expect(sectionFromPath("/admin/trash")).toBe("trash");
    for (const kind of kinds) {
      expect(sectionFromPath(`/admin/${kind}`)).toBe(kind);
      expect(sectionFromPath(`/admin/${kind}/some-id`)).toBe(kind);
      expect(sectionFromPath(`/admin/${kind}/new`)).toBe(kind);
    }
  });

  it("falls back to overview for unknown segments", () => {
    expect(sectionFromPath("/admin/nonsense")).toBe("overview");
    expect(sectionFromPath("/admin/PROJECTS")).toBe("overview");
  });

  it("accepts only real content kinds as a dynamic segment", () => {
    for (const kind of kinds) expect(isKind(kind)).toBe(true);
    for (const value of ["site", "media", "settings", "trash", "new", ""])
      expect(isKind(value)).toBe(false);
  });
});

describe("public tab paths", () => {
  it("gives every kind a destination and keeps the bare domain for projects", () => {
    for (const kind of kinds) expect(tabPaths[kind]).toMatch(/^\//);
    expect(tabPaths.projects).toBe("/");
    expect(new Set(Object.values(tabPaths)).size).toBe(kinds.length);
  });
});

describe("markdown round trip", () => {
  it("reads back what it wrote, keeping body and title", () => {
    const entry = emptyEntry("writing");
    entry.slug = "catatan";
    entry.title = "Catatan";
    entry.body = "# Judul\n\nIsi dengan --- di tengah.";
    const parsed = splitFrontmatter(entryMarkdown(entry));
    expect(parsed).not.toBeNull();
    expect(parsed!.body).toBe(entry.body);
    expect(JSON.parse(parsed!.meta).title).toBe("Catatan");
  });

  it("returns null when there is no frontmatter", () => {
    expect(splitFrontmatter("cuma teks biasa")).toBeNull();
  });
});

describe("media references", () => {
  it("collects referenced media ids without duplicates", () => {
    const entry = emptyEntry("projects");
    entry.cover = "/api/media/abc-1";
    entry.body = "![x](/api/media/abc-1) ![y](/api/media/def-2)";
    expect(mediaIds(entry).sort()).toEqual(["abc-1", "def-2"]);
  });
});

import { englishUrl } from "../src/lib/legacy-url";
import { publicHead } from "../src/lib/public-head";
describe("English URLs and metadata", () => {
  it("removes only language queries, without loops or changing private/API requests", () => {
    for (const lang of ["id", "en", "fr", ""]) {
      const result = englishUrl(
        new Request(
          `https://portfolio.example/post/test?lang=${lang}&utm_source=share#main`,
        ),
      );
      expect(result).toBe(
        "https://portfolio.example/post/test?utm_source=share#main",
      );
      expect(englishUrl(new Request(result!))).toBeNull();
    }
    for (const path of [
      "/admin",
      "/admin/profile",
      "/api/media/test",
      "/preview",
      "/_serverFn/test",
    ])
      expect(
        englishUrl(new Request(`https://portfolio.example${path}?lang=en`)),
      ).toBeNull();
    expect(
      englishUrl(
        new Request("https://portfolio.example/?lang=en", { method: "POST" }),
      ),
    ).toBeNull();
    expect(
      englishUrl(
        new Request("https://portfolio.example/?lang=id&lang=en&tab=writing"),
      ),
    ).toBe("https://portfolio.example/?tab=writing");
  });
  it("uses a single canonical URL and English Open Graph locale", () => {
    const head = publicHead({
      data: {
        site: null,
        entries: [],
        media: {},
        preview: false,
        origin: "https://portfolio.example",
      },
      path: "/post/example",
      title: "Example",
      description: "Description",
    });
    expect(head.links).toEqual([
      { rel: "canonical", href: "https://portfolio.example/post/example" },
    ]);
    expect(head.meta).toContainEqual({
      property: "og:locale",
      content: "en_US",
    });
    expect(head.meta).toContainEqual({
      property: "og:url",
      content: "https://portfolio.example/post/example",
    });
    expect(JSON.stringify(head)).not.toContain("hreflang");
  });
});

describe("interface text contract", () => {
  it("still accepts stored words the code no longer defines", () => {
    // Dokumen site di produksi menyimpan key dari versi lama. Memperketat
    // skema ini menjadi objek dengan key tetap akan menolak dokumen itu,
    // dan halaman publik ikut kosong karena site menjadi null.
    const parsed = siteSchema.shape.words.parse({
      ...defaultWords,
      cvNote: "key yang sudah dibuang dari kode",
    });
    expect(parsed.cvNote).toBe("key yang sudah dibuang dari kode");
    expect(parsed.downloadPdf).toBe(defaultWords.downloadPdf);
  });

  it("lets a stored value win and falls back to the default otherwise", () => {
    const t = { ...defaultWords, ...{ contact: "Say hi" } };
    expect(t.contact).toBe("Say hi");
    expect(t.space).toBe("A personal space");
  });
});
