import { useState } from "react";
import { FileText } from "lucide-react";
import type { MediaItem } from "../lib/cms";
import { api } from "./client";
import { Field, IMAGE_ACCEPT } from "./fields";
import { uploadImageFiles } from "./image-upload";
import { Notice } from "./notice";
import { useAsyncAction } from "./use-async-action";

export function MediaLibrary({
  media,
  onChanged,
}: {
  media: MediaItem[];
  onChanged: () => Promise<void>;
}) {
  const { busy, message, setMessage, run } = useAsyncAction();
  const runAndRefresh = (fn: () => Promise<void>) =>
    run(async () => {
      await fn();
      await onChanged();
    });
  return (
    <>
      <div className="cms-actions">
        <label className="cms-button strong file-button">
          {busy ? "Uploading…" : "Upload files"}
          <input
            type="file"
            multiple
            disabled={busy}
            accept={`${IMAGE_ACCEPT},application/pdf`}
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              void runAndRefresh(async () => {
                for (const file of files) {
                  // Gambar lewat jalur yang sama dengan editor dan formulir,
                  // termasuk pengecilan otomatis untuk foto besar.
                  if (file.type !== "application/pdf") {
                    await uploadImageFiles([file]);
                    continue;
                  }
                  if (file.size > 20 * 1024 * 1024)
                    throw new Error("File exceeds the size limit");
                  await api("media", {
                    method: "POST",
                    headers: {
                      "Content-Type": file.type,
                      "X-File-Name": encodeURIComponent(file.name),
                    },
                    body: file,
                  });
                }
                setMessage(
                  "Files uploaded. Select them in the editor to use them.",
                );
              });
              e.target.value = "";
            }}
          />
        </label>
        <span className="cms-description">
          Images up to 10 MB (large photos are resized automatically) · PDFs up
          to 20 MB
        </span>
      </div>
      <Notice>{message}</Notice>
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard
            key={m.id}
            item={m}
            disabled={busy}
            onSave={(alt) =>
              runAndRefresh(async () => {
                await api("media", {
                  method: "PATCH",
                  body: JSON.stringify({ id: m.id, alt }),
                });
                setMessage("Alt text saved.");
              })
            }
            onDelete={() => {
              if (confirm("Permanently delete this file?"))
                void runAndRefresh(async () => {
                  await api("media", {
                    method: "DELETE",
                    body: JSON.stringify({ id: m.id }),
                  });
                  setMessage("File deleted.");
                });
            }}
          />
        ))}
      </div>
    </>
  );
}

function MediaCard({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: MediaItem;
  disabled: boolean;
  onSave: (alt: MediaItem["alt"]) => void;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  return (
    <article className="cms-card media-card">
      {item.type.startsWith("image/") ? (
        <img src={`/api/media/${item.id}`} alt={item.alt || item.name} />
      ) : (
        <div className="pdf-icon">
          <FileText size={45} />
          <span>PDF</span>
        </div>
      )}
      <strong>{item.name}</strong>
      <small>{(item.size / 1024).toFixed(0)} KB</small>
      {item.type.startsWith("image/") ? (
        <>
          <Field label="Alt text" value={alt} onChange={setAlt} />
          <button
            className="cms-button"
            disabled={disabled}
            onClick={() => onSave(alt)}
          >
            Save alt text
          </button>
        </>
      ) : null}
      <div className="cms-actions">
        <a href={`/api/media/${item.id}`} target="_blank" rel="noreferrer">
          View
        </a>
        <button className="danger" disabled={disabled} onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}
