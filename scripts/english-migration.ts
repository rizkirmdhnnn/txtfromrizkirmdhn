import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { entrySchema, siteSchema, mediaIds } from "../src/lib/cms";
import { maintenanceSchema } from "../src/lib/maintenance";

type Row = Record<string, string | number | null>;
export type Snapshot = Record<
  "documents" | "revisions" | "media" | "integrations" | "redirects",
  Row[]
>;
export type Translation = {
  source: string;
  english: string;
  reviewed: boolean;
  kind: "text" | "cv";
};
export type Translations = Record<string, Translation>;
export type Change = {
  table: keyof Snapshot;
  id: string;
  column: string;
  before: string;
  after: string | null;
};
export type MigrationPlan = {
  format: 1;
  sourceHash: string;
  changes: Change[];
  translations: Translations;
  errors: string[];
};
export const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function snapshot(db: DatabaseSync): Snapshot {
  return Object.fromEntries(
    ["documents", "revisions", "media", "integrations", "redirects"].map(
      (table) => [
        table,
        db
          .prepare(
            `SELECT * FROM ${table} ORDER BY ${table === "redirects" ? "slug" : "id"}`,
          )
          .all(),
      ],
    ),
  ) as Snapshot;
}
const object = (value: unknown): Record<string, unknown> =>
  z.record(z.string(), z.unknown()).parse(value);
const string = (value: unknown) =>
  value === undefined ? "" : z.string().parse(value);

/** Offline conversion only: the application never reads bilingual documents. */
export function planMigration(
  source: Snapshot,
  reviewed: Translations = {},
): MigrationPlan {
  const plan: MigrationPlan = {
    format: 1,
    sourceHash: digest(source),
    changes: [],
    translations: {},
    errors: [],
  };
  function translate(value: string, kind: "text" | "cv" = "text") {
    const key = digest({ kind, source: value });
    const supplied = reviewed[key];
    const valid =
      supplied?.source === value &&
      supplied.kind === kind &&
      supplied.reviewed === true &&
      supplied.english.trim();
    const item: Translation = valid
      ? supplied
      : { source: value, english: "", reviewed: false, kind };
    plan.translations[key] = item;
    if (!valid)
      plan.errors.push(`Missing reviewed ${kind} translation: ${key}`);
    return valid ? supplied.english : "";
  }
  function text(en: unknown, id: unknown) {
    const english = string(en),
      indonesian = string(id);
    return english.trim()
      ? english
      : indonesian.trim()
        ? translate(indonesian)
        : english;
  }
  function flatten(raw: string, kind: string) {
    const data = object(JSON.parse(raw));
    if (data.translations) {
      const translations = object(data.translations);
      const en = object(translations.en ?? {}),
        id = object(translations.id ?? {});
      const fields =
        kind === "site"
          ? [
              "headline",
              "bio",
              "note",
              "aboutTitle",
              "aboutBody",
              "footer",
              "seoTitle",
              "seoDescription",
            ]
          : kind === "maintenance"
            ? ["title", "body"]
            : ["title", "summary", "body", "seoTitle", "seoDescription"];
      for (const field of fields) data[field] = text(en[field], id[field]);
      if (kind === "site") {
        const enWords = object(en.words ?? {}),
          idWords = object(id.words ?? {});
        data.words = Object.fromEntries(
          [...new Set([...Object.keys(enWords), ...Object.keys(idWords)])].map(
            (key) => [key, text(enWords[key], idWords[key])],
          ),
        );
      }
      delete data.translations;
    }
    if (kind === "site" && typeof data.cv !== "string") {
      const cv = object(data.cv);
      const en = string(cv.en),
        id = string(cv.id);
      data.cv = en.trim() ? en : id.trim() ? translate(id, "cv") : "";
    }
    // Missing translations are reported first; schema errors are also retained.
    const schema =
      kind === "site"
        ? siteSchema
        : kind === "maintenance"
          ? maintenanceSchema
          : entrySchema;
    const checked = schema.safeParse(data);
    if (!checked.success) throw new Error(checked.error.message);
    return JSON.stringify(checked.data);
  }
  function change(
    table: keyof Snapshot,
    row: Row,
    column: string,
    convert: (raw: string) => string,
  ) {
    const before = row[column];
    if (before === null) return;
    try {
      const after = convert(z.string().parse(before));
      if (after !== before)
        plan.changes.push({
          table,
          id: String(row.id),
          column,
          before: String(before),
          after,
        });
    } catch (error) {
      plan.errors.push(`${table}/${row.id}/${column}: ${String(error)}`);
    }
  }
  for (const row of source.documents) {
    for (const column of ["draft", "published"])
      change("documents", row, column, (raw) => flatten(raw, String(row.kind)));
  }
  for (const row of source.revisions) {
    const document = source.documents.find((doc) => doc.id === row.document_id);
    if (!document) {
      plan.errors.push(`Orphan revision: ${row.id}`);
      continue;
    }
    change("revisions", row, "snapshot", (raw) =>
      flatten(raw, String(document.kind)),
    );
  }
  for (const row of source.media)
    change("media", row, "alt", (raw) => {
      const value: unknown = JSON.parse(raw);
      const alt =
        typeof value === "string"
          ? value
          : text(object(value).en, object(value).id);
      return JSON.stringify(z.string().max(500).parse(alt));
    });
  for (const row of source.integrations) {
    if (row.id === "maintenance")
      change("integrations", row, "value", (raw) =>
        flatten(raw, "maintenance"),
      );
    if (row.id === "ai")
      plan.changes.push({
        table: "integrations",
        id: "ai",
        column: "value",
        before: String(row.value),
        after: null,
      });
  }
  const assets = new Map(source.media.map((row) => [String(row.id), row]));
  for (const change of plan.changes) {
    if (!change.after || !["documents", "revisions"].includes(change.table))
      continue;
    for (const id of mediaIds(JSON.parse(change.after)))
      if (!assets.has(id))
        plan.errors.push(`Missing asset ${id} in ${change.table}/${change.id}`);
  }
  for (const value of Object.values(plan.translations))
    if (value.kind === "cv" && value.reviewed) {
      const id = value.english.match(/^\/api\/media\/([a-zA-Z0-9-]+)$/)?.[1];
      if (!id || assets.get(id)?.type !== "application/pdf")
        plan.errors.push(
          `English CV must reference an existing PDF: ${value.english}`,
        );
    }
  plan.errors = [...new Set(plan.errors)];
  return plan;
}

/** The source check and all writes share one transaction, including AI removal. */
export function applyMigration(db: DatabaseSync, reviewedPlan: MigrationPlan) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = snapshot(db);
    if (digest(current) !== reviewedPlan.sourceHash)
      throw new Error(
        "Source changed since inspection. Generate and review a new plan.",
      );
    const verified = planMigration(current, reviewedPlan.translations);
    if (verified.errors.length) throw new Error(verified.errors.join("\n"));
    if (digest(verified.changes) !== digest(reviewedPlan.changes))
      throw new Error(
        "Plan changes do not match the reviewed translations. Generate a new plan.",
      );
    for (const change of verified.changes) {
      if (change.after === null)
        db.prepare("DELETE FROM integrations WHERE id='ai'").run();
      else
        db.prepare(
          `UPDATE ${change.table} SET ${change.column}=? WHERE id=?`,
        ).run(change.after, change.id);
    }
    db.exec("COMMIT");
    return verified.changes.length;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
