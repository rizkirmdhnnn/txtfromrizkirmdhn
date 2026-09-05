import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { emptyEntry } from "../src/lib/cms";
import {
  applyMigration,
  planMigration,
  snapshot,
  type Snapshot,
} from "../scripts/english-migration";

function legacy(title = "English title") {
  const {
    title: _,
    summary,
    body,
    seoTitle,
    seoDescription,
    ...data
  } = emptyEntry("writing");
  return {
    ...data,
    translations: {
      id: {
        title: "Judul",
        summary: "Ringkasan",
        body: "## Konten\n\n`code`",
        seoTitle,
        seoDescription,
      },
      en: {
        title,
        summary: "English summary",
        body: "## Content\n\n`code`",
        seoTitle,
        seoDescription,
      },
    },
  };
}
function source(): Snapshot {
  const draft = JSON.stringify(legacy());
  return {
    documents: [
      {
        id: "doc",
        kind: "writing",
        draft,
        published: JSON.stringify(legacy("Published title")),
        slug: "original",
        version: 7,
        deleted: 0,
        updated_at: "2026-09-01",
        mutation: "old",
      },
      {
        id: "trash",
        kind: "writing",
        draft,
        published: null,
        slug: null,
        version: 3,
        deleted: 1,
        updated_at: "2026-09-01",
        mutation: "old",
      },
    ],
    revisions: [
      {
        id: "rev",
        document_id: "doc",
        snapshot: JSON.stringify(legacy("Revision title")),
        action: "save",
        created_at: "2026-09-01",
      },
    ],
    media: [
      {
        id: "image",
        name: "image.jpg",
        type: "image/jpeg",
        size: 5,
        alt: JSON.stringify({ id: "Gambar", en: "Image" }),
        created_at: "2026-09-01",
      },
    ],
    integrations: [
      {
        id: "maintenance",
        value: JSON.stringify({
          enabled: true,
          translations: {
            id: { title: "Tunggu", body: "Kembali nanti" },
            en: { title: "Please wait", body: "Back soon" },
          },
        }),
      },
      { id: "ai", value: '{"encryptedKey":"old-key"}' },
    ],
    redirects: [{ slug: "old", document_id: "doc" }],
  };
}
function database(data: Snapshot) {
  const db = new DatabaseSync(":memory:");
  for (const file of [
    "0001_cms.sql",
    "0002_mutation_guard.sql",
    "0003_english_media.sql",
  ])
    db.exec(readFileSync(`migrations/${file}`, "utf8"));
  for (const [table, rows] of Object.entries(data))
    for (const row of rows)
      db.prepare(
        `INSERT INTO ${table} (${Object.keys(row).join(",")}) VALUES (${Object.keys(
          row,
        )
          .map(() => "?")
          .join(",")})`,
      ).run(...Object.values(row));
  return db;
}

describe("English content migration", () => {
  it("preserves draft/publication boundaries, revisions, trash, redirects and assets; is repeatable", () => {
    const db = database(source());
    try {
      const before = snapshot(db);
      const plan = planMigration(before);
      expect(plan.errors).toEqual([]);
      expect(applyMigration(db, plan)).toBeGreaterThan(0);
      const after = snapshot(db);
      const doc = after.documents.find((d) => d.id === "doc")!;
      expect(JSON.parse(String(doc.draft)).title).toBe("English title");
      expect(JSON.parse(String(doc.published)).title).toBe("Published title");
      expect(JSON.parse(String(after.revisions[0].snapshot)).title).toBe(
        "Revision title",
      );
      expect(after.documents.find((d) => d.id === "trash")).toMatchObject({
        deleted: 1,
        published: null,
        version: 3,
      });
      expect(doc).toMatchObject({
        slug: "original",
        version: 7,
        mutation: "old",
        updated_at: "2026-09-01",
      });
      expect(after.redirects).toEqual(before.redirects);
      expect(after.media[0]).toEqual({ ...before.media[0], alt: '"Image"' });
      expect(after.integrations).toEqual([
        {
          id: "maintenance",
          value: JSON.stringify({
            enabled: true,
            title: "Please wait",
            body: "Back soon",
          }),
        },
      ]);
      expect(JSON.stringify(after)).not.toContain("translations");
      const second = planMigration(after);
      expect(second.errors).toEqual([]);
      expect(applyMigration(db, second)).toBe(0);
    } finally {
      db.close();
    }
  });
  it("requires reviewed translations for each missing field and retains existing English", () => {
    const data = source();
    const draft = legacy("");
    draft.translations.en.body = "";
    data.documents[0].draft = JSON.stringify(draft);
    data.media[0].alt = JSON.stringify({ id: "Gambar", en: "" });
    const first = planMigration(data);
    expect(
      Object.values(first.translations)
        .map((t) => t.source)
        .sort(),
    ).toEqual(["## Konten\n\n`code`", "Gambar", "Judul"]);
    const values: Record<string, string> = {
      Judul: "Translated title",
      Gambar: "Translated image",
      "## Konten\n\n`code`": "## Content\n\n`code`",
    };
    const translations = Object.fromEntries(
      Object.entries(first.translations).map(([key, t]) => [
        key,
        { ...t, english: values[t.source], reviewed: true },
      ]),
    );
    const complete = planMigration(data, translations);
    expect(complete.errors).toEqual([]);
    const changed = JSON.parse(
      complete.changes.find(
        (c) =>
          c.table === "documents" && c.id === "doc" && c.column === "draft",
      )!.after!,
    );
    expect(changed).toMatchObject({
      title: "Translated title",
      summary: "English summary",
      body: "## Content\n\n`code`",
    });
    translations[Object.keys(translations)[0]].reviewed = false;
    expect(planMigration(data, translations).errors.length).toBeGreaterThan(0);
  });
  it("blocks incomplete, stale or tampered plans without partial writes", () => {
    const db = database(source());
    try {
      const before = snapshot(db),
        plan = planMigration(before);
      const tampered = structuredClone(plan);
      tampered.changes[0].after = "{}";
      expect(() => applyMigration(db, tampered)).toThrow("do not match");
      expect(snapshot(db)).toEqual(before);
      db.prepare("UPDATE documents SET version=8 WHERE id='doc'").run();
      const current = snapshot(db);
      expect(() => applyMigration(db, plan)).toThrow("Source changed");
      expect(snapshot(db)).toEqual(current);
    } finally {
      db.close();
    }
  });
  it("blocks missing media and preserves empty optional fields", () => {
    const data = source();
    const draft = legacy();
    draft.cover = "/api/media/missing";
    data.documents[0].draft = JSON.stringify(draft);
    expect(planMigration(data).errors).toContain(
      "Missing asset missing in documents/doc",
    );
    const clean = planMigration(source());
    expect(JSON.parse(clean.changes[0].after!).seoTitle).toBe("");
  });
  it("converts profile copy, interface words, and a reviewed replacement CV", () => {
    const data = source();
    const site = {
      name: "Owner",
      brand: "ar",
      icon: "",
      handle: "owner",
      location: "Indonesia",
      avatar: "",
      email: "",
      whatsapp: "",
      github: "",
      linkedin: "",
      skills: [],
      cv: { id: "/api/media/old-cv", en: "" },
      sections: ["projects", "experience", "writing", "about"].map((key) => ({
        key,
        visible: true,
      })),
      translations: {
        id: {
          headline: "Profil",
          bio: "",
          note: "",
          aboutTitle: "",
          aboutBody: "",
          footer: "",
          seoTitle: "",
          seoDescription: "",
          words: { contact: "Hubungi", read: "Baca" },
        },
        en: {
          headline: "Profile",
          bio: "",
          note: "",
          aboutTitle: "",
          aboutBody: "",
          footer: "",
          seoTitle: "",
          seoDescription: "",
          words: { contact: "Contact" },
        },
      },
    };
    data.documents.push({
      ...data.documents[0],
      id: "site",
      kind: "site",
      draft: JSON.stringify(site),
      published: null,
      slug: null,
    });
    data.media.push({
      id: "new-cv",
      name: "cv.pdf",
      type: "application/pdf",
      size: 20,
      alt: '\"\"',
      created_at: "2026-09-01",
    });
    const first = planMigration(data);
    expect(
      Object.values(first.translations)
        .map((t) => t.kind)
        .sort(),
    ).toEqual(["cv", "text"]);
    const reviewed = Object.fromEntries(
      Object.entries(first.translations).map(([key, value]) => [
        key,
        {
          ...value,
          english: value.kind === "cv" ? "/api/media/new-cv" : "Read",
          reviewed: true,
        },
      ]),
    );
    const ready = planMigration(data, reviewed);
    expect(ready.errors).toEqual([]);
    expect(
      JSON.parse(ready.changes.find((c) => c.id === "site")!.after!),
    ).toMatchObject({
      headline: "Profile",
      words: { contact: "Contact", read: "Read" },
      cv: "/api/media/new-cv",
    });
    const cv = Object.values(reviewed).find((t) => t.kind === "cv")!;
    cv.english = "/api/media/image";
    expect(
      planMigration(data, reviewed).errors.some((e) =>
        e.includes("existing PDF"),
      ),
    ).toBe(true);
  });
  it("rolls back all previous writes when a later update fails", () => {
    const db = database(source());
    try {
      const before = snapshot(db),
        plan = planMigration(before);
      db.exec(
        "CREATE TRIGGER fail_media BEFORE UPDATE ON media BEGIN SELECT RAISE(ABORT, 'test failure'); END",
      );
      expect(() => applyMigration(db, plan)).toThrow("test failure");
      expect(snapshot(db)).toEqual(before);
    } finally {
      db.close();
    }
  });
});
