import { useEffect, useState } from "react";
import { type Maintenance } from "../lib/maintenance";
import { api } from "./client";
import { Field } from "./fields";
import { Notice } from "./notice";
import { useAsyncAction } from "./use-async-action";
export function MaintenancePanel() {
  const [saved, setSaved] = useState<Maintenance | null>(null);
  const [draft, setDraft] = useState<Maintenance | null>(null);
  const { busy, message, setMessage, run } = useAsyncAction();
  useEffect(() => {
    api<Maintenance>("maintenance")
      .then((s) => {
        setSaved(s);
        setDraft(s);
      })
      .catch((e) => setMessage(e.message));
  }, [setMessage]);
  const persist = (value: Maintenance, preserveDraft = false) =>
    run(async () => {
      const result = await api<Maintenance>("maintenance", {
        method: "POST",
        body: JSON.stringify(value),
      });
      setSaved(result);
      setDraft((current) =>
        preserveDraft && current
          ? { ...current, enabled: result.enabled }
          : result,
      );
      setMessage(
        result.enabled
          ? "Maintenance aktif. Pengunjung melihat pesan singkat."
          : "Portofolio terbuka. Konten published tampil kembali.",
      );
    });
  return (
    <section className="cms-card">
      <div className="maintenance-heading">
        <div>
          <h2>Mode maintenance</h2>
          <p className="cms-description">
            Tutup sementara portofolio, tulisan, dan CV. Preview privat tetap
            tersedia.
          </p>
        </div>
        <button
          className="maintenance-switch"
          type="button"
          role="switch"
          aria-label="Mode maintenance"
          aria-checked={saved?.enabled ?? false}
          disabled={busy || !saved}
          onClick={() =>
            saved && persist({ ...saved, enabled: !saved.enabled }, true)
          }
        >
          <span />
        </button>
      </div>
      <p>
        <strong>
          {saved
            ? saved.enabled
              ? "Maintenance aktif"
              : "Portofolio terbuka"
            : "Memuat pengaturan…"}
        </strong>
      </p>
      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void persist(draft);
          }}
        >
          {(["id", "en"] as const).map((lang) => (
            <fieldset key={lang} disabled={busy} className="maintenance-fields">
              <legend>{lang === "id" ? "Bahasa Indonesia" : "English"}</legend>
              <Field
                label={`Judul (${lang.toUpperCase()})`}
                value={draft.translations[lang].title}
                onChange={(title) =>
                  setDraft({
                    ...draft,
                    translations: {
                      ...draft.translations,
                      [lang]: { ...draft.translations[lang], title },
                    },
                  })
                }
              />
              <Field
                label={`Pesan (${lang.toUpperCase()})`}
                multiline
                value={draft.translations[lang].body}
                onChange={(body) =>
                  setDraft({
                    ...draft,
                    translations: {
                      ...draft.translations,
                      [lang]: { ...draft.translations[lang], body },
                    },
                  })
                }
              />
            </fieldset>
          ))}
          <button className="cms-button" disabled={busy} type="submit">
            {busy ? "Menyimpan…" : "Simpan pesan"}
          </button>
          <p className="cms-description">
            Toggle langsung berlaku menggunakan pesan yang sudah disimpan.
            Mematikan maintenance tidak memerlukan publish ulang.
          </p>
        </form>
      )}
      <Notice>{message}</Notice>
    </section>
  );
}
