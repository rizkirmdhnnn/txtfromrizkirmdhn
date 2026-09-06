import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import { ListKit } from "@tiptap/extension-list";

export const EDITOR_PLACEHOLDER =
  "Mulai menulis, atau ketik / untuk pilihan blok…";

// Satu sumber kebenaran untuk ekstensi editor. Hanya node/mark yang didukung
// serializer @tiptap/markdown yang boleh ditambahkan di sini — underline,
// warna teks, dan alignment TIDAK aman (data hilang saat disimpan).
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      // Link standalone dikonfigurasi terpisah di bawah.
      link: false,
      heading: { levels: [1, 2, 3] },
      // List bawaan (bullet/ordered/listItem/listKeymap) dimatikan, diganti
      // ListKit agar ada task list. Catatan interop ESM/CJS:
      // TaskList/TaskItem dari paket standalone terpisah bisa undefined di
      // Vite, jadi pakai ListKit dari @tiptap/extension-list.
      bulletList: false,
      orderedList: false,
      listItem: false,
      listKeymap: false,
    }),
    ListKit.configure({
      taskItem: { nested: true },
    }),
    Link.configure({
      openOnClick: false,
      protocols: ["https"],
      HTMLAttributes: { rel: "noopener noreferrer" },
    }),
    Image,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
    Markdown,
  ];
}

export function countWords(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return { words: text.trim() ? words.length : 0, characters: text.length };
}

export function readingMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}
