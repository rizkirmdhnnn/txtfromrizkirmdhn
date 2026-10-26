import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "public", "og-cache");
const BASE_URL = process.env.EMDASH_URL || "http://localhost:4321";
const TOKEN = process.env.EMDASH_TOKEN;
const R2_BUCKET = process.env.R2_BUCKET || "rizki-portfolio-emdash-media-staging";
const UPLOAD = process.env.OG_UPLOAD === "1";
const WIDTH = 1200;
const HEIGHT = 630;

const collectionLabels = {
	projects: "Projects",
	experience: "Experience",
	writing: "Writing",
	about: "About",
	setup: "Setup",
	gallery: "Gallery",
};

function cli(args) {
	const bin = process.platform === "win32" ? "npx.cmd" : "npx";
	return execFileSync(bin, ["emdash", ...args, "--json", "--url", BASE_URL, ...(TOKEN ? ["--token", TOKEN] : [])], {
		encoding: "utf8",
		maxBuffer: 20 * 1024 * 1024,
	});
}

function el(style, ...children) {
	return { type: "div", props: { style: { display: "flex", ...style }, children } };
}

function text(value, style) {
	return { type: "div", props: { style: { display: "flex", ...style }, children: value } };
}

function card({ title, subtitle, footer }) {
	return el(
		{
			width: "100%",
			height: "100%",
			backgroundColor: "#f8f9fb",
			color: "#282d34",
			padding: "72px",
			flexDirection: "column",
			justifyContent: "space-between",
			fontFamily: "DM Sans",
		},
		el(
			{ alignItems: "center", gap: "14px" },
			text("ar", { fontSize: "26px", fontWeight: 700, color: "#4b6c9d" }),
			text("·", { fontSize: "26px", color: "#727983" }),
			text(subtitle.toUpperCase(), {
				fontSize: "22px",
				letterSpacing: "4px",
				color: "#727983",
				fontWeight: 700,
			}),
		),
		text(title, {
			fontSize: title.length > 54 ? "54px" : "68px",
			lineHeight: 1.08,
			letterSpacing: "-2px",
			fontWeight: 700,
			maxWidth: "1000px",
		}),
		el(
			{ justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e9ebef", paddingTop: "28px" },
			text(footer, { fontSize: "22px", color: "#727983" }),
			text("txtfromrizkirmdhn.my.id", { fontSize: "22px", color: "#4b6c9d", fontWeight: 700 }),
		),
	);
}

const regular = await readFile(path.join(ROOT, "src/assets/fonts/DMSans-Regular.ttf"));
const bold = await readFile(path.join(ROOT, "src/assets/fonts/DMSans-Bold.ttf"));
const fonts = [
	{ name: "DM Sans", data: regular, weight: 400, style: "normal" },
	{ name: "DM Sans", data: bold, weight: 700, style: "normal" },
];

async function render(payload, file) {
	const svg = await satori(card(payload), { width: WIDTH, height: HEIGHT, fonts });
	const png = await sharp(Buffer.from(svg)).png().toBuffer();
	const target = path.join(OUT, `${file}.png`);
	await writeFile(target, png);
	if (UPLOAD) {
		execFileSync("npx", [
			"wrangler",
			"r2",
			"object",
			"put",
			`${R2_BUCKET}/og/${file}.png`,
			"--file",
			target,
			"--content-type",
			"image/png",
			"--remote",
		], { stdio: "inherit" });
	}
	return target;
}

await mkdir(OUT, { recursive: true });

let profileData = {};
try {
	const profile = JSON.parse(cli(["content", "get", "profile", "profile"]));
	profileData = profile.data || {};
} catch {
	// The profile is optional while bootstrapping.
}

await render(
	{
		title: profileData.name || "Achmad Rizki Ramadhan",
		subtitle: "Portfolio",
		footer: profileData.headline || "Backend, cloud & AI",
	},
	"default",
);

for (const collection of Object.keys(collectionLabels)) {
	let result;
	try {
		result = JSON.parse(cli(["content", "list", collection, "--limit", "100"]));
	} catch (error) {
		console.warn(`Skipping ${collection}: ${error.message}`);
		continue;
	}
	for (const item of result.items || []) {
		const date = item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : "";
		await render(
			{
				title: item.title || item.slug || "Untitled",
				subtitle: collectionLabels[collection],
				footer: date,
			},
			item.slug || item.id,
		);
	}
}

console.log(`OG images written to ${OUT}${UPLOAD ? " and uploaded to R2" : ""}`);
