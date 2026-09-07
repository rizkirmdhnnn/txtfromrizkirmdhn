import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createMotionScope, type MotionScope } from "../lib/motion";

export function PublicModal({
  title,
  close,
  closeLabel,
  className = "modal",
  children,
}: {
  title: string;
  close: () => void;
  closeLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const motion = useRef<MotionScope | null>(null);
  const closing = useRef(false);
  const mounted = useRef(false);
  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    const dialog = ref.current;
    const computed = dialog ? getComputedStyle(dialog) : null;
    const fromOpacity = computed?.opacity ?? "1";
    const fromTransform = computed?.transform ?? "none";
    motion.current?.cancel();
    const animation = motion.current?.animate(
      dialog,
      [
        { opacity: fromOpacity, transform: fromTransform },
        { opacity: 0, transform: "translateY(6px)" },
      ],
      { duration: 140, fill: "forwards" },
    );
    const finish = () => {
      if (mounted.current) close();
    };
    if (animation) animation.finished.then(finish, finish);
    else finish();
  }
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    mounted.current = true;
    closing.current = false;
    motion.current = createMotionScope();
    dialog?.showModal();
    motion.current.animate(
      dialog,
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 220 },
    );
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      mounted.current = false;
      motion.current?.dispose();
      dialog?.close();
      document.body.style.overflow = old;
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby="public-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom
        )
          requestClose();
      }}
    >
      <div className="modal-inner">
        <button
          className="icon-button modal-close"
          aria-label={closeLabel}
          onClick={requestClose}
        >
          <X size={20} />
        </button>
        <h2 id="public-modal-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
