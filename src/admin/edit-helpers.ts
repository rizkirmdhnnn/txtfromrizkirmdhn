import type { EntryData, Lang, SiteData } from "../lib/cms";

export const categoryNames = {
  projects: "Proyek",
  experience: "Pengalaman",
  writing: "Tulisan",
  about: "Tentang & sertifikasi",
};

export function setTranslation<T extends EntryData | SiteData>(
  draft: T,
  lang: Lang,
  field: string,
  value: string,
): T {
  return {
    ...draft,
    translations: {
      ...draft.translations,
      [lang]: { ...draft.translations[lang], [field]: value },
    },
  } as T;
}

// Kedua bentuk translations punya kunci berbeda, jadi pembacaan lewat nama
// field dinamis memang perlu satu cast; disimpan di sini supaya cuma sekali.
export function translationText(
  draft: EntryData | SiteData,
  lang: Lang,
  field: string,
): string {
  const value = (draft.translations[lang] as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}
