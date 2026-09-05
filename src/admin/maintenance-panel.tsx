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
          ? "Maintenance is on. Visitors see the maintenance message."
          : "The portfolio is open. Published content is visible again.",
      );
    });
  return (
    <section className="cms-card">
      <div className="maintenance-heading">
        <div>
          <h2>Maintenance mode</h2>
          <p className="cms-description">
            Temporarily close the portfolio, posts, and CV. Private preview
            remains available.
          </p>
        </div>
        <button
          className="maintenance-switch"
          type="button"
          role="switch"
          aria-label="Maintenance mode"
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
              ? "Maintenance is on"
              : "Portfolio is open"
            : "Loading settings…"}
        </strong>
      </p>
      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void persist(draft);
          }}
        >
          <fieldset disabled={busy} className="maintenance-fields">
            <legend>Visitor message</legend>
            <Field
              label="Title"
              value={draft.title}
              onChange={(title) => setDraft({ ...draft, title })}
            />
            <Field
              label="Message"
              multiline
              value={draft.body}
              onChange={(body) => setDraft({ ...draft, body })}
            />
          </fieldset>
          <button className="cms-button" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save message"}
          </button>
          <p className="cms-description">
            The switch takes effect immediately using the saved message. Turning
            maintenance off does not require republishing.
          </p>
        </form>
      )}
      <Notice>{message}</Notice>
    </section>
  );
}
