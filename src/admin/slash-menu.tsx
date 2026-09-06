import type { Editor } from "@tiptap/core";
import type { MediaItem } from "../lib/cms";

export type SlashSelection = "text" | "image";

export type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  run: (editor: Editor, media: MediaItem[]) => void;
};

export function slashCommands(onPickImage: () => void): SlashCommand[] {
  const block = (
    id: string,
    label: string,
    hint: string,
    keywords: string,
    run: (editor: Editor) => void,
  ): SlashCommand => ({
    id,
    label,
    hint,
    keywords: `${label} ${hint} ${keywords}`.toLowerCase(),
    run: (editor) => run(editor),
  });
  return [
    block("paragraph", "Teks", "Paragraf biasa", "p text normal", (editor) =>
      editor.chain().focus().setParagraph().run(),
    ),
    block("h1", "Heading 1", "Judul utama", "h1 title", (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    ),
    block("h2", "Heading 2", "Judul bagian", "h2 subtitle", (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    ),
    block("h3", "Heading 3", "Sub judul", "h3", (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    ),
    block(
      "bullet",
      "Daftar bullet",
      "Daftar tidak berurutan",
      "ul list bullet titik",
      (editor) => editor.chain().focus().toggleBulletList().run(),
    ),
    block(
      "ordered",
      "Daftar bernomor",
      "Daftar berurutan",
      "ol list angka nomor",
      (editor) => editor.chain().focus().toggleOrderedList().run(),
    ),
    block(
      "task",
      "Daftar tugas",
      "Checkbox daftar",
      "todo checklist task",
      (editor) => editor.chain().focus().toggleTaskList().run(),
    ),
    block("quote", "Kutipan", "Blok kutipan", "quote blockquote", (editor) =>
      editor.chain().focus().toggleBlockquote().run(),
    ),
    block("code", "Blok kode", "Kode program", "codeblock pre", (editor) =>
      editor.chain().focus().toggleCodeBlock().run(),
    ),
    block(
      "divider",
      "Pembatas",
      "Garis horizontal",
      "hr divider garis",
      (editor) => editor.chain().focus().setHorizontalRule().run(),
    ),
    block("table", "Tabel", "Tabel 3 kolom", "table grid", (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
    ),
    {
      id: "image",
      label: "Gambar",
      hint: "Sisipkan dari media",
      keywords: "image gambar foto picture",
      run: () => onPickImage(),
    },
  ];
}

export function filterSlashCommands(
  commands: SlashCommand[],
  query: string,
): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => c.keywords.includes(q));
}
