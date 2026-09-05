import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "../../admin/document-editor";
import { PageHeader } from "../../admin/page-header";
import { useAdminData, useRefresh } from "../../admin/data";
import { sectionLabel } from "../../admin/nav";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { documents, media } = useAdminData();
  const navigate = Route.useNavigate();
  const refresh = useRefresh();
  const site = documents.find((d) => d.id === "site");
  if (!site)
    return (
      <>
        <PageHeader
          title={sectionLabel("site")}
          description="Manage your content. Publish when you are ready."
        />
        <p>
          The profile has not been imported. Run the initial import to get
          started.
        </p>
      </>
    );
  return (
    <DocumentEditor
      document={site}
      media={media}
      onSaved={() => refresh()}
      onBack={() => navigate({ to: "/admin" })}
    />
  );
}
