import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

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
    apply(readTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => apply(preference.current);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) apply(readTheme());
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
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
      onClick={() => {
        const next =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        apply(next);
        try {
          localStorage.setItem(key, next);
        } catch {
          /* Preserve this page's selection without storage. */
        }
      }}
    >
      {dark ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
    </button>
  );
}
