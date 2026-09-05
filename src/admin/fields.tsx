import type { MediaItem } from "../lib/cms";
import { useEffect, useRef, useState } from "react";
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
  const [typed, setTyped] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setTyped(value);
  }, [value]);
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={type}
          value={typed}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setTyped(value);
          }}
          onChange={(e) => {
            setTyped(e.target.value);
            onChange(e.target.value);
          }}
        />
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
        <option value="">Tidak ada</option>
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
        <img className="asset-thumb" src={value} alt="Pratinjau pilihan" />
      ) : null}
    </label>
  );
}
