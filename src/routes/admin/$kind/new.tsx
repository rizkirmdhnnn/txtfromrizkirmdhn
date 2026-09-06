import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentEditor } from "../../../admin/document-editor";
import { useAdminData } from "../../../admin/data";
import {
  emptyEntry,
  isSimpleKind,
  type CmsDocument,
  type Kind,
} from "../../../lib/cms";

export const Route = createFileRoute("/admin/$kind/new")({
  // Setup dan Gallery dibuat langsung dari halaman daftarnya.
  beforeLoad: ({ params }) => {
    if (isSimpleKind(params.kind))
      throw redirect({ to: "/admin/$kind", params: { kind: params.kind } });
  },
  component: NewDocumentPage,
});

function NewDocumentPage() {
  const { media } = useAdminData();
  const kind = Route.useParams().kind as Kind;
  const router = useRouter();
  const navigate = Route.useNavigate();
  // version 0 menandai dokumen yang belum pernah masuk D1; server memakainya
  // sebagai syarat insert, dan editor mematikan Preview/Publish karenanya.
  const [blank] = useState<CmsDocument>(() => ({
    id: crypto.randomUUID(),
    kind,
    draft: emptyEntry(kind),
    published: null,
    slug: null,
    version: 0,
    deleted: 0,
    updated_at: new Date().toISOString(),
  }));
  return (
    <DocumentEditor
      document={blank}
      media={media}
      onSaved={async (doc) => {
        await router.invalidate();
        await navigate({
          to: "/admin/$kind/$id",
          params: { kind, id: doc.id },
          replace: true,
        });
      }}
      onBack={() => navigate({ to: "/admin/$kind", params: { kind } })}
    />
  );
}
