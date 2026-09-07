import { describe, expect, it } from "vitest";
import { sitemapXml } from "../src/lib/sitemap";
import { kinds, type PublicData, type SiteData } from "../src/lib/cms";

function site(visible: string[]): SiteData {
  return {
    name: "Portfolio owner",
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
    headline: "Fullstack & cloud",
    bio: "Building useful software.",
    note: "",
    aboutTitle: "About the owner",
    aboutBody: "A personal introduction.",
    footer: "",
    seoTitle: "",
    seoDescription: "",
    sections: kinds.map((key) => ({ key, visible: visible.includes(key) })),
    words: {},
    sectionSeo: {},
  };
}

function data(visible: string[], slugs: string[]): PublicData {
  return {
    site: site(visible),
    entries: slugs.map((slug) => ({
      title: slug,
      summary: "",
      body: "",
      seoTitle: "",
      seoDescription: "",
      slug,
      category: "projects",
      date: "2026-01-02",
      tags: [],
      pinned: false,
      demo: false,
      order: 0,
      cover: "",
      visual: "" as const,
      repo: "",
      demoUrl: "",
      group: "",
    })),
    media: {},
    preview: false,
  };
}

describe("sitemapXml", () => {
  it("only lists visible sections and published posts", () => {
    const xml = sitemapXml(
      "txtfromrizkirmdhn.my.id",
      data(["projects", "writing"], ["first-post", "second-post"]),
      new Map(),
    );
    expect(xml).toContain("https://txtfromrizkirmdhn.my.id/</loc>");
    expect(xml).toContain("https://txtfromrizkirmdhn.my.id/writing</loc>");
    expect(xml).toContain(
      "https://txtfromrizkirmdhn.my.id/post/first-post</loc>",
    );
    expect(xml).toContain(
      "https://txtfromrizkirmdhn.my.id/post/second-post</loc>",
    );
    expect(xml).not.toContain("/experience");
    expect(xml).not.toContain("/gallery");
  });

  it("adds lastmod when the document has an updated_at date", () => {
    const xml = sitemapXml(
      "txtfromrizkirmdhn.my.id",
      data(["projects"], ["post-a", "post-b"]),
      new Map([["post-a", "2026-03-04T12:00:00.000Z"]]),
    );
    expect(xml).toContain(
      "<url><loc>https://txtfromrizkirmdhn.my.id/post/post-a</loc><lastmod>2026-03-04</lastmod></url>",
    );
    expect(xml).toContain(
      "<url><loc>https://txtfromrizkirmdhn.my.id/post/post-b</loc></url>",
    );
    expect(xml).not.toContain("post/post-b</loc><lastmod>");
  });

  it("renders an empty urlset when the site has no visible sections", () => {
    const xml = sitemapXml("txtfromrizkirmdhn.my.id", data([], []), new Map());
    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
  });
});
