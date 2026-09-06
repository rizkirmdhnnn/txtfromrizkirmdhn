import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { MediaItem } from "../lib/cms";
import { api } from "./client";

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function imageFilesFromClipboard(clipboard: DataTransfer | null) {
  if (!clipboard) return [];
  return [...clipboard.files].filter(
    (file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES,
  );
}

export function imageFilesFromDrop(transfer: DataTransfer | null) {
  if (!transfer?.files?.length) return [];
  return [...transfer.files].filter(
    (file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES,
  );
}

export async function uploadImageFiles(files: File[]) {
  const uploaded: { id: string; name: string }[] = [];
  for (const file of files) {
    const created = await api<{ id: string; name: string }>("media", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      body: file,
    });
    uploaded.push(created);
  }
  return uploaded;
}

export function imageMarkdown(id: string, name: string) {
  return `![${name.replace(/[\[\]]/g, "")}](/api/media/${id})`;
}

export function useUploadState() {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  // Identitas harus stabil: keduanya ikut masuk ke extension TipTap yang
  // dibandingkan per-referensi oleh useEditor.
  const addUploads = useCallback((delta: number) => {
    setUploading((n) => Math.max(0, n + delta));
    if (delta > 0) setUploadError("");
  }, []);
  const reportUploadError = useCallback(
    (message: string) => setUploadError(message),
    [],
  );
  return { uploading, uploadError, addUploads, reportUploadError };
}

export async function insertUploadedImages(
  editor: Editor,
  files: File[],
  media: MediaItem[],
  handlers: {
    onProgress: (delta: number) => void;
    onUploaded: () => void;
    onError: (message: string) => void;
  },
): Promise<boolean> {
  const images = files.filter(
    (file) => IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES,
  );
  if (!images.length || !editor) return false;
  handlers.onProgress(images.length);
  try {
    const uploaded = await uploadImageFiles(images);
    const known = new Map(media.map((m) => [m.id, m]));
    editor
      .chain()
      .focus()
      .insertContent(
        uploaded.map((item) => {
          const alt = known.get(item.id)?.alt || item.name || "Uploaded image";
          return {
            type: "image",
            attrs: { src: `/api/media/${item.id}`, alt },
          };
        }),
      )
      .run();
    handlers.onUploaded();
    return true;
  } catch (e) {
    // Dipanggil sebagai fire-and-forget dari handler paste/drop ProseMirror.
    // Tanpa catch di sini kegagalan upload jadi unhandled rejection dan user
    // hanya melihat indikator berkedip tanpa pesan apa pun.
    handlers.onError(
      e instanceof Error ? e.message : "Gagal mengunggah gambar.",
    );
    return false;
  } finally {
    handlers.onProgress(-images.length);
  }
}
