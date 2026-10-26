import type { APIRoute } from "astro";
import {
	getAllPublishedEntries,
	getProfile,
	getSectionLabel,
	tabPaths,
	visibleSections,
} from "../lib/content";

const pageDescriptions: Record<string, string> = {
	projects: "Featured work and projects",
	experience: "Work experience and roles",
	writing: "Notes and articles",
	about: "About the author",
	setup: "Hardware and software in use",
	gallery: "Photos",
};

export const GET: APIRoute = async ({ url }) => {
	const origin = url.origin;
	const profile = await getProfile();
	if (!profile) {
		return new Response(`# Portfolio\n\n> ${origin}\n\nThis personal site is being prepared.\n`, {
			headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
		});
	}
	const entries = await getAllPublishedEntries();
	const lines: string[] = [];
	lines.push(`# ${profile.data.name}`);
	if (profile.data.headline) lines.push("", `> ${profile.data.headline}`);
	if (profile.data.bio) lines.push("", profile.data.bio);
	const facts: string[] = [];
	if (profile.data.location) facts.push(`Location: ${profile.data.location}`);
	if (profile.data.email) facts.push(`Email: ${profile.data.email}`);
	if (profile.data.github) facts.push(`GitHub: ${profile.data.github}`);
	if (profile.data.linkedin) facts.push(`LinkedIn: ${profile.data.linkedin}`);
	if (Array.isArray(profile.data.skills)) {
		const skills = profile.data.skills.map((row: any) => row?.name).filter(Boolean);
		if (skills.length) facts.push(`Skills: ${skills.join(", ")}`);
	}
	if (facts.length) lines.push("", facts.map((fact) => `- ${fact}`).join("\n"));
	lines.push("", "## Pages");
	for (const section of visibleSections(profile)) {
		lines.push(
			`- [${getSectionLabel(profile, section.key)}](${origin}${tabPaths[section.key]}): ${pageDescriptions[section.key]}`,
		);
	}
	for (const section of ["projects", "experience", "writing", "about", "setup", "gallery"] as const) {
		const items = entries.filter((item) => item.collection === section);
		if (!items.length) continue;
		lines.push("", `## ${getSectionLabel(profile, section)}`);
		for (const { entry } of items) {
			const description = entry.data.summary
				? `: ${String(entry.data.summary).replace(/\s+/g, " ").slice(0, 200)}`
				: "";
			lines.push(
				`- [${entry.data.title}](${origin}/post/${entry.id})${description} (${String(entry.data.date || "").slice(0, 10)})`,
			);
		}
	}
	return new Response(lines.join("\n"), {
		headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
	});
};
