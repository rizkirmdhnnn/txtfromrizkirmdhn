import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useState } from "react";
import type { MediaItem } from "../lib/cms";
export function RichEditor({
  value,
  onChange,
  media,
}: {
  value: string;
  onChange: (text: string) => void;
  media: MediaItem[];
}) {
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ["https"] },
      }),
      Image,
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    editorProps: {
      attributes: { "aria-label": "Content", class: "cms-rich-editor" },
    },
  });
  useEffect(() => {
    if (editor && editor.getMarkdown() !== value)
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
  }, [editor, value]);
  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          className={mode === "visual" ? "selected" : ""}
          onClick={() => setMode("visual")}
        >
          Visual
        </button>
        <button
          type="button"
          className={mode === "markdown" ? "selected" : ""}
          onClick={() => setMode("markdown")}
        >
          Markdown
        </button>
        {mode === "visual" && editor ? (
          <>
            <span />
            <button
              type="button"
              aria-label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              aria-label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              Code
            </button>
            <button
              type="button"
              onClick={() => {
                const href = prompt("HTTPS URL");
                if (href && /^https:\/\//.test(href))
                  editor.chain().focus().setLink({ href }).run();
              }}
            >
              Link
            </button>
            <select
              aria-label="Insert image"
              value=""
              onChange={(e) => {
                const image = media.find((m) => m.id === e.target.value);
                if (image)
                  editor
                    .chain()
                    .focus()
                    .setImage({
                      src: `/api/media/${image.id}`,
                      alt: image.alt || image.name,
                    })
                    .run();
              }}
            >
              <option value="">+ Image</option>
              {media
                .filter((m) => m.type.startsWith("image/"))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </>
        ) : null}
      </div>
      {mode === "visual" ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          className="markdown-input"
          aria-label="Markdown content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
