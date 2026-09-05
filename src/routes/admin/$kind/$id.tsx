import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DocumentEditor } from "../../../admin/document-editor";
import { useAdminData, useRefresh } from "../../../admin/data";
import type { Kind } from "../../../lib/cms";

export const Route = createFileRoute("/admin/$kind/$id")({
  component: EditDocumentPage,
});

function EditDocumentPage() {
  const { documents, media } = useAdminData();
  const { kind, id } = Route.useParams();
  const navigate = Route.useNavigate();
  const refresh = useRefresh();
  const document = documents.find((d) => d.id === id);
  if (!document) throw notFound();
  if (document.deleted) throw redirect({ to: "/admin/trash" });
  return (
    <DocumentEditor
      document={document}
      media={media}
      onSaved={() => refresh()}
      onBack={() =>
        navigate({ to: "/admin/$kind", params: { kind: kind as Kind } })
      }
    />
  );
}
