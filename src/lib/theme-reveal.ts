import { createMotionScope } from "./motion";

// One controller per mounted theme button. Superseded snapshot callbacks must
// never apply an older theme after the visitor has made another selection.
export function createThemeReveal() {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const scope = createMotionScope();
  let version = 0;
  let transition: ViewTransition | null = null;
  let pendingUpdate: (() => void) | null = null;

  function clearReveal() {
    delete root.dataset.themeReveal;
    for (const axis of ["x", "y", "radius"])
      root.style.removeProperty(`--theme-reveal-${axis}`);
  }

  function cancel(settle = false) {
    version++;
    transition?.skipTransition();
    transition = null;
    scope.cancel();
    clearReveal();
    if (settle) pendingUpdate?.();
    pendingUpdate = null;
  }
  const onReduce = () => {
    if (reduce.matches) cancel(true);
  };
  const onVisibility = () => {
    if (document.hidden) cancel(true);
  };
  reduce.addEventListener("change", onReduce);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    change(button: HTMLElement, update: () => void) {
      cancel();
      const request = version;
      pendingUpdate = update;
      const updateCurrent = () => {
        if (request !== version || !pendingUpdate) return;
        pendingUpdate = null;
        update();
      };
      const icon = button.querySelector(".theme-glyph");
      const animateIcon = () =>
        scope.animate(
          icon,
          [
            { transform: "rotate(-60deg) scale(.8)" },
            { transform: "rotate(8deg) scale(1.05)", offset: 0.75 },
            { transform: "rotate(0deg) scale(1)" },
          ],
          { duration: 320, easing: "cubic-bezier(.2, .7, .2, 1)" },
        );
      if (reduce.matches || document.hidden || !document.startViewTransition) {
        updateCurrent();
        if (!reduce.matches) animateIcon();
        return;
      }
      const rect = button.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight, rect.top + rect.height / 2));
      const radius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      // The snapshot can have a different CSS-pixel scale than the button's
      // viewport rect (for example with root zoom). Use proportions for both
      // position and radius so the rendered circle stays on the clicked button.
      const diagonal = Math.hypot(innerWidth, innerHeight) / Math.SQRT2;
      root.style.setProperty("--theme-reveal-x", `${(x / innerWidth) * 100}%`);
      root.style.setProperty("--theme-reveal-y", `${(y / innerHeight) * 100}%`);
      root.style.setProperty(
        "--theme-reveal-radius",
        `${(Math.ceil(radius) / diagonal) * 100}%`,
      );
      root.dataset.themeReveal = "true";
      // Respond in the click handler. The CSS reveal starts with the browser's
      // first transition frame, without waiting for a JS ready callback.
      animateIcon();
      try {
        const current = document.startViewTransition(updateCurrent);
        transition = current;
        current.ready.catch(() => {
          // Snapshot capture can be skipped by the browser; the theme still wins.
          updateCurrent();
        });
        current.finished.then(
          () => {
            if (request !== version) return;
            clearReveal();
            transition = null;
          },
          () => {
            if (request !== version) return;
            updateCurrent();
            clearReveal();
            transition = null;
          },
        );
      } catch {
        updateCurrent();
        clearReveal();
      }
    },
    cancel,
    dispose() {
      cancel();
      scope.dispose();
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
