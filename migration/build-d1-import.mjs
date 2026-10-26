import { DatabaseSync } from "node:sqlite";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const db = new DatabaseSync(path.join(ROOT, "data.db"));

const excluded = new Set([
	"users",
	"credentials",
	"auth_challenges",
	"auth_tokens",
	"oauth_accounts",
	"audit_logs",
	"allowed_domains",
	"_emdash_api_tokens",
	"_emdash_authorization_codes",
	"_emdash_device_codes",
	"_emdash_oauth_clients",
	"_emdash_oauth_tokens",
	"_emdash_rate_limits",
	"_emdash_entry_locks",
	"_emdash_media_usage",
	"_emdash_media_usage_activation",
	"_emdash_media_usage_cleanup",
	"_emdash_media_usage_cleanup_fence",
	"_emdash_media_usage_collection_deletions",
	"_emdash_media_usage_generation_writes",
	"_emdash_media_usage_index_status",
	"_emdash_media_usage_reconciliations",
	"_emdash_media_usage_sources",
	"_emdash_media_usage_work",
	"_emdash_media_upload_attempts",
	"_emdash_transfer_approvals",
	"_emdash_transfer_identity_map",
	"_emdash_transfer_media_blobs",
	"_emdash_transfer_operations",
	"_emdash_transfer_package_index",
	"_emdash_transfer_staged_files",
	"_emdash_revision_prune_queue",
	"_emdash_404_log",
	"_emdash_comment_reactions",
	"_emdash_comments",
]);

const master = db
	.prepare(
		"SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '%_fts_%' ORDER BY type, name",
	)
	.all();

const allTables = master
	.filter((row) => row.type === "table")
	.map((row) => row.name);
const tables = master
	.filter((row) => row.type === "table" && !excluded.has(row.name))
	.map((row) => row.name);

const tableSet = new Set(tables);
const schemaTableSet = new Set(allTables);

const schema = [];
for (const row of master) {
	if (row.type === "table") {
		if (!schemaTableSet.has(row.name)) continue;
		schema.push(`${row.sql};`);
	}
}
for (const row of master) {
	if (row.type === "index" && schemaTableSet.has(row.tbl_name)) schema.push(`${row.sql};`);
}
for (const row of master) {
	if (row.type === "trigger" && schemaTableSet.has(row.tbl_name)) schema.push(`${row.sql};`);
}

const dependencies = new Map();
for (const table of tables) {
	const fks = db.prepare(`PRAGMA foreign_key_list("${table.replaceAll('"', '""')}")`).all();
	dependencies.set(
		table,
		[...new Set(fks.map((fk) => fk.table).filter((parent) => parent !== table && tableSet.has(parent)))],
	);
}

const ordered = [];
const visiting = new Set();
const visited = new Set();
function visit(table) {
	if (visited.has(table)) return;
	if (visiting.has(table)) return;
	visiting.add(table);
	for (const parent of dependencies.get(table) ?? []) visit(parent);
	visiting.delete(table);
	visited.add(table);
	ordered.push(table);
}
for (const table of tables) visit(table);

function quote(value) {
	if (value === null || value === undefined) return "NULL";
	if (typeof value === "number") return String(value);
	if (typeof value === "bigint") return String(value);
	if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
	return `'${String(value).replaceAll("'", "''")}'`;
}

const data = [];
for (const table of ordered) {
	const rows = db.prepare(`SELECT * FROM "${table.replaceAll('"', '""')}"`).all();
	if (!rows.length) continue;
	const columns = Object.keys(rows[0]);
	const columnSql = columns.map((column) => `"${column.replaceAll('"', '""')}"`).join(", ");
	for (const row of rows) {
		const values = columns.map((column) => quote(row[column])).join(", ");
		data.push(`INSERT INTO "${table.replaceAll('"', '""')}" (${columnSql}) VALUES (${values});`);
	}
}

await writeFile(path.join(ROOT, "migration/output/d1-schema.sql"), schema.join("\n") + "\n");
await writeFile(path.join(ROOT, "migration/output/d1-data.sql"), data.join("\n") + "\n");

console.log(
	JSON.stringify(
		{
			tables: ordered.length,
			rows: data.length,
			order: ordered,
			schemaBytes: schema.join("\n").length,
			dataBytes: data.join("\n").length,
		},
		null,
		2,
	),
);
