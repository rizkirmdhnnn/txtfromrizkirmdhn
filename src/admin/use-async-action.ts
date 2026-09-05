import { useCallback, useState } from "react";

export function useAsyncAction() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, message, setMessage, run };
}
