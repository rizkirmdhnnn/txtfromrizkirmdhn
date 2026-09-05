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
        <h2>Website visitors</h2>
        <select
          aria-label="Statistics period"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      {error ? (
        <p>{error}</p>
      ) : !data ? (
        <p>Loading statistics…</p>
      ) : !data.configured || data.error ? (
        <p className="cms-description">{data.message}</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span>Visits</span>
              <strong>{data.visits}</strong>
            </div>
            <div className="stat-card">
              <span>Page views</span>
              <strong>{data.views}</strong>
            </div>
          </div>
          <h3>Popular pages</h3>
          {data.pages?.length ? (
            data.pages.map((p) => (
              <div className="revision-row" key={p.path}>
                <span>{p.path}</span>
                <strong>{p.views}</strong>
              </div>
            ))
          ) : (
            <p>No visitor data yet.</p>
          )}
          <small>
            Updated{" "}
            {data.updatedAt
              ? new Date(data.updatedAt).toLocaleString("en-US")
              : ""}
          </small>
        </>
      )}
    </section>
  );
}
