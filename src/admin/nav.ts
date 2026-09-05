import {
  LayoutDashboard,
  User,
  Folder,
  Briefcase,
  FileText,
  Award,
  Image,
  Settings,
  Trash2,
} from "lucide-react";
import type { Section } from "../lib/routing";

export const nav = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "site", label: "Profile & website", Icon: User },
  { id: "projects", label: "Projects", Icon: Folder },
  { id: "experience", label: "Experience", Icon: Briefcase },
  { id: "writing", label: "Writing", Icon: FileText },
  { id: "about", label: "About & certifications", Icon: Award },
  { id: "media", label: "Media library", Icon: Image },
  { id: "settings", label: "Settings", Icon: Settings },
  { id: "trash", label: "Trash", Icon: Trash2 },
] as const satisfies ReadonlyArray<{
  id: Section;
  label: string;
  Icon: unknown;
}>;

export function sectionLabel(section: Section) {
  return nav.find((n) => n.id === section)?.label ?? "";
}
