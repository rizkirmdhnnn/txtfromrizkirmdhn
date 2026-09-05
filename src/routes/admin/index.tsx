import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Overview } from "../../admin/overview";
import { PageHeader } from "../../admin/page-header";
import { useAdminData } from "../../admin/data";

export const Route = createFileRoute("/admin/")({ component: OverviewPage });

function OverviewPage() {
  const { documents, media } = useAdminData();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="Welcome, Rizki."
        description="A space for the ideas, stories, and work you share."
      />
      <Overview
        documents={documents}
        media={media}
        onOpen={(doc) =>
          doc.kind === "site"
            ? navigate({ to: "/admin/profile" })
            : navigate({
                to: "/admin/$kind/$id",
                params: { kind: doc.kind, id: doc.id },
              })
        }
      />
    </>
  );
}
