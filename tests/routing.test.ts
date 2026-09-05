import { describe, it, expect } from "vitest";
import { isKind, sectionFromPath } from "../src/lib/routing";
import { tabPaths } from "../src/lib/tabs";
import { entryMarkdown, splitFrontmatter } from "../src/lib/markdown";
import {
  contentLanguage,
  emptyEntry,
  kinds,
  mediaIds,
  otherLang,
} from "../src/lib/cms";

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
    entry.translations.id.title = "Catatan";
    entry.translations.id.body = "# Judul\n\nIsi dengan --- di tengah.";
    const parsed = splitFrontmatter(entryMarkdown(entry, "id"));
    expect(parsed).not.toBeNull();
    expect(parsed!.body).toBe(entry.translations.id.body);
    expect(JSON.parse(parsed!.meta).title).toBe("Catatan");
  });

  it("returns null when there is no frontmatter", () => {
    expect(splitFrontmatter("cuma teks biasa")).toBeNull();
  });
});

describe("language helpers", () => {
  it("flips between the two languages", () => {
    expect(otherLang("id")).toBe("en");
    expect(otherLang("en")).toBe("id");
  });

  it("falls back to the language that actually has a title", () => {
    const entry = emptyEntry("projects");
    entry.translations.en.title = "Only English";
    expect(contentLanguage(entry, "id")).toBe("en");
    expect(contentLanguage(entry, "en")).toBe("en");
    entry.translations.id.title = "Ada judul";
    expect(contentLanguage(entry, "id")).toBe("id");
  });

  it("collects referenced media ids without duplicates", () => {
    const entry = emptyEntry("projects");
    entry.cover = "/api/media/abc-1";
    entry.translations.id.body =
      "![x](/api/media/abc-1) ![y](/api/media/def-2)";
    expect(mediaIds(entry).sort()).toEqual(["abc-1", "def-2"]);
  });
});
