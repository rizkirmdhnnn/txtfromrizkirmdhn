export const motionEase = "cubic-bezier(.22, 1, .36, 1)";

// Create inside an effect/event, never while rendering on the server.
export function createMotionScope() {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Set<Animation>();
  let disposed = false;
  function cancel() {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }
  const onPreference = () => {
    if (preference.matches) cancel();
  };
  const onVisibility = () => {
    if (document.hidden) cancel();
  };
  preference.addEventListener("change", onPreference);
  document.addEventListener("visibilitychange", onVisibility);
  return {
    animate(
      element: Element | null,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions = {},
    ) {
      if (
        disposed ||
        preference.matches ||
        document.hidden ||
        !element?.animate
      )
        return null;
      const animation = element.animate(keyframes, {
        duration: 240,
        easing: motionEase,
        ...options,
      });
      animations.add(animation);
      animation.finished.then(
        () => animations.delete(animation),
        () => animations.delete(animation),
      );
      return animation;
    },
    cancel,
    dispose() {
      disposed = true;
      cancel();
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

export type MotionScope = ReturnType<typeof createMotionScope>;
