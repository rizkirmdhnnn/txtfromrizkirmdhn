import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ExternalLink, Menu, X } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { nav, sectionLabel } from "./nav";
import { sectionFromPath, type Section } from "../lib/routing";
import { useDrawer } from "./use-drawer";
import { kinds } from "../lib/cms";

const icon = (id: Section) => nav.find((n) => n.id === id)!.Icon;

export function AdminShell({ children }: { children: ReactNode }) {
  const { mobile, open, setOpen, panel, trigger } = useDrawer();
  const section = useRouterState({
    select: (state) => sectionFromPath(state.location.pathname),
  });
  const close = () => setOpen(false);
  const Overview = icon("overview"),
    Site = icon("site"),
    Media = icon("media"),
    Settings = icon("settings"),
    Trash = icon("trash");
  const modal = mobile ? { role: "dialog" as const, "aria-modal": true } : {};
  return (
    <div className="cms-shell">
      <div
        className={`cms-scrim ${open ? "open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        id="cms-navigation"
        ref={panel}
        className={`cms-sidebar ${open ? "open" : ""}`}
        aria-label="Studio navigation"
        inert={mobile && !open}
        {...(open ? modal : {})}
      >
        <div className="cms-brand-row">
          <Link className="cms-brand" to="/admin" onClick={close}>
            ar<span>.</span>
            <small>Studio</small>
          </Link>
          <button
            className="cms-drawer-close"
            data-drawer-focus
            aria-label="Close navigation"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <div className="cms-sidebar-caption">A space for your work</div>
        <nav>
          <Link to="/admin" activeOptions={{ exact: true }} onClick={close}>
            <Overview size={17} />
            {sectionLabel("overview")}
          </Link>
          <Link to="/admin/profile" onClick={close}>
            <Site size={17} />
            {sectionLabel("site")}
          </Link>
          {kinds.map((kind) => {
            const Icon = icon(kind);
            return (
              <Link
                key={kind}
                to="/admin/$kind"
                params={{ kind }}
                onClick={close}
              >
                <Icon size={17} />
                {sectionLabel(kind)}
              </Link>
            );
          })}
          <Link to="/admin/media" onClick={close}>
            <Media size={17} />
            {sectionLabel("media")}
          </Link>
          <Link to="/admin/settings" onClick={close}>
            <Settings size={17} />
            {sectionLabel("settings")}
          </Link>
          <Link to="/admin/trash" onClick={close}>
            <Trash size={17} />
            {sectionLabel("trash")}
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <a href="/preview" target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Preview website
          </a>
          <a href="/cdn-cgi/access/logout">Log out</a>
        </div>
      </aside>
      <div className="cms-workspace">
        <header className="cms-topbar">
          <button
            ref={trigger}
            className="cms-mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="cms-navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
          <span>Portfolio / {sectionLabel(section)}</span>
          <div>
            <span className="owner-dot" />
            Rizki
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="cms-main">
          {children}
        </main>
      </div>
    </div>
  );
}
