import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { createThemeReveal } from "../lib/theme-reveal";

type Theme = "system" | "light" | "dark";
const key = "portfolio-theme";
function readTheme(): Theme {
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "dark") return value;
  } catch {
    /* Use device appearance when storage is unavailable. */
  }
  return "system";
}
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const preference = useRef<Theme>("system");
  const reveal = useRef<ReturnType<typeof createThemeReveal> | null>(null);
  function apply(value: Theme) {
    preference.current = value;
    const resolved =
      value === "dark" ||
      (value === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = resolved ? "dark" : "light";
    setDark(resolved);
  }
  useEffect(() => {
    reveal.current = createThemeReveal();
    apply(readTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (preference.current !== "system") return;
      reveal.current?.cancel();
      apply("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        reveal.current?.cancel();
        apply(readTheme());
      }
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
      reveal.current?.dispose();
      reveal.current = null;
      media.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      className="theme-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        const next =
          (preference.current === "system"
            ? document.documentElement.dataset.theme
            : preference.current) === "dark"
            ? "light"
            : "dark";
        preference.current = next;
        if (reveal.current)
          reveal.current.change(event.currentTarget, () =>
            flushSync(() => apply(next)),
          );
        else apply(next);
        try {
          localStorage.setItem(key, next);
        } catch {
          /* Preserve this page's selection without storage. */
        }
      }}
    >
      <span className="theme-glyph" aria-hidden="true">
        <Sun className="theme-sun" size={18} />
        <Moon className="theme-moon" size={18} />
      </span>
    </button>
  );
}
