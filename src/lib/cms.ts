import { z } from "zod";
export const kinds = ["projects", "experience", "writing", "about"] as const;
export type Kind = (typeof kinds)[number];
const text = z.string().max(2000);
const asset = z.string().regex(/^$|^\/api\/media\/[a-zA-Z0-9-]+$/);
const link = z
  .string()
  .max(2000)
  .refine((v) => !v || /^https:\/\//.test(v), "Use an HTTPS URL");
export const entryTextSchema = z.object({
  title: text,
  summary: text,
  body: z.string().max(100000),
  seoTitle: text.default(""),
  seoDescription: text.default(""),
});
export const entrySchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  category: z.enum(kinds),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().max(60)).max(30),
  pinned: z.boolean(),
  demo: z.boolean(),
  order: z.number().int().min(0).max(10000),
  cover: asset,
  visual: z.enum(["", "mail", "storage", "agent"]),
  repo: link,
  demoUrl: link,
  ...entryTextSchema.shape,
});
const copySchema = z.object({
  headline: text,
  bio: text,
  note: text,
  aboutTitle: text,
  aboutBody: z.string().max(20000),
  footer: text,
  seoTitle: text,
  seoDescription: text,
  words: z.record(z.string().max(60), z.string().max(2000)),
});
export const siteSchema = z.object({
  name: text,
  brand: text.default("ar"),
  icon: asset.default(""),
  handle: text,
  location: text,
  avatar: asset,
  email: z
    .string()
    .max(200)
    .refine((v) => !v || z.email().safeParse(v).success, "Invalid email"),
  whatsapp: z.string().regex(/^\d{0,18}$/),
  github: link,
  linkedin: link,
  skills: z.array(z.string().max(80)).max(20),
  cv: asset,
  sections: z
    .array(z.object({ key: z.enum(kinds), visible: z.boolean() }))
    .length(4)
    .refine((v) => new Set(v.map((s) => s.key)).size === 4),
  ...copySchema.shape,
});
export type EntryData = z.infer<typeof entrySchema>;
export type SiteData = z.infer<typeof siteSchema>;
export type DocumentRow = {
  id: string;
  kind: Kind | "site";
  draft: string;
  published: string | null;
  slug: string | null;
  version: number;
  deleted: number;
  updated_at: string;
};
type DocumentMeta = Omit<DocumentRow, "kind" | "draft" | "published">;
export type CmsDocument =
  | (DocumentMeta & {
      kind: "site";
      draft: SiteData;
      published: SiteData | null;
    })
  | (DocumentMeta & {
      kind: Kind;
      draft: EntryData;
      published: EntryData | null;
    });
export type MediaItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  alt: string;
  created_at: string;
};
export type PublicData = {
  site: SiteData | null;
  entries: EntryData[];
  media: Record<string, string>;
  preview: boolean;
};
export function parseDocument(row: DocumentRow): CmsDocument {
  return {
    ...row,
    draft: (row.kind === "site" ? siteSchema : entrySchema).parse(
      JSON.parse(row.draft),
    ),
    published: row.published
      ? (row.kind === "site" ? siteSchema : entrySchema).parse(
          JSON.parse(row.published),
        )
      : null,
  } as CmsDocument;
}
export function emptyEntry(category: Kind): EntryData {
  const blank = {
    title: "",
    summary: "",
    body: "",
    seoTitle: "",
    seoDescription: "",
  };
  return {
    slug: "new-" + crypto.randomUUID().slice(0, 8),
    category,
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    pinned: false,
    demo: false,
    order: 0,
    cover: "",
    visual: "",
    repo: "",
    demoUrl: "",
    ...blank,
  };
}
export function mediaIds(data: unknown): string[] {
  return [
    ...new Set(
      [...JSON.stringify(data).matchAll(/\/api\/media\/([a-zA-Z0-9-]+)/g)].map(
        (m) => m[1],
      ),
    ),
  ];
}
