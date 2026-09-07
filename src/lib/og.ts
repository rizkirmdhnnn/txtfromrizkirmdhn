import type { PublicEntry, SiteData } from "./cms";
import { defaultWords } from "./default-words";

// Template kartu OG 1200x630. File ini sengaja murni (tanpa satori/wasm)
// supaya tata letaknya bisa diuji tanpa merender gambar.

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Token warna tema terang dari styles.css.
export const ogColors = {
  bg: "#f8f9fb",
  ink: "#282d34",
  muted: "#727983",
  line: "#e9ebef",
  soft: "#f5f6f8",
  accent: "#4b6c9d",
} as const;

export type OgNode = {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: (OgNode | string)[];
  };
};

// Satori menuntut display flex eksplisit pada setiap div ber-children array,
// jadi semua node dibuat lewat helper ini.
function el(
  style: Record<string, unknown>,
  ...children: (OgNode | string)[]
): OgNode {
  return {
    type: "div",
    props: { style: { display: "flex", ...style }, children },
  };
}

// Truncation di JS, bukan line-clamp CSS, agar hasil render deterministik
// (satori tidak mendukung -webkit-line-clamp).
export function truncate(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatOgDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function root(children: (OgNode | string)[]): OgNode {
  return el(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 72,
      backgroundColor: ogColors.bg,
      color: ogColors.ink,
      fontFamily: "DM Sans",
    },
    ...children,
  );
}

function headerRow(label: string): OgNode {
  return el(
    { alignItems: "center", gap: 14 },
    el({
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: ogColors.accent,
    }),
    el({ fontSize: 26, fontWeight: 700 }, label),
  );
}

function footerRow(left: string, right?: string): OgNode {
  return el(
    {
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 24,
      color: ogColors.muted,
    },
    el({}, left),
    ...(right ? [el({}, right)] : []),
  );
}

function middle(...children: (OgNode | string)[]): OgNode {
  return el(
    { flexDirection: "column", justifyContent: "center", flex: 1 },
    ...children,
  );
}

export function siteCardElement(site: SiteData, host: string): OgNode {
  const headline = site.seoTitle || site.headline || site.name;
  const description = site.seoDescription || site.bio;
  return root([
    headerRow(site.name || host),
    middle(
      el(
        {
          fontSize: 22,
          fontWeight: 700,
          color: ogColors.accent,
          letterSpacing: 4,
          marginBottom: 22,
        },
        truncate(site.brand, 40).toUpperCase(),
      ),
      el(
        { fontSize: 62, fontWeight: 700, lineHeight: 1.15 },
        truncate(headline, 110),
      ),
      ...(description
        ? [
            el(
              {
                fontSize: 30,
                lineHeight: 1.45,
                color: ogColors.muted,
                marginTop: 18,
              },
              truncate(description, 150),
            ),
          ]
        : []),
    ),
    footerRow(host),
  ]);
}

export function entryCardElement(
  entry: PublicEntry,
  site: SiteData | null,
  host: string,
): OgNode {
  const label = (defaultWords[entry.category] || entry.category).toUpperCase();
  const summary = truncate(entry.summary, 120);
  return root([
    headerRow(site?.name || host),
    middle(
      el(
        {
          alignSelf: "flex-start",
          padding: "8px 18px",
          borderRadius: 999,
          backgroundColor: ogColors.soft,
          color: ogColors.accent,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2,
        },
        label,
      ),
      el(
        { fontSize: 66, fontWeight: 700, lineHeight: 1.15, marginTop: 22 },
        truncate(entry.title || "Untitled", 90),
      ),
      ...(summary
        ? [
            el(
              {
                fontSize: 30,
                lineHeight: 1.45,
                color: ogColors.muted,
                marginTop: 18,
              },
              summary,
            ),
          ]
        : []),
    ),
    footerRow(host, formatOgDate(entry.date)),
  ]);
}
