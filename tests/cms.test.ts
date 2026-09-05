import { unzipSync, strFromU8 } from "fflate";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { readFile } from "node:fs/promises";
import { emptyEntry, type DocumentRow } from "../src/lib/cms";
import {
  saveDocument,
  documentAction,
  publicData,
  getDocument,
} from "../src/server/store";
import { handleApi, mediaResponse } from "../src/server/api";
import { requireAdmin } from "../src/server/auth";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
let mf: Miniflare, env: Env;
const owner = "achmadrizkiramadhan0101@gmail.com";
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
          r2Buckets: ["MEDIA"],
        },
      ],
    }),
  );
  const db = await mf.getD1Database("DB"),
    media = await mf.getR2Bucket("MEDIA");
  for (const file of [
    "0001_cms.sql",
    "0002_mutation_guard.sql",
    "0003_english_media.sql",
  ]) {
    const sql = await readFile(`migrations/${file}`, "utf8");
    for (const statement of sql.split(";").filter((s) => s.trim()))
      await db.prepare(statement).run();
  }
  env = {
    DB: db,
    MEDIA: media,
    PUBLIC_HOST: "txtfromrizkirmdhn.my.id",
    ADMIN_HOST: "admin.txtfromrizkirmdhn.my.id",
    OWNER_EMAIL: owner,
    ACCESS_TEAM_DOMAIN: "",
    ACCESS_AUD: "",
    CF_ACCOUNT_ID: "",
    ANALYTICS_SITE_TAG: "",
    ANALYTICS_BEACON_TOKEN: "",
    CF_ANALYTICS_TOKEN: "",
  } as Env;
});
afterAll(async () => {
  await mf?.dispose();
});
function entry(slug: string) {
  const e = emptyEntry("projects");
  e.slug = slug;
  Object.assign(e, {
    title: "Judul Indonesia",
    summary: "Ringkasan",
    body: "## Isi\n\nKonten asli.",
    seoTitle: "",
    seoDescription: "",
  });
  return e;
}
describe("draft and publication boundaries", () => {
  it("keeps saved changes private until publish and restores revision into draft", async () => {
    const id = crypto.randomUUID();
    const original = entry("original");
    let d = await saveDocument(env, id, {
      kind: "projects",
      draft: original,
      version: 0,
    });
    expect((await publicData(env)).entries).toHaveLength(0);
    d = (await documentAction(env, id, "publish", d.version)) as typeof d;
    expect((await publicData(env)).entries[0].title).toBe("Judul Indonesia");
    const changed = {
      ...original,
      title: "Next draft",
    };
    d = await saveDocument(env, id, {
      kind: "projects",
      draft: changed,
      version: d.version,
    });
    expect((await publicData(env)).entries[0].title).toBe("Judul Indonesia");
    const rev = await env.DB.prepare(
      "SELECT id FROM revisions WHERE document_id=? AND action='create'",
    )
      .bind(id)
      .first<{ id: string }>();
    d = (await documentAction(
      env,
      id,
      "revision",
      d.version,
      rev!.id,
    )) as typeof d;
    expect(JSON.parse((await getDocument(env, id)).draft).title).toBe(
      "Judul Indonesia",
    );
    await documentAction(env, id, "unpublish", d.version);
    expect((await publicData(env)).entries).toHaveLength(0);
  });
  it("supports one language, redirects old slugs, rejects duplicates, restores trash privately", async () => {
    const id = crypto.randomUUID();
    let d = await saveDocument(env, id, {
      kind: "projects",
      draft: entry("before"),
      version: 0,
    });
    d = (await documentAction(env, id, "publish", d.version)) as typeof d;
    d = await saveDocument(env, id, {
      kind: "projects",
      draft: entry("after"),
      version: d.version,
    });
    d = (await documentAction(env, id, "publish", d.version)) as typeof d;
    expect(
      await env.DB.prepare("SELECT document_id FROM redirects WHERE slug=?")
        .bind("before")
        .first(),
    ).toEqual({ document_id: id });
    const duplicate = await saveDocument(env, crypto.randomUUID(), {
      kind: "projects",
      draft: entry("before"),
      version: 0,
    });
    await expect(
      documentAction(env, duplicate.id, "publish", duplicate.version),
    ).rejects.toMatchObject({ status: 409 });
    d = (await documentAction(env, id, "trash", d.version)) as typeof d;
    expect((await publicData(env)).entries).toHaveLength(0);
    d = (await documentAction(env, id, "restore", d.version)) as typeof d;
    expect(d.published).toBeNull();
  });
  it("rejects stale and concurrent edits without creating false revisions", async () => {
    const id = crypto.randomUUID();
    const d = await saveDocument(env, id, {
      kind: "projects",
      draft: entry("race"),
      version: 0,
    });
    const results = await Promise.allSettled([
      saveDocument(env, id, {
        kind: "projects",
        draft: entry("race-a"),
        version: d.version,
      }),
      saveDocument(env, id, {
        kind: "projects",
        draft: entry("race-b"),
        version: d.version,
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await env.DB.prepare(
          "SELECT count(*) AS n FROM revisions WHERE document_id=?",
        )
          .bind(id)
          .first<{ n: number }>()
      )?.n,
    ).toBe(2);
  });
  it("requires an English title before publication", async () => {
    const d = await saveDocument(env, crypto.randomUUID(), {
      kind: "writing",
      version: 0,
      draft: emptyEntry("writing"),
    });
    await expect(
      documentAction(env, d.id, "publish", d.version),
    ).rejects.toMatchObject({ status: 400 });
  });
});
describe("public payload", () => {
  it("orders entries by pinned, order, then date and hides drafts", async () => {
    const base = Date.now();
    const rows = [
      { slug: "lama", order: 5, pinned: false, date: "2024-01-01" },
      { slug: "baru", order: 5, pinned: false, date: "2026-01-01" },
      { slug: "utama", order: 9, pinned: true, date: "2020-01-01" },
      { slug: "awal", order: 1, pinned: false, date: "2020-01-01" },
    ];
    const ids: string[] = [];
    for (const row of rows) {
      const id = `sort-${row.slug}-${base}`;
      ids.push(id);
      const e = entry(row.slug);
      e.order = row.order;
      e.pinned = row.pinned;
      e.date = row.date;
      await saveDocument(env, id, { kind: "projects", version: 0, draft: e });
      await documentAction(env, id, "publish", 1);
    }
    const draftOnly = `sort-draft-${base}`;
    await saveDocument(env, draftOnly, {
      kind: "projects",
      version: 0,
      draft: entry(`draft-${base}`),
    });

    const published = await publicData(env);
    const order = published.entries
      .filter((e) => ids.some((id) => id.includes(e.slug)))
      .map((e) => e.slug);
    expect(order).toEqual(["utama", "awal", "baru", "lama"]);
    expect(published.entries.some((e) => e.slug === `draft-${base}`)).toBe(
      false,
    );

    const preview = await publicData(env, true);
    expect(preview.entries.some((e) => e.slug === `draft-${base}`)).toBe(true);
  });

  it("refuses to publish a document whose media reference is missing", async () => {
    const id = crypto.randomUUID();
    const e = entry(`dangling-${Date.now()}`);
    e.cover = "/api/media/tidak-ada";
    await saveDocument(env, id, { kind: "projects", version: 0, draft: e });
    await expect(documentAction(env, id, "publish", 1)).rejects.toBeDefined();
  });

  it("removes a document permanently only after it reaches the trash", async () => {
    const id = crypto.randomUUID();
    await saveDocument(env, id, {
      kind: "projects",
      version: 0,
      draft: entry(`hapus-${Date.now()}`),
    });
    await expect(documentAction(env, id, "delete", 1)).rejects.toBeDefined();
    await documentAction(env, id, "trash", 1);
    await documentAction(env, id, "delete", 2);
    await expect(getDocument(env, id)).rejects.toMatchObject({ status: 404 });
  });
});
describe("admin and media protection", () => {
  it("accepts only a signed, unexpired owner token for the configured audience", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = {
      ...(await exportJWK(publicKey)),
      kid: "owner-key",
      alg: "RS256",
    };
    const secure = {
      ...env,
      ACCESS_TEAM_DOMAIN: "owner.cloudflareaccess.com",
      ACCESS_AUD: "owner-aud",
    } as Env;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ keys: [jwk] }));
    const token = (email: string, audience = "owner-aud", expires = "1h") =>
      new SignJWT({ email })
        .setProtectedHeader({ alg: "RS256", kid: "owner-key" })
        .setIssuer("https://owner.cloudflareaccess.com")
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime(expires)
        .sign(privateKey);
    const request = (jwt: string) =>
      new Request("https://admin.txtfromrizkirmdhn.my.id/admin", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
    try {
      await expect(
        requireAdmin(request(await token(owner)), secure),
      ).resolves.toBe(owner);
      for (const jwt of [
        await token("other@example.com"),
        await token(owner, "wrong-aud"),
        await token(owner, "owner-aud", "-1h"),
      ]) {
        await expect(requireAdmin(request(jwt), secure)).rejects.toMatchObject({
          status: 403,
        });
      }
    } finally {
      fetchMock.mockRestore();
    }
  });
  it("rejects cross-origin writes and alternative hostnames", async () => {
    await expect(
      requireAdmin(
        new Request("http://localhost/admin", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
        env,
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      requireAdmin(new Request("https://preview.workers.dev/admin"), env),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      requireAdmin(
        new Request("https://txtfromrizkirmdhn.my.id/api/admin/documents"),
        env,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("never trusts a forged email header or invalid JWT", async () => {
    const secure = {
      ...env,
      ACCESS_TEAM_DOMAIN: "owner.cloudflareaccess.com",
      ACCESS_AUD: "owner-aud",
    } as Env;
    await expect(
      requireAdmin(
        new Request("https://admin.txtfromrizkirmdhn.my.id/admin", {
          headers: { "Cf-Access-Authenticated-User-Email": owner },
        }),
        secure,
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      requireAdmin(
        new Request("https://admin.txtfromrizkirmdhn.my.id/admin", {
          headers: { "Cf-Access-Jwt-Assertion": "forged" },
        }),
        secure,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("protects draft assets, permits published assets, blocks referenced deletion", async () => {
    const asset = crypto.randomUUID();
    await env.MEDIA.put(asset, "%PDF-1.4\ndemo");
    await env.DB.prepare("INSERT INTO media(id,name,type,size) VALUES(?,?,?,?)")
      .bind(asset, "cv.pdf", "application/pdf", 13)
      .run();
    const request = new Request(
      `https://txtfromrizkirmdhn.my.id/api/media/${asset}`,
    );
    await expect(mediaResponse(request, env, asset)).rejects.toMatchObject({
      status: 404,
    });
    const draft = entry("asset-doc");
    draft.body = `[CV](/api/media/${asset})`;
    const d = await saveDocument(env, crypto.randomUUID(), {
      kind: "projects",
      draft,
      version: 0,
    });
    await documentAction(env, d.id, "publish", d.version);
    expect((await mediaResponse(request, env, asset)).status).toBe(200);
    await expect(
      handleApi(
        new Request("http://localhost/api/admin/media", {
          method: "DELETE",
          headers: {
            origin: "http://localhost",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: asset }),
        }),
        env,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects disguised uploads", async () => {
    await expect(
      handleApi(
        new Request("http://localhost/api/admin/media", {
          method: "POST",
          headers: { origin: "http://localhost", "Content-Type": "image/png" },
          body: "<script>bad</script>",
        }),
        env,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
describe("backup", () => {
  it("exports a complete ZIP without integration credentials", async () => {
    const response = await handleApi(
      new Request("http://localhost/api/admin/backup"),
      env,
    );
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const manifest = strFromU8(files["content.json"]);
    expect(JSON.parse(manifest).documents.length).toBeGreaterThan(0);
    expect(JSON.parse(manifest).format).toBe(2);
    const markdown = Object.keys(files).filter((name) =>
      name.startsWith("markdown/"),
    );
    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown.every((name) => !/\.(id|en)\.md$/.test(name))).toBe(true);
    expect(strFromU8(files[markdown[0]])).not.toContain('"lang"');
    expect(Object.keys(files).some((name) => name.startsWith("media/"))).toBe(
      true,
    );
    expect(manifest).not.toContain("sensitive-key");
    expect(manifest).not.toContain("encryptedKey");
  });
});

describe("removed translation APIs", () => {
  it("returns 404 for translation and AI settings", async () => {
    for (const [path, method] of [
      ["ai", "GET"],
      ["ai", "POST"],
      ["translate", "POST"],
    ]) {
      const response = await handleApi(
        new Request(`http://localhost/api/admin/${path}`, {
          method,
          headers: { origin: "http://localhost" },
        }),
        env,
      );
      expect(response.status).toBe(404);
    }
  });
});
describe("maintenance mode", () => {
  it("blocks public pages, direct media and data while preserving private preview and published content", async () => {
    const { maintenanceGate, saveMaintenance } =
      await import("../src/server/maintenance");
    const { defaultMaintenance } = await import("../src/lib/maintenance");
    const before = await publicData(env);
    await saveMaintenance(env, { ...defaultMaintenance, enabled: true });
    try {
      for (const path of [
        "/",
        "/post/original",
        "/api/public",
        "/api/media/test",
        "/_serverFn/test",
        "/preview",
        "/admin",
      ]) {
        const response = await maintenanceGate(
          new Request(`https://${env.PUBLIC_HOST}${path}`),
          env,
        );
        expect(response?.status).toBe(503);
        expect(response?.headers.get("Cache-Control")).toBe("no-store");
      }
      for (const path of [
        "/admin",
        "/preview",
        "/api/admin/preview",
        "/api/media/test",
      ]) {
        expect(
          await maintenanceGate(
            new Request(`https://${env.ADMIN_HOST}${path}`),
            env,
          ),
        ).toBeNull();
      }
      expect(await publicData(env)).toEqual(before);
    } finally {
      await saveMaintenance(env, defaultMaintenance);
    }
    expect(
      await maintenanceGate(new Request(`https://${env.PUBLIC_HOST}/`), env),
    ).toBeNull();
    expect(await publicData(env)).toEqual(before);
  });
  it("renders English and escapes owner text", async () => {
    const { maintenanceGate, saveMaintenance } =
      await import("../src/server/maintenance");
    const { defaultMaintenance } = await import("../src/lib/maintenance");
    await saveMaintenance(env, {
      ...defaultMaintenance,
      enabled: true,
      title: "<script>alert(1)</script>",
      body: "Back soon & thank you",
    });
    try {
      const response = await maintenanceGate(
        new Request(`https://${env.PUBLIC_HOST}/?lang=en`),
        env,
      );
      const html = await response!.text();
      expect(html).toContain('lang="en"');
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
      expect(html).toContain("Back soon &amp; thank you");
      expect(
        (
          await maintenanceGate(
            new Request(`https://${env.PUBLIC_HOST}/`, { method: "HEAD" }),
            env,
          )
        )?.body,
      ).toBeNull();
    } finally {
      await saveMaintenance(env, defaultMaintenance);
    }
  });
  it("requires owner authorization and validates maintenance settings", async () => {
    const { defaultMaintenance } = await import("../src/lib/maintenance");
    await expect(
      handleApi(
        new Request(`https://${env.PUBLIC_HOST}/api/admin/maintenance`, {
          method: "POST",
          headers: { origin: `https://${env.PUBLIC_HOST}` },
          body: JSON.stringify({ ...defaultMaintenance, enabled: true }),
        }),
        env,
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      handleApi(
        new Request("http://localhost/api/admin/maintenance", {
          method: "POST",
          headers: { origin: "http://localhost" },
          body: JSON.stringify({ enabled: true }),
        }),
        env,
      ),
    ).rejects.toThrow();
  });
});
