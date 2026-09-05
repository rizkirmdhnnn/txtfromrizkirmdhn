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
      <h2>Revision history</h2>
      <p>Restoring a revision does not change the public website.</p>
      {revisions.map((r) => (
        <div className="revision-row" key={r.id}>
          <span>
            {new Date(r.created_at).toLocaleString("en-US")} · {r.action}
          </span>
          <button
            className="cms-button"
            disabled={disabled}
            onClick={() => {
              if (confirm("Restore this revision as the draft?"))
                onRestore(r.id);
            }}
          >
            Restore
          </button>
        </div>
      ))}
    </section>
  );
}
