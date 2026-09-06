import { Fragment, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight } from "lucide-react";
import { mediaAlt } from "./gallery-section";
import type { EntryData, PublicData, SiteData } from "../lib/cms";
import type { defaultWords } from "../lib/default-words";

type Words = typeof defaultWords;

// Lembar spesifikasi: kategori di kolom kiri, nama + catatan singkat di kanan.
// Satu-satunya gambar adalah foto meja di atas, dan itu pun opsional.
export function SetupSection({
  site,
  entries,
  media,
  t,
  empty,
}: {
  site: SiteData;
  entries: EntryData[];
  media: PublicData["media"];
  t: Words;
  empty: ReactNode;
}) {
  // Kelompok mengikuti urutan kemunculan pertama; item sudah tersortir oleh
  // publicData, jadi urutan grup pun diatur lewat field Order yang sama.
  const groups: { name: string; items: EntryData[] }[] = [];
  for (const entry of entries) {
    const name = entry.group.trim();
    let group = groups.find((g) => g.name === name);
    if (!group) groups.push((group = { name, items: [] }));
    group.items.push(entry);
  }
  const labelled = groups.some((g) => g.name);
  const hasIntro = Boolean(site.setupCover || site.setupIntro.trim());
  return (
    <section aria-labelledby="setup-heading">
      <div className="section-heading">
        <h2 id="setup-heading">{t.setup}</h2>
      </div>
      {site.setupCover ? (
        <img
          className="content-cover setup-cover"
          src={site.setupCover}
          alt={mediaAlt(media, site.setupCover) || t.setup}
          loading="eager"
        />
      ) : null}
      {site.setupIntro.trim() ? (
        <div className="prose about-intro">
          <ReactMarkdown>{site.setupIntro}</ReactMarkdown>
        </div>
      ) : null}
      {entries.length ? (
        <div className={`spec${labelled ? "" : " spec-flat"}`}>
          {groups.map((group) => (
            <Fragment key={group.name || " "}>
              {labelled ? (
                <div className="spec-cat">{group.name || t.setupOther}</div>
              ) : null}
              <div className="spec-items">
                {group.items.map((entry) => (
                  <div className="spec-row" key={entry.slug}>
                    <strong>
                      {entry.demoUrl ? (
                        <a
                          href={entry.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {entry.title}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        entry.title
                      )}
                    </strong>
                    {entry.summary ? <span>{entry.summary}</span> : null}
                  </div>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      ) : hasIntro ? null : (
        empty
      )}
    </section>
  );
}
