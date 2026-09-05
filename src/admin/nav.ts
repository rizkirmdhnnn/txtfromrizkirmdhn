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
  { id: "overview", label: "Ringkasan", Icon: LayoutDashboard },
  { id: "site", label: "Profil & website", Icon: User },
  { id: "projects", label: "Proyek", Icon: Folder },
  { id: "experience", label: "Pengalaman", Icon: Briefcase },
  { id: "writing", label: "Tulisan", Icon: FileText },
  { id: "about", label: "Tentang & sertifikasi", Icon: Award },
  { id: "media", label: "Media library", Icon: Image },
  { id: "settings", label: "Pengaturan", Icon: Settings },
  { id: "trash", label: "Sampah", Icon: Trash2 },
] as const satisfies ReadonlyArray<{
  id: Section;
  label: string;
  Icon: unknown;
}>;

export function sectionLabel(section: Section) {
  return nav.find((n) => n.id === section)?.label ?? "";
}
