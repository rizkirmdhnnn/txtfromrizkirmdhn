import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "../../admin/document-editor";
import { PageHeader } from "../../admin/page-header";
import { useAdminData, useRefresh } from "../../admin/data";
import { sectionLabel } from "../../admin/nav";

export const Route = createFileRoute("/admin/profile")({
  validateSearch: (s: Record<string, unknown>): { lang?: "en" } => ({
    lang: s.lang === "en" ? "en" : undefined,
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { documents, media } = useAdminData();
  const { lang } = Route.useSearch();
  const navigate = Route.useNavigate();
  const refresh = useRefresh();
  const site = documents.find((d) => d.id === "site");
  if (!site)
    return (
      <>
        <PageHeader
          title={sectionLabel("site")}
          description="Atur kontenmu dengan tenang. Publikasikan saat sudah siap."
        />
        <p>Profil belum diimpor. Jalankan impor awal untuk memulai.</p>
      </>
    );
  return (
    <DocumentEditor
      document={site}
      media={media}
      lang={lang ?? "id"}
      onLang={(next) =>
        navigate({ search: { lang: next === "en" ? "en" : undefined } })
      }
      onSaved={() => refresh()}
      onBack={() => navigate({ to: "/admin" })}
    />
  );
}
