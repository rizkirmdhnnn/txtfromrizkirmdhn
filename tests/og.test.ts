import { describe, expect, it } from "vitest";
import {
  entryCardElement,
  formatOgDate,
  siteCardElement,
  truncate,
  type OgNode,
} from "../src/lib/og";
import { emptyEntry, type SiteData } from "../src/lib/cms";

function texts(node: OgNode | string): string[] {
  if (typeof node === "string") return [node];
  return (node.props.children ?? []).flatMap((child) => texts(child));
}

const site = (overrides: Partial<SiteData> = {}): SiteData => ({
  name: "Rizki",
  brand: "ar",
  icon: "",
  handle: "owner",
  location: "Yogyakarta",
  avatar: "",
  email: "",
  whatsapp: "",
  github: "",
  linkedin: "",
  skills: [],
  cv: "",
  setupCover: "",
  setupIntro: "",
  headline: "Fullstack & cloud developer",
  bio: "Building useful software.",
  note: "",
  aboutTitle: "",
  aboutBody: "",
  footer: "",
  seoTitle: "",
  seoDescription: "",
  sections: [],
  words: {},
  sectionSeo: {},
  ...overrides,
});

describe("truncate", () => {
  it("keeps short text and collapses whitespace", () => {
    expect(truncate("  a   b  c ", 10)).toBe("a b c");
  });

  it("cuts at the limit and closes with an ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
    expect(truncate("hello world", 8)).toHaveLength(8);
  });
});

describe("formatOgDate", () => {
  it("formats ISO dates for the card footer", () => {
    expect(formatOgDate("2026-08-10")).toBe("August 10, 2026");
  });

  it("returns unrecognized dates untouched", () => {
    expect(formatOgDate("soon")).toBe("soon");
  });
});

describe("entryCardElement", () => {
  it("renders title, category label, summary, host, and date", () => {
    const entry = {
      ...emptyEntry("writing"),
      title: "Notes on workers",
      summary: "A short summary.",
      date: "2026-08-10",
    };
    const card = entryCardElement(entry, site(), "example.com");
    const content = texts(card).join(" ");
    expect(content).toContain("Notes on workers");
    expect(content).toContain("WRITING");
    expect(content).toContain("A short summary.");
    expect(content).toContain("example.com");
    expect(content).toContain("August 10, 2026");
  });

  it("truncates long titles deterministically", () => {
    const entry = {
      ...emptyEntry("projects"),
      title: "x".repeat(120),
    };
    const card = entryCardElement(entry, null, "example.com");
    expect(texts(card)).toContain(`${"x".repeat(89)}…`);
    expect(texts(card).some((t) => t === "Rizki")).toBe(false);
  });

  it("falls back to Untitled when the title is empty", () => {
    const card = entryCardElement(emptyEntry("projects"), null, "example.com");
    expect(texts(card)).toContain("Untitled");
  });
});

describe("siteCardElement", () => {
  it("prefers seoTitle and seoDescription over profile copy", () => {
    const card = siteCardElement(
      site({
        seoTitle: "Homepage title",
        headline: "Fullstack & cloud developer",
        seoDescription: "Homepage description",
      }),
      "example.com",
    );
    const content = texts(card).join(" ");
    expect(content).toContain("Homepage title");
    expect(content).not.toContain("Fullstack & cloud developer");
    expect(content).toContain("Homepage description");
    expect(content).toContain("AR");
  });

  it("falls back to headline and bio when SEO fields are empty", () => {
    const card = siteCardElement(site(), "example.com");
    const content = texts(card).join(" ");
    expect(content).toContain("Fullstack & cloud developer");
    expect(content).toContain("Building useful software.");
  });
});
