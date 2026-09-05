import { useCallback } from "react";
import { useBlocker } from "@tanstack/react-router";

// Satu blocker menutup tiga jalan keluar sekaligus: navigasi router,
// tombol Back, dan reload lewat beforeunload bawaan blocker.
export function useUnsavedGuard(dirty: boolean) {
  const shouldBlockFn = useCallback(
    () => !confirm("Ada perubahan belum disimpan. Tinggalkan halaman ini?"),
    [],
  );
  useBlocker({ shouldBlockFn, disabled: !dirty });
}
