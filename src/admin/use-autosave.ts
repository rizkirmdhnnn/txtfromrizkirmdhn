import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { CmsDocument } from "../lib/cms";

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: Date }
  | { status: "error"; message: string };

const AUTOSAVE_DELAY_MS = 2000;

export function useAutosave({
  document,
  draft,
  dirty,
  valid,
  busy,
  save,
}: {
  document: CmsDocument;
  draft: CmsDocument["draft"];
  dirty: boolean;
  /** Draft lolos skema server. Draft setengah jadi tidak dikirim. */
  valid: boolean;
  busy: boolean;
  save: (
    draft: CmsDocument["draft"],
    opts: { silent: boolean },
  ) => Promise<void>;
}) {
  const state = useRef({
    saveState: { status: "idle" } as SaveState,
    timer: null as ReturnType<typeof setTimeout> | null,
    queued: null as CmsDocument["draft"] | null,
    inFlight: false,
    listeners: new Set<(s: SaveState) => void>(),
  });
  const saveRef = useRef(save);
  saveRef.current = save;

  const setSaveState = useCallback((next: SaveState) => {
    state.current.saveState = next;
    for (const fn of state.current.listeners) fn(next);
  }, []);

  const subscribe = useCallback((fn: (s: SaveState) => void) => {
    state.current.listeners.add(fn);
    fn(state.current.saveState);
    return () => {
      state.current.listeners.delete(fn);
    };
    // state stabil sepanjang hidup hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getState = useCallback(() => state.current.saveState, []);

  const flush = useCallback(async () => {
    const st = state.current;
    if (st.inFlight) return;
    const pending = st.queued;
    if (!pending) return;
    st.queued = null;
    st.inFlight = true;
    setSaveState({ status: "saving" });
    try {
      await saveRef.current(pending, { silent: true });
      setSaveState({ status: "saved", at: new Date() });
    } catch (e) {
      setSaveState({
        status: "error",
        message: e instanceof Error ? e.message : "Autosave failed",
      });
    } finally {
      st.inFlight = false;
    }
    // Bila draft berubah saat save berjalan, jadwalkan ulang.
    if (st.queued) {
      if (st.timer) clearTimeout(st.timer);
      st.timer = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    }
    // setSaveState & flush stabil; saveRef selalu menunjuk save terbaru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schedule = useCallback(() => {
    const st = state.current;
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    // flush stabil (lihat di atas).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset penanda antrean saat dokumen berganti. Sengaja TIDAK ikut
  // document.version: version naik justru tepat setelah autosave kita sendiri
  // berhasil, sehingga status "saved" yang baru diset akan langsung terhapus
  // (dan antrean yang menunggu ikut dibatalkan).
  useEffect(() => {
    state.current.queued = null;
    if (state.current.timer) clearTimeout(state.current.timer);
    setSaveState({ status: "idle" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  useEffect(() => {
    if (!dirty || busy || !valid) return;
    state.current.queued = draft;
    schedule();
    return () => {
      if (state.current.timer) clearTimeout(state.current.timer);
    };
    // `schedule` stabil; sisanya memicu penjadwalan ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, valid, busy]);

  return { subscribe, getState, flush, schedule };
}

export function useSaveState(
  subscribe: (fn: (s: SaveState) => void) => () => void,
  getSnapshot: () => SaveState,
) {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function formatSaveTime(at: Date) {
  return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
