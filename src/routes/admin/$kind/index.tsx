import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ContentList } from "../../../admin/content-list";
import { Notice } from "../../../admin/notice";
import { PageHeader } from "../../../admin/page-header";
import { useAdminData } from "../../../admin/data";
import { sectionLabel } from "../../../admin/nav";
import { useDocumentAction } from "../../../admin/use-document-action";
import type { Kind } from "../../../lib/cms";

export const Route = createFileRoute("/admin/$kind/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
  }),
  component: ContentPage,
});

function ContentPage() {
  const { documents } = useAdminData();
  const kind = Route.useParams().kind as Kind;
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { error, setError, act } = useDocumentAction();
  return (
    <>
      <PageHeader
        title={sectionLabel(kind)}
        description="Manage your content. Publish when you are ready."
        action={
          <Link
            className="cms-button strong"
            to="/admin/$kind/new"
            params={{ kind }}
          >
            <Plus size={16} />
            Add content
          </Link>
        }
      />
      <Notice role="alert" onDismiss={() => setError("")}>
        {error}
      </Notice>
      <ContentList
        documents={documents.filter((d) => !d.deleted && d.kind === kind)}
        kind={kind}
        query={q ?? ""}
        onQuery={(value) =>
          navigate({ search: { q: value.trim() ? value : undefined } })
        }
        onAction={act}
      />
    </>
  );
}
