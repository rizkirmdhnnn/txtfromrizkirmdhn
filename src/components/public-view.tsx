import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Github,
  Linkedin,
  MapPin,
  X,
  Mail,
  MessageCircle,
  Download,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Visual } from "./visual";
import { defaultWords } from "../lib/default-words";
import { type PublicData, type EntryData, type Kind } from "../lib/cms";
export type PublicNav = {
  tab: (kind: Kind, children: ReactNode, active: boolean) => ReactNode;
};

export function PublicView({
  data,
  tab = "projects",
  slug,
  onTab,
  onPost,
  onBack,
  nav,
}: {
  data: PublicData;
  tab?: Kind;
  slug?: string;
  onTab: (tab: Kind) => void;
  onPost: (slug: string) => void;
  onBack: () => void;
  nav?: PublicNav;
}) {
  const [modal, setModal] = useState<"contact" | "cv" | null>(null);
  const link: PublicNav = nav ?? {
    tab: (kind, children, active) => (
      <button
        className={active ? "active" : ""}
        onClick={() => onTab(kind)}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </button>
    ),
  };
  const site = data.site;
  const t = { ...defaultWords, ...site?.words };
  const sections = site?.sections.filter((s) => s.visible) ?? [];
  const selected = sections.some((s) => s.key === tab) ? tab : sections[0]?.key;
  const entry = slug ? data.entries.find((e) => e.slug === slug) : undefined;
  const cv = site?.cv ?? "";
  const projects = data.entries.filter((e) => e.category === "projects");
  const selectedEntries = data.entries.filter((e) => e.category === selected);
  const featured = projects.find((e) => e.pinned) ?? projects[0];
  const otherProjects = projects.filter((e) => e !== featured);
  const writingVisible = sections.some((s) => s.key === "writing");
  const latestWriting = writingVisible
    ? data.entries
        .filter((e) => e.category === "writing")
        .reduce<EntryData | undefined>(
          (latest, e) => (!latest || e.date > latest.date ? e : latest),
          undefined,
        )
    : undefined;
  const hasContact = Boolean(
    site?.email || site?.github || site?.linkedin || site?.whatsapp,
  );
  const emptyCopy = {
    projects: t.projectsEmpty,
    experience: t.experienceEmpty,
    writing: t.writingEmpty,
    about: t.aboutEmpty,
  };
  const entryLink = (
    e: EntryData,
    children: React.ReactNode,
    className?: string,
  ) =>
    data.preview ? (
      <button
        className={`preview-link ${className ?? ""}`}
        onClick={() => onPost(e.slug)}
      >
        {children}
      </button>
    ) : (
      <Link className={className} to="/post/$slug" params={{ slug: e.slug }}>
        {children}
      </Link>
    );
  function projectCard(e: EntryData, featuredCard = false) {
    return (
      <article
        className={`work-card${featuredCard ? " featured-work" : ""}`}
        key={e.slug}
      >
        <EntryMedia entry={e} media={data.media} priority={featuredCard} />
        <div className="work-info">
          {e.pinned || e.demo || site?.words[e.category + "Label"] ? (
            <div className="work-meta">
              {e.pinned ? <span>{t.pinned}</span> : null}
              {e.demo ? (
                <span className="demo-label">{t.demo}</span>
              ) : (
                <span>{site?.words[e.category + "Label"]}</span>
              )}
            </div>
          ) : null}
          <h3>{entryLink(e, e.title, "work-title")}</h3>
          {e.summary ? <p className="work-summary">{e.summary}</p> : null}
          <EntryTags tags={e.tags} />
          {entryLink(
            e,
            <>
              {e.category === "projects" ? t.read : t.article}
              <ArrowUpRight size={16} aria-hidden="true" />
            </>,
            "read-link",
          )}
        </div>
      </article>
    );
  }
  return (
    <div className="public-site">
      <header className="topbar">
        <button
          className="monogram preview-link"
          onClick={onBack}
          aria-label={t.back}
        >
          {site?.brand || "ar"}
          <span>.</span>
        </button>
        <span className="top-label">{t.space}</span>
        <div className="header-tools">
          <ThemeToggle />
        </div>
      </header>
      {!site ? (
        <main id="main" className="page empty-public">
          <h1>{"Coming soon."}</h1>
          <p>{"This personal space is being prepared."}</p>
        </main>
      ) : entry ? (
        <main id="main" className="page detail">
          <button className="back-link preview-link" onClick={onBack}>
            <ArrowLeft size={16} />
            {t.back}
          </button>
          <div className="detail-meta">
            {t[entry.category]}
            {entry.demo ? <span className="demo-label">{t.demo}</span> : null}
          </div>
          <h1>{entry.title}</h1>
          {entry.summary ? (
            <p className="detail-summary">{entry.summary}</p>
          ) : null}
          <EntryMedia entry={entry} media={data.media} priority />
          <div className="entry-tags">
            {entry.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="prose">
            <ReactMarkdown>{entry.body}</ReactMarkdown>
          </div>
          <div className="detail-links">
            {entry.repo ? (
              <a
                className="button"
                href={entry.repo}
                target="_blank"
                rel="noreferrer"
              >
                {t.source}
                <ArrowUpRight size={15} />
              </a>
            ) : null}
            {entry.demoUrl ? (
              <a
                className="button"
                href={entry.demoUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t.liveDemo}
                <ArrowUpRight size={15} />
              </a>
            ) : null}
          </div>
        </main>
      ) : (
        <main id="main" className="portfolio-layout">
          <section className="profile" aria-label={t.profileLabel}>
            <div className="identity">
              <div>
                <h1>{site.name}</h1>
                {site.handle ? <p className="handle">@{site.handle}</p> : null}
                {site.headline ? (
                  <p className="specialty">{site.headline}</p>
                ) : null}
              </div>
              <img
                className="avatar"
                src={site.avatar || "/favicon.svg"}
                alt={site.name}
                width={86}
                height={86}
              />
            </div>
            {site.bio ? <p className="bio">{site.bio}</p> : null}
            {site.note ? <p className="bio-note">{site.note}</p> : null}
            {site.location ? (
              <div className="location">
                <MapPin size={16} aria-hidden="true" />
                {site.location}
              </div>
            ) : null}
            {hasContact || cv ? (
              <div className="profile-actions">
                {hasContact ? (
                  <button
                    className="button primary"
                    onClick={() => setModal("contact")}
                  >
                    {t.contact}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </button>
                ) : null}
                {cv ? (
                  <button className="button" onClick={() => setModal("cv")}>
                    <FileText size={16} aria-hidden="true" />
                    {t.cv}
                  </button>
                ) : null}
              </div>
            ) : null}
            {site.skills.length ? (
              <ul className="focus-tags">
                {site.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : null}
            {site.github || site.linkedin ? (
              <div className="profile-socials">
                {site.github ? (
                  <a href={site.github} target="_blank" rel="noreferrer">
                    GitHub
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : null}
                {site.linkedin ? (
                  <a href={site.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>
          <div className="portfolio-content">
            {sections.length ? (
              <nav className="tabs" aria-label="Portfolio categories">
                {sections.map((s) => (
                  <Fragment key={s.key}>
                    {link.tab(
                      s.key,
                      <>
                        {t[s.key]}
                        {s.key === "projects" ? (
                          <span>{projects.length}</span>
                        ) : null}
                      </>,
                      selected === s.key,
                    )}
                  </Fragment>
                ))}
              </nav>
            ) : null}
            {selected === "projects" ? (
              <section aria-labelledby="work-heading">
                <div className="section-heading">
                  <h2 id="work-heading">{t.selectedWork}</h2>
                  <p>{t.workIntro}</p>
                </div>
                {featured ? (
                  <>
                    {projectCard(featured, true)}
                    {otherProjects.length ? (
                      <div className="work-grid">
                        {otherProjects.map((e) => projectCard(e))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="empty-section">
                    <p>{t.projectsEmpty}</p>
                  </div>
                )}
                {latestWriting ? (
                  <aside className="latest-writing" aria-label={t.notebook}>
                    <div>
                      <span>{t.notebook}</span>
                      {latestWriting.demo ? (
                        <span className="demo-label">{t.demo}</span>
                      ) : null}
                      <h3>
                        {entryLink(
                          latestWriting,
                          latestWriting.title,
                          "work-title",
                        )}
                      </h3>
                    </div>
                    {entryLink(
                      latestWriting,
                      <>
                        {t.article}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </>,
                      "read-link",
                    )}
                  </aside>
                ) : null}
              </section>
            ) : selected ? (
              <section aria-labelledby="section-heading">
                <div className="section-heading">
                  <h2 id="section-heading">
                    {selected === "about"
                      ? site.aboutTitle || t.about
                      : t[selected]}
                  </h2>
                </div>
                {selected === "about" && site.aboutBody ? (
                  <div className="prose about-intro">
                    <ReactMarkdown>{site.aboutBody}</ReactMarkdown>
                  </div>
                ) : null}
                {selectedEntries.length ? (
                  <div className="content-list">
                    {selectedEntries.map((e) => projectCard(e))}
                  </div>
                ) : selected !== "about" || !site.aboutBody ? (
                  <div className="empty-section">
                    <p>{emptyCopy[selected]}</p>
                    {sections.some((s) => s.key === "projects") &&
                    projects.length
                      ? link.tab(
                          "projects",
                          <>
                            {t.browseProjects}
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </>,
                          false,
                        )
                      : null}
                  </div>
                ) : null}
              </section>
            ) : (
              <div className="empty-section">
                <p>{t.sectionsEmpty}</p>
              </div>
            )}
          </div>
        </main>
      )}
      <footer className="public-footer">
        <span>{t.end}</span>
        <p>
          © {new Date().getFullYear()} {site?.name} <span>·</span>{" "}
          {site?.footer}
        </p>
        {site?.github ? (
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={11} />
          </a>
        ) : null}
      </footer>
      {modal && site ? (
        <PublicModal
          title={modal === "contact" ? t.contact : t.cvTitle}
          close={() => setModal(null)}
          closeLabel={t.close}
        >
          {modal === "contact" ? (
            <>
              <p className="muted">{t.contactSub}</p>
              <div className="channels">
                {[
                  {
                    name: "Email",
                    icon: Mail,
                    url: site.email ? `mailto:${site.email}` : "",
                  },
                  { name: "LinkedIn", icon: Linkedin, url: site.linkedin },
                  { name: "GitHub", icon: Github, url: site.github },
                  {
                    name: "WhatsApp",
                    icon: MessageCircle,
                    url: site.whatsapp ? `https://wa.me/${site.whatsapp}` : "",
                  },
                ]
                  .filter((c) => c.url)
                  .map(({ name, icon: Icon, url }) => (
                    <a key={name} href={url} target="_blank" rel="noreferrer">
                      <Icon size={20} />
                      <strong>{name}</strong>
                      <ArrowUpRight size={16} />
                    </a>
                  ))}
              </div>
            </>
          ) : (
            <>
              <iframe className="cv-frame" src={cv} title={t.cvTitle} />
              <a className="button primary" href={`${cv}?download=1`}>
                <Download size={16} />
                {t.downloadPdf}
              </a>
            </>
          )}
        </PublicModal>
      ) : null}
    </div>
  );
}

function EntryMedia({
  entry,
  media,
  priority = false,
}: {
  entry: EntryData;
  media: PublicData["media"];
  priority?: boolean;
}) {
  if (entry.cover)
    return (
      <img
        className="content-cover"
        src={entry.cover}
        alt={media[entry.cover.split("/").pop()!] || entry.title}
        loading={priority ? "eager" : "lazy"}
      />
    );
  return entry.visual ? <Visual kind={entry.visual} /> : null;
}

function EntryTags({ tags }: { tags: string[] }) {
  return tags.length ? (
    <div className="entry-tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  ) : null;
}

function PublicModal({
  title,
  close,
  closeLabel,
  children,
}: {
  title: string;
  close: () => void;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="public-modal-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom
        )
          close();
      }}
    >
      <div className="modal-inner">
        <button
          className="icon-button modal-close"
          aria-label={closeLabel}
          onClick={close}
        >
          <X size={20} />
        </button>
        <h2 id="public-modal-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
