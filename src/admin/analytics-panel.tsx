import { useEffect, useState } from "react";
import { api } from "./client";

type AnalyticsData = {
  configured: boolean;
  error?: boolean;
  message?: string;
  visits?: number;
  views?: number;
  pages?: { path: string; views: number }[];
  updatedAt?: string;
};

export function AnalyticsPanel() {
  const [days, setDays] = useState("30"),
    [data, setData] = useState<AnalyticsData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setData(null);
    api<AnalyticsData>(`analytics?days=${days}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);
  return (
    <section className="cms-card">
      <div className="cms-title-row">
        <h2>Pengunjung website</h2>
        <select
          aria-label="Periode statistik"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">7 hari terakhir</option>
          <option value="30">30 hari terakhir</option>
        </select>
      </div>
      {error ? (
        <p>{error}</p>
      ) : !data ? (
        <p>Memuat statistik…</p>
      ) : !data.configured || data.error ? (
        <p className="cms-description">{data.message}</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span>Kunjungan</span>
              <strong>{data.visits}</strong>
            </div>
            <div className="stat-card">
              <span>Page views</span>
              <strong>{data.views}</strong>
            </div>
          </div>
          <h3>Halaman populer</h3>
          {data.pages?.length ? (
            data.pages.map((p) => (
              <div className="revision-row" key={p.path}>
                <span>{p.path}</span>
                <strong>{p.views}</strong>
              </div>
            ))
          ) : (
            <p>Belum ada data kunjungan.</p>
          )}
          <small>
            Diperbarui{" "}
            {data.updatedAt
              ? new Date(data.updatedAt).toLocaleString("id-ID")
              : ""}
          </small>
        </>
      )}
    </section>
  );
}
