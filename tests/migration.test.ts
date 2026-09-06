import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { readFile } from "node:fs/promises";

// Instance Miniflare sendiri: cms.test.ts sudah menerapkan semua migrasi di
// beforeAll-nya, sedangkan di sini data harus ada SEBELUM 0004 dijalankan.
let mf: Miniflare;
let db: Awaited<ReturnType<Miniflare["getD1Database"]>>;
async function apply(file: string) {
  const sql = await readFile(`migrations/${file}`, "utf8");
  for (const statement of sql.split(";").filter((s) => s.trim()))
    await db.prepare(statement).run();
}
beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      cf: false,
      workers: [
        {
          modules: true,
          script: 'export default {fetch(){return new Response("ok")}}',
          compatibilityDate: "2026-09-05",
          d1Databases: ["DB"],
        },
      ],
    }),
  );
  db = await mf.getD1Database("DB");
});
afterAll(async () => {
  await mf?.dispose();
});

describe("migration 0004 (open kind column)", () => {
  it("keeps documents, revisions, and redirects, then accepts new kinds and still cascades", async () => {
    for (const file of [
      "0001_cms.sql",
      "0002_mutation_guard.sql",
      "0003_english_media.sql",
    ])
      await apply(file);
    await db
      .prepare(
        "INSERT INTO documents(id,kind,draft,published,slug,mutation) VALUES('doc-1','projects','{}','{}','old-slug','m1')",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO revisions(id,document_id,snapshot,action) VALUES('rev-1','doc-1','{}','create')",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO redirects(slug,document_id) VALUES('older','doc-1')",
      )
      .run();
    await expect(
      db
        .prepare(
          "INSERT INTO documents(id,kind,draft) VALUES('x','setup','{}')",
        )
        .run(),
    ).rejects.toThrow();

    await apply("0004_documents_kind_open.sql");

    expect(
      await db
        .prepare("SELECT id,kind,slug,mutation FROM documents WHERE id='doc-1'")
        .first(),
    ).toEqual({
      id: "doc-1",
      kind: "projects",
      slug: "old-slug",
      mutation: "m1",
    });
    expect(
      await db
        .prepare("SELECT id,action FROM revisions WHERE document_id='doc-1'")
        .first(),
    ).toEqual({ id: "rev-1", action: "create" });
    expect(
      await db
        .prepare("SELECT slug FROM redirects WHERE document_id='doc-1'")
        .first(),
    ).toEqual({ slug: "older" });
    for (const kind of ["setup", "gallery"])
      await db
        .prepare("INSERT INTO documents(id,kind,draft) VALUES(?,?,'{}')")
        .bind(`doc-${kind}`, kind)
        .run();
    const names = (
      await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type IN ('table','index')",
        )
        .all<{ name: string }>()
    ).results.map((r) => r.name);
    expect(names).toContain("revisions_document");
    expect(names).not.toContain("documents_v2");
    expect(names).not.toContain("revisions_backup");
    expect(names).not.toContain("redirects_backup");
    // FK anak dibuat ulang: menghapus dokumen masih menyapu revisi & redirect.
    await db.prepare("DELETE FROM documents WHERE id='doc-1'").run();
    expect(
      await db.prepare("SELECT count(*) AS n FROM revisions").first(),
    ).toEqual({ n: 0 });
    expect(
      await db.prepare("SELECT count(*) AS n FROM redirects").first(),
    ).toEqual({ n: 0 });
  });
});
