import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../../admin/page-header";
import { SettingsPanel } from "../../admin/settings-panel";
import { sectionLabel } from "../../admin/nav";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <PageHeader
        title={sectionLabel("settings")}
        description="Atur kontenmu dengan tenang. Publikasikan saat sudah siap."
      />
      <SettingsPanel />
    </>
  );
}
