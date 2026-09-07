import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { readFile } from "node:fs/promises";
import { emptyEntry, type SiteData } from "../src/lib/cms";
import { saveDocument, documentAction } from "../src/server/store";
import { ogResponse } from "../src/server/og";

let mf: Miniflare, env: Env;
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
    "0004_documents_kind_open.sql",
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
    OWNER_EMAIL: "",
    ACCESS_TEAM_DOMAIN: "",
    ACCESS_AUD: "",
    CF_ACCOUNT_ID: "",
    ANALYTICS_SITE_TAG: "",
    ANALYTICS_BEACON_TOKEN: "",
    CF_ANALYTICS_TOKEN: "",
  } as Env;

  const site: SiteData = {
    name: "Rizki",
    brand: "ar",
    icon: "",
    handle: "owner",
    location: "Yogyakarta",
    avatar: "",
    email: "",
    whatsapp: "",
    github: "",
    linkedin: "",
    skills: [],
    cv: "",
    setupCover: "",
    setupIntro: "",
    headline: "Fullstack & cloud developer",
    bio: "Building useful software.",
    note: "",
    aboutTitle: "",
    aboutBody: "",
    footer: "",
    seoTitle: "Rizki — Portfolio",
    seoDescription: "Building useful software.",
    sections: [],
    words: {},
    sectionSeo: {},
  };
  // Dokumen profil selalu ber-id "site" (lihat saveDocument) dan harus
  // dipublish agar terbaca publicData.
  const siteDoc = await saveDocument(env, "site", {
    kind: "site",
    draft: site,
    version: 0,
  });
  await documentAction(env, siteDoc.id, "publish", siteDoc.version);
  const published = emptyEntry("writing");
  published.slug = "hello-card";
  published.title = "Notes on workers";
  published.summary = "A short summary.";
  const doc = await saveDocument(env, crypto.randomUUID(), {
    kind: "writing",
    draft: published,
    version: 0,
  });
  await documentAction(env, doc.id, "publish", doc.version);
  const draft = emptyEntry("projects");
  draft.slug = "draft-card";
  await saveDocument(env, crypto.randomUUID(), {
    kind: "projects",
    draft,
    version: 0,
  });
});
afterAll(async () => {
  await mf?.dispose();
});

async function pngSize(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 8)]).toEqual([
    0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10,
  ]);
  const view = new DataView(bytes.buffer);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("og image endpoint", () => {
  it("renders a published entry card as a 1200x630 PNG", async () => {
    const res = await ogResponse(env, "hello-card");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
    expect(await pngSize(res)).toEqual({ width: 1200, height: 630 });
  });

  it("renders the site card for section pages", async () => {
    const res = await ogResponse(env);
    expect(res.status).toBe(200);
    expect(await pngSize(res)).toEqual({ width: 1200, height: 630 });
  });

  it("hides drafts and unknown slugs", async () => {
    expect((await ogResponse(env, "draft-card")).status).toBe(404);
    expect((await ogResponse(env, "missing-card")).status).toBe(404);
  });
});
