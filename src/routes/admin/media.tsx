import { createFileRoute } from "@tanstack/react-router";
import { MediaLibrary } from "../../admin/media-library";
import { PageHeader } from "../../admin/page-header";
import { useAdminData, useRefresh } from "../../admin/data";
import { sectionLabel } from "../../admin/nav";

export const Route = createFileRoute("/admin/media")({ component: MediaPage });

function MediaPage() {
  const { media } = useAdminData();
  const refresh = useRefresh();
  return (
    <>
      <PageHeader
        title={sectionLabel("media")}
        description="Atur kontenmu dengan tenang. Publikasikan saat sudah siap."
      />
      <MediaLibrary media={media} onChanged={refresh} />
    </>
  );
}
