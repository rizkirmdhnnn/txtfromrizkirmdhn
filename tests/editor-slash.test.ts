import { describe, expect, it, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import { createEditorExtensions } from "../src/admin/editor-extensions";
import { createSlashMenuExtension } from "../src/admin/slash-extension";
import { filterSlashCommands, slashCommands } from "../src/admin/slash-menu";

const editors: Editor[] = [];
afterEach(() => {
  for (const editor of editors) editor.destroy();
  editors.length = 0;
});

function makeEditor() {
  const editor = new Editor({
    extensions: [
      ...createEditorExtensions(),
      createSlashMenuExtension({ getMedia: () => [], onPickImage: () => {} }),
    ] as never,
    content: "",
  } as never);
  editors.push(editor);
  return editor;
}

describe("slash menu", () => {
  it("lists wordpress-like blocks and filters by query", () => {
    const all = slashCommands(() => {});
    expect(all.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "paragraph",
        "h1",
        "h2",
        "h3",
        "bullet",
        "ordered",
        "task",
        "quote",
        "code",
        "divider",
        "table",
        "image",
      ]),
    );
    expect(filterSlashCommands(all, "").length).toBe(all.length);
    expect(filterSlashCommands(all, "tabel").map((c) => c.id)).toEqual([
      "table",
    ]);
    expect(filterSlashCommands(all, "xyz-tidak-ada").length).toBe(0);
  });

  it("inserts a heading when the slash command runs", () => {
    const editor = makeEditor();
    const commands = slashCommands(() => {});
    const h2 = commands.find((c) => c.id === "h2");
    expect(h2).toBeDefined();
    h2!.run(editor, []);
    editor.commands.insertContent("Judul Bagian");
    expect(editor.getMarkdown()).toContain("## Judul Bagian");
  });

  it("inserts a table that survives markdown serialization", () => {
    const editor = makeEditor();
    const commands = slashCommands(() => {});
    commands.find((c) => c.id === "table")!.run(editor, []);
    const md = editor.getMarkdown();
    expect(md).toContain("|");
    // Idempoten setelah reload.
    editor.commands.setContent(md, {
      contentType: "markdown",
      emitUpdate: false,
    });
    expect(editor.getMarkdown()).toBe(md);
  });
});
