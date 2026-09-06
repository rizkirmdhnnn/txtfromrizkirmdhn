import type { MediaItem } from "../lib/cms";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  list?: string;
}) {
  // Nilai lokal menahan kursor supaya tidak melompat saat draft di atas
  // dirender ulang sementara pengguna masih mengetik.
  const [typed, setTyped] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setTyped(value);
  }, [value]);
  const control = {
    value: typed,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      setTyped(value);
    },
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTyped(event.target.value);
      onChange(event.target.value);
    },
  };
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline ? (
        <textarea {...control} />
      ) : (
        <input type={type} list={list} {...control} />
      )}
    </label>
  );
}
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
export function AssetField({
  label,
  value,
  onChange,
  media,
  pdf = false,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  media: MediaItem[];
  pdf?: boolean;
  // Mengunggah file lalu mengembalikan URL /api/media/<id> yang sudah ada di
  // daftar `media` (pemanggil menyegarkan data lebih dulu), supaya <select>
  // tidak sempat menunjuk option yang belum ada.
  onUpload?: (file: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Bukan <label> pembungkus: tombol Upload di dalamnya juga sebuah <label>,
  // dan label bersarang membuat klik tombol ikut membuka <select>.
  return (
    <div className="cms-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">None</option>
        {media
          .filter((m) =>
            pdf ? m.type === "application/pdf" : m.type.startsWith("image/"),
          )
          .map((m) => (
            <option value={`/api/media/${m.id}`} key={m.id}>
              {m.name}
            </option>
          ))}
      </select>
      {onUpload && !pdf ? (
        <label className="cms-button file-button asset-upload">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setUploading(true);
              setError("");
              onUpload(file)
                .then((url) => onChange(url))
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Upload failed."),
                )
                .finally(() => setUploading(false));
            }}
          />
        </label>
      ) : null}
      {error ? (
        <small className="asset-error" role="alert">
          {error}
        </small>
      ) : null}
      {value && !pdf ? (
        <img className="asset-thumb" src={value} alt="Selected image preview" />
      ) : null}
    </div>
  );
}
