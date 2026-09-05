import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ExternalLink, Menu } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { nav, sectionFromPath, sectionLabel, type Section } from "./nav";
import { kinds } from "../lib/cms";

const icon = (id: Section) => nav.find((n) => n.id === id)!.Icon;

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = useRouterState({
    select: (state) => sectionFromPath(state.location.pathname),
  });
  const close = () => setMobileOpen(false);
  const Overview = icon("overview"),
    Site = icon("site"),
    Media = icon("media"),
    Settings = icon("settings"),
    Trash = icon("trash");
  return (
    <div className="cms-shell">
      <aside className={`cms-sidebar ${mobileOpen ? "open" : ""}`}>
        <Link className="cms-brand" to="/admin" onClick={close}>
          ar<span>.</span>
          <small>Studio</small>
        </Link>
        <div className="cms-sidebar-caption">Ruang untuk karyamu</div>
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
          <a href="/cdn-cgi/access/logout">Keluar</a>
        </div>
      </aside>
      <div className="cms-workspace">
        <header className="cms-topbar">
          <button
            className="cms-mobile-menu"
            aria-label="Buka navigasi"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={20} />
          </button>
          <span>Portofolio / {sectionLabel(section)}</span>
          <div>
            <span className="owner-dot" />
            Rizki
            <ThemeToggle lang="id" />
          </div>
        </header>
        <main id="main" className="cms-main">
          {children}
        </main>
      </div>
    </div>
  );
}
