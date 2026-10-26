import {
	getEmDashCollection,
	getEmDashEntry,
	resolveEmDashPath,
} from "emdash";

export const sections = [
	"projects",
	"experience",
	"writing",
	"about",
	"setup",
	"gallery",
] as const;

export type SectionKey = (typeof sections)[number];

export const tabPaths: Record<SectionKey, string> = {
	projects: "/",
	experience: "/experience",
	writing: "/writing",
	about: "/about",
	setup: "/setup",
	gallery: "/gallery",
};

export const sectionLabels: Record<SectionKey, string> = {
	projects: "Projects",
	experience: "Experience",
	writing: "Writing",
	about: "About",
	setup: "Setup",
	gallery: "Gallery",
};

export type ImageValue = {
	id?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	url?: string;
} | null;

export type ProfileSection = {
	key: SectionKey;
	label: string;
	visible: boolean;
};

export type ProfileEntry = {
	id: string;
	data: Record<string, any> & {
		sections?: ProfileSection[] | null;
		copy?: Array<{ key?: string; value?: string }> | null;
		skills?: Array<{ name?: string }> | null;
	};
};

const defaultSectionOrder: ProfileSection[] = sections.map((key) => ({
	key,
	label: sectionLabels[key],
	visible: true,
}));

export async function getProfile(): Promise<ProfileEntry | null> {
	try {
		const { entry } = await getEmDashEntry("profile", "profile");
		return (entry as ProfileEntry | null) ?? null;
	} catch {
		return null;
	}
}

export function getProfileSections(profile: ProfileEntry | null): ProfileSection[] {
	const raw = profile?.data?.sections;
	if (!Array.isArray(raw) || raw.length === 0) return defaultSectionOrder;
	const seen = new Set<string>();
	const result: ProfileSection[] = [];
	for (const row of raw) {
		if (!row || typeof row.key !== "string") continue;
		if (!(sections as readonly string[]).includes(row.key)) continue;
		if (seen.has(row.key)) continue;
		seen.add(row.key);
		result.push({
			key: row.key as SectionKey,
			label: row.label?.trim() || sectionLabels[row.key as SectionKey],
			visible: row.visible !== false,
		});
	}
	for (const key of sections) {
		if (!seen.has(key)) {
			result.push({ key, label: sectionLabels[key], visible: false });
		}
	}
	return result;
}

export function visibleSections(profile: ProfileEntry | null): ProfileSection[] {
	return getProfileSections(profile).filter((section) => section.visible);
}

export function getSectionLabel(
	profile: ProfileEntry | null,
	key: SectionKey,
): string {
	return (
		getProfileSections(profile).find((section) => section.key === key)?.label ||
		sectionLabels[key]
	);
}

export function isSectionVisible(
	profile: ProfileEntry | null,
	key: SectionKey,
): boolean {
	return visibleSections(profile).some((section) => section.key === key);
}

export function getSkills(profile: ProfileEntry | null): string[] {
	return (profile?.data?.skills ?? [])
		.map((row) => row?.name?.trim())
		.filter((value): value is string => Boolean(value));
}

export function getCopy(profile: ProfileEntry | null): Record<string, string> {
	const copy: Record<string, string> = {};
	for (const row of profile?.data?.copy ?? []) {
		if (!row?.key || typeof row.value !== "string") continue;
		copy[row.key] = row.value;
	}
	return copy;
}

export function formatDate(value: string | Date | null | undefined): string {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(`${value}`);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function dateValue(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string") return value;
	return "";
}

export function entryTags(entry: any): string[] {
	const terms = entry?.data?.terms?.tag;
	if (Array.isArray(terms)) return terms.map((term: any) => term.label || term.name || term.slug).filter(Boolean);
	const tags = entry?.data?.tags;
	return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
}

export function imageAlt(image: ImageValue, fallback: string): string {
	return image?.alt?.trim() || fallback;
}

export function imageUrl(image: ImageValue): string {
	return image?.src || image?.url || "";
}

export function resolveImageUrl(image: ImageValue, emdash?: any): string {
	if (!image) return "";
	if (image.src || image.url) return image.src || image.url || "";
	const storageKey = (image as any).meta?.storageKey;
	return storageKey && emdash?.getPublicMediaUrl
		? emdash.getPublicMediaUrl(storageKey)
		: "";
}

export function sortEntries<T extends { data: Record<string, any> }>(collection: SectionKey, entries: T[]): T[] {
	const sorted = [...entries];
	sorted.sort((a, b) => {
		if (collection === "projects") {
			const pinned = Number(Boolean(b.data.pinned)) - Number(Boolean(a.data.pinned));
			if (pinned) return pinned;
		}
		const order = Number(a.data.order ?? 0) - Number(b.data.order ?? 0);
		if (order) return order;
		return dateValue(b.data.date).localeCompare(dateValue(a.data.date));
	});
	return sorted;
}

export async function getSectionEntries(collection: SectionKey): Promise<any[]> {
	const result = await getEmDashCollection(collection, { limit: 100 });
	if (result.error) throw result.error;
	return sortEntries(collection, result.entries as any[]);
}

export async function getEntryForPath(slug: string) {
	const result = await resolveEmDashPath(`/post/${slug}`);
	if (!result) return null;
	return { entry: result.entry as any, collection: result.collection as SectionKey };
}

export async function getAllPublishedEntries(): Promise<Array<{ collection: SectionKey; entry: any }>> {
	const collections = await Promise.all(
		sections.map(async (collection) => ({
			collection,
			entries: await getSectionEntries(collection),
		})),
	);
	return collections.flatMap(({ collection, entries }) =>
		entries.map((entry) => ({ collection, entry })),
	);
}

export function entryHref(entry: any): string {
	return `/post/${entry.id}`;
}

export function sectionTitle(
	profile: ProfileEntry | null,
	key: SectionKey,
): string {
	return getSectionLabel(profile, key);
}
