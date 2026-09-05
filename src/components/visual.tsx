import { useEffect } from "react";
import { Check, Cloud, Folder, Globe2, Mail, Terminal } from "lucide-react";
import type { Lang } from "../lib/cms";

export function Language({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div
      className="language"
      aria-label={lang === "id" ? "Bahasa" : "Language"}
    >
      <Globe2 size={14} />
      {(["id", "en"] as const).map((l) => (
        <button key={l} aria-pressed={lang === l} onClick={() => onChange(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Visual({ kind, lang }: { kind?: string; lang: Lang }) {
  if (kind === "mail")
    return (
      <div
        className="project-visual mail-visual"
        aria-label={
          lang === "id"
            ? "Ilustrasi konsep Mailriz"
            : "Mailriz concept illustration"
        }
      >
        <div className="visual-copy">
          <span className="project-brand">
            <Mail size={18} />
            mailriz
          </span>
          <strong>
            {lang === "id"
              ? "Banyak alamat.\nSatu rumah."
              : "Many addresses.\nOne home."}
          </strong>
          <span>
            {lang === "id"
              ? "Email di domain milikmu."
              : "Email on your own domain."}
          </span>
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
            {lang === "id" ? "Satu inbox milikmu" : "Your one inbox"}
          </div>
        </div>
        <span className="visual-caption">
          {lang === "id" ? "Ilustrasi konsep" : "Concept illustration"} /
          Cloudflare
        </span>
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
          <strong>
            {lang === "id"
              ? "Cloud,\nlebih dekat."
              : "Cloud,\na little closer."}
          </strong>
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
        <span className="visual-caption">
          {lang === "id" ? "Ilustrasi konsep" : "Concept illustration"}
        </span>
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
