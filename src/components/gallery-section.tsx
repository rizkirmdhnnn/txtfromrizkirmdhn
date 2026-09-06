import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PublicModal } from "./public-modal";
import type { EntryData, PublicData } from "../lib/cms";
import type { defaultWords } from "../lib/default-words";

type Words = typeof defaultWords;

export function mediaAlt(media: PublicData["media"], url: string) {
  return media[url.split("/").pop()!] || "";
}

export function GallerySection({
  entries,
  media,
  t,
  empty,
}: {
  entries: EntryData[];
  media: PublicData["media"];
  t: Words;
  empty: ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? undefined : entries[active];
  const count = entries.length;
  const step = (offset: number) =>
    setActive((index) =>
      index === null ? index : (index + offset + count) % count,
    );
  // Panah dipasang di window, bukan onKeyDown dialog: setelah mengeklik foto
  // fokus bisa jatuh ke body, sehingga event tidak pernah sampai ke dialog.
  const open = current !== undefined;
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count]);
  return (
    <section aria-labelledby="gallery-heading">
      <div className="section-heading">
        <h2 id="gallery-heading">{t.gallery}</h2>
      </div>
      {count ? (
        <div className="gallery-grid">
          {entries.map((entry, index) => (
            <button
              type="button"
              className="gallery-tile"
              key={entry.slug}
              aria-label={entry.title}
              onClick={() => setActive(index)}
            >
              <img src={entry.cover} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : (
        empty
      )}
      {current && active !== null ? (
        <PublicModal
          className="modal lightbox"
          title={current.title}
          close={() => setActive(null)}
          closeLabel={t.close}
        >
          <figure className="lightbox-photo">
            <img
              src={current.cover}
              alt={mediaAlt(media, current.cover) || current.title}
              decoding="async"
            />
          </figure>
          <div className="lightbox-info">
            {current.summary ? (
              <p className="work-summary">{current.summary}</p>
            ) : null}
            {current.demoUrl ? (
              <a
                className="button"
                href={current.demoUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t.link}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            ) : null}
            {count > 1 ? (
              <div className="lightbox-nav">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t.previousPhoto}
                  onClick={() => step(-1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t.nextPhoto}
                  onClick={() => step(1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <span>
                  {active + 1} / {count}
                </span>
              </div>
            ) : null}
          </div>
        </PublicModal>
      ) : null}
    </section>
  );
}
