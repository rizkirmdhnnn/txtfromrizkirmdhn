import { Check, Cloud, Folder, Mail, RotateCcw, Terminal } from "lucide-react";
import { useEffect, useRef } from "react";
import { createMotionScope, type MotionScope } from "../lib/motion";
import { useMotionMemory } from "./public-motion";

export function Visual({
  kind,
  motionKey,
}: {
  kind?: string;
  motionKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const motion = useRef<MotionScope | null>(null);
  const memory = useMotionMemory();
  const key = motionKey ?? kind ?? "";
  function replay() {
    const scope = motion.current;
    if (!scope || !ref.current) return;
    memory.illustrations.add(key);
    scope.cancel();
    ref.current.querySelectorAll(".mail-chip").forEach((chip, index) => {
      scope.animate(
        chip,
        [
          { opacity: 0, transform: "translateX(16px)" },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 360, delay: index * 75, fill: "backwards" },
      );
      scope.animate(
        chip.querySelector("svg"),
        [
          { opacity: 0, transform: "scale(.6)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 180, delay: 240 + index * 75, fill: "backwards" },
      );
    });
    scope.animate(
      ref.current.querySelector(".inbox-pill"),
      [
        { opacity: 0.4, transform: "translateY(-4px) scale(.98)" },
        { opacity: 1, transform: "translateY(0) scale(1.04)", offset: 0.6 },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 300, delay: 500 },
    );
  }
  useEffect(() => {
    if (kind !== "mail" || !ref.current) return;
    const scope = createMotionScope();
    motion.current = scope;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (!memory.illustrations.has(key)) replay();
      },
      { threshold: 0.4 },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      scope.dispose();
      motion.current = null;
    };
  }, [kind, key, memory]);
  if (kind === "mail")
    return (
      <div
        ref={ref}
        className="project-visual mail-visual"
        aria-label={"Mailriz concept illustration"}
      >
        <div className="visual-copy">
          <span className="project-brand">
            <Mail size={18} />
            mailriz
          </span>
          <strong>{"Many addresses.\nOne home."}</strong>
          <span>{"Email on your own domain."}</span>
        </div>
        <div className="mail-stack">
          <div className="mail-chip">
            <span className="chip-icon">s</span>shop@your.domain
            <Check size={12} />
          </div>
          <div className="mail-chip">
            <span className="chip-icon">w</span>work@your.domain
            <Check size={12} />
          </div>
          <div className="mail-chip">
            <span className="chip-icon">h</span>hello@your.domain
            <Check size={12} />
          </div>
          <div className="inbox-pill">
            <Mail size={13} />
            {"Your one inbox"}
          </div>
        </div>
        <span className="visual-caption">
          {"Concept illustration"} / Cloudflare
        </span>
        <button
          type="button"
          className="visual-replay"
          onClick={replay}
          aria-label="Replay Mailriz animation"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Replay
        </button>
      </div>
    );
  if (kind === "storage")
    return (
      <div className="project-visual storage-visual">
        <div className="visual-copy">
          <span className="project-brand">
            <Cloud size={18} />
            R2 × macOS
          </span>
          <strong>{"Cloud,\na little closer."}</strong>
          <span>JuiceFS / Redis / Docker</span>
        </div>
        <div className="folder-art">
          <Folder size={76} strokeWidth={1} />
          <span>cloud-drive</span>
          <span className="sync">
            <Check size={11} />
            Connected via SMB
          </span>
        </div>
        <span className="visual-caption">{"Concept illustration"}</span>
      </div>
    );
  return (
    <div className="agent-visual">
      <Terminal size={22} />
      <code>agent.task.complete</code>
      <span>
        <Check size={13} /> notification sent
      </span>
    </div>
  );
}
