import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Extension } from "@tiptap/core";
import {
  Plugin as PmPlugin,
  PluginKey,
  type EditorState as PmEditorState,
} from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Braces,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table as TableIcon,
} from "lucide-react";
import type { MediaItem } from "../lib/cms";
import {
  filterSlashCommands,
  slashCommands,
  type SlashCommand,
} from "./slash-menu";

export const slashPluginKey = new PluginKey("slash-menu");

type SlashKeyDown = {
  view: EditorView;
  event: KeyboardEvent;
  range: { from: number; to: number };
};

type SlashListHandle = {
  onKeyDown: (props: SlashKeyDown) => boolean;
};

const slashIcons: Record<string, typeof Pilcrow> = {
  paragraph: Pilcrow,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  bullet: List,
  ordered: ListOrdered,
  task: ListChecks,
  quote: Quote,
  code: Braces,
  divider: Minus,
  table: TableIcon,
  image: ImageIcon,
};

function SlashList({
  items,
  command,
  listRef,
}: {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
  listRef: React.MutableRefObject<SlashListHandle | null>;
}) {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => setSelected(0), [items]);
  useEffect(() => {
    root.current
      ?.querySelector<HTMLElement>("[data-selected='true']")
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  useImperativeHandle(
    listRef,
    () => ({
      onKeyDown: ({ event }: SlashKeyDown) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((s) => (s + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected(
            (s) => (s - 1 + items.length) % Math.max(items.length, 1),
          );
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selected];
          if (item) {
            event.preventDefault();
            command(item);
            return true;
          }
          return false;
        }
        return false;
      },
    }),
    [items, selected, command, listRef],
  );
  return (
    <div
      ref={root}
      className="slash-menu"
      role="listbox"
      aria-label="Insert block"
    >
      {items.length === 0 ? (
        <div className="slash-empty">Tidak ada blok yang cocok</div>
      ) : (
        items.map((item, index) => {
          const Icon = slashIcons[item.id] ?? Pilcrow;
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === selected}
              data-selected={index === selected}
              className={index === selected ? "selected" : ""}
              onMouseEnter={() => setSelected(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(item)}
            >
              <span className="slash-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
              <span className="slash-text">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

export function createSlashMenuExtension({
  getMedia,
  onPickImage,
}: {
  getMedia: () => MediaItem[];
  onPickImage: () => void;
}) {
  return Extension.create({
    name: "slash-menu",
    addProseMirrorPlugins() {
      // Catatan penting: @tiptap/suggestion v3 TIDAK bisa dipakai untuk slash
      // menu di awal blok kosong — findSuggestionMatch-nya membaca
      // $position.nodeBefore yang selalu null di posisi 1 dokumen kosong
      // (diverifikasi lewat E2E). Sebagai gantinya menu ini memakai plugin
      // ProseMirror sendiri yang sederhana: popup muncul setiap kursor berada
      // di blok teks kosong yang diawali "/" (+ query opsional), tanpa
      // ketergantungan pada nodeBefore.
      const editor = this.editor;
      const pluginKey = slashPluginKey;
      let renderer: ReactRenderer | null = null;
      let listHandle: SlashListHandle | null = null;
      const listRef = {
        get current() {
          return listHandle;
        },
        set current(v: SlashListHandle | null) {
          listHandle = v;
        },
      } as React.MutableRefObject<SlashListHandle | null>;

      // Posisi awal slash yang sudah ditutup lewat Escape. Menu tetap tertutup
      // selama kursor masih di slash yang sama; tanpa penanda ini transaksi
      // berikutnya menemukan teks "/query" yang belum berubah dan langsung
      // membukanya lagi, sehingga Escape terasa tidak berfungsi.
      let dismissedFrom: number | null = null;

      const close = () => {
        renderer?.destroy();
        renderer = null;
        listHandle = null;
      };

      const runCommand = (item: SlashCommand, from: number, to: number) => {
        editor.chain().focus().deleteRange({ from, to }).run();
        item.run(editor, getMedia());
        dismissedFrom = null;
        close();
      };

      const openOrUpdate = (from: number, to: number, query: string) => {
        const items = filterSlashCommands(slashCommands(onPickImage), query);
        const command = (item: SlashCommand) => runCommand(item, from, to);
        if (!renderer) {
          renderer = new ReactRenderer(SlashMenuHost, {
            editor,
            props: { items, command, listRef },
          });
          renderer.element.classList.add("slash-menu-popup");
          document.body.appendChild(renderer.element);
        } else {
          renderer.updateProps({ items, command, listRef });
        }
        positionPopup(editor, from, renderer.element);
      };

      return [
        new PmPlugin({
          key: pluginKey,
          view: () => ({
            update: (view) => {
              const match = findSlashMatch(view.state);
              if (!match) {
                dismissedFrom = null;
                close();
                return;
              }
              if (dismissedFrom === match.from) return;
              dismissedFrom = null;
              openOrUpdate(match.from, match.to, match.query);
            },
            destroy: close,
          }),
          props: {
            handleKeyDown: (view, event) => {
              if (!renderer || !listHandle) return false;
              if (
                event.key === "ArrowDown" ||
                event.key === "ArrowUp" ||
                event.key === "Enter"
              ) {
                return listHandle.onKeyDown({
                  view,
                  event,
                  range: view.state.selection,
                });
              }
              if (event.key === "Escape") {
                event.preventDefault();
                // Tahan di sini: tanpa ini Escape terus naik ke listener window
                // milik FocusModeKeys, jadi menutup menu sekaligus melempar
                // user keluar dari mode fokus.
                event.stopPropagation();
                dismissedFrom = findSlashMatch(view.state)?.from ?? null;
                close();
                return true;
              }
              return false;
            },
          },
        }),
      ];
    },
  });
}

function findSlashMatch(state: PmEditorState) {
  const { $from } = state.selection;
  if (!state.selection.empty) return null;
  if ($from.parent.type.name === "codeBlock") return null;
  if (!$from.parent.isTextblock) return null;
  const text = $from.parent.textContent;
  if (!text.startsWith("/")) return null;
  // Kursor harus masih di baris query (tidak ada spasi/newline setelah /).
  const after = text.slice(1);
  if (/[\s]/.test(after)) return null;
  const from = $from.start();
  return { from, to: from + text.length, query: after };
}

function positionPopup(editor: Editor, from: number, element: HTMLElement) {
  const coords = editor.view.coordsAtPos(from);
  element.style.position = "fixed";
  const width = Math.min(300, window.innerWidth - 16);
  let left = Math.min(coords.left, window.innerWidth - width - 8);
  left = Math.max(8, left);
  let top = coords.bottom + 6;
  const height = Math.min(300, element.offsetHeight || 300);
  if (top + height > window.innerHeight - 8) {
    top = Math.max(8, coords.top - height - 6);
  }
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
}

function SlashMenuHost({
  items,
  command,
  listRef,
}: {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
  listRef: React.MutableRefObject<SlashListHandle | null>;
}) {
  return <SlashList items={items} command={command} listRef={listRef} />;
}

// Re-export agar slashCommands bisa dipakai dari satu tempat.
export type { SlashCommand };
