import { Fragment, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Github,
  Linkedin,
  MapPin,
  Mail,
  MessageCircle,
  Download,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Visual } from "./visual";
import { useCategoryMotion } from "./public-motion";
import { PublicModal } from "./public-modal";
import { GallerySection } from "./gallery-section";
import { SetupSection } from "./setup-section";
import { defaultWords } from "../lib/default-words";
import { formatDate } from "../lib/text";
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
  const [modal, setModal] = useState<"contact" | "cv" | "avatar" | null>(null);
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
  const { navRef, contentRef } = useCategoryMotion(
    site && !entry ? selected : undefined,
  );
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
    setup: t.setupEmpty,
    gallery: t.galleryEmpty,
  };
  const emptyBlock = (kind: Kind) => (
    <div className="empty-section">
      <p>{emptyCopy[kind]}</p>
      {sections.some((s) => s.key === "projects") && projects.length
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
  );
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
          {e.pinned ||
          e.demo ||
          site?.words[e.category + "Label"] ||
          e.category === "writing" ? (
            <div className="work-meta">
              {e.pinned ? <span>{t.pinned}</span> : null}
              {e.demo ? (
                <span className="demo-label">{t.demo}</span>
              ) : (
                <span>{site?.words[e.category + "Label"]}</span>
              )}
              {e.category === "writing" ? (
                <time dateTime={e.date}>{formatDate(e.date)}</time>
              ) : null}
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
          <p className="detail-byline">
            {t.by} <strong>{site.name}</strong>
            <span aria-hidden="true"> · </span>
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            {entry.updatedAt ? (
              <>
                <span aria-hidden="true"> · </span>
                {t.updated}{" "}
                <time dateTime={entry.updatedAt.slice(0, 10)}>
                  {formatDate(entry.updatedAt)}
                </time>
              </>
            ) : null}
          </p>
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
                {entry.category === "setup" || entry.category === "gallery"
                  ? t.link
                  : t.liveDemo}
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
                {selected === "projects" || !selected ? (
                  <h1>{site.name}</h1>
                ) : (
                  <p className="identity-name">{site.name}</p>
                )}
                {site.handle ? <p className="handle">@{site.handle}</p> : null}
                {site.headline ? (
                  <p className="specialty">{site.headline}</p>
                ) : null}
              </div>
              {site.avatar ? (
                <button
                  type="button"
                  className="avatar-button"
                  aria-label={`${t.viewProfilePhoto}: ${site.name}`}
                  aria-haspopup="dialog"
                  title={t.viewProfilePhoto}
                  onClick={() => setModal("avatar")}
                >
                  <img
                    className="avatar"
                    src={site.avatar}
                    alt={site.name}
                    width={86}
                    height={86}
                  />
                </button>
              ) : (
                <img
                  className="avatar"
                  src="/favicon.svg"
                  alt={site.name}
                  width={86}
                  height={86}
                />
              )}
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
              <nav
                ref={navRef}
                className="tabs"
                aria-label="Portfolio categories"
              >
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
                <i className="category-indicator" aria-hidden="true" hidden />
              </nav>
            ) : null}
            <div ref={contentRef} className="category-content">
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
              ) : selected === "setup" ? (
                <>
                  <div className="section-heading">
                    <h1 id="setup-heading">{t.setup}</h1>
                  </div>
                  <SetupSection
                    site={site}
                    entries={selectedEntries}
                    media={data.media}
                    t={t}
                    empty={emptyBlock("setup")}
                  />
                </>
              ) : selected === "gallery" ? (
                <>
                  <div className="section-heading">
                    <h1 id="gallery-heading">{t.gallery}</h1>
                  </div>
                  <GallerySection
                    entries={selectedEntries}
                    media={data.media}
                    t={t}
                    empty={emptyBlock("gallery")}
                  />
                </>
              ) : selected ? (
                <section aria-labelledby="section-heading">
                  <div className="section-heading">
                    <h1 id="section-heading">
                      {selected === "about"
                        ? site.aboutTitle || t.about
                        : t[selected]}
                    </h1>
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
                    emptyBlock(selected)
                  ) : null}
                </section>
              ) : (
                <div className="empty-section">
                  <p>{t.sectionsEmpty}</p>
                </div>
              )}
            </div>
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
          title={
            modal === "avatar"
              ? site.name
              : modal === "contact"
                ? t.contact
                : t.cvTitle
          }
          className={modal === "avatar" ? "modal avatar-modal" : "modal"}
          close={() => setModal(null)}
          closeLabel={t.close}
        >
          {modal === "avatar" ? (
            <img className="profile-photo" src={site.avatar} alt={site.name} />
          ) : modal === "contact" ? (
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
        className={`content-cover${entry.category === "gallery" ? " photo" : ""}`}
        src={entry.cover}
        alt={media[entry.cover.split("/").pop()!] || entry.title}
        loading={priority ? "eager" : "lazy"}
      />
    );
  return entry.visual ? (
    <Visual kind={entry.visual} motionKey={entry.slug} />
  ) : null;
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
