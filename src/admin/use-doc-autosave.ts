import { useCallback, useEffect, useRef, useState } from "react";
import type { CmsDocument } from "../lib/cms";
import { api } from "./client";

const DELAY_MS = 1200;

export type RowStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

// Autosave ringan untuk satu dokumen yang diedit di tempat (baris item atau
// kartu header). Berbeda dengan useAutosave milik editor penuh, di sini tidak
// ada tombol Simpan: perubahan yang valid dikirim setelah jeda ketik, dan
// Publish memaksa simpan lebih dulu.
export function useDocAutosave<T extends object>({
  doc,
  validate,
  onSaved,
}: {
  doc: { id: string; kind: string; version: number; draft: T };
  validate: (draft: T) => boolean;
  onSaved: (updated: CmsDocument) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<T>(doc.draft);
  const [status, setStatus] = useState<RowStatus>({ kind: "idle" });
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(JSON.stringify(doc.draft));
  const versionRef = useRef(doc.version);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const validateRef = useRef(validate);
  validateRef.current = validate;

  // Versi berubah dari luar (publish, pindah urutan, refresh): ambil versi
  // barunya. Draft lokal hanya ditimpa bila tidak ada ketikan yang belum
  // tersimpan; kalau ada, cukup ikuti `order` server supaya pemindahan
  // urutan tidak dibatalkan oleh autosave berikutnya.
  useEffect(() => {
    if (doc.version === versionRef.current) return;
    versionRef.current = doc.version;
    const serverRaw = JSON.stringify(doc.draft);
    if (JSON.stringify(draftRef.current) === savedRef.current) {
      savedRef.current = serverRaw;
      setDraft(doc.draft);
    } else if ("order" in doc.draft) {
      setDraft((d) => ({
        ...d,
        order: (doc.draft as { order: number }).order,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.version]);

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) {
      queued.current = true;
      return false;
    }
    const next = draftRef.current;
    const raw = JSON.stringify(next);
    if (raw === savedRef.current) return true;
    if (!validateRef.current(next)) return false;
    inFlight.current = true;
    setStatus({ kind: "saving" });
    try {
      const updated = await api<CmsDocument>("documents", {
        method: "POST",
        body: JSON.stringify({
          id: doc.id,
          kind: doc.kind,
          version: versionRef.current,
          draft: next,
          revision: false,
        }),
      });
      versionRef.current = updated.version;
      savedRef.current = raw;
      setStatus({ kind: "saved" });
      await onSavedRef.current(updated);
      return true;
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not save",
      });
      return false;
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        void save();
      }
    }
  }, [doc.id, doc.kind]);

  useEffect(() => {
    if (JSON.stringify(draft) === savedRef.current) return;
    if (!validateRef.current(draft)) return;
    const timer = setTimeout(() => void save(), DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, save]);

  const dirty = JSON.stringify(draft) !== savedRef.current;
  const valid = validate(draft);

  // Aksi server (publish, trash) memakai versi terbaru yang diketahui hook.
  const action = useCallback(
    async (name: string) => {
      const saved = await save();
      if (!saved && JSON.stringify(draftRef.current) !== savedRef.current)
        return false;
      try {
        const updated = await api<CmsDocument>("action", {
          method: "POST",
          body: JSON.stringify({
            id: doc.id,
            action: name,
            version: versionRef.current,
          }),
        });
        versionRef.current = updated.version;
        savedRef.current = JSON.stringify(updated.draft);
        setStatus({ kind: "idle" });
        await onSavedRef.current(updated);
        return true;
      } catch (e) {
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Something went wrong",
        });
        return false;
      }
    },
    [doc.id, save],
  );

  return { draft, setDraft, status, dirty, valid, save, action };
}
