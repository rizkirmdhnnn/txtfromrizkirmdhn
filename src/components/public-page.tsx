import {
  Link,
  useLoaderData,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { PublicView, type PublicNav } from "./public-view";
import { tabPaths } from "../lib/tabs";
import type { Kind } from "../lib/cms";

export function PublicPage({ tab }: { tab: Kind }) {
  const data = useLoaderData({ from: "/_public" });
  const search = useSearch({ from: "/_public" });
  const navigate = useNavigate();
  const nav: PublicNav = {
    tab: (kind, children, active) => (
      <Link
        to={tabPaths[kind]}
        search={search}
        activeProps={{}}
        activeOptions={{ exact: true }}
        className={active ? "active" : ""}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </Link>
    ),
    lang: (value, children, active) => (
      <Link
        to={tabPaths[tab]}
        search={{ lang: value === "en" ? "en" : undefined }}
        replace
        activeProps={{}}
        activeOptions={{ exact: true, includeSearch: true }}
        className={active ? "selected" : ""}
      >
        {children}
      </Link>
    ),
  };
  return (
    <PublicView
      data={data}
      lang={search.lang ?? "id"}
      tab={tab}
      nav={nav}
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
