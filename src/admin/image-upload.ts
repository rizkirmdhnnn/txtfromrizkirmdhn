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

// Server tidak punya resize dan menyajikan file apa adanya, jadi foto kamera
// dikecilkan di browser sebelum diunggah. GIF dilewati agar animasinya utuh.
const OPTIMIZE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_EDGE = 2400;
const OPTIMIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;

export function imageFilesFromClipboard(clipboard: DataTransfer | null) {
  if (!clipboard) return [];
  return [...clipboard.files].filter((file) => IMAGE_TYPES.has(file.type));
}

export function imageFilesFromDrop(transfer: DataTransfer | null) {
  if (!transfer?.files?.length) return [];
  return [...transfer.files].filter((file) => IMAGE_TYPES.has(file.type));
}

export async function optimizeImage(file: File): Promise<File> {
  if (!OPTIMIZE_TYPES.has(file.type)) return file;
  if (
    typeof createImageBitmap !== "function" ||
    typeof document === "undefined"
  )
    return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    try {
      const longest = Math.max(bitmap.width, bitmap.height);
      if (longest <= MAX_EDGE && file.size <= OPTIMIZE_ABOVE_BYTES) return file;
      const scale = Math.min(1, MAX_EDGE / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.85),
      );
      // Safari diam-diam mengembalikan PNG bila WebP tidak didukung. Server
      // mencocokkan magic byte dengan Content-Type, jadi hasil itu ditolak.
      if (!blob || blob.type !== "image/webp" || blob.size >= file.size)
        return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
        type: "image/webp",
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

export async function uploadImageFiles(files: File[]) {
  const uploaded: { id: string; name: string }[] = [];
  for (const original of files) {
    const file = await optimizeImage(original);
    if (file.size > MAX_IMAGE_BYTES)
      throw new Error(`${file.name} is larger than 10 MB`);
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
  const images = files.filter((file) => IMAGE_TYPES.has(file.type));
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
