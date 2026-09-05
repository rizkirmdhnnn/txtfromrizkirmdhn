import { z } from "zod";
import { Zip, ZipPassThrough, strToU8 } from "fflate";
import { kinds, parseDocument, type DocumentRow } from "../lib/cms";
import { requireAdmin } from "./auth";
import { readMaintenance, saveMaintenance } from "./maintenance";
import { publicData, saveDocument, documentAction } from "./store";
import { readAi, saveAi, runAi, analytics, boundedText } from "./integrations";
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
async function body(request: Request) {
  return JSON.parse(await boundedText(new Response(request.body), 600000));
}
const idSchema = z.string().regex(/^[a-zA-Z0-9-]{1,100}$/);
function signature(bytes: Uint8Array, type: string) {
  const str = String.fromCharCode(...bytes.slice(0, 12));
  return type === "application/pdf"
    ? str.startsWith("%PDF-")
    : type === "image/png"
      ? bytes[0] === 137 && str.slice(1, 4) === "PNG"
      : type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : type === "image/gif"
          ? /^GIF8[79]a/.test(str)
          : type === "image/webp"
            ? str.startsWith("RIFF") && str.slice(8) === "WEBP"
            : false;
}
export async function upload(request: Request, env: Env) {
  const type = request.headers.get("content-type")?.split(";")[0] ?? "";
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ].includes(type)
  )
    throw new Response("Format file tidak didukung", { status: 400 });
  const limit =
    type === "application/pdf" ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new Response("File terlalu besar", { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) throw new Response("File kosong", { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Response("File terlalu besar", { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  if (!signature(bytes, type))
    throw new Response("Isi file tidak sesuai format", { status: 400 });
  const id = crypto.randomUUID(),
    name = decodeURIComponent(request.headers.get("x-file-name") || "upload")
      .replace(/[\r\n\x00-\x1f]/g, "")
      .slice(0, 200);
  await env.MEDIA.put(id, bytes, { httpMetadata: { contentType: type } });
  try {
    await env.DB.prepare("INSERT INTO media(id,name,type,size) VALUES(?,?,?,?)")
      .bind(id, name, type, size)
      .run();
  } catch (error) {
    await env.MEDIA.delete(id);
    throw error;
  }
  return json(
    { id, name, type, size, url: `/api/media/${id}`, alt: { id: "", en: "" } },
    201,
  );
}
export async function mediaResponse(request: Request, env: Env, id: string) {
  const published = await env.DB.prepare(
    "SELECT id FROM documents WHERE deleted=0 AND published IS NOT NULL AND instr(published,?)>0 LIMIT 1",
  )
    .bind(`/api/media/${id}`)
    .first();
  if (!published) await requireAdmin(request, env);
  const row = await env.DB.prepare("SELECT name,type FROM media WHERE id=?")
    .bind(id)
    .first<{ name: string; type: string }>();
  if (!row) throw new Response("File tidak ditemukan", { status: 404 });
  const rangeHeader = request.headers.get("range");
  let rangeRequest: R2Range | undefined;
  if (rangeHeader) {
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (!match || (!match[1] && !match[2]))
      throw new Response("Range tidak valid", { status: 416 });
    if (!match[1]) rangeRequest = { suffix: Number(match[2]) };
    else {
      const offset = Number(match[1]);
      const end = match[2] ? Number(match[2]) : undefined;
      if (
        !Number.isSafeInteger(offset) ||
        (end !== undefined && (!Number.isSafeInteger(end) || end < offset))
      )
        throw new Response("Range tidak valid", { status: 416 });
      rangeRequest =
        end === undefined ? { offset } : { offset, length: end - offset + 1 };
    }
  }
  const obj = await env.MEDIA.get(
    id,
    rangeRequest ? { range: rangeRequest } : undefined,
  );
  if (!obj) throw new Response("File tidak ditemukan", { status: 404 });
  const headers = new Headers({
    "Content-Type": row.type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${new URL(request.url).searchParams.has("download") ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(row.name)}`,
  });
  const range = rangeRequest
    ? (obj.range as { offset: number; length: number })
    : undefined;
  if (range) {
    headers.set(
      "Content-Range",
      `bytes ${range.offset}-${range.offset + range.length - 1}/${obj.size}`,
    );
    headers.set("Content-Length", String(range.length));
  } else headers.set("Content-Length", String(obj.size));
  return new Response(request.method === "HEAD" ? null : obj.body, {
    status: range ? 206 : 200,
    headers,
  });
}
async function backup(env: Env) {
  const docs = await env.DB.prepare(
    "SELECT * FROM documents",
  ).all<DocumentRow>();
  const revisions = await env.DB.prepare("SELECT * FROM revisions").all();
  const media = await env.DB.prepare("SELECT * FROM media").all<{
    id: string;
    name: string;
  }>();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  // Sequential writes provide backpressure instead of buffering every asset in memory.
  let pending = Promise.resolve();
  const zip = new Zip((err, chunk, final) => {
    pending = pending.then(async () => {
      if (err) throw err;
      await writer.write(chunk);
      if (final) await writer.close();
    });
  });
  const task = (async () => {
    const manifest = new ZipPassThrough("content.json");
    zip.add(manifest);
    manifest.push(
      strToU8(
        JSON.stringify(
          {
            format: 1,
            documents: docs.results,
            revisions: revisions.results,
            media: media.results,
          },
          null,
          2,
        ),
      ),
      true,
    );
    await pending;
    for (const row of docs.results) {
      if (row.kind === "site") continue;
      const doc = JSON.parse(row.draft);
      for (const lang of ["id", "en"]) {
        const t = doc.translations[lang];
        const file = new ZipPassThrough(`markdown/${row.id}.${lang}.md`);
        zip.add(file);
        file.push(
          strToU8(
            `---\n${JSON.stringify({ ...doc, translations: undefined, ...t, lang }, null, 2)}\n---\n${t.body}`,
          ),
          true,
        );
        await pending;
      }
    }
    for (const item of media.results) {
      const obj = await env.MEDIA.get(item.id);
      if (!obj) throw new Error("Backup asset missing");
      const file = new ZipPassThrough(`media/${item.id}`);
      zip.add(file);
      const reader = obj.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          file.push(value, false);
          await pending;
        }
      } finally {
        reader.releaseLock();
      }
      file.push(new Uint8Array(), true);
      await pending;
    }
    zip.end();
    await pending;
  })().catch(async () => {
    await writer.abort("Ekspor gagal; silakan ulangi.");
  });
  void task;
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="portfolio-backup.zip"',
      "Cache-Control": "no-store",
    },
  });
}
export async function handleApi(request: Request, env: Env) {
  const url = new URL(request.url),
    path = url.pathname;
  if (path === "/api/public" && request.method === "GET")
    return json(await publicData(env));
  const media = path.match(/^\/api\/media\/([a-zA-Z0-9-]+)$/);
  if (media && ["GET", "HEAD"].includes(request.method))
    return mediaResponse(request, env, media[1]);
  if (!path.startsWith("/api/admin/")) return json({ error: "Not found" }, 404);
  await requireAdmin(request, env);
  const route = path.slice("/api/admin/".length);
  if (route === "maintenance" && request.method === "GET")
    return json(await readMaintenance(env));
  if (route === "maintenance" && request.method === "POST")
    return json(await saveMaintenance(env, await body(request)));
  if (route === "preview" && request.method === "GET")
    return json(await publicData(env, true));
  if (route === "documents" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM documents ORDER BY updated_at DESC",
    ).all<DocumentRow>();
    return json(rows.results.map(parseDocument));
  }
  if (route === "documents" && request.method === "POST") {
    const input = z
      .object({
        id: idSchema,
        kind: z.enum(["site", ...kinds]),
        draft: z.unknown(),
        version: z.number().int().min(0),
      })
      .parse(await body(request));
    return json(await saveDocument(env, input.id, input));
  }
  if (route === "action" && request.method === "POST") {
    const input = z
      .object({
        id: idSchema,
        action: z.enum([
          "publish",
          "unpublish",
          "trash",
          "restore",
          "delete",
          "revision",
        ]),
        version: z.number().int().min(1),
        revisionId: z.string().optional(),
      })
      .parse(await body(request));
    return json(
      await documentAction(
        env,
        input.id,
        input.action,
        input.version,
        input.revisionId,
      ),
    );
  }
  if (route === "revisions" && request.method === "GET") {
    const id = idSchema.parse(url.searchParams.get("id"));
    return json(
      (
        await env.DB.prepare(
          "SELECT * FROM revisions WHERE document_id=? ORDER BY created_at DESC LIMIT 100",
        )
          .bind(id)
          .all()
      ).results,
    );
  }
  if (route === "media" && request.method === "GET")
    return json(
      (
        await env.DB.prepare(
          "SELECT * FROM media ORDER BY created_at DESC",
        ).all<{ alt: string }>()
      ).results.map((m) => ({ ...m, alt: JSON.parse(m.alt) })),
    );
  if (route === "media" && request.method === "POST")
    return upload(request, env);
  if (route === "media" && request.method === "PATCH") {
    const input = z
      .object({
        id: idSchema,
        alt: z.object({ id: z.string().max(500), en: z.string().max(500) }),
      })
      .parse(await body(request));
    await env.DB.prepare("UPDATE media SET alt=? WHERE id=?")
      .bind(JSON.stringify(input.alt), input.id)
      .run();
    return json({ ok: true });
  }
  if (route === "media" && request.method === "DELETE") {
    const { id } = z.object({ id: idSchema }).parse(await body(request));
    const used = await env.DB.prepare(
      "SELECT id FROM documents WHERE instr(draft,?)>0 OR instr(published,?)>0 UNION SELECT id FROM revisions WHERE instr(snapshot,?)>0 LIMIT 1",
    )
      .bind(`/api/media/${id}`, `/api/media/${id}`, `/api/media/${id}`)
      .first();
    if (used)
      throw new Response("File masih digunakan konten atau riwayat revisi", {
        status: 409,
      });
    await env.MEDIA.delete(id);
    await env.DB.prepare("DELETE FROM media WHERE id=?").bind(id).run();
    return json({ ok: true });
  }
  if (route === "ai" && request.method === "GET") {
    const settings = await readAi(env);
    return json({
      baseUrl: settings.baseUrl,
      model: settings.model,
      hasKey: !!settings.encryptedKey,
    });
  }
  if (route === "ai" && request.method === "POST")
    return json(await saveAi(env, await body(request)));
  if (route === "translate" && request.method === "POST") {
    const input = z
      .object({
        text: z.string().max(30000),
        lang: z.enum(["id", "en"]),
        test: z.boolean().optional(),
      })
      .parse(await body(request));
    return json(await runAi(env, input));
  }
  if (route === "analytics" && request.method === "GET")
    return json(
      await analytics(env, url.searchParams.get("days") === "7" ? 7 : 30),
    );
  if (route === "backup" && request.method === "GET") return backup(env);
  return json({ error: "Not found" }, 404);
}
