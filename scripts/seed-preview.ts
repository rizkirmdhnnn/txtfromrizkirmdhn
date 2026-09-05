// Bootstrap only the original imported drafts; never overwrite online edits.
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import type { CmsDocument, MediaItem } from "../src/lib/cms";
import { mediaIds } from "../src/lib/cms";
const origin = process.env.CMS_ORIGIN || "http://localhost:3001";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw new Error("Bootstrap must read from local preview");
async function read<T>(path: string): Promise<T> {
  const r = await fetch(`${origin}/api/admin/${path}`);
  if (!r.ok) throw new Error("Local CMS is not ready");
  return r.json();
}
const docs = (await read<CmsDocument[]>("documents")).filter(
  (d) => d.id === "site" || d.id.startsWith("seed-"),
);
if (!docs.some((d) => d.id === "site"))
  throw new Error("Run db:seed locally first");
const assets = await read<MediaItem[]>("media");
const used = new Set(mediaIds(docs.map((d) => d.draft)));
const quote = (text: string) => `'${text.replaceAll("'", "''")}'`;
const sql: string[] = [];
for (const item of assets.filter((m) => used.has(m.id))) {
  const response = await fetch(`${origin}/api/media/${item.id}`);
  if (!response.ok) throw new Error("Asset download failed");
  const dir = await mkdtemp(join(tmpdir(), "portfolio-media-")),
    file = join(dir, item.id);
  await writeFile(file, new Uint8Array(await response.arrayBuffer()));
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `rizki-portfolio-preview-media/${item.id}`,
      "--file",
      file,
      "--content-type",
      item.type,
      "--remote",
    ],
    { stdio: "inherit" },
  );
  sql.push(
    `INSERT OR IGNORE INTO media(id,name,type,size,alt) VALUES(${quote(item.id)},${quote(item.name)},${quote(item.type)},${item.size},${quote(JSON.stringify(item.alt))});`,
  );
}
for (const doc of docs) {
  const draft = quote(JSON.stringify(doc.draft));
  sql.push(
    `INSERT OR IGNORE INTO documents(id,kind,draft) VALUES(${quote(doc.id)},${quote(doc.kind)},${draft});`,
  );
  sql.push(
    `INSERT OR IGNORE INTO revisions(id,document_id,snapshot,action) VALUES(${quote("initial-" + doc.id)},${quote(doc.id)},${draft},'import');`,
  );
}
const dir = await mkdtemp(join(tmpdir(), "portfolio-seed-")),
  file = join(dir, "seed.sql");
await writeFile(file, sql.join("\n"));
execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "DB", "--remote", "--file", file],
  { stdio: "inherit" },
);
console.log(
  "Preview bootstrap complete. Existing online documents were preserved; imported content remains draft.",
);
