import { Check, Cloud, Folder, Mail, Terminal } from "lucide-react";

export function Visual({ kind }: { kind?: string }) {
  if (kind === "mail")
    return (
      <div
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
