import { useLoaderData, useNavigate, useSearch } from "@tanstack/react-router";
import { PublicView } from "./public-view";
import { tabPaths } from "../lib/tabs";
import type { Kind } from "../lib/cms";

export function PublicPage({ tab }: { tab: Kind }) {
  const data = useLoaderData({ from: "/_public" });
  const search = useSearch({ from: "/_public" });
  const navigate = useNavigate();
  return (
    <PublicView
      data={data}
      lang={search.lang ?? "id"}
      tab={tab}
      onLanguage={(next) =>
        navigate({
          to: tabPaths[tab],
          search: { lang: next === "en" ? "en" : undefined },
          replace: true,
        })
      }
      onTab={(next) => navigate({ to: tabPaths[next], search })}
      onPost={(slug) =>
        navigate({ to: "/post/$slug", params: { slug }, search })
      }
      onBack={() => navigate({ to: "/", search })}
    />
  );
}
