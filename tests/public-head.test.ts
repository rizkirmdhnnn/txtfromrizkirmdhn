import { describe, expect, it } from "vitest";
import { publicHead } from "../src/lib/public-head";
import { emptyEntry, kinds, type SiteData } from "../src/lib/cms";

function site(overrides: Partial<SiteData> = {}): SiteData {
  return {
    name: "Portfolio owner",
    brand: "ar",
    icon: "",
    handle: "owner",
    location: "Yogyakarta",
    avatar: "",
    email: "owner@example.com",
    whatsapp: "",
    github: "https://github.com/owner",
    linkedin: "https://www.linkedin.com/in/owner/",
    skills: [],
    cv: "",
    setupCover: "",
    setupIntro: "",
    headline: "Fullstack & cloud",
    bio: "Building useful software.",
    note: "",
    aboutTitle: "About the owner",
    aboutBody: "A personal introduction.",
    footer: "",
    seoTitle: "Homepage title",
    seoDescription: "Homepage description",
    sections: kinds.map((key) => ({ key, visible: true })),
    words: {},
    sectionSeo: {},
    ...overrides,
  };
}

const head = (overrides: Partial<Parameters<typeof publicHead>[0]> = {}) =>
  publicHead({
    data: {
      site: site(),
      entries: [],
      media: {},
      preview: false,
      origin: "https://example.com",
    },
    path: "/",
    ...overrides,
  });

function metaValue(
  metas: Record<string, unknown>[],
  key: "name" | "property",
  value: string,
) {
  return metas.find((m) => m[key] === value)?.content;
}

describe("publicHead", () => {
  it("uses the site title and description on the homepage", () => {
    const { meta } = head({});
    expect(metaValue(meta, "name", "description")).toBe("Homepage description");
    expect(meta).toContainEqual({ title: "Homepage title" });
  });

  it("falls back to a section label for pages without an override", () => {
    const { meta } = head({ path: "/writing", kind: "writing" });
    expect(meta).toContainEqual({
      title: "Writing — Portfolio owner",
    });
  });

  it("prefers the CMS override for a section page", () => {
    const data = {
      ...site({
        sectionSeo: {
          writing: {
            seoTitle: "Notes on building",
            seoDescription: "Essays about infrastructure.",
          },
        },
      }),
    };
    const { meta } = publicHead({
      data: {
        site: data,
        entries: [],
        media: {},
        preview: false,
        origin: "https://example.com",
      },
      path: "/writing",
      kind: "writing",
    });
    expect(meta).toContainEqual({ title: "Notes on building" });
    expect(metaValue(meta, "name", "description")).toBe(
      "Essays about infrastructure.",
    );
  });

  it("marks posts as articles and adds BlogPosting schema", () => {
    const entry = {
      ...emptyEntry("writing"),
      title: "Post title",
      slug: "post-title",
      updatedAt: "2026-08-10T12:00:00.000Z",
    };
    const { meta } = publicHead({
      data: {
        site: site(),
        entries: [entry],
        media: {},
        preview: false,
        origin: "https://example.com",
      },
      path: "/post/post-title",
      entry,
    });
    expect(metaValue(meta, "property", "og:type")).toBe("article");
    const ld = meta.find((m) => "script:ld+json" in m)?.["script:ld+json"] as {
      "@graph": {
        "@type": string;
        dateModified?: string;
        articleSection?: string;
      }[];
    };
    expect(ld?.["@graph"].map((node) => node["@type"])).toEqual([
      "Person",
      "WebSite",
      "BlogPosting",
    ]);
    const posting = ld?.["@graph"].find(
      (node) => node["@type"] === "BlogPosting",
    );
    expect(posting?.dateModified).toBe("2026-08-10");
    expect(posting?.articleSection).toBe("Writing");
  });

  it("keeps the website og:type on section pages", () => {
    const { meta } = head({ path: "/about", kind: "about" });
    expect(metaValue(meta, "property", "og:type")).toBe("website");
  });

  it("points og:image at the generated card on section pages", () => {
    const { meta } = head({ path: "/writing", kind: "writing" });
    expect(metaValue(meta, "property", "og:image")).toBe(
      "https://example.com/og.png",
    );
    expect(metaValue(meta, "property", "og:image:width")).toBe("1200");
    expect(metaValue(meta, "property", "og:image:height")).toBe("630");
    expect(metaValue(meta, "name", "twitter:image")).toBe(
      "https://example.com/og.png",
    );
  });

  it("uses the generated card for entries without a cover", () => {
    const entry = {
      ...emptyEntry("writing"),
      slug: "post-title",
      title: "Post title",
    };
    const { meta } = publicHead({
      data: {
        site: site(),
        entries: [entry],
        media: {},
        preview: false,
        origin: "https://example.com",
      },
      path: "/post/post-title",
      entry,
    });
    expect(metaValue(meta, "property", "og:image")).toBe(
      "https://example.com/og/post-title.png",
    );
    expect(metaValue(meta, "property", "og:image:type")).toBe("image/png");
  });

  it("keeps an explicit cover as og:image without dimension hints", () => {
    const entry = {
      ...emptyEntry("projects"),
      slug: "covered",
      title: "Covered",
      cover: "/api/media/abc",
    };
    const { meta } = publicHead({
      data: {
        site: site(),
        entries: [entry],
        media: {},
        preview: false,
        origin: "https://example.com",
      },
      path: "/post/covered",
      entry,
    });
    expect(metaValue(meta, "property", "og:image")).toBe(
      "https://example.com/api/media/abc",
    );
    expect(metaValue(meta, "property", "og:image:width")).toBeUndefined();
    expect(metaValue(meta, "name", "twitter:image")).toBeUndefined();
  });
});
