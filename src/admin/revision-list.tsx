export type Revision = {
  id: string;
  action: string;
  created_at: string;
  snapshot: string;
};

export function RevisionList({
  revisions,
  disabled,
  onRestore,
}: {
  revisions: Revision[];
  disabled: boolean;
  onRestore: (id: string) => void;
}) {
  return (
    <section className="cms-card">
      <h2>Riwayat revisi</h2>
      <p>Memulihkan versi tidak mengubah website publik.</p>
      {revisions.map((r) => (
        <div className="revision-row" key={r.id}>
          <span>
            {new Date(r.created_at).toLocaleString("id-ID")} · {r.action}
          </span>
          <button
            className="cms-button"
            disabled={disabled}
            onClick={() => {
              if (confirm("Pulihkan versi ini menjadi draft?")) onRestore(r.id);
            }}
          >
            Pulihkan
          </button>
        </div>
      ))}
    </section>
  );
}
