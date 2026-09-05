import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Github,
  Linkedin,
  MapPin,
  Pin,
  X,
  Mail,
  MessageCircle,
  Download,
  Code2,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Visual, Language } from "./portfolio";
import { defaultWords } from "../lib/default-words";
import {
  contentLanguage,
  type PublicData,
  type Lang,
  type EntryData,
  type Kind,
} from "../lib/cms";
export function PublicView({
  data,
  lang,
  tab = "projects",
  slug,
  onLanguage,
  onTab,
  onPost,
  onBack,
}: {
  data: PublicData;
  lang: Lang;
  tab?: Kind;
  slug?: string;
  onLanguage: (lang: Lang) => void;
  onTab: (tab: Kind) => void;
  onPost: (slug: string) => void;
  onBack: () => void;
}) {
  const [modal, setModal] = useState<"contact" | "cv" | null>(null);
  const site = data.site;
  const copy = site?.translations[lang];
  const t = { ...defaultWords[lang], ...copy?.words };
  const sections = site?.sections.filter((s) => s.visible) ?? [];
  const selected = sections.some((s) => s.key === tab) ? tab : sections[0]?.key;
  const entry = slug ? data.entries.find((e) => e.slug === slug) : undefined;
  const avatar = (small = false) => (
    <img
      className={small ? "avatar small" : "avatar"}
      src={site?.avatar || "/favicon.svg"}
      alt={site?.name ?? ""}
      width={small ? 32 : 82}
      height={small ? 32 : 82}
    />
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
      <Link
        className={className}
        to="/post/$slug"
        params={{ slug: e.slug }}
        search={{ lang }}
      >
        {children}
      </Link>
    );
  function content(e: EntryData, detail = false) {
    const actual = contentLanguage(e, lang),
      tr = e.translations[actual];
    return (
      <>
        {actual !== lang ? (
          <span className="fallback-label">
            {lang === "id"
              ? "Tersedia dalam bahasa Inggris"
              : "Available in Indonesian"}
          </span>
        ) : null}
        {detail ? <h1>{tr.title}</h1> : <h2>{tr.title}</h2>}
        <p className={detail ? "detail-summary" : ""}>{tr.summary}</p>
        {e.cover ? (
          <img
            className="content-cover"
            src={e.cover}
            alt={data.media[e.cover.split("/").pop()!]?.[actual] ?? tr.title}
          />
        ) : e.visual ? (
          <Visual kind={e.visual} lang={lang} />
        ) : null}
      </>
    );
  }
  return (
    <>
      <header className="topbar">
        <button
          className="monogram preview-link"
          onClick={onBack}
          aria-label={t.back}
        >
          {site?.brand || "ar"}
          <span>.</span>
        </button>
        <span className="top-label">
          {copy?.words.space ??
            (lang === "id" ? "Ruang personal" : "A personal space")}
        </span>
        <div className="header-tools">
          <Language lang={lang} onChange={onLanguage} />
          <ThemeToggle lang={lang} />
        </div>
      </header>
      {!site ? (
        <main id="main" className="page empty-public">
          <h1>{lang === "id" ? "Segera hadir." : "Coming soon."}</h1>
          <p>
            {lang === "id"
              ? "Ruang personal ini sedang disiapkan."
              : "This personal space is being prepared."}
          </p>
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
          {content(entry, true)}
          <div className="entry-tags">
            {entry.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="prose">
            <ReactMarkdown>
              {entry.translations[contentLanguage(entry, lang)].body}
            </ReactMarkdown>
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
                {copy?.words.liveDemo ?? "Live demo"}
                <ArrowUpRight size={15} />
              </a>
            ) : null}
          </div>
        </main>
      ) : (
        <main id="main" className="page">
          <section className="profile">
            <div className="identity">
              <div>
                <h1>{site.name}</h1>
                <div className="handle">
                  @{site.handle}
                  <span className="specialty">{copy?.headline}</span>
                </div>
              </div>
              {avatar()}
            </div>
            <p className="bio">{copy?.bio}</p>
            <p className="bio-note">{copy?.note}</p>
            <div className="location">
              <MapPin size={14} />
              {site.location}
            </div>
            <div className="profile-actions">
              <button
                className="button primary"
                onClick={() => setModal("contact")}
              >
                {t.contact}
                <ArrowUpRight size={17} />
              </button>
              {site.cv[lang] || site.cv[lang === "id" ? "en" : "id"] ? (
                <button className="button" onClick={() => setModal("cv")}>
                  <FileText size={16} />
                  {t.cv}
                </button>
              ) : null}
              {site.github ? (
                <a
                  className="icon-button"
                  href={site.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
              ) : null}
              {site.linkedin ? (
                <a
                  className="icon-button"
                  href={site.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
              ) : null}
            </div>
            <div className="focus-tags">
              {site.skills.map((skill) => (
                <span key={skill}>
                  <Code2 size={14} />
                  {skill}
                </span>
              ))}
            </div>
          </section>
          <nav
            className="tabs"
            aria-label={
              lang === "id" ? "Kategori portofolio" : "Portfolio categories"
            }
          >
            {sections.map((s) => (
              <button
                className={selected === s.key ? "active" : ""}
                key={s.key}
                onClick={() => onTab(s.key)}
                aria-current={selected === s.key ? "page" : undefined}
              >
                {t[s.key]}
                {s.key === "projects" ? (
                  <span>
                    {
                      data.entries.filter((e) => e.category === "projects")
                        .length
                    }
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          {selected === "about" ? (
            <section className="about-intro">
              <h2>{copy?.aboutTitle}</h2>
              <div className="prose">
                <ReactMarkdown>{copy?.aboutBody ?? ""}</ReactMarkdown>
              </div>
            </section>
          ) : null}
          <section>
            {data.entries
              .filter((e) => e.category === selected)
              .map((e) => (
                <article className="entry" key={e.slug}>
                  {e.pinned ? (
                    <div className="pinned">
                      <Pin size={12} />
                      {t.pinned}
                    </div>
                  ) : null}
                  <div className="thread">
                    <div className="thread-rail">
                      {avatar(true)}
                      <span />
                    </div>
                    <div className="entry-content">
                      <div className="post-author">
                        <strong>{site.name}</strong>
                        <span>@{site.handle}</span>
                        <span className="entry-kind">
                          {e.demo
                            ? t.demo
                            : (copy?.words[e.category + "Label"] ?? "")}
                        </span>
                      </div>
                      {entryLink(e, content(e), "entry-link")}
                      <div className="entry-tags">
                        {e.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      {entryLink(
                        e,
                        <>
                          {e.category === "projects" ? t.read : t.article}
                          <ArrowUpRight size={14} />
                        </>,
                        "read-link",
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </section>
          <div className="feed-end">
            <span />
          </div>
        </main>
      )}
      <footer>
        <span>{t.end}</span>
        <p>
          © {new Date().getFullYear()} {site?.name} <span>·</span>{" "}
          {copy?.footer}
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
              {!site.cv[lang] ? (
                <p className="fallback-label">
                  {lang === "id"
                    ? "CV tersedia dalam bahasa Inggris"
                    : "CV available in Indonesian"}
                </p>
              ) : null}
              <iframe
                className="cv-frame"
                src={site.cv[lang] || site.cv[lang === "id" ? "en" : "id"]}
                title={t.cvTitle}
              />
              <a
                className="button primary"
                href={`${site.cv[lang] || site.cv[lang === "id" ? "en" : "id"]}?download=1`}
              >
                <Download size={16} />
                {copy?.words.downloadPdf ??
                  (lang === "id" ? "Unduh PDF" : "Download PDF")}
              </a>
            </>
          )}
        </PublicModal>
      ) : null}
    </>
  );
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
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="public-modal-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
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
