import {
  entrySchema,
  siteSchema,
  parseDocument,
  mediaIds,
  type DocumentRow,
  type EntryData,
  type SiteData,
  type PublicData,
} from "../lib/cms";
export async function publicData(
  env: Env,
  preview = false,
): Promise<PublicData> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM documents WHERE deleted=0 ${preview ? "" : "AND published IS NOT NULL"}`,
  ).all<DocumentRow>();
  const siteRow = results.find((r) => r.kind === "site");
  const field = preview ? "draft" : "published";
  const entries = results
    .filter((r) => r.kind !== "site")
    .map((r) => JSON.parse(r[field]!) as EntryData)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        a.order - b.order ||
        b.date.localeCompare(a.date),
    );
  const mediaRows = await env.DB.prepare("SELECT id,alt FROM media").all<{
    id: string;
    alt: string;
  }>();
  const site = siteRow ? (JSON.parse(siteRow[field]!) as SiteData) : null;
  const used = new Set(mediaIds({ site, entries }));
  return {
    site,
    entries,
    media: Object.fromEntries(
      mediaRows.results
        .filter((m) => used.has(m.id))
        .map((m) => [m.id, JSON.parse(m.alt)]),
    ),
    preview,
  };
}
export async function getDocument(env: Env, id: string) {
  const row = await env.DB.prepare("SELECT * FROM documents WHERE id=?")
    .bind(id)
    .first<DocumentRow>();
  if (!row) throw new Response("Konten tidak ditemukan", { status: 404 });
  return row;
}
export async function saveDocument(
  env: Env,
  id: string,
  input: { kind: string; draft: unknown; version: number },
) {
  const draft =
    input.kind === "site"
      ? siteSchema.parse(input.draft)
      : entrySchema.parse(input.draft);
  if (input.kind !== "site" && (draft as EntryData).category !== input.kind)
    throw new Response("Kategori tidak cocok", { status: 400 });
  if ((input.kind === "site") !== (id === "site"))
    throw new Response("Identitas profil tidak valid", { status: 400 });
  const raw = JSON.stringify(draft);
  if (new TextEncoder().encode(raw).length > 400000)
    throw new Response("Konten terlalu besar", { status: 413 });
  const existing = await env.DB.prepare("SELECT * FROM documents WHERE id=?")
    .bind(id)
    .first<DocumentRow>();
  if (
    existing &&
    (existing.version !== input.version ||
      existing.deleted ||
      existing.kind !== input.kind)
  )
    throw new Response("Konten berubah. Muat ulang sebelum menyimpan.", {
      status: 409,
    });
  const revision = crypto.randomUUID();
  if (!existing) {
    if (input.version !== 0)
      throw new Response("Versi tidak valid", { status: 409 });
    await env.DB.batch([
      env.DB.prepare("INSERT INTO documents(id,kind,draft) VALUES(?,?,?)").bind(
        id,
        input.kind,
        raw,
      ),
      env.DB.prepare(
        "INSERT INTO revisions(id,document_id,snapshot,action) VALUES(?,?,?,'create')",
      ).bind(revision, id, raw),
    ]);
  } else {
    const res = await env.DB.batch([
      env.DB.prepare(
        "UPDATE documents SET draft=?,mutation=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND version=?",
      ).bind(raw, revision, id, input.version),
      env.DB.prepare(
        "INSERT INTO revisions(id,document_id,snapshot,action) SELECT ?,id,draft,'save' FROM documents WHERE id=? AND mutation=?",
      ).bind(revision, id, revision),
    ]);
    if (!res[0].meta.changes)
      throw new Response("Konflik perubahan", { status: 409 });
  }
  return parseDocument(await getDocument(env, id));
}
export async function documentAction(
  env: Env,
  id: string,
  action: string,
  version: number,
  revisionId?: string,
) {
  const row = await getDocument(env, id);
  if (row.version !== version)
    throw new Response("Konten berubah. Muat ulang.", { status: 409 });
  const doc = parseDocument(row);
  if (row.deleted && !["restore", "delete"].includes(action))
    throw new Response("Pulihkan konten dahulu", { status: 409 });
  let next = row.draft;
  const statements: D1PreparedStatement[] = [];
  const mutation = crypto.randomUUID();
  if (action === "publish") {
    if (doc.kind === "site") {
      if (!(doc.draft as SiteData).name.trim())
        throw new Response("Nama wajib diisi", { status: 400 });
    } else if (
      !Object.values((doc.draft as EntryData).translations).some((t) =>
        t.title.trim(),
      )
    )
      throw new Response("Isi judul minimal satu bahasa", { status: 400 });
    for (const mediaId of mediaIds(doc.draft))
      if (
        !(await env.DB.prepare("SELECT id FROM media WHERE id=?")
          .bind(mediaId)
          .first())
      )
        throw new Response("Media tidak ditemukan", { status: 400 });
    if (doc.kind !== "site") {
      const slug = (doc.draft as EntryData).slug;
      const conflict = await env.DB.prepare(
        "SELECT id FROM documents WHERE slug=? AND id<>? UNION SELECT document_id AS id FROM redirects WHERE slug=? AND document_id<>?",
      )
        .bind(slug, id, slug, id)
        .first();
      if (conflict) throw new Response("Slug sudah digunakan", { status: 409 });
      if (row.slug && row.slug !== slug)
        statements.push(
          env.DB.prepare(
            "INSERT OR REPLACE INTO redirects(slug,document_id) SELECT ?,id FROM documents WHERE id=? AND mutation=?",
          ).bind(row.slug, id, mutation),
        );
      statements.push(
        env.DB.prepare(
          "DELETE FROM redirects WHERE slug=? AND document_id=? AND EXISTS(SELECT 1 FROM documents WHERE id=? AND mutation=?)",
        ).bind(slug, id, id, mutation),
      );
    }
    statements.unshift(
      env.DB.prepare(
        "UPDATE documents SET published=draft,slug=?,mutation=?,version=version+1 WHERE id=? AND version=?",
      ).bind(
        doc.kind === "site" ? null : (doc.draft as EntryData).slug,
        mutation,
        id,
        version,
      ),
    );
  } else if (action === "unpublish")
    statements.push(
      env.DB.prepare(
        "UPDATE documents SET published=NULL,mutation=?,version=version+1 WHERE id=? AND version=?",
      ).bind(mutation, id, version),
    );
  else if (action === "trash" || action === "restore") {
    if (id === "site")
      throw new Response("Profil tidak bisa dihapus", { status: 400 });
    statements.push(
      env.DB.prepare(
        "UPDATE documents SET deleted=?,published=NULL,mutation=?,version=version+1 WHERE id=? AND version=?",
      ).bind(action === "trash" ? 1 : 0, mutation, id, version),
    );
  } else if (action === "revision") {
    const rev = await env.DB.prepare(
      "SELECT snapshot FROM revisions WHERE id=? AND document_id=?",
    )
      .bind(revisionId, id)
      .first<{ snapshot: string }>();
    if (!rev) throw new Response("Revisi tidak ditemukan", { status: 404 });
    next = rev.snapshot;
    statements.push(
      env.DB.prepare(
        "UPDATE documents SET draft=?,mutation=?,version=version+1 WHERE id=? AND version=?",
      ).bind(next, mutation, id, version),
    );
  } else if (action === "delete") {
    if (!row.deleted || id === "site")
      throw new Response("Pindahkan ke sampah dahulu", { status: 400 });
    await env.DB.prepare("DELETE FROM documents WHERE id=? AND version=?")
      .bind(id, version)
      .run();
    return { deleted: true };
  } else throw new Response("Aksi tidak valid", { status: 400 });
  statements.push(
    env.DB.prepare(
      "INSERT INTO revisions(id,document_id,snapshot,action) SELECT ?,id,?,? FROM documents WHERE id=? AND mutation=?",
    ).bind(crypto.randomUUID(), next, action, id, mutation),
  );
  const result = await env.DB.batch(statements);
  if (!result[0].meta.changes)
    throw new Response("Konflik perubahan", { status: 409 });
  return parseDocument(await getDocument(env, id));
}
