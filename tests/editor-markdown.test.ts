import { beforeAll, afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { createEditorExtensions } from "../src/admin/editor-extensions";

if (typeof window === "undefined") {
  throw new Error("editor-markdown tests require a DOM environment");
}

let editors: Editor[] = [];
afterEach(() => {
  for (const editor of editors) editor.destroy();
  editors = [];
});

function legacyExtensions() {
  return [
    StarterKit.configure({
      link: { openOnClick: false, protocols: ["https"] },
    }),
    Image,
    Markdown,
  ];
}

function makeEditor(
  extensions:
    | ReturnType<typeof legacyExtensions>
    | ReturnType<typeof createEditorExtensions>,
) {
  const editor = new Editor({
    extensions: extensions as never,
    content: "",
  } as never);
  editors.push(editor);
  return editor;
}

function roundTrip(editor: Editor, markdown: string) {
  editor.commands.setContent(markdown, {
    contentType: "markdown",
    emitUpdate: false,
  });
  return editor.getMarkdown();
}

describe("editor markdown round-trip", () => {
  beforeAll(() => {
    expect(typeof document).toBe("object");
  });

  // Catatan perilaku serializer @tiptap/markdown: node yang TIDAK punya
  // ekstensi terdaftar (tabel/task list di editor lama) hilang saat
  // serialisasi — alasan tabel & task list wajib jadi ekstensi resmi.
  it("documents why tables and task lists need real extensions", () => {
    const editor = makeEditor(legacyExtensions());
    const out = roundTrip(
      editor,
      "| A | B |\n|---|---|\n| 1 | 2 |\n\n- [ ] todo\n- [x] done\n",
    );
    expect(out).not.toContain("| A");
    expect(out).toContain("todo");
  });

  it("new extensions serialize tables, task lists, and strike", () => {
    const editor = makeEditor(createEditorExtensions());
    editor.commands.setContent(
      "| A | B |\n|---|---|\n| 1 | 2 |\n\n- [ ] todo\n- [x] done\n\ntext with ~~strike~~ here\n",
      { contentType: "markdown", emitUpdate: false },
    );
    const out = editor.getMarkdown();
    expect(out).toContain("| A");
    expect(out).toContain("todo");
    expect(out).toContain("~~strike~~");
    // Idempoten: save -> reload -> save menghasilkan markdown sama.
    const again = makeEditor(createEditorExtensions());
    again.commands.setContent(out, {
      contentType: "markdown",
      emitUpdate: false,
    });
    expect(again.getMarkdown()).toBe(out);
  });

  it("new extensions keep legacy markdown identical", () => {
    const samples = [
      "# Title\n\nParagraph with **bold** and *italic* and `code`.\n",
      "## Sub\n\n- one\n- two\n\n1. first\n2. second\n",
      "> quote\n\n---\n\n```js\nconst a = 1;\n```\n",
      "![alt](/api/media/abc123)\n\n[link](https://example.com)\n",
    ];
    for (const sample of samples) {
      const before = makeEditor(legacyExtensions());
      const after = makeEditor(createEditorExtensions());
      const a = roundTrip(before, sample);
      const b = roundTrip(after, sample);
      expect(b, `round-trip mismatch for: ${JSON.stringify(sample)}`).toBe(a);
    }
  });
});
