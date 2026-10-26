import { readFile, writeFile, mkdir } from "node:fs/promises";
import { markdownToPortableText } from "@portabletext/markdown";

const ROOT = new URL("../", import.meta.url);
const readJson = async (path) =>
	JSON.parse(await readFile(new URL(path, ROOT), "utf8"));

const documentsResponse = await readJson("migration/output/documents.json");
const mediaResponse = await readJson("migration/output/media.json");
const redirectsResponse = await readJson("migration/output/redirects.json");
const seed = await readJson("seed/seed.json");

const documents = documentsResponse[0]?.results ?? [];
const mediaRows = mediaResponse[0]?.results ?? [];
const redirects = redirectsResponse[0]?.results ?? [];
const mediaById = new Map(mediaRows.map((row) => [row.id, row]));

const PUBLIC_ORIGIN = "https://txtfromrizkirmdhn.my.id";
const text = (value) => (typeof value === "string" ? value : "");
const dateIso = (value) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;

function slugify(value) {
	return String(value)
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function mediaValue(assetPath, fallbackAlt = "") {
	const match = String(assetPath || "").match(/\/api\/media\/([a-zA-Z0-9-]+)/);
	if (!match) return undefined;
	const id = match[1];
	const row = mediaById.get(id);
	if (!row) return undefined;
	let alt = fallbackAlt;
	try {
		const parsed = JSON.parse(row.alt || '""');
		if (typeof parsed === "string" && parsed.trim()) alt = parsed;
	} catch {
		if (typeof row.alt === "string" && row.alt.trim()) alt = row.alt;
	}
	return {
		$media: {
			url: `${PUBLIC_ORIGIN}/api/media/${id}`,
			alt,
			filename: row.name || `${id}`,
		},
	};
}

function portableText(markdown) {
	if (!markdown || !markdown.trim()) return [];
	return markdownToPortableText(markdown);
}

const tagTerms = new Map();
function tagSlug(label) {
	const slug = slugify(label);
	if (!slug) return null;
	if (!tagTerms.has(slug)) tagTerms.set(slug, label);
	return slug;
}

const content = {
	projects: [],
	experience: [],
	writing: [],
	about: [],
	setup: [],
	gallery: [],
	profile: [],
};

function baseEntry(row, data, collection, tags = []) {
	const entry = {
		id: row.id,
		slug: row.slug,
		status: "published",
		data,
	};
	if (tags.length) {
		entry.taxonomies = { tag: tags.map(tagSlug).filter(Boolean) };
	}
	return entry;
}

for (const row of documents) {
	if (row.deleted) continue;
	const raw = JSON.parse(row.published || row.draft);
	const kind = row.kind;
	const tags = Array.isArray(raw.tags) ? raw.tags.map(text).filter(Boolean) : [];
	const common = {
		title: text(raw.title),
		summary: text(raw.summary),
		body: portableText(raw.body),
		date: dateIso(text(raw.date)),
		order: Number(raw.order) || 0,
	};
	if (kind === "projects") {
		content.projects.push(
			baseEntry(
				row,
				{
					...common,
					pinned: Boolean(raw.pinned),
					demo: Boolean(raw.demo),
					cover: mediaValue(raw.cover, raw.title),
					visual: raw.visual || "none",
					repo: raw.repo || undefined,
					demo_url: raw.demoUrl || undefined,
				},
				kind,
				tags,
			),
		);
	} else if (kind === "experience" || kind === "writing" || kind === "about") {
		content[kind].push(
			baseEntry(
				row,
				{
					...common,
					cover: mediaValue(raw.cover, raw.title),
				},
				kind,
				tags,
			),
		);
	} else if (kind === "setup") {
		content.setup.push(
			baseEntry(
				row,
				{
					title: common.title,
					group: text(raw.group),
					summary: common.summary,
					body: common.body,
					link: raw.demoUrl || undefined,
					order: common.order,
				},
				kind,
			),
		);
	} else if (kind === "gallery") {
		content.gallery.push(
			baseEntry(
				row,
				{
					title: common.title,
					summary: common.summary,
					cover: mediaValue(raw.cover, raw.title),
					link: raw.demoUrl || undefined,
					order: common.order,
					date: common.date || undefined,
				},
				kind,
			),
		);
	} else if (kind === "site") {
		const sections = Array.isArray(raw.sections) ? raw.sections : [];
		const words = raw.words && typeof raw.words === "object" ? raw.words : {};
		const skills = Array.isArray(raw.skills) ? raw.skills : [];
		content.profile.push({
			id: "profile",
			slug: "profile",
			status: "published",
			data: {
				name: text(raw.name),
				brand: text(raw.brand) || "ar",
				handle: text(raw.handle),
				headline: text(raw.headline),
				bio: text(raw.bio),
				note: text(raw.note),
				location: text(raw.location),
				email: text(raw.email),
				whatsapp: text(raw.whatsapp),
				github: raw.github || undefined,
				linkedin: raw.linkedin || undefined,
				skills: skills.map((name) => ({ name: text(name) })),
				avatar: mediaValue(raw.avatar, raw.name),
				cv: mediaValue(raw.cv, "Curriculum vitae"),
				about_title: text(raw.aboutTitle),
				about_body: portableText(raw.aboutBody),
				setup_intro: portableText(raw.setupIntro),
				setup_cover: mediaValue(raw.setupCover, "Setup"),
				gallery_intro: [],
				footer: text(raw.footer),
				seo_title: text(raw.seoTitle),
				seo_description: text(raw.seoDescription),
				copy: Object.entries(words).map(([key, value]) => ({
					key,
					value: text(value),
				})),
				sections: sections
					.filter((section) => section && typeof section.key === "string")
					.map((section) => ({
						key: section.key,
						label:
							text(words[section.key]) ||
							section.key.charAt(0).toUpperCase() + section.key.slice(1),
						visible: section.visible !== false,
					})),
				maintenance_enabled: false,
			},
		});
	}
}

if (tagTerms.size) {
	seed.taxonomies = seed.taxonomies ?? [];
	const taxonomy = seed.taxonomies.find((item) => item.name === "tag");
	if (taxonomy) {
		taxonomy.terms = [...tagTerms.entries()].map(([slug, label]) => ({ slug, label }));
	}
}

seed.content = content;
delete seed.content.pages;

await mkdir(new URL("migration/output", ROOT), { recursive: true });
await writeFile(
	new URL("migration/seed-with-content.json", ROOT),
	JSON.stringify(seed, null, 2) + "\n",
);

const report = {
	documents: documents.filter((row) => !row.deleted).length,
	projects: content.projects.length,
	experience: content.experience.length,
	writing: content.writing.length,
	about: content.about.length,
	setup: content.setup.length,
	gallery: content.gallery.length,
	profile: content.profile.length,
	media: mediaRows.length,
	taxonomyTerms: tagTerms.size,
	redirects: redirects.length,
};
await writeFile(
	new URL("migration/output/report.json", ROOT),
	JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
