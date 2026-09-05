import { ThemeToggle } from "./theme-toggle";
import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Cloud,
  Code2,
  Download,
  FileText,
  Github,
  Globe2,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Pin,
  X,
  Layers,
  Terminal,
  Folder,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { profile } from "../lib/profile";
import type { Entry, Lang, Category } from "../lib/content";
export const words = {
  id: {
    projects: "Proyek",
    experience: "Pengalaman",
    writing: "Tulisan",
    about: "Tentang",
    contact: "Mari terhubung",
    cv: "Lihat CV",
    bio: "Membangun aplikasi, merangkai infrastruktur cloud, dan memecahkan masalah bersama AI.",
    note: "Dari ide sederhana, sampai benar-benar berjalan.",
    pinned: "Proyek pilihan",
    read: "Jelajahi proyek",
    article: "Baca selengkapnya",
    demo: "Konten demo",
    back: "Kembali ke profil",
    built: "Dibuat dengan rasa ingin tahu.",
    end: "Terus membangun. Terus belajar.",
    source: "Lihat repository",
    close: "Tutup",
    contactSub: "Punya ide, kesempatan, atau sekadar ingin menyapa?",
    unavailable: "Segera tersedia",
    cvTitle: "Curriculum vitae",
    cvNote:
      "Pratinjau demo berdasarkan informasi profil. CV lengkap akan menyusul.",
    download: "Unduh PDF demo",
  },
  en: {
    projects: "Projects",
    experience: "Experience",
    writing: "Writing",
    about: "About",
    contact: "Let’s connect",
    cv: "View CV",
    bio: "Building applications, connecting cloud infrastructure, and solving problems with AI.",
    note: "From a small idea to something that works.",
    pinned: "Featured project",
    read: "Explore project",
    article: "Read more",
    demo: "Demo content",
    back: "Back to profile",
    built: "Made with curiosity.",
    end: "Always building. Always learning.",
    source: "View repository",
    close: "Close",
    contactSub: "Have an idea, an opportunity, or just want to say hello?",
    unavailable: "Coming soon",
    cvTitle: "Curriculum vitae",
    cvNote:
      "Demo preview based on profile information. A complete CV is coming soon.",
    download: "Download demo PDF",
  },
};
export function Language({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div
      className="language"
      aria-label={lang === "id" ? "Bahasa" : "Language"}
    >
      <Globe2 size={14} />
      {(["id", "en"] as const).map((l) => (
        <button key={l} aria-pressed={lang === l} onClick={() => onChange(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
export function Avatar({ small = false }: { small?: boolean }) {
  return (
    <img
      className={small ? "avatar small" : "avatar"}
      src="/avatar.jpg"
      alt="Achmad Rizki Ramadhan"
      width={small ? 36 : 88}
      height={small ? 36 : 88}
    />
  );
}
export function Topbar({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <header className="topbar">
      <Link
        to="/"
        search={{ lang, tab: "projects" }}
        className="monogram"
        aria-label={words[lang].back}
      >
        ar<span>.</span>
      </Link>
      <span className="top-label">
        {lang === "id" ? "Ruang personal" : "A personal space"}
      </span>
      <div className="header-tools">
        <Language lang={lang} onChange={onChange} />
        <ThemeToggle lang={lang} />
      </div>
    </header>
  );
}
export function Profile({
  lang,
  onModal,
}: {
  lang: Lang;
  onModal: (m: "contact" | "cv") => void;
}) {
  const t = words[lang];
  return (
    <section className="profile">
      <div className="identity">
        <div>
          <h1>{profile.name}</h1>
          <div className="handle">
            @{profile.handle}
            <span className="specialty">Fullstack & cloud</span>
          </div>
        </div>
        <Avatar />
      </div>
      <p className="bio">{t.bio}</p>
      <p className="bio-note">{t.note}</p>
      <div className="location">
        <MapPin size={14} />
        {profile.location}
        <span className="location-dot" />
        <span>Fullstack Developer</span>
      </div>
      <div className="profile-actions">
        <button className="button primary" onClick={() => onModal("contact")}>
          {t.contact}
          <ArrowUpRight size={17} />
        </button>
        <button className="button" onClick={() => onModal("cv")}>
          <FileText size={16} />
          {t.cv}
        </button>
        <a
          className="icon-button"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <Github size={20} />
        </a>
        <a
          className="icon-button"
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <Linkedin size={20} />
        </a>
      </div>
      <div className="focus-tags">
        <span>
          <Code2 size={14} />
          Fullstack development
        </span>
        <span>
          <Cloud size={14} />
          Cloud & DevOps
        </span>
        <span>
          <Terminal size={14} />
          AI-assisted building
        </span>
      </div>
    </section>
  );
}
export function Visual({ kind, lang }: { kind?: string; lang: Lang }) {
  if (kind === "mail")
    return (
      <div
        className="project-visual mail-visual"
        aria-label={
          lang === "id"
            ? "Ilustrasi konsep Mailriz"
            : "Mailriz concept illustration"
        }
      >
        <div className="visual-copy">
          <span className="project-brand">
            <Mail size={18} />
            mailriz
          </span>
          <strong>
            {lang === "id"
              ? "Banyak alamat.\nSatu rumah."
              : "Many addresses.\nOne home."}
          </strong>
          <span>
            {lang === "id"
              ? "Email di domain milikmu."
              : "Email on your own domain."}
          </span>
        </div>
        <div className="mail-stack">
          <div className="mail-chip">
            <span className="chip-icon">s</span>shop@your.domain
            <Check size={12} />
          </div>
          <div className="mail-chip">
            <span className="chip-icon">w</span>work@your.domain
            <Check size={12} />
          </div>
          <div className="mail-chip">
            <span className="chip-icon">h</span>hello@your.domain
            <Check size={12} />
          </div>
          <div className="inbox-pill">
            <Mail size={13} />
            {lang === "id" ? "Satu inbox milikmu" : "Your one inbox"}
          </div>
        </div>
        <span className="visual-caption">
          {lang === "id" ? "Ilustrasi konsep" : "Concept illustration"} /
          Cloudflare
        </span>
      </div>
    );
  if (kind === "storage")
    return (
      <div className="project-visual storage-visual">
        <div className="visual-copy">
          <span className="project-brand">
            <Cloud size={18} />
            R2 × macOS
          </span>
          <strong>
            {lang === "id"
              ? "Cloud,\nlebih dekat."
              : "Cloud,\na little closer."}
          </strong>
          <span>JuiceFS / Redis / Docker</span>
        </div>
        <div className="folder-art">
          <Folder size={76} strokeWidth={1} />
          <span>cloud-drive</span>
          <span className="sync">
            <Check size={11} />
            Connected via SMB
          </span>
        </div>
        <span className="visual-caption">
          {lang === "id" ? "Ilustrasi konsep" : "Concept illustration"}
        </span>
      </div>
    );
  return (
    <div className="agent-visual">
      <Terminal size={22} />
      <code>agent.task.complete</code>
      <span>
        <Check size={13} /> notification sent
      </span>
    </div>
  );
}
export function EntryCard({ entry, lang }: { entry: Entry; lang: Lang }) {
  const t = words[lang];
  return (
    <article className="entry">
      {entry.pinned ? (
        <div className="pinned">
          <Pin size={12} />
          {t.pinned}
        </div>
      ) : null}
      <div className="thread">
        <div className="thread-rail">
          <Avatar small />
          <span />
        </div>
        <div className="entry-content">
          <div className="post-author">
            <strong>Achmad Rizki</strong>
            <span>@{profile.handle}</span>
            <span className="entry-kind">
              {entry.demo ? t.demo : "Open source"}
            </span>
          </div>
          <Link
            className="entry-link"
            to="/post/$slug"
            params={{ slug: entry.slug }}
            search={{ lang }}
          >
            <h2>{entry.title}</h2>
            <p>{entry.summary}</p>
            {entry.visual ? <Visual kind={entry.visual} lang={lang} /> : null}
          </Link>
          <div className="entry-tags">
            {entry.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <Link
            className="read-link"
            to="/post/$slug"
            params={{ slug: entry.slug }}
            search={{ lang }}
          >
            {entry.category === "projects" ? t.read : t.article}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer>
      <span>{words[lang].end}</span>
      <p>
        © {new Date().getFullYear()} Rizki <span>·</span> {words[lang].built}
      </p>
      <a href={profile.github} target="_blank" rel="noreferrer">
        GitHub <ArrowUpRight size={11} />
      </a>
    </footer>
  );
}
export function Modal({
  kind,
  lang,
  close,
}: {
  kind: "contact" | "cv";
  lang: Lang;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = words[lang];
  useEffect(() => {
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  const channels = [
    {
      name: "Email",
      icon: Mail,
      url: profile.email ? `mailto:${profile.email}` : "",
      detail: profile.email,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: profile.linkedin,
      detail: "achmadrizkirmdhn",
    },
    {
      name: "GitHub",
      icon: Github,
      url: profile.github,
      detail: "rizkirmdhnnn",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: profile.whatsapp ? `https://wa.me/${profile.whatsapp}` : "",
      detail: profile.whatsapp,
    },
  ];
  return (
    <dialog
      aria-labelledby="dialog-title"
      ref={ref}
      className="modal"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-inner">
        <button
          className="icon-button modal-close"
          onClick={close}
          aria-label={t.close}
        >
          <X size={20} />
        </button>
        <h2 id="dialog-title">{kind === "contact" ? t.contact : t.cvTitle}</h2>
        <p className="muted">{kind === "contact" ? t.contactSub : t.cvNote}</p>
        {kind === "contact" ? (
          <div className="channels">
            {channels.map(({ name, icon: Icon, url, detail }) =>
              url ? (
                <a key={name} href={url} target="_blank" rel="noreferrer">
                  <Icon size={21} />
                  <div>
                    <strong>{name}</strong>
                    <small>{detail}</small>
                  </div>
                  <ArrowUpRight size={17} />
                </a>
              ) : (
                <div className="channel-disabled" key={name}>
                  <Icon size={21} />
                  <strong>{name}</strong>
                  <small>{t.unavailable}</small>
                </div>
              ),
            )}
          </div>
        ) : (
          <>
            <div className="cv-sheet">
              <span className="demo-label">{t.demo}</span>
              <h3>{profile.name}</h3>
              <p>Fullstack Developer · Cloud Enthusiast</p>
              <hr />
              <h4>{lang === "id" ? "Profil" : "Profile"}</h4>
              <p>{t.bio}</p>
              <h4>{t.projects}</h4>
              <p>Mailriz — Cloudflare, TypeScript, D1, R2</p>
              <p>R2 × macOS — JuiceFS, Redis, Docker</p>
              <h4>{t.contact}</h4>
              <p>github.com/rizkirmdhnnn</p>
              <p>linkedin.com/in/achmadrizkirmdhn</p>
            </div>
            <a className="button primary" href={profile.cv} download>
              <Download size={16} />
              {t.download}
            </a>
          </>
        )}
      </div>
    </dialog>
  );
}

export const categories: Category[] = [
  "projects",
  "experience",
  "writing",
  "about",
];
export { ArrowLeft, ChevronRight, Layers, ExternalLink };
