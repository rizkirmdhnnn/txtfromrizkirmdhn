import { Download } from "lucide-react";
import { MaintenancePanel } from "./maintenance-panel";
export function SettingsPanel() {
  return (
    <>
      <MaintenancePanel />
      <section className="cms-card">
        <h2>Content backup</h2>
        <p className="cms-description">
          Download content, revisions, website settings, Markdown, and media.
        </p>
        <a className="cms-button" href="/api/admin/backup">
          <Download size={16} />
          Export ZIP backup
        </a>
      </section>
    </>
  );
}
