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
    .map((r) => ({
      ...entrySchema.parse(JSON.parse(r[field]!)),
      updatedAt: r.updated_at,
    }))
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
  const site = siteRow ? siteSchema.parse(JSON.parse(siteRow[field]!)) : null;
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
  if (!row) throw new Response("Content not found", { status: 404 });
  return row;
}
export async function saveDocument(
  env: Env,
  id: string,
  input: { kind: string; draft: unknown; version: number; revision?: boolean },
) {
  const draft =
    input.kind === "site"
      ? siteSchema.parse(input.draft)
      : entrySchema.parse(input.draft);
  if (input.kind !== "site" && (draft as EntryData).category !== input.kind)
    throw new Response("Category does not match", { status: 400 });
  if ((input.kind === "site") !== (id === "site"))
    throw new Response("Invalid profile identity", { status: 400 });
  const raw = JSON.stringify(draft);
  if (new TextEncoder().encode(raw).length > 400000)
    throw new Response("Content is too large", { status: 413 });
  const existing = await env.DB.prepare("SELECT * FROM documents WHERE id=?")
    .bind(id)
    .first<DocumentRow>();
  if (
    existing &&
    (existing.version !== input.version ||
      existing.deleted ||
      existing.kind !== input.kind)
  )
    throw new Response("Content has changed. Reload before saving.", {
      status: 409,
    });
  const revision = crypto.randomUUID();
  const skipRevision = input.revision === false;
  if (!existing) {
    if (input.version !== 0)
      throw new Response("Invalid version", { status: 409 });
    await env.DB.batch([
      env.DB.prepare("INSERT INTO documents(id,kind,draft) VALUES(?,?,?)").bind(
        id,
        input.kind,
        raw,
      ),
      // Revisi 'create' selalu dicatat, termasuk saat baris dibuat oleh
      // autosave: ini baseline dokumen dan hanya terjadi sekali, jadi tidak
      // ikut membanjiri riwayat seperti revisi 'save' per jeda ketik.
      env.DB.prepare(
        "INSERT INTO revisions(id,document_id,snapshot,action) VALUES(?,?,?,'create')",
      ).bind(revision, id, raw),
    ]);
  } else {
    const res = await env.DB.batch([
      env.DB.prepare(
        "UPDATE documents SET draft=?,mutation=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND version=?",
      ).bind(raw, revision, id, input.version),
      ...(skipRevision
        ? []
        : [
            env.DB.prepare(
              "INSERT INTO revisions(id,document_id,snapshot,action) SELECT ?,id,draft,'save' FROM documents WHERE id=? AND mutation=?",
            ).bind(revision, id, revision),
          ]),
    ]);
    if (!res[0].meta.changes)
      throw new Response("Edit conflict", { status: 409 });
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
    throw new Response("Content has changed. Reload the page.", {
      status: 409,
    });
  const doc = parseDocument(row);
  if (row.deleted && !["restore", "delete"].includes(action))
    throw new Response("Restore the content first", { status: 409 });
  let next = row.draft;
  const statements: D1PreparedStatement[] = [];
  const mutation = crypto.randomUUID();
  if (action === "publish") {
    if (doc.kind === "site") {
      if (!doc.draft.name.trim())
        throw new Response("Name is required", { status: 400 });
    } else if (!doc.draft.title.trim())
      throw new Response("Title is required", { status: 400 });
    // Ubin galeri hanya menampilkan foto, jadi item tanpa foto akan menjadi
    // kotak kosong di halaman publik.
    if (doc.kind === "gallery" && !doc.draft.cover)
      throw new Response("A photo is required", { status: 400 });
    for (const mediaId of mediaIds(doc.draft))
      if (
        !(await env.DB.prepare("SELECT id FROM media WHERE id=?")
          .bind(mediaId)
          .first())
      )
        throw new Response("Media not found", { status: 400 });
    if (doc.kind !== "site") {
      const slug = doc.draft.slug;
      const conflict = await env.DB.prepare(
        "SELECT id FROM documents WHERE slug=? AND id<>? UNION SELECT document_id AS id FROM redirects WHERE slug=? AND document_id<>?",
      )
        .bind(slug, id, slug, id)
        .first();
      if (conflict)
        throw new Response("Slug is already in use", { status: 409 });
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
        doc.kind === "site" ? null : doc.draft.slug,
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
      throw new Response("The profile cannot be deleted", { status: 400 });
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
    if (!rev) throw new Response("Revision not found", { status: 404 });
    next = JSON.stringify(
      (row.kind === "site" ? siteSchema : entrySchema).parse(
        JSON.parse(rev.snapshot),
      ),
    );
    statements.push(
      env.DB.prepare(
        "UPDATE documents SET draft=?,mutation=?,version=version+1 WHERE id=? AND version=?",
      ).bind(next, mutation, id, version),
    );
  } else if (action === "delete") {
    if (!row.deleted || id === "site")
      throw new Response("Move the content to trash first", { status: 400 });
    await env.DB.prepare("DELETE FROM documents WHERE id=? AND version=?")
      .bind(id, version)
      .run();
    return { deleted: true };
  } else throw new Response("Invalid action", { status: 400 });
  statements.push(
    env.DB.prepare(
      "INSERT INTO revisions(id,document_id,snapshot,action) SELECT ?,id,?,? FROM documents WHERE id=? AND mutation=?",
    ).bind(crypto.randomUUID(), next, action, id, mutation),
  );
  const result = await env.DB.batch(statements);
  if (!result[0].meta.changes)
    throw new Response("Edit conflict", { status: 409 });
  return parseDocument(await getDocument(env, id));
}
