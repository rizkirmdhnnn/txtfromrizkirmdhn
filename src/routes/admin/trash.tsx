import { createFileRoute } from "@tanstack/react-router";
import { ContentList } from "../../admin/content-list";
import { Notice } from "../../admin/notice";
import { PageHeader } from "../../admin/page-header";
import { useAdminData } from "../../admin/data";
import { sectionLabel } from "../../admin/nav";
import { useDocumentAction } from "../../admin/use-document-action";

export const Route = createFileRoute("/admin/trash")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
  }),
  component: TrashPage,
});

function TrashPage() {
  const { documents } = useAdminData();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { error, setError, act } = useDocumentAction();
  return (
    <>
      <PageHeader
        title={sectionLabel("trash")}
        description="Atur kontenmu dengan tenang. Publikasikan saat sudah siap."
      />
      <Notice role="alert" onDismiss={() => setError("")}>
        {error}
      </Notice>
      <ContentList
        documents={documents.filter((d) => d.deleted)}
        kind={null}
        query={q ?? ""}
        onQuery={(value) =>
          navigate({ search: { q: value.trim() ? value : undefined } })
        }
        onAction={act}
      />
    </>
  );
}
