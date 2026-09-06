import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Braces,
  Check,
  Code2,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import type { MediaItem } from "../lib/cms";
import { createEditorExtensions, countWords } from "./editor-extensions";
import { createSlashMenuExtension } from "./slash-extension";
import {
  imageFilesFromClipboard,
  imageFilesFromDrop,
  insertUploadedImages,
  useUploadState,
} from "./image-upload";
import type { EditorState as PmEditorState } from "@tiptap/pm/state";
import type { EditorProps } from "@tiptap/pm/view";

function ToolButton({
  editor,
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  editor: Editor | null;
  label: string;
  icon: typeof Bold;
  active?: boolean;
  disabled?: boolean;
  onClick: (editor: Editor) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!editor || disabled}
      className={active ? "selected" : ""}
      onClick={() => {
        if (editor) onClick(editor);
      }}
    >
      <Icon size={15} />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" />;
}

// Didefinisikan di module scope, bukan inline di JSX: BubbleMenu memasukkan
// shouldShow ke deps effect-nya dan men-dispatch transaksi "updateOptions"
// setiap identitasnya berubah — dengan shouldRerenderOnTransaction aktif itu
// menjadi render loop tak berujung.
function bubbleShouldShow({ state }: { state: PmEditorState }) {
  const { from, to, empty } = state.selection;
  if (empty || from === to) return false;
  const $from = state.doc.resolve(from);
  return $from.parent.isTextblock && $from.parent.type.name !== "codeBlock";
}

export function RichEditor({
  value,
  onChange,
  media,
  onMediaUploaded,
  focusSignal,
}: {
  value: string;
  onChange: (text: string) => void;
  media: MediaItem[];
  onMediaUploaded: () => void;
  focusSignal?: number;
}) {
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const [linkError, setLinkError] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [stats, setStats] = useState({ words: 0, characters: 0 });
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const uploadedRef = useRef(onMediaUploaded);
  uploadedRef.current = onMediaUploaded;
  const { uploading, uploadError, addUploads, reportUploadError } =
    useUploadState();
  const pickerRef = useRef<HTMLDivElement>(null);
  const slashImageRef = useRef(false);
  // Handler paste/drop dibuat sekali (useMemo) tapi butuh editor yang baru ada
  // setelah useEditor, jadi diambil lewat ref saat dijalankan.
  const editorRef = useRef<Editor | null>(null);

  // extensions & editorProps dibandingkan per-referensi oleh useEditor
  // (compareOptions). Tanpa memo, setiap render memanggil editor.setOptions
  // dan mengalokasikan ulang seluruh extension — mahal sekali sekarang
  // karena render terjadi pada tiap transaksi.
  const extensions = useMemo(
    () => [
      ...createEditorExtensions(),
      createSlashMenuExtension({
        getMedia: () => mediaRef.current,
        onPickImage: () => {
          slashImageRef.current = true;
          setImagePickerOpen(true);
        },
      }),
    ],
    [],
  );

  // editorProps memang diteruskan ke EditorView oleh @tiptap/core — createView
  // menyebarnya ke konstruktor (diverifikasi: view._props berisi
  // handleKeyDown, dan Ctrl+K membuka popup link). Jadi paste/drop gambar
  // cukup di sini, tidak perlu plugin ProseMirror sendiri.
  const uploadImages = useCallback(
    (target: Editor, files: File[]) => {
      void insertUploadedImages(target, files, mediaRef.current, {
        onProgress: addUploads,
        onUploaded: () => void uploadedRef.current(),
        onError: reportUploadError,
      });
    },
    [addUploads, reportUploadError],
  );
  const uploadImagesRef = useRef(uploadImages);
  uploadImagesRef.current = uploadImages;

  const editorProps = useMemo<EditorProps>(
    () => ({
      attributes: { "aria-label": "Content", class: "cms-rich-editor" },
      handlePaste(view, event) {
        const target = editorRef.current;
        const files = imageFilesFromClipboard(event.clipboardData);
        if (!target || !files.length) return false;
        event.preventDefault();
        event.stopPropagation();
        uploadImagesRef.current(target, files);
        return true;
      },
      handleDrop(view, event) {
        const target = editorRef.current;
        const files = imageFilesFromDrop(event.dataTransfer);
        if (!target || !files.length) return false;
        event.preventDefault();
        event.stopPropagation();
        const coords =
          event.clientX || event.clientY
            ? { left: event.clientX, top: event.clientY }
            : null;
        const pos = coords ? view.posAtCoords(coords)?.pos : null;
        if (pos != null) target.commands.setTextSelection(pos);
        uploadImagesRef.current(target, files);
        return true;
      },
      handleKeyDown(view, event) {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          const { href } = (
            view.state.doc.resolve(view.state.selection.from).marks() ?? []
          ).reduce(
            (acc: { href: string }, mark) => {
              if (mark.type.name === "link")
                return { href: String(mark.attrs.href ?? "") };
              return acc;
            },
            { href: "" },
          );
          setLinkHref(href);
          setLinkError("");
          setLinkOpen(true);
          return true;
        }
        return false;
      },
    }),
    [],
  );

  const editor = useEditor({
    extensions,
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    // Wajib: tanpa ini @tiptap/react v3 tidak me-render ulang pada transaksi
    // yang hanya memindah selection, sehingga semua flag turunan isActive()
    // (toolbar aktif, table bar, bubble alt-text gambar) jadi basi.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: ed }) => {
      changeRef.current(ed.getMarkdown());
      setStats(countWords(ed.getText()));
    },
    onCreate: ({ editor: ed }) => {
      setStats(countWords(ed.getText()));
    },
    editorProps,
  });
  editorRef.current = editor;

  useEffect(() => {
    if (editor && mode === "visual" && editor.getMarkdown() !== value)
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
  }, [editor, value, mode]);

  useEffect(() => {
    if (focusSignal && editor && mode === "visual") editor.commands.focus();
  }, [focusSignal, editor, mode]);

  useEffect(() => {
    if (!imagePickerOpen) slashImageRef.current = false;
  }, [imagePickerOpen]);

  const openLinkEditor = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    setLinkHref(typeof attrs.href === "string" ? attrs.href : "");
    setLinkError("");
    setLinkOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const href = linkHref.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else if (/^https:\/\//.test(href)) {
      editor.chain().focus().setLink({ href }).run();
    } else {
      // Hanya https yang diizinkan (lihat protocols di editor-extensions).
      // Tutup diam-diam berarti URL yang sudah diketik hilang tanpa pesan.
      setLinkError("Link harus diawali https://");
      return;
    }
    setLinkOpen(false);
    setLinkHref("");
    setLinkError("");
  }, [editor, linkHref]);

  const insertImage = useCallback(
    (id: string) => {
      if (!editor) return;
      const image = mediaRef.current.find((m) => m.id === id);
      if (!image) return;
      // Alt diambil dari media library bila ada; markdown menyimpan alt.
      const alt = image.alt || image.name;
      editor
        .chain()
        .focus()
        .setImage({ src: `/api/media/${image.id}`, alt })
        .run();
      setImagePickerOpen(false);
    },
    [editor],
  );

  const headingLabel = !editor
    ? "Paragraf"
    : editor.isActive("heading", { level: 1 })
      ? "Heading 1"
      : editor.isActive("heading", { level: 2 })
        ? "Heading 2"
        : editor.isActive("heading", { level: 3 })
          ? "Heading 3"
          : "Paragraf";

  const imageNode = editor?.isActive("image");
  const showTableTools = editor?.isActive("table");

  return (
    <div className="rich-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
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
            <Divider />
            <ToolButton
              editor={editor}
              label="Undo"
              icon={Undo2}
              disabled={!editor.can().undo()}
              onClick={(ed) => ed.chain().focus().undo().run()}
            />
            <ToolButton
              editor={editor}
              label="Redo"
              icon={Redo2}
              disabled={!editor.can().redo()}
              onClick={(ed) => ed.chain().focus().redo().run()}
            />
            <Divider />
            <label className="heading-picker" title="Gaya paragraf">
              <span className="visually-hidden">Gaya paragraf</span>
              <select
                aria-label="Gaya paragraf"
                value={headingLabel}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "Paragraf")
                    editor.chain().focus().setParagraph().run();
                  else
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({
                        level: Number(v.slice(-1)) as 1 | 2 | 3,
                      })
                      .run();
                }}
              >
                {["Paragraf", "Heading 1", "Heading 2", "Heading 3"].map(
                  (h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ),
                )}
              </select>
            </label>
            <Divider />
            <ToolButton
              editor={editor}
              label="Bold"
              icon={Bold}
              active={editor.isActive("bold")}
              onClick={(ed) => ed.chain().focus().toggleBold().run()}
            />
            <ToolButton
              editor={editor}
              label="Italic"
              icon={Italic}
              active={editor.isActive("italic")}
              onClick={(ed) => ed.chain().focus().toggleItalic().run()}
            />
            <ToolButton
              editor={editor}
              label="Strikethrough"
              icon={Strikethrough}
              active={editor.isActive("strike")}
              onClick={(ed) => ed.chain().focus().toggleStrike().run()}
            />
            <ToolButton
              editor={editor}
              label="Inline code"
              icon={Code2}
              active={editor.isActive("code")}
              onClick={(ed) => ed.chain().focus().toggleCode().run()}
            />
            <ToolButton
              editor={editor}
              label="Link (Ctrl+K)"
              icon={Link2}
              active={editor.isActive("link")}
              onClick={() => openLinkEditor()}
            />
            <Divider />
            <ToolButton
              editor={editor}
              label="Bullet list"
              icon={List}
              active={editor.isActive("bulletList")}
              onClick={(ed) => ed.chain().focus().toggleBulletList().run()}
            />
            <ToolButton
              editor={editor}
              label="Numbered list"
              icon={ListOrdered}
              active={editor.isActive("orderedList")}
              onClick={(ed) => ed.chain().focus().toggleOrderedList().run()}
            />
            <ToolButton
              editor={editor}
              label="Task list"
              icon={ListChecks}
              active={editor.isActive("taskList")}
              onClick={(ed) => ed.chain().focus().toggleTaskList().run()}
            />
            <ToolButton
              editor={editor}
              label="Quote"
              icon={Quote}
              active={editor.isActive("blockquote")}
              onClick={(ed) => ed.chain().focus().toggleBlockquote().run()}
            />
            <ToolButton
              editor={editor}
              label="Code block"
              icon={Braces}
              active={editor.isActive("codeBlock")}
              onClick={(ed) => ed.chain().focus().toggleCodeBlock().run()}
            />
            <ToolButton
              editor={editor}
              label="Divider"
              icon={Minus}
              onClick={(ed) => ed.chain().focus().setHorizontalRule().run()}
            />
            <ToolButton
              editor={editor}
              label="Table"
              icon={TableIcon}
              active={editor.isActive("table")}
              onClick={(ed) =>
                ed.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
              }
            />
            <Divider />
            <div className="image-picker" ref={pickerRef}>
              <button
                type="button"
                aria-label="Insert image"
                title="Insert image"
                aria-expanded={imagePickerOpen}
                className={imageNode ? "selected" : ""}
                onClick={() => setImagePickerOpen((v) => !v)}
              >
                <ImageIcon size={15} />
              </button>
              {imagePickerOpen ? (
                <div
                  className="image-picker-pop"
                  role="dialog"
                  aria-label="Pilih gambar"
                >
                  <div className="image-picker-head">
                    <strong>Pilih gambar</strong>
                    <button
                      type="button"
                      aria-label="Tutup"
                      onClick={() => setImagePickerOpen(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="image-picker-grid">
                    {media
                      .filter((m) => m.type.startsWith("image/"))
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="image-picker-item"
                          title={m.name}
                          onClick={() => insertImage(m.id)}
                        >
                          <img
                            src={`/api/media/${m.id}`}
                            alt={m.alt || m.name}
                            loading="lazy"
                          />
                          <span>{m.name}</span>
                        </button>
                      ))}
                  </div>
                  <p className="cms-description">
                    Tip: tempel (paste) atau seret gambar langsung ke editor
                    untuk mengunggah otomatis.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {showTableTools && mode === "visual" && editor ? (
        <div className="editor-toolbar table-bar" aria-label="Table tools">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            + Baris
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            − Baris
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            + Kolom
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            − Kolom
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Hapus tabel
          </button>
        </div>
      ) : null}

      {linkOpen && mode === "visual" && editor ? (
        <div className="link-pop" role="dialog" aria-label="Edit link">
          <input
            autoFocus
            type="url"
            inputMode="url"
            placeholder="https://…"
            aria-label="URL link"
            value={linkHref}
            aria-invalid={linkError !== ""}
            aria-describedby={linkError ? "link-pop-error" : undefined}
            onChange={(e) => {
              setLinkHref(e.target.value);
              setLinkError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") {
                // Tahan agar Escape tidak lanjut ke FocusModeKeys di window:
                // menutup popup ini bukan berarti keluar dari mode fokus.
                e.stopPropagation();
                setLinkOpen(false);
                setLinkHref("");
                setLinkError("");
              }
            }}
          />
          <button
            type="button"
            aria-label="Terapkan link"
            disabled={
              linkHref.trim() !== "" && !/^https:\/\//.test(linkHref.trim())
            }
            onClick={applyLink}
          >
            <Check size={15} />
          </button>
          {editor.isActive("link") ? (
            <button
              type="button"
              aria-label="Hapus link"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setLinkOpen(false);
                setLinkHref("");
              }}
            >
              <Unlink size={15} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Batal"
            onClick={() => {
              setLinkOpen(false);
              setLinkHref("");
              setLinkError("");
            }}
          >
            <X size={15} />
          </button>
          {linkError ? (
            <span className="link-error" id="link-pop-error" role="alert">
              {linkError}
            </span>
          ) : null}
        </div>
      ) : null}

      {mode === "visual" ? (
        <>
          <EditorContent editor={editor} />
          {editor ? (
            <BubbleMenu editor={editor} shouldShow={bubbleShouldShow}>
              <div
                className="bubble-menu"
                role="toolbar"
                aria-label="Format selection"
              >
                <button
                  type="button"
                  aria-label="Bold"
                  className={editor.isActive("bold") ? "selected" : ""}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Italic"
                  className={editor.isActive("italic") ? "selected" : ""}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Strikethrough"
                  className={editor.isActive("strike") ? "selected" : ""}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                  <Strikethrough size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Inline code"
                  className={editor.isActive("code") ? "selected" : ""}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                >
                  <Code2 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Link"
                  className={editor.isActive("link") ? "selected" : ""}
                  onClick={openLinkEditor}
                >
                  <Link2 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Heading 2"
                  className={
                    editor.isActive("heading", { level: 2 }) ? "selected" : ""
                  }
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                >
                  <Heading2 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Bullet list"
                  className={editor.isActive("bulletList") ? "selected" : ""}
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Quote"
                  className={editor.isActive("blockquote") ? "selected" : ""}
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                >
                  <Quote size={14} />
                </button>
              </div>
            </BubbleMenu>
          ) : null}
          {editor && imageNode ? <ImageBubble editor={editor} /> : null}
        </>
      ) : (
        <textarea
          className="markdown-input"
          aria-label="Markdown content"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setStats(countWords(e.target.value));
          }}
        />
      )}
      <EditorStatusBar
        stats={stats}
        uploading={uploading}
        error={uploadError}
      />
    </div>
  );
}

function ImageBubble({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes("image");
  const [alt, setAlt] = useState<string>(
    typeof attrs.alt === "string" ? attrs.alt : "",
  );
  useEffect(() => {
    const next = editor.getAttributes("image").alt;
    setAlt(typeof next === "string" ? next : "");
  }, [editor, attrs.src]);
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const node = state.doc.nodeAt(state.selection.from);
        if (node?.type.name === "image") return true;
        return state.selection.$from.parent.type.name === "image";
      }}
    >
      <div
        className="bubble-menu image-bubble"
        role="toolbar"
        aria-label="Image options"
      >
        <input
          aria-label="Alt text gambar"
          placeholder="Alt text…"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              editor.chain().focus().updateAttributes("image", { alt }).run();
            }
          }}
        />
        <button
          type="button"
          aria-label="Simpan alt text"
          onClick={() =>
            editor.chain().focus().updateAttributes("image", { alt }).run()
          }
        >
          <Check size={14} />
        </button>
      </div>
    </BubbleMenu>
  );
}

function EditorStatusBar({
  stats,
  uploading,
  error,
}: {
  stats: { words: number; characters: number };
  uploading: number;
  error: string;
}) {
  const minutes = Math.max(1, Math.ceil(stats.words / 200));
  return (
    <div className="editor-statusbar" aria-live="polite">
      <span>
        {stats.words} kata · {stats.characters} karakter · ±{minutes} mnt baca
      </span>
      {uploading > 0 ? <span>Mengunggah gambar…</span> : null}
      {error ? (
        <span className="editor-status-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
