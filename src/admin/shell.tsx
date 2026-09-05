import { useState, type ReactNode } from "react";
import { ExternalLink, Menu } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { nav, sectionLabel, type Section } from "./nav";

export function AdminShell({
  section,
  onNavigate,
  children,
}: {
  section: Section;
  onNavigate: (id: Section) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="cms-shell">
      <aside className={`cms-sidebar ${mobileOpen ? "open" : ""}`}>
        <a className="cms-brand" href="/admin">
          ar<span>.</span>
          <small>Studio</small>
        </a>
        <div className="cms-sidebar-caption">Ruang untuk karyamu</div>
        <nav>
          {nav.map(({ id, label, Icon }) => (
            <button
              className={section === id ? "active" : ""}
              key={id}
              onClick={() => {
                setMobileOpen(false);
                onNavigate(id);
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
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
