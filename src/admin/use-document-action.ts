import { useState } from "react";
import type { CmsDocument } from "../lib/cms";
import { api } from "./client";
import { useRefresh } from "./data";

export function useDocumentAction() {
  const refresh = useRefresh();
  const [error, setError] = useState("");
  async function act(doc: CmsDocument, action: string) {
    if (
      !confirm(
        action === "delete"
          ? "Hapus permanen konten dan seluruh revisinya?"
          : "Lanjutkan perubahan ini?",
      )
    )
      return;
    try {
      await api("action", {
        method: "POST",
        body: JSON.stringify({ id: doc.id, action, version: doc.version }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { error, setError, act };
}
