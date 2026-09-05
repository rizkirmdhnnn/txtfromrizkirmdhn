import type { MediaItem } from "../lib/cms";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
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
        <input type={type} {...control} />
      )}
    </label>
  );
}
export function AssetField({
  label,
  value,
  onChange,
  media,
  pdf = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  media: MediaItem[];
  pdf?: boolean;
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
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
      {value && !pdf ? (
        <img className="asset-thumb" src={value} alt="Selected image preview" />
      ) : null}
    </label>
  );
}
