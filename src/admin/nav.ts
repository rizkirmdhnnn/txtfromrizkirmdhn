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
import { kinds, type Kind } from "../lib/cms";

export const nav = [
  { id: "overview", label: "Ringkasan", Icon: LayoutDashboard },
  { id: "site", label: "Profil & website", Icon: User },
  { id: "projects", label: "Proyek", Icon: Folder },
  { id: "experience", label: "Pengalaman", Icon: Briefcase },
  { id: "writing", label: "Tulisan", Icon: FileText },
  { id: "about", label: "Tentang & sertifikasi", Icon: Award },
  { id: "media", label: "Media library", Icon: Image },
  { id: "settings", label: "Pengaturan", Icon: Settings },
  { id: "trash", label: "Sampah", Icon: Trash2 },
] as const;

export type Section = (typeof nav)[number]["id"];

export function sectionLabel(section: Section) {
  return nav.find((n) => n.id === section)?.label ?? "";
}

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
