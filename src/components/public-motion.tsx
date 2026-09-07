import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createMotionScope } from "../lib/motion";

type NavigationPosition = {
  category: string;
  left: number;
  width: number;
  containerWidth: number;
};
type MotionMemory = {
  navigation?: NavigationPosition;
  illustrations: Set<string>;
};
const MotionContext = createContext<MotionMemory | null>(null);

export function PublicMotionProvider({ children }: { children: ReactNode }) {
  // Request-local during SSR, then retained across client-side route changes.
  const memory = useRef<MotionMemory>({ illustrations: new Set() });
  return (
    <MotionContext.Provider value={memory.current}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionMemory() {
  const shared = useContext(MotionContext);
  const local = useRef<MotionMemory>({ illustrations: new Set() });
  return shared ?? local.current;
}

export function useCategoryMotion(category: string | undefined) {
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const memory = useMotionMemory();
  useEffect(() => {
    const nav = navRef.current;
    const indicator = nav?.querySelector<HTMLElement>(".category-indicator");
    if (!category || !nav || !indicator) return;
    const scope = createMotionScope();
    const previous = memory.navigation;
    function measure(animate = false) {
      const active = nav!.querySelector<HTMLElement>("[aria-current='page']");
      if (!active) return;
      const navRect = nav!.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (
        activeRect.left < navRect.left ||
        activeRect.right > navRect.right
      ) {
        // Pastikan tab aktif tetap terlihat pada strip yang bisa digulir.
        active.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      const rect = active.getBoundingClientRect(),
        container = nav!.getBoundingClientRect();
      const next = {
        category: category!,
        left: rect.left - container.left + nav!.scrollLeft,
        width: rect.width,
        containerWidth: container.width,
      };
      const transform = `translateX(${next.left}px) scaleX(${next.width})`;
      indicator!.style.transform = transform;
      indicator!.hidden = false;
      nav!.dataset.motionReady = "true";
      if (
        animate &&
        previous &&
        previous.category !== category &&
        Math.abs(previous.containerWidth - next.containerWidth) < 1
      ) {
        scope.animate(indicator!, [
          {
            transform: `translateX(${previous.left}px) scaleX(${previous.width})`,
          },
          { transform },
        ]);
      }
      memory.navigation = next;
    }
    measure(true);
    if (previous && previous.category !== category) {
      scope.animate(contentRef.current, [
        { opacity: 0.35, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ]);
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(nav);
    nav.querySelectorAll("a, button").forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      scope.dispose();
    };
  }, [category, memory]);
  return { navRef, contentRef };
}
