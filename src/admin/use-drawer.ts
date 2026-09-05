import { useEffect, useRef, useState } from "react";

const focusableSelector = "a[href], button:not([disabled])";

export function useDrawer(query = "(max-width: 760px)") {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = matchMedia(query);
    const sync = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    // Yang menggulir adalah elemen root, bukan body: mengunci body saja
    // menyisakan latar yang tetap bergerak di belakang drawer.
    const root = document.documentElement;
    const scroll = root.style.overflow;
    root.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>(
      "[data-drawer-focus]",
    );
    (
      first ?? panel.current?.querySelector<HTMLElement>(focusableSelector)
    )?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const items = [
        ...panel.current.querySelectorAll<HTMLElement>(focusableSelector),
      ];
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (items.length && document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = scroll;
      if (panel.current?.contains(document.activeElement))
        trigger.current?.focus();
    };
  }, [open]);

  return { mobile, open, setOpen, panel, trigger };
}
