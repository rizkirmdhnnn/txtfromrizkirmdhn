import { DatabaseSync, backup } from "node:sqlite";
import { cp, mkdir, readFile, writeFile, realpath } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { parseArgs } from "node:util";
import {
  applyMigration,
  planMigration,
  snapshot,
  type MigrationPlan,
  type Translations,
} from "./english-migration";

const { values } = parseArgs({
  options: {
    db: { type: "string" },
    plan: { type: "string" },
    translations: { type: "string" },
    apply: { type: "boolean", default: false },
    backup: { type: "string" },
    assets: { type: "string" },
  },
});
if (!values.db || !values.plan)
  throw new Error(
    "Usage: npm run content:migrate-english -- --db <sqlite> --plan <json> [--translations <json>] [--apply --backup <new-directory> --assets <asset-directory>]",
  );
// realpath prevents accidentally creating an empty database on a misspelled path.
const db = new DatabaseSync(await realpath(values.db), {
  readOnly: !values.apply,
});
try {
  if (!values.apply) {
    const translations: Translations = values.translations
      ? JSON.parse(await readFile(values.translations, "utf8"))
      : {};
    const plan = planMigration(snapshot(db), translations);
    await writeFile(values.plan, JSON.stringify(plan, null, 2) + "\n", {
      mode: 0o600,
    });
    console.log(
      `${plan.changes.length} changes; ${plan.errors.length} unresolved items. Plan: ${values.plan}`,
    );
    if (plan.errors.length) {
      await writeFile(
        values.plan + ".translations.json",
        JSON.stringify(plan.translations, null, 2) + "\n",
        { mode: 0o600 },
      );
      console.log(
        `Fill english and reviewed in ${values.plan}.translations.json, then inspect again with --translations.`,
      );
      process.exitCode = 1;
    }
  } else {
    if (!values.backup)
      throw new Error("--backup is required before applying a migration.");
    const plan: MigrationPlan = JSON.parse(await readFile(values.plan, "utf8"));
    if (plan.format !== 1 || plan.errors.length)
      throw new Error("Generate a complete, error-free plan before applying.");
    if (snapshot(db).media.length && !values.assets)
      throw new Error(
        "--assets is required to back up existing media. Stop the local server before applying.",
      );
    const backupDir = resolve(values.backup);
    if (values.assets) {
      const assetDir = await realpath(values.assets);
      const rel = relative(assetDir, backupDir);
      if (!rel || (!rel.startsWith("..") && !rel.startsWith("/")))
        throw new Error(
          "Backup directory must be outside the asset directory.",
        );
    }
    await mkdir(backupDir, { mode: 0o700 }); // Refuse to overwrite a previous backup.
    await backup(db, resolve(backupDir, "database.sqlite"));
    if (values.assets)
      await cp(values.assets, resolve(backupDir, "assets"), {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    console.log(
      `Applied ${applyMigration(db, plan)} changes. Backup: ${backupDir}`,
    );
  }
} finally {
  db.close();
}
