import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "./client";
import { Field } from "./fields";
import { MaintenancePanel } from "./maintenance-panel";
import { Notice } from "./notice";
import { useAsyncAction } from "./use-async-action";

type AiSettings = {
  baseUrl: string;
  model: string;
  apiKey: string;
  hasKey: boolean;
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<AiSettings>({
    baseUrl: "",
    model: "",
    apiKey: "",
    hasKey: false,
  });
  const { busy, message, setMessage, run } = useAsyncAction();
  useEffect(() => {
    api<Omit<AiSettings, "apiKey">>("ai")
      .then((s) => setSettings({ ...s, apiKey: "" }))
      .catch((e) => setMessage(e.message));
  }, [setMessage]);
  const save = (removeKey = false) =>
    run(async () => {
      const saved = await api<Omit<AiSettings, "apiKey">>("ai", {
        method: "POST",
        body: JSON.stringify({ ...settings, removeKey }),
      });
      setSettings({ ...saved, apiKey: "" });
      setMessage("Pengaturan AI tersimpan.");
    });
  return (
    <>
      <MaintenancePanel />
      <section className="cms-card">
        <h2>Terjemahan dengan AI</h2>
        <p className="cms-description">
          Gunakan provider OpenAI-compatible milikmu. Permintaan hanya dikirim
          ketika kamu menekan terjemahkan atau tes koneksi.
        </p>
        <Field
          label="Base URL (contoh: https://api.provider.com/v1)"
          value={settings.baseUrl}
          onChange={(baseUrl) => setSettings({ ...settings, baseUrl })}
        />
        <Field
          label="Nama model"
          value={settings.model}
          onChange={(model) => setSettings({ ...settings, model })}
        />
        <Field
          label={
            settings.hasKey
              ? "API key baru (kosongkan untuk mempertahankan)"
              : "API key"
          }
          type="password"
          value={settings.apiKey}
          onChange={(apiKey) => setSettings({ ...settings, apiKey })}
        />
        <p className="cms-description">
          {settings.hasKey
            ? "API key tersimpan dan terenkripsi."
            : "Belum ada API key."}
        </p>
        <div className="cms-actions">
          <button
            className="cms-button strong"
            disabled={busy}
            onClick={() => save()}
          >
            Simpan
          </button>
          <button
            className="cms-button"
            disabled={busy || !settings.hasKey}
            onClick={() =>
              run(async () => {
                await api("translate", {
                  method: "POST",
                  body: JSON.stringify({ text: "", lang: "en", test: true }),
                });
                setMessage(
                  "Koneksi berhasil menggunakan pengaturan tersimpan.",
                );
              })
            }
          >
            Tes koneksi
          </button>
          <button
            className="cms-button danger"
            disabled={busy || !settings.hasKey}
            onClick={() => {
              if (confirm("Hapus API key tersimpan?")) void save(true);
            }}
          >
            Hapus key
          </button>
        </div>
        <Notice>{message}</Notice>
      </section>
      <section className="cms-card">
        <h2>Cadangan konten</h2>
        <p className="cms-description">
          Unduh konten, revisi, pengaturan website, Markdown, dan media. API key
          tidak disertakan.
        </p>
        <a className="cms-button" href="/api/admin/backup">
          <Download size={16} />
          Ekspor cadangan ZIP
        </a>
      </section>
    </>
  );
}
