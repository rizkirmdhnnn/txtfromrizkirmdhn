import { kinds, type Kind } from "./cms";

export const adminSections = [
  "overview",
  "site",
  "projects",
  "experience",
  "writing",
  "about",
  "media",
  "settings",
  "trash",
] as const;

export type Section = (typeof adminSections)[number];

export function isKind(value: string): value is Kind {
  return (kinds as readonly string[]).includes(value);
}

export function sectionFromPath(pathname: string): Section {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!segment) return "overview";
  if (segment === "profile") return "site";
  if (isKind(segment)) return segment;
  return segment === "media" || segment === "settings" || segment === "trash"
    ? segment
    : "overview";
}
